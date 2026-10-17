// Panel de leads. Todo requiere sesión de alguien del equipo.
// GET    /api/admin/leads          -> todos los leads + { yo: { email, rol } }
// GET    /api/admin/leads?id=...   -> historial de un lead
// PATCH  /api/admin/leads          -> { id, ...cambios }  asesor: estado y notas; admin: cualquier dato
// POST   /api/admin/leads          -> alta manual (solo admin)
// DELETE /api/admin/leads?id=...   -> eliminar (solo admin)
const { configured, ESTADOS, db, parseMonto, perfilDe, prioridadDe, readBody, send, memberFromRequest } = require('../_lib');

const isUuid = (s) => /^[0-9a-f-]{36}$/i.test(s || '');
const clip = (v, n) => (v == null ? null : String(v).trim().slice(0, n) || null);

// Campos que se pueden escribir desde el panel y su largo máximo.
const CAMPOS = { nombre: 120, email: 160, whatsapp: 40, monto: 80, objetivo: 80, mensaje: 2000, proyecto_interes: 160, asignado: 120, notas: 5000, pais: 4, ciudad: 80 };
const DEL_ASESOR = ['estado', 'notas'];

// Normaliza los cambios y recalcula monto, tipo de inversor y prioridad cuando corresponde.
function normalizar(b) {
  const c = {};
  for (const k of Object.keys(CAMPOS)) if (b[k] !== undefined) c[k] = k === 'notas' ? String(b[k] || '').slice(0, CAMPOS[k]) : clip(b[k], CAMPOS[k]);
  if (c.pais) c.pais = c.pais.toUpperCase();
  if (b.estado !== undefined) {
    if (!ESTADOS.includes(b.estado)) throw Object.assign(new Error('Estado inválido'), { status: 400 });
    c.estado = b.estado;
  }
  if (b.monto !== undefined) {
    const [min, max] = parseMonto(b.monto);
    c.monto_min = min; c.monto_max = max; c.prioridad = prioridadDe(min);
  }
  if (b.prioridad !== undefined && ['alta', 'media', 'baja'].includes(b.prioridad)) c.prioridad = b.prioridad;
  if (b.objetivo !== undefined) c.perfil = perfilDe(c.objetivo);
  if (c.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) throw Object.assign(new Error('El email no es válido'), { status: 400 });
  return c;
}

module.exports = async (req, res) => {
  if (!configured()) return send(res, 503, { error: 'La base de datos todavía no está configurada' });
  const yo = await memberFromRequest(req).catch(() => null);
  if (!yo) return send(res, 401, { error: 'Sesión vencida, vuelve a entrar' });
  const esAdmin = yo.rol === 'admin';
  const id = (req.query && req.query.id) || null;

  try {
    if (req.method === 'GET') {
      if (id) {
        if (!isUuid(id)) return send(res, 400, { error: 'id inválido' });
        return send(res, 200, { eventos: await db(`lead_eventos?lead_id=eq.${id}&order=created_at.desc`) });
      }
      const leads = await db('leads?select=*&order=created_at.desc&limit=5000');
      return send(res, 200, { leads, yo });
    }

    if (req.method === 'POST') {
      if (!esAdmin) return send(res, 403, { error: 'Solo un administrador puede agregar leads' });
      const b = await readBody(req);
      const lead = normalizar(b);
      if (!lead.nombre) return send(res, 400, { error: 'Falta el nombre' });
      if (!lead.perfil) lead.perfil = perfilDe(null);
      if (!lead.prioridad) lead.prioridad = prioridadDe(null);
      lead.origen = clip(b.origen, 80) || 'Carga manual';
      const [creado] = await db('leads', { method: 'POST', body: lead, prefer: 'return=representation' });
      await db('lead_eventos', { method: 'POST', body: { lead_id: creado.id, tipo: 'creado', detalle: { origen: lead.origen }, autor: yo.email } });
      return send(res, 201, { lead: creado });
    }

    if (req.method === 'PATCH') {
      const b = await readBody(req);
      if (!isUuid(b.id)) return send(res, 400, { error: 'id inválido' });
      const pedidos = Object.keys(b).filter((k) => k !== 'id');
      if (!esAdmin && pedidos.some((k) => !DEL_ASESOR.includes(k))) return send(res, 403, { error: 'Tu usuario solo puede cambiar el estado y las notas' });
      const cambios = normalizar(b);
      if (!Object.keys(cambios).length) return send(res, 400, { error: 'Nada para actualizar' });
      if ('nombre' in cambios && !cambios.nombre) return send(res, 400, { error: 'Falta el nombre' });

      const [antes] = await db(`leads?id=eq.${b.id}&select=*`);
      if (!antes) return send(res, 404, { error: 'Lead no encontrado' });
      const [lead] = await db(`leads?id=eq.${b.id}`, { method: 'PATCH', body: cambios, prefer: 'return=representation' });

      const eventos = [];
      if (cambios.estado && cambios.estado !== antes.estado) eventos.push({ tipo: 'estado', detalle: { de: antes.estado, a: cambios.estado } });
      if (cambios.notas !== undefined && cambios.notas !== (antes.notas || '')) eventos.push({ tipo: 'nota', detalle: { texto: cambios.notas.slice(0, 300) } });
      if (cambios.asignado !== undefined && cambios.asignado !== antes.asignado) eventos.push({ tipo: 'asignado', detalle: { a: cambios.asignado } });
      const editados = Object.keys(CAMPOS).filter((k) => !['notas', 'asignado'].includes(k) && k in cambios && cambios[k] !== antes[k]);
      if (editados.length) eventos.push({ tipo: 'editado', detalle: { campos: editados } });
      if (eventos.length) await db('lead_eventos', { method: 'POST', body: eventos.map((e) => ({ ...e, lead_id: b.id, autor: yo.email })) });
      return send(res, 200, { lead });
    }

    if (req.method === 'DELETE') {
      if (!esAdmin) return send(res, 403, { error: 'Solo un administrador puede eliminar leads' });
      if (!isUuid(id)) return send(res, 400, { error: 'id inválido' });
      const borrados = await db(`leads?id=eq.${id}`, { method: 'DELETE', prefer: 'return=representation' });
      if (!borrados.length) return send(res, 404, { error: 'Lead no encontrado' });
      console.log('lead eliminado', id, 'por', yo.email);
      return send(res, 200, { ok: true });
    }

    return send(res, 405, { error: 'Método no permitido' });
  } catch (e) {
    if (e.status === 400) return send(res, 400, { error: e.message });
    console.error('admin leads', e);
    return send(res, 500, { error: 'Error al leer la base de datos' });
  }
};
