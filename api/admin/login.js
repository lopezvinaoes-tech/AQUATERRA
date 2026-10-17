// GET  /api/admin/login: indica si la base está configurada (el panel entra en modo demo si no).
// POST /api/admin/login: { email, password } o { refresh_token } -> sesión de Supabase Auth.
const { SUPABASE_URL, ANON_KEY, configured, readBody, send, rolDe } = require('../_lib');

module.exports = async (req, res) => {
  if (req.method === 'GET') return send(res, 200, { configured: configured() });
  if (req.method !== 'POST') return send(res, 405, { error: 'Método no permitido' });
  if (!configured()) return send(res, 503, { error: 'La base de datos todavía no está configurada' });

  const b = await readBody(req);
  const grant = b.refresh_token ? 'refresh_token' : 'password';
  const payload = b.refresh_token ? { refresh_token: b.refresh_token } : { email: b.email, password: b.password };
  const r = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=${grant}`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) return send(res, 401, { error: 'Email o contraseña incorrectos' });

  const email = ((data.user && data.user.email) || '').toLowerCase();
  const rol = await rolDe(email).catch(() => null);
  if (!rol) return send(res, 403, { error: 'Esta cuenta no tiene acceso al panel' });

  return send(res, 200, { access_token: data.access_token, refresh_token: data.refresh_token, expires_at: data.expires_at, email, rol });
};
