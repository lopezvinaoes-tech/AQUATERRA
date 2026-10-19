// Utilidades compartidas por las funciones de /api (Vercel ignora archivos que empiezan con "_").
const crypto = require('crypto');

const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

const configured = () => Boolean(SUPABASE_URL && SERVICE_KEY && ANON_KEY);

const ESTADOS = ['nuevo', 'contactado', 'en_conversacion', 'calificado', 'cliente', 'descartado'];

// Llamada a la API REST de Supabase con la clave de servicio.
async function db(path, { method = 'GET', body, prefer } = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      apikey: SERVICE_KEY,
      // Las claves nuevas (sb_secret_...) van solo en apikey; las antiguas (JWT) también como Bearer.
      ...(SERVICE_KEY.startsWith('eyJ') ? { Authorization: `Bearer ${SERVICE_KEY}` } : {}),
      'Content-Type': 'application/json',
      ...(prefer ? { Prefer: prefer } : {})
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) throw Object.assign(new Error((data && data.message) || `Supabase ${res.status}`), { status: res.status });
  return data;
}

// "Hasta USD 50.000" -> [0, 50000]; "USD 50.000 – 100.000" -> [50000, 100000]; "Más de USD 250.000" -> [250000, null]
function parseMonto(monto) {
  if (typeof monto === 'number' && isFinite(monto)) return [Math.round(monto), Math.round(monto)];
  if (!monto) return [null, null];
  const s = String(monto);
  const nums = (s.match(/\d[\d.,]*/g) || []).map((n) => parseInt(n.replace(/[.,]/g, ''), 10)).filter((n) => !isNaN(n));
  if (!nums.length) return [null, null];
  if (/^\s*hasta/i.test(s)) return [0, nums[0]];
  if (/m[aá]s de|\+/i.test(s)) return [nums[0], null];
  return [nums[0], nums.length > 1 ? nums[1] : nums[0]];
}

// Tipo de inversor según el objetivo declarado.
function perfilDe(objetivo) {
  const o = (objetivo || '').toLowerCase();
  if (o.includes('renta') || o.includes('alquiler')) return 'Rentista';
  if (o.includes('revalor') || o.includes('plusval')) return 'Inversor de plusvalía';
  if (o.includes('vivienda') || o.includes('propia') || o.includes('vivir')) return 'Comprador final';
  return 'Explorador';
}

// Prioridad comercial según el monto: desde USD 100.000 alta, menos de 50.000 baja.
function prioridadDe(min) {
  if (min == null) return 'media';
  if (min >= 100000) return 'alta';
  if (min >= 50000) return 'media';
  return 'baja';
}

// ---------- Un solo perfil por persona ----------
// Si alguien vuelve a escribir (otro formulario, el comparador, el chat) con el mismo email o
// WhatsApp, se suma a su lead en lugar de crear uno nuevo, y queda un evento "contacto" en su historial.

const digitos = (w) => String(w || '').replace(/\D/g, '');
// Los últimos 8 dígitos reconocen el mismo número escrito con o sin prefijo, espacios o guiones.
const colaWa = (w) => { const d = digitos(w); return d.length >= 8 ? d.slice(-8) : null; };

// Devuelve el lead más antiguo con ese email o WhatsApp, o null.
async function buscarLeadExistente(email, whatsapp) {
  const em = email ? String(email).trim().toLowerCase() : null;
  const cola = colaWa(whatsapp);
  const conds = [];
  if (em) conds.push(`email.ilike."${em.replace(/"/g, '')}"`);
  if (cola) conds.push(`whatsapp.ilike.*${cola.split('').join('*')}*`);
  if (!conds.length) return null;
  const candidatos = await db(`leads?select=*&or=${encodeURIComponent('(' + conds.join(',') + ')')}&order=created_at.asc&limit=50`);
  return candidatos.find((l) => (em && (l.email || '').trim().toLowerCase() === em) || (cola && colaWa(l.whatsapp) === cola)) || null;
}

// Suma un nuevo contacto al lead existente sin borrar lo que ya había:
// completa los datos que faltaban, actualiza monto y objetivo si los vuelve a declarar,
// junta los proyectos de interés y agrega el mensaje nuevo al anterior.
async function sumarContacto(previo, nuevo, { origen, autor } = {}) {
  const c = {};
  for (const k of ['email', 'whatsapp', 'pais', 'ciudad', 'idioma', 'pagina', 'referrer', 'utm_source', 'utm_medium', 'utm_campaign', 'user_agent']) {
    if (nuevo[k] && !previo[k]) c[k] = nuevo[k];
  }
  if (nuevo.monto && nuevo.monto !== previo.monto) {
    const [min, max] = parseMonto(nuevo.monto);
    Object.assign(c, { monto: nuevo.monto, monto_min: min, monto_max: max, prioridad: prioridadDe(min) });
  }
  if (nuevo.objetivo && nuevo.objetivo !== previo.objetivo) Object.assign(c, { objetivo: nuevo.objetivo, perfil: perfilDe(nuevo.objetivo) });
  if (nuevo.proyecto_interes) {
    const lista = String(previo.proyecto_interes || '').split(' / ').filter(Boolean);
    for (const p of String(nuevo.proyecto_interes).split(' / ')) if (p && !lista.includes(p)) lista.push(p);
    const unido = lista.join(' / ').slice(0, 160);
    if (unido !== (previo.proyecto_interes || '')) c.proyecto_interes = unido;
  }
  if (nuevo.mensaje && !String(previo.mensaje || '').includes(nuevo.mensaje)) {
    const fecha = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'America/Asuncion' });
    const junto = previo.mensaje ? `${previo.mensaje}\n\n${origen || 'Web'} · ${fecha}: ${nuevo.mensaje}` : nuevo.mensaje;
    c.mensaje = junto.length > 2000 ? '…' + junto.slice(-1999) : junto;
  }
  if (nuevo.consentimiento && !previo.consentimiento) c.consentimiento = true;
  if (nuevo.ia) {
    // Conserva las conversaciones anteriores con el asistente y suma la nueva.
    const antes = (previo.ia && previo.ia.conversacion) || [];
    c.ia = { ...(previo.ia || {}), ...nuevo.ia, conversacion: antes.concat(nuevo.ia.conversacion || []).slice(-60) };
  }
  if (Object.keys(c).length) await db(`leads?id=eq.${previo.id}`, { method: 'PATCH', body: c });
  const detalle = { origen: origen || null };
  for (const k of ['mensaje', 'proyecto_interes', 'monto', 'objetivo', 'pagina']) if (nuevo[k]) detalle[k] = String(nuevo[k]).slice(0, 300);
  const campos = Object.keys(c).filter((k) => !['ia', 'monto_min', 'monto_max'].includes(k));
  if (campos.length) detalle.campos = campos;
  await db('lead_eventos', { method: 'POST', body: { lead_id: previo.id, tipo: 'contacto', detalle, autor: autor || null } });
  return previo.id;
}

const hashIp = (ip) => crypto.createHash('sha256').update(`${process.env.IP_SALT || SERVICE_KEY}:${ip}`).digest('hex').slice(0, 32);

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') { try { return JSON.parse(req.body); } catch (e) { return {}; } }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch (e) { return {}; }
}

function send(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  res.end(JSON.stringify(data));
}

const bootstrapAdmins = () => (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);

// Rol de un email en el panel: 'admin', 'asesor' o null si no tiene acceso.
async function rolDe(email) {
  email = (email || '').toLowerCase();
  if (!email) return null;
  if (bootstrapAdmins().includes(email)) return 'admin';
  const [m] = await db(`equipo?email=eq.${encodeURIComponent(email)}&activo=is.true&select=rol`);
  return m ? m.rol : null;
}

// Devuelve { email, rol } si el token es de alguien del equipo; si no, null.
async function memberFromRequest(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return null;
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` } });
  if (!r.ok) return null;
  const user = await r.json();
  const email = (user.email || '').toLowerCase();
  const rol = await rolDe(email);
  return rol ? { email, rol } : null;
}

// Llamada a la API de administración de Supabase Auth (crear usuarios, etc.).
async function authAdmin(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/${path}`, {
    method,
    headers: {
      apikey: SERVICE_KEY,
      ...(SERVICE_KEY.startsWith('eyJ') ? { Authorization: `Bearer ${SERVICE_KEY}` } : {}),
      'Content-Type': 'application/json'
    },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

// ---------- Seguridad del panel ----------
// Tras 5 contraseñas incorrectas seguidas la cuenta se bloquea y se envía un correo para crear una nueva.
const MAX_FALLOS = 5;

// Desde dónde se conecta alguien: IP, ciudad y país (cabeceras de Vercel) y un resumen del navegador.
function clienteDe(req) {
  const h = req.headers;
  const ua = String(h['user-agent'] || '');
  const nav = /Edg\//.test(ua) ? 'Edge' : /OPR\/|Opera/.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox' : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'Otro navegador';
  const so = /iPhone|iPad/.test(ua) ? 'iPhone/iPad' : /Android/.test(ua) ? 'Android' : /Windows/.test(ua) ? 'Windows' : /Mac OS X/.test(ua) ? 'Mac' : /Linux/.test(ua) ? 'Linux' : 'otro sistema';
  let ciudad = null;
  try { ciudad = h['x-vercel-ip-city'] ? decodeURIComponent(h['x-vercel-ip-city']).slice(0, 80) : null; } catch (e) {}
  return {
    ip: String(h['x-forwarded-for'] || h['x-real-ip'] || '').split(',')[0].trim().slice(0, 64) || null,
    pais: h['x-vercel-ip-country'] ? String(h['x-vercel-ip-country']).slice(0, 4) : null,
    ciudad,
    dispositivo: ua ? `${nav} · ${so}` : null
  };
}

// Deja constancia de una entrada, salida, fallo o bloqueo. Nunca hace fallar la petición.
async function registrarAcceso(req, email, evento, detalle) {
  try {
    await db('accesos', { method: 'POST', body: { email: String(email || '').toLowerCase().slice(0, 160) || '(sin email)', evento, detalle: detalle ? String(detalle).slice(0, 200) : null, ...clienteDe(req) } });
  } catch (e) { console.error('registrar acceso', e.message); }
}

async function bloqueoDe(email) {
  const [b] = await db(`acceso_bloqueos?email=eq.${encodeURIComponent(email)}&select=*`);
  return b || null;
}

// Suma una contraseña incorrecta y devuelve cuántas lleva seguidas.
async function sumarFallo(email) {
  return db('rpc/sumar_fallo', { method: 'POST', body: { p_email: email } });
}

const limpiarBloqueo = (email) => db(`acceso_bloqueos?email=eq.${encodeURIComponent(email)}`, { method: 'DELETE' });

// Envía el correo de Supabase para crear una contraseña nueva; el enlace vuelve a /admin.
async function enviarCorreoClave(req, email) {
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').split(',')[0].trim();
  const base = (process.env.SITE_URL || (host ? `https://${host}` : '')).replace(/\/+$/, '');
  const r = await fetch(`${SUPABASE_URL}/auth/v1/recover${base ? `?redirect_to=${encodeURIComponent(base + '/admin/')}` : ''}`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  if (!r.ok) console.error('correo de recuperación', r.status, await r.text().catch(() => ''));
  return r.ok;
}

module.exports = { SUPABASE_URL, ANON_KEY, configured, ESTADOS, db, parseMonto, perfilDe, prioridadDe, buscarLeadExistente, sumarContacto, hashIp, readBody, send, rolDe, memberFromRequest, authAdmin, bootstrapAdmins, MAX_FALLOS, clienteDe, registrarAcceso, bloqueoDe, sumarFallo, limpiarBloqueo, enviarCorreoClave };
