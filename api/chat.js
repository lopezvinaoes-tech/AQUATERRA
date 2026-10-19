// POST /api/chat: asistente con IA de la web. Responde dudas de inversión y, si la
// persona acepta, guarda sus datos como lead en la misma base del panel.
// Proveedor: Google Gemini (plan gratis) si está GEMINI_API_KEY; si no, Claude con ANTHROPIC_API_KEY.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { configured, db, parseMonto, perfilDe, prioridadDe, buscarLeadExistente, sumarContacto, hashIp, readBody, send } = require('./_lib');

const GEMINI_KEY = process.env.GEMINI_API_KEY || '';
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';
const PROVEEDOR = GEMINI_KEY ? 'gemini' : ANTHROPIC_KEY ? 'claude' : null;
// Modelo configurable desde Vercel (CHAT_MODEL).
const MODEL = process.env.CHAT_MODEL || (PROVEEDOR === 'gemini' ? 'gemini-3.8-flash' : 'claude-haiku-5-5');
const POR_IP_HORA = parseInt(process.env.CHAT_LIMITE_IP_HORA || '40', 10);
const POR_DIA = parseInt(process.env.CHAT_LIMITE_DIARIO || '3000', 10);
const MAX_MENSAJES = 40;
const MAX_LARGO = 2000;

const clip = (v, n) => (v == null ? null : String(v).trim().slice(0, n) || null);

// Catálogo de proyectos: el mismo archivo que usan las páginas Proyectos y Ficha.
function catalogo() {
  try {
    const code = fs.readFileSync(path.join(__dirname, '..', 'proyectos.js'), 'utf8');
    const sandbox = { window: { MARCA: { nombre: 'Aquaterra' } } };
    vm.runInNewContext(code, sandbox, { timeout: 200 });
    return (sandbox.window.PROYECTOS || []).map((p, i) => {
      const precio = p.precio ? `desde USD ${p.precio.toLocaleString('es-ES')}` : 'precio a consultar';
      const datos = [
        `${p.name} (${p.tipo}, ${p.etapa}) en ${p.barrio}, ${p.ciudad}`,
        p.dev ? `desarrolla ${p.dev}` : null,
        precio,
        p.entrega ? `entrega: ${p.entrega}` : null,
        p.tipologia ? `tipologías: ${p.tipologia}` : null,
        p.amen && p.amen.length ? `amenities: ${p.amen.join(', ')}` : null,
        p.pagos ? `pagos: ${p.pagos}` : null,
        p.nota || null,
        p.fuentes && p.fuentes[0] ? `fuente: ${p.fuentes[0].nombre}, ${p.fuentes[0].fecha}` : null,
        `ficha: /Aquaterra%20Ficha.dc.html?p=${i}`
      ].filter(Boolean);
      return `- ${datos.join('; ')}`;
    }).join('\n');
  } catch (e) {
    console.error('chat catálogo', e);
    return '(El catálogo no está disponible ahora; deriva a la página Proyectos.)';
  }
}

const SISTEMA = `Eres el asistente virtual de Aquaterra, una asesoría de inversión inmobiliaria en Paraguay (Asunción y el interior) para inversores, sobre todo españoles. Hablas en español de España, con trato de "tú", cercano y profesional. Si te escriben en otro idioma, responde en ese idioma.

Tu objetivo: resolver dudas sobre invertir en Paraguay, orientar hacia los proyectos del catálogo y, cuando la persona muestre interés real, ofrecerle que un asesor la contacte.

Estilo:
- Respuestas breves: 2 a 5 frases o una lista corta. Nada de párrafos largos.
- Puedes usar **negrita** y enlaces en formato [texto](url). No uses tablas ni títulos.
- Termina, cuando tenga sentido, con una pregunta que ayude a avanzar (presupuesto, objetivo, plazo).

Reglas:
- Usa solo los datos de abajo. Si no sabes algo o depende de su caso (fiscalidad concreta, trámites legales), dilo y ofrece hablar con un asesor. Nunca inventes precios, rentabilidades ni proyectos.
- No prometas rentabilidades: habla de rangos con su fuente y recuerda que no son garantía.
- No des asesoramiento fiscal ni legal personalizado; da la información general y recomienda confirmarla con un asesor o abogado.
- Si preguntan si eres una persona, di que eres un asistente con IA.
- No hables de temas ajenos a inversión inmobiliaria en Paraguay; redirige con amabilidad.

Captar el contacto:
- Cuando la persona quiera avanzar, pida que la llamen, pregunte por disponibilidad o precios concretos, o tras 3 o 4 mensajes con interés claro, ofrécele que un asesor la contacte.
- Pide su nombre y un email o WhatsApp (con prefijo de país). Si sabes su presupuesto y objetivo, inclúyelos.
- Antes de guardar, pregunta explícitamente si acepta que Aquaterra use esos datos para contactarla sobre su consulta. Solo llama a la herramienta guardar_contacto cuando haya dicho que sí y tengas nombre y al menos un email o WhatsApp.
- No insistas si no quiere dejar datos: sigue ayudando igual.
- Después de guardar, confírmale que un asesor le escribirá pronto.

Datos de la web (cada uno con su fuente):
- Grado de inversión: Moody's (Baa3, 2024) y S&P (BBB-, 2025). Fuente: ABC Color.
- Renta en dólares: los pisos se compran y alquilan en USD. Uno bien ubicado en Asunción rinde entre un 6 % y un 8 % neto al año. Fuente: La Nación.
- Entrada baja, sin banco: reservas desde USD 1.000–5.000 y cuotas a la desarrolladora durante los 2 o 3 años de obra. Fuente: Rio Times.
- Precio de entrada: desde USD 1.783/m² en pozo frente a USD 1.817/m² de un piso terminado en Asunción (avisos de mayo de 2026). Fuente: Keypy.
- Impuestos en Paraguay: IVA del 5 % en vivienda, IRP del 8 % sobre el 50 % del alquiler y sin impuesto al patrimonio. Si sigues siendo residente fiscal en España, el convenio de doble imposición evita pagar dos veces (en España los bienes en el extranjero pueden tener que declararse, p. ej. en el Modelo 720; que lo confirme su asesor fiscal). Fuente: Última Hora.
- Compra a distancia: se puede comprar con pasaporte y un poder notarial, sin residencia en Paraguay. Fuente: Rio Times.
- Cómo trabaja Aquaterra: 1) análisis del perfil (objetivo, plazo y monto), 2) selección de proyectos evaluando desarrolladora, ubicación y plan de pagos, 3) acompañamiento hasta la entrega y la puesta en renta, con informes de avance de obra.
- Rangos de inversión que usamos: Hasta USD 50.000; USD 50.000 – 100.000; USD 100.000 – 250.000; Más de USD 250.000.
- Objetivos: Renta por alquiler; Revalorización; Vivienda propia.

Catálogo actual (proyectos reales de otras desarrolladoras, con fuente y fecha del dato):
{{CATALOGO}}

Páginas: [Proyectos](/Aquaterra%20Proyectos.dc.html), [Comprar desde España](/Aquaterra%20Desde%20Espana.dc.html), [Blog](/Aquaterra%20Blog.dc.html), [asesoría](/#contacto).`;

const HERRAMIENTAS = [{
  name: 'guardar_contacto',
  description: 'Guarda los datos de contacto de la persona para que un asesor de Aquaterra la contacte. Úsala solo cuando la persona haya aceptado explícitamente ser contactada y haya dado su nombre y un email o WhatsApp. Si ya la usaste en esta conversación y la persona da datos nuevos, vuelve a usarla con todo actualizado.',
  input_schema: {
    type: 'object',
    additionalProperties: false,
    required: ['nombre', 'email', 'whatsapp', 'monto', 'objetivo', 'proyecto_interes', 'resumen', 'consentimiento'],
    properties: {
      nombre: { type: 'string', description: 'Nombre y apellido' },
      email: { type: ['string', 'null'], description: 'Email, o null si no lo dio' },
      whatsapp: { type: ['string', 'null'], description: 'WhatsApp con prefijo de país, o null' },
      monto: { type: ['string', 'null'], enum: ['Hasta USD 50.000', 'USD 50.000 – 100.000', 'USD 100.000 – 250.000', 'Más de USD 250.000', null], description: 'Rango de inversión, o null si no se sabe' },
      objetivo: { type: ['string', 'null'], enum: ['Renta por alquiler', 'Revalorización', 'Vivienda propia', null], description: 'Objetivo principal, o null' },
      proyecto_interes: { type: ['string', 'null'], description: 'Proyecto del catálogo que le interesa, o null' },
      resumen: { type: 'string', description: 'Resumen de 2 a 4 frases para el asesor: qué busca, plazo, dudas y siguiente paso' },
      consentimiento: { type: 'boolean', description: 'true solo si la persona aceptó explícitamente ser contactada' }
    }
  }
}];

// La misma herramienta en el formato de Gemini (subconjunto de OpenAPI: sin null ni additionalProperties).
const GEMINI_HERRAMIENTAS = [{
  functionDeclarations: [{
    name: 'guardar_contacto',
    description: HERRAMIENTAS[0].description,
    parameters: {
      type: 'object',
      required: ['nombre', 'resumen', 'consentimiento'],
      properties: {
        nombre: { type: 'string', description: 'Nombre y apellido' },
        email: { type: 'string', description: 'Email, si lo dio' },
        whatsapp: { type: 'string', description: 'WhatsApp con prefijo de país, si lo dio' },
        monto: { type: 'string', enum: ['Hasta USD 50.000', 'USD 50.000 – 100.000', 'USD 100.000 – 250.000', 'Más de USD 250.000'], description: 'Rango de inversión, si se sabe' },
        objetivo: { type: 'string', enum: ['Renta por alquiler', 'Revalorización', 'Vivienda propia'], description: 'Objetivo principal, si se sabe' },
        proyecto_interes: { type: 'string', description: 'Proyecto del catálogo que le interesa, si hay uno' },
        resumen: { type: 'string', description: 'Resumen de 2 a 4 frases para el asesor: qué busca, plazo, dudas y siguiente paso' },
        consentimiento: { type: 'boolean', description: 'true solo si la persona aceptó explícitamente ser contactada' }
      }
    }
  }]
}];

// Firma del id del lead para que solo esta conversación pueda actualizarlo.
const firmar = (id) => `${id}.${crypto.createHmac('sha256', process.env.SUPABASE_SERVICE_ROLE_KEY || 'x').update(String(id)).digest('hex').slice(0, 24)}`;
function verificar(token) {
  const [id] = String(token || '').split('.');
  return id && /^[0-9a-f-]{36}$/.test(id) && firmar(id) === token ? id : null;
}

async function guardarContacto(input, ctx) {
  if (!configured()) return { error: 'La base de datos no está disponible; ofrece WhatsApp o el formulario de asesoría.' };
  if (input.consentimiento !== true) return { error: 'Falta que la persona acepte ser contactada. Pregúntaselo antes de guardar.' };
  const nombre = clip(input.nombre, 120);
  const email = clip(input.email, 160);
  const whatsapp = clip(input.whatsapp, 40);
  if (!nombre) return { error: 'Falta el nombre.' };
  if (!email && !whatsapp) return { error: 'Falta un email o WhatsApp.' };
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: 'El email no parece válido; pídeselo de nuevo.' };
  if (whatsapp && whatsapp.replace(/\D/g, '').length < 6) return { error: 'El WhatsApp no parece válido; pídeselo con prefijo de país.' };

  const monto = clip(input.monto, 80);
  const [monto_min, monto_max] = parseMonto(monto);
  const objetivo = clip(input.objetivo, 80);
  const ia = {
    fuente: 'chat',
    modelo: MODEL,
    resumen: clip(input.resumen, 1500),
    conversacion: ctx.mensajes.slice(-30).map((m) => ({ rol: m.role === 'user' ? 'visitante' : 'asistente', texto: m.content })),
    actualizado: new Date().toISOString()
  };
  const datos = {
    nombre, email, whatsapp, monto, monto_min, monto_max, objetivo,
    proyecto_interes: clip(input.proyecto_interes, 160),
    mensaje: clip(input.resumen, 2000),
    consentimiento: true,
    perfil: perfilDe(objetivo),
    prioridad: prioridadDe(monto_min),
    ia
  };

  const previo = verificar(ctx.leadToken);
  if (previo) {
    // Al actualizar no se borran datos que la persona dio antes.
    const cambios = Object.fromEntries(Object.entries(datos).filter(([, v]) => v != null));
    if (!monto) { delete cambios.prioridad; }
    if (!objetivo) { delete cambios.perfil; }
    await db(`leads?id=eq.${previo}`, { method: 'PATCH', body: cambios });
    await db('lead_eventos', { method: 'POST', body: { lead_id: previo, tipo: 'editado', detalle: { campos: Object.keys(cambios).filter((k) => k !== 'ia') }, autor: 'Asistente IA' } });
    return { ok: true, id: previo };
  }
  const h = ctx.req.headers;
  const lead = Object.assign(datos, {
    origen: 'Chat IA',
    pagina: clip(ctx.pagina, 300),
    pais: clip(h['x-vercel-ip-country'], 4),
    ciudad: h['x-vercel-ip-city'] ? clip(decodeURIComponent(h['x-vercel-ip-city']), 80) : null,
    idioma: clip(String(h['accept-language'] || '').split(',')[0], 20),
    user_agent: clip(h['user-agent'], 300),
    ip_hash: ctx.ipHash
  });
  // Si ya dejó sus datos antes (formulario, comparador u otro chat), se suma a su perfil.
  const existente = await buscarLeadExistente(email, whatsapp);
  if (existente) return { ok: true, id: await sumarContacto(existente, lead, { origen: 'Chat IA', autor: 'Asistente IA' }) };
  const [creado] = await db('leads', { method: 'POST', body: lead, prefer: 'return=representation' });
  await db('lead_eventos', { method: 'POST', body: { lead_id: creado.id, tipo: 'creado', detalle: { origen: 'Chat IA' }, autor: 'Asistente IA' } });
  return { ok: true, id: creado.id };
}

async function pedir(url, headers, body) {
  const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json', ...headers }, body: JSON.stringify(body) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error((data.error && data.error.message) || `${PROVEEDOR} ${r.status}`), { status: r.status });
  return data;
}

// Cada proveedor expone el mismo par de funciones:
//   turno() -> { texto } o { llamadas: [{ id, name, input }] } o { rechazo: true }
//   responder(llamadas, resultados) añade los resultados de las herramientas a la conversación.
function proveedorClaude(sistema, mensajes) {
  const historial = mensajes.map((m) => ({ role: m.role, content: m.content }));
  const base = {
    model: MODEL,
    max_tokens: 2048,
    system: [{ type: 'text', text: sistema, cache_control: { type: 'ephemeral' } }],
    tools: HERRAMIENTAS,
    output_config: { effort: 'low' }
  };
  return {
    async turno() {
      const r = await pedir('https://api.anthropic.com/v1/messages', { 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' }, { ...base, messages: historial });
      if (r.stop_reason === 'refusal') return { rechazo: true };
      const usos = (r.content || []).filter((c) => c.type === 'tool_use');
      if (r.stop_reason !== 'tool_use' || !usos.length) return { texto: (r.content || []).filter((c) => c.type === 'text').map((c) => c.text).join('\n').trim() };
      // Se devuelve el contenido tal cual (incluidos los bloques de razonamiento) antes de los resultados.
      historial.push({ role: 'assistant', content: r.content });
      return { llamadas: usos.map((u) => ({ id: u.id, name: u.name, input: u.input || {} })) };
    },
    responder(llamadas, resultados) {
      historial.push({ role: 'user', content: llamadas.map((l, i) => ({ type: 'tool_result', tool_use_id: l.id, content: JSON.stringify(resultados[i]), is_error: !resultados[i].ok })) });
    }
  };
}

function proveedorGemini(sistema, mensajes) {
  const contents = mensajes.map((m) => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] }));
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent`;
  return {
    async turno() {
      const r = await pedir(url, { 'x-goog-api-key': GEMINI_KEY }, {
        systemInstruction: { parts: [{ text: sistema }] },
        contents,
        tools: GEMINI_HERRAMIENTAS,
        generationConfig: { maxOutputTokens: 2048 }
      });
      const cand = (r.candidates || [])[0];
      if (!cand || !cand.content) return (r.promptFeedback && r.promptFeedback.blockReason) || (cand && cand.finishReason === 'SAFETY') ? { rechazo: true } : { texto: '' };
      const parts = cand.content.parts || [];
      const llamadas = parts.filter((p) => p.functionCall).map((p) => ({ id: p.functionCall.id, name: p.functionCall.name, input: p.functionCall.args || {} }));
      if (!llamadas.length) return { texto: parts.filter((p) => p.text && !p.thought).map((p) => p.text).join('').trim() };
      // Se devuelve el turno del modelo tal cual (con sus firmas de razonamiento) antes de los resultados.
      contents.push(cand.content);
      return { llamadas };
    },
    responder(llamadas, resultados) {
      contents.push({ role: 'user', parts: llamadas.map((l, i) => ({ functionResponse: { ...(l.id ? { id: l.id } : {}), name: l.name, response: resultados[i] } })) });
    }
  };
}

// Límite por IP y diario. Si la tabla no existe todavía, no bloquea el chat.
async function dentroDelLimite(ipHash) {
  if (!configured()) return true;
  try {
    const hora = new Date(Date.now() - 3600 * 1000).toISOString();
    const dia = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const [deIp, total] = await Promise.all([
      db(`chat_uso?select=id&ip_hash=eq.${ipHash}&created_at=gte.${encodeURIComponent(hora)}&limit=${POR_IP_HORA}`),
      db(`chat_uso?select=id&created_at=gte.${encodeURIComponent(dia)}&limit=${POR_DIA}`)
    ]);
    if (deIp.length >= POR_IP_HORA || total.length >= POR_DIA) return false;
    await db('chat_uso', { method: 'POST', body: { ip_hash: ipHash } });
  } catch (e) {
    console.error('chat límite', e.message);
  }
  return true;
}

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  if (req.method === 'GET') return send(res, 200, { ok: true, activo: Boolean(PROVEEDOR), proveedor: PROVEEDOR, modelo: PROVEEDOR ? MODEL : null });
  if (req.method !== 'POST') return send(res, 405, { error: 'Método no permitido' });
  if (!PROVEEDOR) return send(res, 503, { error: 'El asistente todavía no está activado. Escríbenos por WhatsApp o deja tus datos en el formulario.' });

  const b = await readBody(req);
  // Historial en texto plano que guarda el navegador; empieza siempre por un mensaje del visitante.
  let mensajes = (Array.isArray(b.mensajes) ? b.mensajes : [])
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .map((m) => ({ role: m.role, content: m.content.trim().slice(0, MAX_LARGO) }))
    .slice(-MAX_MENSAJES);
  while (mensajes.length && mensajes[0].role !== 'user') mensajes.shift();
  // Une mensajes seguidos del mismo rol (la API exige alternancia).
  mensajes = mensajes.reduce((acc, m) => {
    const last = acc[acc.length - 1];
    if (last && last.role === m.role) last.content += `\n\n${m.content}`;
    else acc.push({ ...m });
    return acc;
  }, []);
  if (!mensajes.length || mensajes[mensajes.length - 1].role !== 'user') return send(res, 400, { error: 'Falta tu mensaje' });

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'desconocida';
  const ipHash = hashIp(ip);
  if (!(await dentroDelLimite(ipHash))) {
    return send(res, 429, { error: 'Has enviado muchos mensajes seguidos. Prueba en un rato o escríbenos por WhatsApp.' });
  }

  const ctx = { req, ipHash, mensajes, leadToken: b.lead, pagina: b.pagina };
  const sistema = SISTEMA.replace('{{CATALOGO}}', catalogo());
  const ia = PROVEEDOR === 'gemini' ? proveedorGemini(sistema, mensajes) : proveedorClaude(sistema, mensajes);

  let lead = null;
  try {
    for (let vuelta = 0; vuelta < 3; vuelta++) {
      const r = await ia.turno();
      if (r.rechazo) {
        return send(res, 200, { respuesta: 'Prefiero no responder a eso. ¿Te ayudo con alguna duda sobre invertir en Paraguay?', lead: lead ? firmar(lead) : undefined });
      }
      if (!r.llamadas) {
        return send(res, 200, {
          respuesta: r.texto || 'Perdona, no te he entendido. ¿Me lo cuentas de otra forma?',
          lead: lead ? firmar(lead) : undefined,
          guardado: Boolean(lead)
        });
      }
      const resultados = [];
      for (const u of r.llamadas) {
        let out;
        try {
          out = u.name === 'guardar_contacto' ? await guardarContacto(u.input, ctx) : { error: 'Herramienta desconocida' };
        } catch (e) {
          console.error('chat guardar', e);
          out = { error: 'No se pudo guardar ahora; ofrece WhatsApp o el formulario de asesoría.' };
        }
        if (out.ok) { lead = out.id; ctx.leadToken = firmar(out.id); }
        resultados.push(out.ok ? { ok: true } : out);
      }
      ia.responder(r.llamadas, resultados);
    }
    return send(res, 200, { respuesta: 'Listo. ¿Hay algo más en lo que te pueda ayudar?', lead: lead ? firmar(lead) : undefined, guardado: Boolean(lead) });
  } catch (e) {
    console.error('chat', e.status, e.message);
    const ocupado = e.status === 429 || e.status === 529;
    return send(res, ocupado ? 503 : 500, { error: ocupado ? 'El asistente está muy solicitado ahora mismo. Prueba en unos segundos.' : 'No pude responder ahora. Escríbenos por WhatsApp o deja tus datos en el formulario.' });
  }
};
