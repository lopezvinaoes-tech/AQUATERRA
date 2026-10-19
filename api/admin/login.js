// GET  /api/admin/login: indica si la base está configurada (el panel entra en modo demo si no).
// POST /api/admin/login:
//   { email, password }                      -> sesión de Supabase Auth
//   { refresh_token }                        -> renueva la sesión
//   { accion: 'nueva_clave', access_token, password } -> contraseña nueva desde el enlace del correo
//   { accion: 'salir', refresh_token, motivo }        -> cierra la sesión en Supabase
// Tras 5 contraseñas incorrectas seguidas la cuenta queda bloqueada hasta que se cree una nueva
// con el enlace que llega por correo (o un administrador la cambie desde Equipo).
const {
  SUPABASE_URL, ANON_KEY, configured, db, readBody, send, rolDe, authAdmin,
  MAX_FALLOS, registrarAcceso, bloqueoDe, sumarFallo, limpiarBloqueo, enviarCorreoClave
} = require('../_lib');

const BLOQUEADA = 'Cuenta bloqueada por demasiados intentos. Te enviamos un correo para crear una contraseña nueva.';
const REENVIO_MS = 15 * 60 * 1000;

function token(payload, grant) {
  return fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=${grant}`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then((r) => r.json().catch(() => ({})).then((data) => ({ ok: r.ok, data })));
}

// Con la cuenta bloqueada no se prueba la contraseña. El correo se reenvía como mucho cada 15 minutos.
async function respuestaBloqueada(req, res, email, b) {
  if (!b.correo_at || Date.now() - new Date(b.correo_at).getTime() > REENVIO_MS) {
    if (await enviarCorreoClave(req, email)) await db(`acceso_bloqueos?email=eq.${encodeURIComponent(email)}`, { method: 'PATCH', body: { correo_at: new Date().toISOString() } });
  }
  await registrarAcceso(req, email, 'intento_bloqueado');
  return send(res, 423, { error: BLOQUEADA, bloqueada: true });
}

async function entrar(req, res, b) {
  const email = String(b.email || '').trim().toLowerCase().slice(0, 160);
  if (!email || !b.password) return send(res, 400, { error: 'Escribe tu email y tu contraseña' });
  const bloqueo = await bloqueoDe(email).catch(() => null);
  if (bloqueo && bloqueo.bloqueado_at) return respuestaBloqueada(req, res, email, bloqueo);

  const r = await token({ email, password: String(b.password) }, 'password');
  if (!r.ok) {
    await registrarAcceso(req, email, 'fallo');
    // Solo se cuentan y bloquean cuentas del equipo; un email cualquiera no genera correos.
    const rol = await rolDe(email).catch(() => null);
    if (!rol) return send(res, 401, { error: 'Email o contraseña incorrectos' });
    const fallos = await sumarFallo(email).catch(() => 0);
    if (fallos >= MAX_FALLOS) {
        const enviado = await enviarCorreoClave(req, email);
      await db(`acceso_bloqueos?email=eq.${encodeURIComponent(email)}`, { method: 'PATCH', body: { bloqueado_at: new Date().toISOString(), correo_at: enviado ? new Date().toISOString() : null } });
      await registrarAcceso(req, email, 'bloqueo', enviado ? 'Correo enviado para crear una contraseña nueva' : 'No se pudo enviar el correo');
      return send(res, 423, { error: BLOQUEADA, bloqueada: true });
    }
    const quedan = MAX_FALLOS - fallos;
    return send(res, 401, { error: `Email o contraseña incorrectos. ${quedan === 1 ? 'Queda 1 intento' : `Quedan ${quedan} intentos`} antes de bloquear la cuenta.` });
  }

  const rol = await rolDe(email).catch(() => null);
  if (!rol) return send(res, 403, { error: 'Esta cuenta no tiene acceso al panel' });
  if (bloqueo) await limpiarBloqueo(email).catch(() => {});
  await registrarAcceso(req, email, 'entrada');
  return send(res, 200, { access_token: r.data.access_token, refresh_token: r.data.refresh_token, expires_at: r.data.expires_at, email, rol });
}

async function renovar(req, res, b) {
  const r = await token({ refresh_token: String(b.refresh_token) }, 'refresh_token');
  if (!r.ok) return send(res, 401, { error: 'Sesión vencida, vuelve a entrar' });
  const email = ((r.data.user && r.data.user.email) || '').toLowerCase();
  const bloqueo = await bloqueoDe(email).catch(() => null);
  if (bloqueo && bloqueo.bloqueado_at) return send(res, 423, { error: BLOQUEADA, bloqueada: true });
  const rol = await rolDe(email).catch(() => null);
  if (!rol) return send(res, 403, { error: 'Esta cuenta no tiene acceso al panel' });
  return send(res, 200, { access_token: r.data.access_token, refresh_token: r.data.refresh_token, expires_at: r.data.expires_at, email, rol });
}

// El enlace del correo abre /admin con una sesión de recuperación; con ella se fija la contraseña nueva.
async function nuevaClave(req, res, b) {
  const password = String(b.password || '');
  if (password.length < 8) return send(res, 400, { error: 'La contraseña debe tener al menos 8 caracteres' });
  const u = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: ANON_KEY, Authorization: `Bearer ${String(b.access_token || '')}` } });
  if (!u.ok) return send(res, 401, { error: 'El enlace venció o ya se usó. Pide uno nuevo intentando entrar otra vez.' });
  const user = await u.json();
  const email = (user.email || '').toLowerCase();
  if (!(await rolDe(email).catch(() => null))) return send(res, 403, { error: 'Esta cuenta no tiene acceso al panel' });
  const upd = await authAdmin(`users/${user.id}`, { method: 'PUT', body: { password } });
  if (!upd.ok) return send(res, 400, { error: (upd.data && (upd.data.msg || upd.data.message)) || 'No se pudo cambiar la contraseña' });
  await limpiarBloqueo(email).catch(() => {});
  await registrarAcceso(req, email, 'clave_cambiada', 'Con el enlace del correo');
  return send(res, 200, { ok: true, email });
}

// Cierra la sesión también en Supabase, aunque el token de acceso ya haya vencido.
async function salir(req, res, b) {
  if (!b.refresh_token) return send(res, 200, { ok: true });
  const r = await token({ refresh_token: String(b.refresh_token) }, 'refresh_token');
  if (!r.ok) return send(res, 200, { ok: true });
  await fetch(`${SUPABASE_URL}/auth/v1/logout?scope=local`, { method: 'POST', headers: { apikey: ANON_KEY, Authorization: `Bearer ${r.data.access_token}` } }).catch(() => {});
  const email = ((r.data.user && r.data.user.email) || '').toLowerCase();
  await registrarAcceso(req, email, b.motivo === 'inactividad' ? 'inactividad' : 'salida');
  return send(res, 200, { ok: true });
}

module.exports = async (req, res) => {
  if (req.method === 'GET') return send(res, 200, { configured: configured() });
  if (req.method !== 'POST') return send(res, 405, { error: 'Método no permitido' });
  if (!configured()) return send(res, 503, { error: 'La base de datos todavía no está configurada' });

  const b = await readBody(req);
  try {
    if (b.accion === 'nueva_clave') return await nuevaClave(req, res, b);
    if (b.accion === 'salir') return await salir(req, res, b);
    if (b.refresh_token) return await renovar(req, res, b);
    return await entrar(req, res, b);
  } catch (e) {
    console.error('admin login', e);
    return send(res, 500, { error: 'No se pudo entrar, inténtalo de nuevo' });
  }
};
