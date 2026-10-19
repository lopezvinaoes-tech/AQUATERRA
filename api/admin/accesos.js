// GET /api/admin/accesos: quién entró al panel, cuándo y desde dónde (solo administradores).
const { configured, db, send, memberFromRequest } = require('../_lib');

module.exports = async (req, res) => {
  if (!configured()) return send(res, 503, { error: 'La base de datos todavía no está configurada' });
  if (req.method !== 'GET') return send(res, 405, { error: 'Método no permitido' });
  const yo = await memberFromRequest(req).catch(() => null);
  if (!yo) return send(res, 401, { error: 'Sesión vencida, vuelve a entrar' });
  if (yo.rol !== 'admin') return send(res, 403, { error: 'Solo un administrador puede ver los accesos' });
  try {
    const accesos = await db('accesos?select=*&order=created_at.desc&limit=500');
    const bloqueados = await db('acceso_bloqueos?bloqueado_at=not.is.null&select=email,bloqueado_at');
    return send(res, 200, { accesos, bloqueados });
  } catch (e) {
    console.error('admin accesos', e);
    return send(res, 500, { error: 'Error al leer los accesos' });
  }
};
