// POST /api/leads: recibe el formulario de asesoría y guarda el lead.
const { configured, db, parseMonto, perfilDe, prioridadDe, hashIp, readBody, send } = require('./_lib');

const clip = (v, n) => (v == null ? null : String(v).trim().slice(0, n) || null);

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (req.method !== 'POST') return send(res, 405, { error: 'Método no permitido' });
  if (!configured()) return send(res, 503, { error: 'La base de datos todavía no está configurada' });

  const b = await readBody(req);
  // Campo trampa: invisible para personas, los bots lo completan.
  if (b.empresa_web) return send(res, 200, { ok: true });

  const nombre = clip(b.nombre, 120);
  const email = clip(b.email, 160);
  const whatsapp = clip(b.whatsapp || b.tel, 40);
  if (!nombre) return send(res, 400, { error: 'Falta el nombre' });
  if (!email && !whatsapp) return send(res, 400, { error: 'Falta un email o WhatsApp' });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return send(res, 400, { error: 'El email no es válido' });
  if (whatsapp && whatsapp.replace(/\D/g, '').length < 6) return send(res, 400, { error: 'El WhatsApp no es válido' });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'desconocida';
  const ip_hash = hashIp(ip);

  try {
    // Máximo 5 envíos por IP cada 10 minutos.
    const desde = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const recientes = await db(`leads?select=id&ip_hash=eq.${ip_hash}&created_at=gte.${encodeURIComponent(desde)}`);
    if (recientes.length >= 5) return send(res, 429, { error: 'Demasiados envíos, intenta más tarde' });

    const monto = clip(b.monto, 80);
    const [monto_min, monto_max] = parseMonto(b.monto);
    const objetivo = clip(b.objetivo || b.obj, 80);
    const h = req.headers;
    const lead = {
      nombre, email, whatsapp, monto, monto_min, monto_max, objetivo,
      mensaje: clip(b.mensaje, 2000),
      proyecto_interes: clip(b.proyecto, 160),
      consentimiento: b.consentimiento === true,
      perfil: perfilDe(objetivo),
      prioridad: prioridadDe(monto_min),
      origen: clip(b.origen, 80) || 'Asesoría personalizada',
      pagina: clip(b.pagina, 300),
      referrer: clip(b.referrer, 300),
      utm_source: clip(b.utm_source, 80),
      utm_medium: clip(b.utm_medium, 80),
      utm_campaign: clip(b.utm_campaign, 120),
      pais: clip(h['x-vercel-ip-country'], 4),
      ciudad: h['x-vercel-ip-city'] ? clip(decodeURIComponent(h['x-vercel-ip-city']), 80) : null,
      idioma: clip(String(h['accept-language'] || '').split(',')[0], 20),
      user_agent: clip(h['user-agent'], 300),
      ip_hash
    };
    const [creado] = await db('leads', { method: 'POST', body: lead, prefer: 'return=representation' });
    await db('lead_eventos', { method: 'POST', body: { lead_id: creado.id, tipo: 'creado', detalle: { origen: lead.origen } } });
    return send(res, 201, { ok: true, id: creado.id });
  } catch (e) {
    console.error('leads POST', e);
    return send(res, 500, { error: 'No pudimos guardar tu solicitud' });
  }
};
