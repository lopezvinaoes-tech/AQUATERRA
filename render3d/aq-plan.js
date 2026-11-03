// Aquaterra · formato de plano «aq-plano» v1: estándar, validación, análisis de muros/aberturas y plantillas.
export const TIPOS = {
  salon: { l: 'Salón', css: 'var(--color-accent-100)', hex: '#f3e2cf' },
  comedor: { l: 'Comedor', css: 'var(--color-accent-100)', hex: '#f3e2cf' },
  cocina: { l: 'Cocina', css: 'var(--color-accent-2-100)', hex: '#e2e8d6' },
  dormitorio: { l: 'Dormitorio', css: 'var(--color-neutral-200)', hex: '#ece2d2' },
  bano: { l: 'Baño', css: 'var(--color-accent-2-200)', hex: '#d3dcc4' },
  estudio: { l: 'Estudio', css: 'var(--color-neutral-200)', hex: '#ece2d2' },
  pasillo: { l: 'Pasillo', css: 'var(--color-neutral-100)', hex: '#f6efe3' },
  recibidor: { l: 'Recibidor', css: 'var(--color-neutral-100)', hex: '#f6efe3' },
  lavadero: { l: 'Lavadero', css: 'var(--color-accent-2-100)', hex: '#e2e8d6' },
  terraza: { l: 'Terraza', css: 'var(--color-accent-2-300)', hex: '#c6d1b1' }
};

const r2 = v => Math.round(v * 100) / 100;
const snap = v => Math.round(v * 20) / 20;
const num = (v, d) => { const n = typeof v === 'string' ? parseFloat(v.replace(',', '.')) : v; return Number.isFinite(n) ? n : d; };
const fmt = v => String(r2(v)).replace('.', ',');
const ins = r => !!r && r.tipo !== 'terraza';

export function normalize(raw) {
  const errors = [], warnings = [];
  let p = raw;
  if (typeof p === 'string') { try { p = JSON.parse(p); } catch (e) { return { errors: ['El archivo no es un JSON válido.'], warnings, plan: null, stats: null }; } }
  if (!p || typeof p !== 'object') return { errors: ['Plano vacío.'], warnings, plan: null, stats: null };
  if (p.formato !== 'aq-plano') warnings.push('Falta "formato": "aq-plano"; se interpreta igualmente.');
  if (p.unidad && p.unidad !== 'm') errors.push('Las medidas deben ir en metros ("unidad": "m").');
  const H = r2(Math.min(4.5, Math.max(2.2, num(p.alturaLibre, 2.7))));
  const list = Array.isArray(p.estancias) ? p.estancias : [];
  if (!list.length) errors.push('No hay estancias: añade al menos una en "estancias".');
  if (list.length > 40) errors.push('Máximo 40 estancias por planta.');
  const ids = new Set();
  const rooms = list.slice(0, 40).map((e, i) => {
    e = e || {};
    let tipo = String(e.tipo || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (!TIPOS[tipo]) { warnings.push(`Estancia ${i + 1}: tipo «${e.tipo || '—'}» desconocido; se trata como salón.`); tipo = 'salon'; }
    const nombre = String(e.nombre || TIPOS[tipo].l).slice(0, 40);
    let id = String(e.id || tipo + (i + 1)).replace(/[^\w-]/g, '').slice(0, 30) || 'e' + (i + 1);
    while (ids.has(id)) id += '_';
    ids.add(id);
    const x = snap(num(e.x, NaN)), y = snap(num(e.y, NaN)), w = snap(num(e.ancho ?? e.w, NaN)), d = snap(num(e.fondo ?? e.d, NaN));
    if (![x, y, w, d].every(Number.isFinite)) errors.push(`«${nombre}»: faltan x, y, ancho o fondo.`);
    else if (w < 1.2 || d < 1.2) errors.push(`«${nombre}»: mínimo 1,2 × 1,2 m.`);
    else if (w > 30 || d > 30) errors.push(`«${nombre}»: máximo 30 m por lado.`);
    const dbl = !!e.dobleAltura && tipo !== 'terraza';
    let alt = num(e.altura, 0); alt = alt > 0 ? r2(Math.min(9, Math.max(2.2, alt))) : 0;
    return { id, nombre, tipo, x: x || 0, y: y || 0, w: w || 0, d: d || 0, dbl, alt, h: tipo === 'terraza' ? 0 : (dbl ? Math.max(alt, r2(H * 2)) : (alt || H)) };
  });
  for (let i = 0; i < rooms.length; i++) for (let j = i + 1; j < rooms.length; j++) {
    const a = rooms[i], b = rooms[j];
    const ov = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x)) * Math.max(0, Math.min(a.y + a.d, b.y + b.d) - Math.max(a.y, b.y));
    if (ov > 0.05) errors.push(`«${a.nombre}» y «${b.nombre}» se solapan ${fmt(ov)} m².`);
  }
  if (rooms.length) {
    const xs = rooms.flatMap(r => [r.x, r.x + r.w]), ys = rooms.flatMap(r => [r.y, r.y + r.d]);
    if (Math.max(...xs) - Math.min(...xs) > 60 || Math.max(...ys) - Math.min(...ys) > 60) errors.push('La planta supera 60 m de lado.');
    if (!rooms.some(r => r.tipo === 'bano')) warnings.push('No hay ningún baño.');
  }
  // Paredes libres (líneas, también en diagonal) y puertas colocadas a mano.
  const paredes = (Array.isArray(p.paredes) ? p.paredes : []).slice(0, 200).map(w => {
    w = w || {}; const x1 = snap(num(w.x1, NaN)), y1 = snap(num(w.y1, NaN)), x2 = snap(num(w.x2, NaN)), y2 = snap(num(w.y2, NaN));
    return [x1, y1, x2, y2].every(Number.isFinite) && Math.hypot(x2 - x1, y2 - y1) >= 0.3 ? { x1, y1, x2, y2 } : null;
  }).filter(Boolean);
  if (Array.isArray(p.paredes) && p.paredes.length > paredes.length) warnings.push('Se ignoraron paredes sin coordenadas o de menos de 30 cm.');
  const puertas = (Array.isArray(p.puertas) ? p.puertas : []).slice(0, 100).map(d => {
    d = d || {}; const x = snap(num(d.x, NaN)), y = snap(num(d.y, NaN));
    return Number.isFinite(x) && Number.isFinite(y) ? { x, y, ancho: r2(Math.min(1.6, Math.max(0.6, num(d.ancho, 0.9)))) } : null;
  }).filter(Boolean);
  const area = rooms.filter(ins).reduce((s, r) => s + r.w * r.d, 0), terr = rooms.filter(r => r.tipo === 'terraza').reduce((s, r) => s + r.w * r.d, 0);
  return { errors, warnings, plan: errors.length ? null : { nombre: String(p.nombre || 'Mi plano').slice(0, 60), H, rooms, paredes, puertas }, stats: { n: rooms.length, area: r2(area), terraza: r2(terr), dbl: rooms.some(r => r.dbl) } };
}

const HUB = ['salon', 'comedor', 'pasillo', 'recibidor'];
const OPEN = ['cocina|comedor', 'cocina|salon', 'comedor|salon'];
const PREF = {
  cocina: ['pasillo', 'recibidor', 'comedor', 'salon'],
  dormitorio: ['pasillo', 'recibidor', 'salon', 'comedor', 'estudio'],
  estudio: ['pasillo', 'recibidor', 'salon', 'comedor'],
  lavadero: ['cocina', 'pasillo', 'recibidor', 'comedor', 'salon'],
  bano: ['pasillo', 'recibidor', 'dormitorio', 'salon', 'comedor']
};

// Muros, puertas, ventanas y conexiones generados automáticamente a partir de estancias rectangulares.
export function analyze(plan) {
  const rooms = plan.rooms, warnings = [];
  const lines = new Map();
  const add = (o, c, a, b, r, side) => { const k = o + r2(c); if (!lines.has(k)) lines.set(k, { o, c: r2(c), it: [] }); lines.get(k).it.push({ a: r2(a), b: r2(b), r, side }); };
  rooms.forEach(r => { add('h', r.y, r.x, r.x + r.w, r, 1); add('h', r.y + r.d, r.x, r.x + r.w, r, -1); add('v', r.x, r.y, r.y + r.d, r, 1); add('v', r.x + r.w, r.y, r.y + r.d, r, -1); });
  const segs = [], rails = [];
  lines.forEach(L => {
    const pts = [...new Set(L.it.flatMap(i => [i.a, i.b]))].sort((a, b) => a - b);
    let cur = null;
    for (let i = 0; i < pts.length - 1; i++) {
      const p = pts[i], q = pts[i + 1], m = (p + q) / 2;
      const f = s => (L.it.find(t => t.side === s && t.a < m && t.b > m) || {}).r || null;
      const pos = f(1), neg = f(-1);
      if (!ins(pos) && !ins(neg)) { if ((pos || neg) && !(pos && neg)) rails.push({ o: L.o, c: L.c, a: p, b: q }); cur = null; continue; }
      if (cur && cur.pos === pos && cur.neg === neg && Math.abs(cur.b - p) < 1e-6) { cur.b = q; continue; }
      cur = { o: L.o, c: L.c, a: p, b: q, pos, neg, ops: [] };
      segs.push(cur);
    }
  });
  segs.forEach(s => { s.ext = !ins(s.pos) || !ins(s.neg); s.t = s.ext ? 0.24 : 0.12; s.h = Math.max(ins(s.pos) ? s.pos.h : 0, ins(s.neg) ? s.neg.h : 0); s.len = r2(s.b - s.a); });

  const ops = [], edges = [], adj = new Map(rooms.map(r => [r.id, []]));
  const opAt = (s, kind, w, bot, top, center) => {
    const m = center ?? (s.a + s.b) / 2;
    const o = { kind, s: r2(m - w / 2), e: r2(m + w / 2), w, bot, top, seg: s, mid: m, x: s.o === 'h' ? m : s.c, y: s.o === 'h' ? s.c : m };
    s.ops.push(o); ops.push(o); return o;
  };
  const link = (s, kind) => {
    const A = s.pos, B = s.neg, len = s.len;
    let o;
    if (kind === 'open') o = opAt(s, 'open', len - 0.14, 0, Math.min(A.h, B.h));
    else if (kind === 'slide') { const I = ins(A) ? A : B; o = opAt(s, 'slide', Math.max(0.9, Math.min(len - 0.6, I.dbl ? 4.5 : 3)), 0, I.dbl ? Math.min(I.h - 0.5, 4.6) : 2.3); }
    else o = opAt(s, 'door', (A.tipo === 'bano' || B.tipo === 'bano') ? 0.8 : 0.9, 0, 2.1);
    o.rooms = [A, B]; edges.push(o);
    adj.get(A.id).push({ to: B, o }); adj.get(B.id).push({ to: A, o });
    return o;
  };
  const pk = (A, B) => [A.id, B.id].sort().join('|'), tk = (A, B) => [A.tipo, B.tipo].sort().join('|');
  // Paredes libres: segmentos con cualquier ángulo. Su altura es la de la estancia más alta que tocan.
  const roomAtP = (x, y) => rooms.find(R => ins(R) && x >= R.x - 1e-6 && x <= R.x + R.w + 1e-6 && y >= R.y - 1e-6 && y <= R.y + R.d + 1e-6) || null;
  const free = (plan.paredes || []).map((w, i) => {
    const dx = w.x2 - w.x1, dy = w.y2 - w.y1, len = r2(Math.hypot(dx, dy));
    let h = 0; [0.1, 0.5, 0.9].forEach(k => { const R = roomAtP(w.x1 + dx * k, w.y1 + dy * k); if (R) h = Math.max(h, R.h); });
    return { free: true, i, o: 'f', c: 'f' + i, x1: w.x1, y1: w.y1, x2: w.x2, y2: w.y2, len, ux: dx / len, uy: dy / len, ang: Math.atan2(dy, dx), t: 0.12, h: h || plan.H || 2.7, ops: [] };
  });
  // Puertas a mano: cada una se apoya en la pared (de estancia o libre) más cercana a su punto.
  const manual = (plan.puertas || []).length > 0;
  let entry = null;
  if (manual) {
    (plan.puertas || []).forEach((P, pi) => {
      let best = null;
      segs.forEach(s => {
        const along = s.o === 'h' ? P.x : P.y, across = s.o === 'h' ? P.y : P.x, dist = Math.abs(across - s.c);
        if (dist > 0.45 || along < s.a - 0.05 || along > s.b + 0.05) return;
        if (!best || dist < best.dist) best = { s, along, dist };
      });
      free.forEach(f => {
        const k = (P.x - f.x1) * f.ux + (P.y - f.y1) * f.uy, dist = Math.abs((P.x - f.x1) * f.uy - (P.y - f.y1) * f.ux);
        if (dist > 0.45 || k < -0.05 || k > f.len + 0.05) return;
        if (!best || dist < best.dist) best = { s: f, along: k, dist };
      });
      if (!best) { warnings.push(`Puerta en (${fmt(P.x)}, ${fmt(P.y)}) sin pared cerca: se ignora.`); return; }
      const s = best.s, a = s.free ? 0 : s.a, b = s.free ? s.len : s.b, w = Math.min(P.ancho, r2(b - a - 0.1));
      if (w < 0.6) { warnings.push(`Pared demasiado corta para la puerta en (${fmt(P.x)}, ${fmt(P.y)}).`); return; }
      const m = r2(Math.min(b - w / 2 - 0.05, Math.max(a + w / 2 + 0.05, best.along)));
      if (s.ops.some(o => o.s < m + w / 2 + 0.05 && o.e > m - w / 2 - 0.05)) return;
      if (s.free) { const o = { kind: 'door', s: r2(m - w / 2), e: r2(m + w / 2), w, bot: 0, top: 2.1, seg: s, mid: m, x: r2(s.x1 + s.ux * m), y: r2(s.y1 + s.uy * m), rooms: [], manual: true, pi }; s.ops.push(o); ops.push(o); return; }
      const A = s.pos, B = s.neg;
      if (ins(A) && ins(B)) { const o = opAt(s, 'door', w, 0, 2.1, m); o.manual = true; o.pi = pi; o.rooms = [A, B]; edges.push(o); adj.get(A.id).push({ to: B, o }); adj.get(B.id).push({ to: A, o }); return; }
      const R = ins(A) ? A : B, T = R === A ? B : A;
      if (!entry && !T) { entry = opAt(s, 'entry', Math.max(w, 0.9), 0, 2.2, m); entry.manual = true; entry.pi = pi; entry.rooms = [R]; entry.room = R; return; }
      const o = opAt(s, 'door', w, 0, 2.1, m); o.manual = true; o.pi = pi; o.rooms = T ? [R, T] : [R];
      if (T) { edges.push(o); adj.get(R.id).push({ to: T, o }); adj.get(T.id).push({ to: R, o }); }
    });
  }
  const pairs = new Map();
  segs.forEach(s => { if (!s.pos || !s.neg) return; const k = pk(s.pos, s.neg), c = pairs.get(k); if (!c || s.len > c.len) pairs.set(k, s); });
  const linked = new Set();
  pairs.forEach((s, k) => {
    const A = s.pos, B = s.neg;
    if (s.ops.length) return;
    if (A.tipo === 'terraza' || B.tipo === 'terraza') { if (s.len >= 1.4) { link(s, 'slide'); linked.add(k); } return; }
    if (OPEN.includes(tk(A, B)) && s.len >= 1.2) { link(s, 'open'); linked.add(k); }
  });
  if (!manual) pairs.forEach((s, k) => { if (!linked.has(k) && HUB.includes(s.pos.tipo) && HUB.includes(s.neg.tipo) && s.len >= 1) { link(s, 'door'); linked.add(k); } });
  if (!manual) ['cocina', 'dormitorio', 'estudio', 'lavadero', 'bano'].forEach(t => rooms.filter(R => R.tipo === t).forEach(R => {
    if (adj.get(R.id).some(a => HUB.includes(a.to.tipo) || a.o.kind === 'open')) return;
    for (const want of PREF[t]) {
      let best = null;
      pairs.forEach((s, k) => { if (linked.has(k) || s.len < 1) return; const O = s.pos === R ? s.neg : s.neg === R ? s.pos : null; if (O && O.tipo === want && (!best || s.len > best.len)) best = s; });
      if (best) { link(best, 'door'); linked.add(pk(best.pos, best.neg)); break; }
    }
  }));

  if (!manual) for (const t of ['recibidor', 'pasillo', 'salon', 'comedor', 'cocina', 'estudio', 'dormitorio']) {
    const c = segs.filter(s => s.ext && !(s.pos && s.neg) && s.len >= 1.3 && (s.pos || s.neg).tipo === t).sort((a, b) => b.len - a.len)[0];
    if (c) { const R = c.pos || c.neg; entry = opAt(c, 'entry', 1, 0, 2.2, c.len >= 3.4 ? c.a + 1.05 : null); entry.rooms = [R]; entry.room = R; break; }
  }
  if (!entry && rooms.some(ins)) warnings.push(manual ? 'Ninguna puerta da al exterior: pon una en una fachada para la entrada.' : 'No se encontró un muro exterior para la puerta de entrada.');

  const reach = () => {
    const start = entry ? entry.room : rooms.find(ins), seen = new Set();
    if (!start) return seen;
    const q = [start]; seen.add(start.id);
    while (q.length) { const R = q.shift(); adj.get(R.id).forEach(a => { if (!seen.has(a.to.id)) { seen.add(a.to.id); q.push(a.to); } }); }
    return seen;
  };
  for (let g = 0; g < 40; g++) {
    const seen = reach(), miss = rooms.filter(r => !seen.has(r.id));
    if (!miss.length) break;
    if (manual) { const sin = miss.filter(ins); if (sin.length && !free.length) warnings.push('Sin puerta: ' + sin.map(r => '«' + r.nombre + '»').join(', ') + '.'); break; }
    const s = [...pairs.values()].sort((a, b) => b.len - a.len).find(s => !linked.has(pk(s.pos, s.neg)) && s.len >= 1 && seen.has(s.pos.id) !== seen.has(s.neg.id));
    if (!s) { warnings.push('Sin acceso a: ' + miss.map(r => '«' + r.nombre + '»').join(', ') + '.'); break; }
    link(s, s.pos.tipo === 'terraza' || s.neg.tipo === 'terraza' ? 'slide' : 'door'); linked.add(pk(s.pos, s.neg));
  }

  const WIN = (R, len) => {
    const t = R.tipo;
    if (t === 'salon') return R.dbl ? { w: Math.min(len - 0.8, 6), bot: 0.05, top: R.h - 0.45 } : { w: Math.min(len * 0.6, 3.2), bot: 0.45, top: 2.3 };
    if (t === 'comedor' || t === 'estudio' || t === 'dormitorio') return { w: Math.min(len * 0.5, 2.4), bot: 0.9, top: 2.2 };
    if (t === 'cocina') return { w: Math.min(len * 0.4, 1.6), bot: 1.05, top: 2.15 };
    if (t === 'bano' || t === 'lavadero') return { w: 0.6, bot: 1.6, top: 2.15 };
    return len >= 3 ? { w: 0.8, bot: 0.9, top: 2.2 } : null;
  };
  const nWin = new Map();
  segs.filter(s => s.ext && !(s.pos && s.neg) && s.len >= 1.4).sort((a, b) => b.len - a.len).forEach(s => {
    const R = s.pos || s.neg, n = nWin.get(R.id) || 0;
    if (R.tipo !== 'salon' && n >= 2) return;
    const spec = WIN(R, s.len); if (!spec) return;
    let lo = s.a + 0.3, hi = s.b - 0.3;
    s.ops.forEach(o => { if (o.mid < (s.a + s.b) / 2) lo = Math.max(lo, o.e + 0.35); else hi = Math.min(hi, o.s - 0.35); });
    const w = Math.min(spec.w, hi - lo); if (w < 0.5) return;
    opAt(s, 'window', r2(w), spec.bot, spec.top, (lo + hi) / 2); nWin.set(R.id, n + 1);
  });

  const xs = rooms.flatMap(r => [r.x, r.x + r.w]).concat(free.flatMap(f => [f.x1, f.x2])), ys = rooms.flatMap(r => [r.y, r.y + r.d]).concat(free.flatMap(f => [f.y1, f.y2]));
  return { rooms, segs, free, rails, ops, edges, adj, entry, manual, warnings, bounds: { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) } };
}

export function toFile(nombre, rooms, alturaLibre, paredes, puertas) {
  const f = { formato: 'aq-plano', version: 1, unidad: 'm', nombre: nombre || 'Mi plano', alturaLibre: alturaLibre || 2.7, estancias: rooms.map(r => Object.assign({ id: r.id, nombre: r.nombre, tipo: r.tipo, x: r.x, y: r.y, ancho: r.ancho, fondo: r.fondo, dobleAltura: !!r.dobleAltura }, r.altura ? { altura: r.altura } : {})) };
  if (paredes && paredes.length) f.paredes = paredes.map(w => ({ x1: w.x1, y1: w.y1, x2: w.x2, y2: w.y2 }));
  if (puertas && puertas.length) f.puertas = puertas.map(d => ({ x: d.x, y: d.y, ancho: d.ancho || 0.9 }));
  return f;
}

const E = (id, nombre, tipo, x, y, ancho, fondo, dobleAltura) => ({ id, nombre, tipo, x, y, ancho, fondo, dobleAltura: !!dobleAltura });
export const PLANTILLAS = [
  { id: 'familiar', nombre: 'Casa familiar con doble altura', sub: '3 dormitorios · salón de 5,4 m de altura · terraza', estancias: [
    E('dorm1', 'Dormitorio principal', 'dormitorio', 0, 0, 4.5, 4), E('bano1', 'Baño', 'bano', 4.5, 0, 2.5, 4), E('dorm2', 'Dormitorio 2', 'dormitorio', 7, 0, 3.5, 4), E('dorm3', 'Dormitorio 3', 'dormitorio', 10.5, 0, 3.5, 4),
    E('pasillo', 'Pasillo', 'pasillo', 0, 4, 14, 1.5), E('recibidor', 'Recibidor', 'recibidor', 0, 5.5, 3, 5.5), E('salon', 'Salón', 'salon', 3, 5.5, 6, 5.5, true),
    E('cocina', 'Cocina', 'cocina', 9, 5.5, 5, 2.75), E('comedor', 'Comedor', 'comedor', 9, 8.25, 5, 2.75), E('terraza', 'Terraza', 'terraza', 3, 11, 6, 2.5)] },
  { id: 'depto', nombre: 'Departamento de 2 dormitorios', sub: 'Salón con balcón · cocina con lavadero', estancias: [
    E('dorm1', 'Dormitorio principal', 'dormitorio', 0, 0, 3.5, 4), E('bano', 'Baño', 'bano', 3.5, 0, 2.5, 2.5), E('pasillo', 'Pasillo', 'pasillo', 3.5, 2.5, 2.5, 1.5), E('dorm2', 'Dormitorio 2', 'dormitorio', 6, 0, 4, 4),
    E('salon', 'Salón comedor', 'salon', 0, 4, 6.5, 5), E('cocina', 'Cocina', 'cocina', 6.5, 4, 3.5, 3), E('lavadero', 'Lavadero', 'lavadero', 6.5, 7, 3.5, 2), E('balcon', 'Balcón', 'terraza', 0, 9, 6.5, 2)] },
  { id: 'loft', nombre: 'Loft con doble altura', sub: '1 dormitorio · estudio · salón abierto de 5,4 m', estancias: [
    E('salon', 'Salón', 'salon', 0, 0, 8, 6, true), E('cocina', 'Cocina', 'cocina', 8, 0, 3, 4), E('bano', 'Baño', 'bano', 8, 4, 3, 2),
    E('dorm', 'Dormitorio', 'dormitorio', 0, 6, 5.5, 4), E('estudio', 'Estudio', 'estudio', 5.5, 6, 5.5, 4)] }
];
