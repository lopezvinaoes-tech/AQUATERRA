// GET   /api/admin/leads           -> todos los leads (más recientes primero)
// GET   /api/admin/leads?id=...    -> un lead con su historial
// PATCH /api/admin/leads           -> { id, estado?, notas?, asignado? }
const { configured, ESTADOS, db, readBody, send, adminFromRequest } = require('../_lib');

const isUuid = (s) => /^[0-9a-f-]{36}$/i.test(s || '');

module.exports = async (req, res) => {
  if (!configured()) return send(res, 503, { error: 'La base de datos todavía no está configurada' });
  const admin = await adminFromRequest(req);
  if (!admin) return send(res, 401, { error: 'Sesión vencida, vuelve a entrar' });

  try {
    if (req.method === 'GET') {
      const id = req.query && req.query.id;
      if (id) {
        if (!isUuid(id)) return send(res, 400, { error: 'id inválido' });
        const eventos = await db(`lead_eventos?lead_id=eq.${id}&order=created_at.desc`);
        return send(res, 200, { eventos });
      }
      const leads = await db('leads?select=*&order=created_at.desc&limit=5000');
      return send(res, 200, { leads, admin });
    }

    if (req.method === 'PATCH') {
      const b = await readBody(req);
      if (!isUuid(b.id)) return send(res, 400, { error: 'id inválido' });
      const cambios = {};
      if (b.estado !== undefined) {
        if (!ESTADOS.includes(b.estado)) return send(res, 400, { error: 'Estado inválido' });
        cambios.estado = b.estado;
      }
      if (b.notas !== undefined) cambios.notas = String(b.notas || '').slice(0, 5000);
      if (b.asignado !== undefined) cambios.asignado = String(b.asignado || '').slice(0, 120) || null;
      if (!Object.keys(cambios).length) return send(res, 400, { error: 'Nada para actualizar' });

      const [antes] = await db(`leads?id=eq.${b.id}&select=estado,notas,asignado`);
      if (!antes) return send(res, 404, { error: 'Lead no encontrado' });
      const [lead] = await db(`leads?id=eq.${b.id}`, { method: 'PATCH', body: cambios, prefer: 'return=representation' });

      const eventos = [];
      if (cambios.estado && cambios.estado !== antes.estado) eventos.push({ tipo: 'estado', detalle: { de: antes.estado, a: cambios.estado } });
      if (cambios.notas !== undefined && cambios.notas !== (antes.notas || '')) eventos.push({ tipo: 'nota', detalle: { texto: cambios.notas.slice(0, 300) } });
      if (cambios.asignado !== undefined && cambios.asignado !== antes.asignado) eventos.push({ tipo: 'asignado', detalle: { a: cambios.asignado } });
      if (eventos.length) await db('lead_eventos', { method: 'POST', body: eventos.map((e) => ({ ...e, lead_id: b.id, autor: admin })) });

      return send(res, 200, { lead });
    }

    return send(res, 405, { error: 'Método no permitido' });
  } catch (e) {
    console.error('admin leads', e);
    return send(res, 500, { error: 'Error al leer la base de datos' });
  }
};
