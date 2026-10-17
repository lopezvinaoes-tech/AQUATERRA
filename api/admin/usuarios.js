// Gestión del equipo (solo administradores).
// GET    /api/admin/usuarios                 -> lista del equipo
// POST   /api/admin/usuarios                 -> { email, nombre, rol, password } crea o reactiva el acceso
// PATCH  /api/admin/usuarios                 -> { email, rol?, activo?, nombre?, password? }
// DELETE /api/admin/usuarios?email=...       -> quita el acceso al panel
const { configured, db, readBody, send, memberFromRequest, authAdmin, bootstrapAdmins } = require('../_lib');

const ROLES = ['admin', 'asesor'];
const emailOk = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || '');

module.exports = async (req, res) => {
  if (!configured()) return send(res, 503, { error: 'La base de datos todavía no está configurada' });
  const yo = await memberFromRequest(req).catch(() => null);
  if (!yo) return send(res, 401, { error: 'Sesión vencida, vuelve a entrar' });
  if (yo.rol !== 'admin') return send(res, 403, { error: 'Solo un administrador puede gestionar el equipo' });
  const fijos = bootstrapAdmins();

  try {
    if (req.method === 'GET') {
      const equipo = await db('equipo?select=*&order=created_at.asc');
      fijos.forEach((e) => { if (!equipo.some((m) => m.email === e)) equipo.unshift({ email: e, nombre: null, rol: 'admin', activo: true, fijo: true }); });
      equipo.forEach((m) => { if (fijos.includes(m.email)) m.fijo = true; });
      return send(res, 200, { equipo, yo });
    }

    const b = req.method === 'DELETE' ? {} : await readBody(req);
    const email = String((req.method === 'DELETE' ? req.query.email : b.email) || '').trim().toLowerCase();
    if (!emailOk(email)) return send(res, 400, { error: 'El email no es válido' });
    if (b.rol !== undefined && !ROLES.includes(b.rol)) return send(res, 400, { error: 'Rol inválido' });
    if (b.password && String(b.password).length < 8) return send(res, 400, { error: 'La contraseña debe tener al menos 8 caracteres' });
    const tocaAdminFijo = fijos.includes(email) && (req.method === 'DELETE' || b.rol === 'asesor' || b.activo === false);
    if (tocaAdminFijo) return send(res, 400, { error: 'Este administrador está fijado en Vercel (ADMIN_EMAILS)' });
    if (email === yo.email && (req.method === 'DELETE' || b.rol === 'asesor' || b.activo === false)) return send(res, 400, { error: 'No puedes quitarte tu propio acceso de administrador' });

    if (req.method === 'POST') {
      if (!b.password) return send(res, 400, { error: 'Falta la contraseña inicial' });
      // Crea el usuario en Supabase Auth; si ya existía, le pone la contraseña nueva.
      const creado = await authAdmin('users', { method: 'POST', body: { email, password: String(b.password), email_confirm: true } });
      if (!creado.ok) {
        const lista = await authAdmin(`users?per_page=1000`);
        const u = lista.ok && (lista.data.users || []).find((x) => (x.email || '').toLowerCase() === email);
        if (!u) return send(res, 400, { error: (creado.data && (creado.data.msg || creado.data.message)) || 'No se pudo crear el usuario' });
        const upd = await authAdmin(`users/${u.id}`, { method: 'PUT', body: { password: String(b.password) } });
        if (!upd.ok) return send(res, 400, { error: 'No se pudo actualizar la contraseña' });
      }
      const [m] = await db('equipo?on_conflict=email', {
        method: 'POST', prefer: 'resolution=merge-duplicates,return=representation',
        body: { email, nombre: String(b.nombre || '').slice(0, 120) || null, rol: b.rol || 'asesor', activo: true, creado_por: yo.email }
      });
      return send(res, 201, { miembro: m });
    }

    if (req.method === 'PATCH') {
      const cambios = {};
      if (b.rol !== undefined) cambios.rol = b.rol;
      if (b.activo !== undefined) cambios.activo = Boolean(b.activo);
      if (b.nombre !== undefined) cambios.nombre = String(b.nombre || '').slice(0, 120) || null;
      if (b.password) {
        const lista = await authAdmin(`users?per_page=1000`);
        const u = lista.ok && (lista.data.users || []).find((x) => (x.email || '').toLowerCase() === email);
        if (!u) return send(res, 404, { error: 'Usuario no encontrado' });
        const upd = await authAdmin(`users/${u.id}`, { method: 'PUT', body: { password: String(b.password) } });
        if (!upd.ok) return send(res, 400, { error: 'No se pudo cambiar la contraseña' });
      }
      let m = null;
      if (Object.keys(cambios).length) [m] = await db(`equipo?email=eq.${encodeURIComponent(email)}`, { method: 'PATCH', body: cambios, prefer: 'return=representation' });
      return send(res, 200, { miembro: m });
    }

    if (req.method === 'DELETE') {
      await db(`equipo?email=eq.${encodeURIComponent(email)}`, { method: 'DELETE' });
      return send(res, 200, { ok: true });
    }

    return send(res, 405, { error: 'Método no permitido' });
  } catch (e) {
    console.error('admin usuarios', e);
    return send(res, 500, { error: 'Error al guardar el equipo' });
  }
};
