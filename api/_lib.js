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
      Authorization: `Bearer ${SERVICE_KEY}`,
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

// Devuelve el email del administrador si el token es válido y está autorizado; si no, null.
async function adminFromRequest(req) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return null;
  const r = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}` } });
  if (!r.ok) return null;
  const user = await r.json();
  const allowed = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  const email = (user.email || '').toLowerCase();
  return email && allowed.includes(email) ? email : null;
}

module.exports = { SUPABASE_URL, ANON_KEY, configured, ESTADOS, db, parseMonto, perfilDe, prioridadDe, hashIp, readBody, send, adminFromRequest };
