// Coches del parking (subsuelos) en 3D, hechos con código: sin modelos ni imágenes externas.
// Cada modelo se describe con su planta, su silueta lateral y su sección; la carrocería sale de coser
// esas curvas en una malla suave, con pasos de rueda recortados, lunas, faros LED, llantas y matrícula.
// Se carga con import() desde el parking de index.html y recibe el THREE que ya usa la página.
// Uso: const flota = crearFlota(THREE, scene, { max: 32, calidad: 'alta' | 'media', renderer, vivo: () => true });
//      flota.colocar([{ x, z, giro, modelo, color }]);   // modelo y color: números de 0 a 1 (azar estable)
//      flota.listo -> promesa que se cumple cuando ya están todos los modelos

const cl = (x, a, b) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sm = (a, b, x) => { const t = b > a ? cl((x - a) / (b - a), 0, 1) : (x >= b ? 1 : 0); return t * t * (3 - 2 * t); };

// Curva suave que pasa por los puntos [z, y] sin pasarse de largo (cúbica monótona).
function curva(p) {
  const n = p.length, xs = p.map((q) => q[0]), ys = p.map((q) => q[1]), d = [], m = [];
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (d[i] === 0) { m[i] = m[i + 1] = 0; continue; }
    const a = m[i] / d[i], b = m[i + 1] / d[i], h = a * a + b * b;
    if (h > 9) { const t = 3 / Math.sqrt(h); m[i] = t * a * d[i]; m[i + 1] = t * b * d[i]; }
  }
  return (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0; while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}

// Medidas en metros. z hacia el morro, y hacia arriba. base: bajos laterales; hombro: capó, cintura y maletero;
// techo: línea superior central (parabrisas, techo y luneta). pl: redondeo en planta [cola, exp, morro, exp].
// rk: inclinación del frontal y la trasera [arriba, abajo, altura del punto más saliente] x2.
const MODELOS = [
  { id: 'suv', peso: 0.28, L: 4.6, W: 1.88, ejes: [-1.38, 1.38], R: 0.365, ra: 0.235, rl: 0.245, llanta: 'cinco',
    pl: [0.32, 3.6, 0.4, 3.6],
    base: [[-2.3, 0.42], [-2.25, 0.37], [-2.1, 0.32], [-1.5, 0.25], [1.5, 0.25], [2.08, 0.31], [2.25, 0.35], [2.3, 0.39]],
    hombro: [[-2.3, 1.04], [-2.25, 1.06], [-2.14, 1.07], [-1.4, 1.075], [0, 1.03], [0.8, 0.99], [1.5, 0.935], [2.05, 0.895], [2.24, 0.875], [2.3, 0.86]],
    techo: [[-2.25, 0.6], [-2.19, 1.14], [-2.06, 1.58], [-1.8, 1.65], [-0.5, 1.68], [0.2, 1.645], [0.95, 1.07], [1.25, 0.6]],
    cin: 0.7, sh: 0.12, tuck: 0.07, caida: 0.36, copa: [0.035, 0.075], rk: [0.1, 0.05, 0.5, 0.05, 0.04, 0.55],
    techoZ: [-1.95, 0.12], plasticos: true, faros: 'suv', pilotos: 'barra', frente: 'suv', placaF: 0.42, placaT: 0.62 },
  { id: 'berlina', peso: 0.2, L: 4.72, W: 1.85, ejes: [-1.36, 1.5], R: 0.335, ra: 0.235, rl: 0.235, llanta: 'aero',
    pl: [0.36, 3.2, 0.48, 3],
    base: [[-2.36, 0.38], [-2.31, 0.31], [-2.16, 0.25], [-1.6, 0.18], [1.75, 0.175], [2.2, 0.21], [2.32, 0.26], [2.36, 0.31]],
    hombro: [[-2.36, 0.94], [-2.32, 0.97], [-2.22, 0.99], [-1.9, 1.0], [-1.2, 0.975], [0, 0.92], [0.8, 0.875], [1.45, 0.8], [2.0, 0.73], [2.28, 0.685], [2.36, 0.665]],
    techo: [[-2.3, 0.5], [-1.98, 1.03], [-1.55, 1.2], [-1.0, 1.36], [-0.45, 1.44], [0.0, 1.43], [0.35, 1.37], [0.98, 0.92], [1.3, 0.5]],
    cin: 0.6, sh: 0.11, tuck: 0.07, caida: 0.42, copa: [0.03, 0.075], rk: [0.11, 0.05, 0.4, 0.05, 0.04, 0.5],
    techoZ: null, plasticos: false, faros: 'finos', pilotos: 'barra', frente: 'ev', placaF: 0.3, placaT: 0.63 },
  { id: 'compacto', peso: 0.17, L: 4.28, W: 1.79, ejes: [-1.32, 1.32], R: 0.32, ra: 0.225, rl: 0.22, llanta: 'diez',
    pl: [0.3, 3.2, 0.44, 2.8],
    base: [[-2.14, 0.4], [-2.1, 0.35], [-1.98, 0.29], [-1.4, 0.2], [1.45, 0.2], [1.95, 0.26], [2.1, 0.31], [2.14, 0.36]],
    hombro: [[-2.14, 0.99], [-2.11, 1.01], [-2.02, 1.03], [-1.4, 1.02], [0, 0.97], [0.7, 0.93], [1.4, 0.86], [1.9, 0.8], [2.08, 0.77], [2.14, 0.75]],
    techo: [[-2.1, 0.7], [-2.05, 1.1], [-1.95, 1.38], [-1.72, 1.46], [-0.6, 1.48], [0.12, 1.45], [0.9, 0.98], [1.15, 0.5]],
    cin: 0.62, sh: 0.1, tuck: 0.06, caida: 0.4, copa: [0.03, 0.07], rk: [0.1, 0.05, 0.42, 0.09, 0.04, 0.5],
    techoZ: [-1.75, 0.0], plasticos: false, faros: 'barra', pilotos: 'esquinas', frente: 'compacto', placaF: 0.4, placaT: 0.56 },
  { id: 'suvXL', peso: 0.15, L: 4.92, W: 1.95, ejes: [-1.32, 1.53], R: 0.39, ra: 0.265, rl: 0.255, llanta: 'seis',
    pl: [0.3, 4, 0.36, 3.6],
    base: [[-2.46, 0.48], [-2.42, 0.43], [-2.3, 0.37], [-1.6, 0.31], [1.6, 0.31], [2.25, 0.36], [2.42, 0.41], [2.46, 0.46]],
    hombro: [[-2.46, 1.12], [-2.43, 1.145], [-2.35, 1.16], [-1.5, 1.17], [0, 1.14], [0.8, 1.11], [1.6, 1.07], [2.2, 1.04], [2.4, 1.02], [2.46, 1.0]],
    techo: [[-2.44, 1.0], [-2.39, 1.24], [-2.33, 1.77], [-2.15, 1.84], [0.0, 1.86], [0.5, 1.83], [1.22, 1.22], [1.5, 0.8]],
    cin: 0.8, sh: 0.1, tuck: 0.05, caida: 0.22, copa: [0.04, 0.06], rk: [0.06, 0.04, 0.62, 0.02, 0.03, 0.65],
    techoZ: [-2.2, 0.42], plasticos: true, cromo: true, faros: 'suv', pilotos: 'esquinas', frente: 'xl', placaF: 0.5, placaT: 0.68 },
  { id: 'pickup', peso: 0.2, L: 5.32, W: 1.86, ejes: [-1.62, 1.46], R: 0.38, ra: 0.265, rl: 0.235, llanta: 'seis', llantaOscura: true,
    pl: [0.22, 4.4, 0.4, 3.4],
    base: [[-2.66, 0.56], [-2.62, 0.5], [-2.5, 0.44], [-1.9, 0.4], [1.7, 0.36], [2.3, 0.42], [2.6, 0.47], [2.66, 0.52]],
    hombro: [[-2.66, 1.13], [-2.63, 1.16], [-2.55, 1.17], [-0.66, 1.18], [-0.5, 1.15], [0.2, 1.12], [1.0, 1.09], [1.8, 1.05], [2.4, 1.01], [2.6, 0.99], [2.66, 0.97]],
    techo: [[-0.66, 1.1], [-0.62, 1.4], [-0.57, 1.76], [-0.42, 1.81], [0.42, 1.82], [0.85, 1.76], [1.46, 1.2], [1.72, 0.8]],
    cin: 0.84, sh: 0.1, tuck: 0.05, caida: 0.2, copa: [0.04, 0.055], rk: [0.08, 0.04, 0.7, 0.0, 0.02, 0.7],
    techoZ: [-0.5, 0.75], plasticos: true, caja: -0.66, faros: 'pickup', pilotos: 'pickup', frente: 'pickup', placaF: 0.56, placaT: 0.62 }
];

// Colores habituales en Asunción: muchos blancos, negros, grises y platas; algún azul o rojo.
const COLORES = [
  ['#F2F3F2', 0, 0.2], ['#E6E7E3', 1, 0.08], ['#0E1013', 1, 0.15], ['#1E2126', 0, 0.04], ['#8E949A', 1, 0.12], ['#C3C7CB', 1, 0.11],
  ['#5D6268', 0, 0.09], ['#22324D', 1, 0.07], ['#6E1A20', 1, 0.05], ['#3B4A42', 1, 0.03], ['#B9AE9A', 1, 0.03], ['#2E3238', 1, 0.03]
];
// Matrículas Mercosur de Paraguay: cuatro letras y tres números, una por modelo.
const PLACAS = ['HAQT 064', 'NRBV 218', 'MXKC 507', 'JDPA 931', 'KTGS 482'];
const elegir = (lista, r) => { const tot = lista.reduce((s, m) => s + (m.peso != null ? m.peso : m[2]), 0); let a = r * tot; for (let i = 0; i < lista.length; i++) { a -= lista[i].peso != null ? lista[i].peso : lista[i][2]; if (a <= 0) return i; } return lista.length - 1; };

const TS = [0, 0.2, 0.5, 0.68, 1];   // tramos de la sección: bajos, costado, luna lateral, techo

function preparar(M) {
  const hl = M.L / 2, a = M.W / 2, [Rt, nt, Rd, nd] = M.pl, P = [];
  M.yb = curva(M.base); M.hb = curva(M.hombro); M.hc = curva(M.techo);
  // Contorno en planta, de la cola (centro) al morro (centro) por el costado derecho.
  const Q = 500;
  for (let i = 0; i <= Q; i++) { const th = (1 - i / Q) * Math.PI / 2; P.push([-hl + Rt - Rt * Math.pow(Math.sin(th), 2 / nt), a * Math.pow(Math.cos(th), 2 / nt)]); }
  for (let i = 1; i < 60; i++) P.push([lerp(-hl + Rt, hl - Rd, i / 60), a]);
  for (let i = 0; i <= Q; i++) { const th = (i / Q) * Math.PI / 2; P.push([hl - Rd + Rd * Math.pow(Math.sin(th), 2 / nd), a * Math.pow(Math.cos(th), 2 / nd)]); }
  const S = [0];
  for (let i = 1; i < P.length; i++) S.push(S[i - 1] + Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]));
  const tot = S[S.length - 1];
  M.perim = tot;
  M.plan = (p) => {
    const s = cl(p, 0, 1) * tot; let lo = 0, hi = S.length - 1;
    while (hi - lo > 1) { const k = (lo + hi) >> 1; if (S[k] <= s) lo = k; else hi = k; }
    const k = (s - S[lo]) / ((S[hi] - S[lo]) || 1);
    return [lerp(P[lo][0], P[hi][0], k), lerp(P[lo][1], P[hi][1], k)];
  };
  M.pz = (z) => { let lo = 0, hi = 1; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (M.plan(m)[0] < z) lo = m; else hi = m; } return (lo + hi) / 2; };
  M.pa = (a0, frente) => frente ? 1 - a0 / tot : a0 / tot;   // distancia desde el centro del morro o de la cola
  M.ymid = 0.55 * M.hc(0);
  return M;
}

// Sección (media, x >= 0) de la estación p: cuatro tramos de Bézier encadenados con tangente continua.
function est(M, p) {
  const [z, w] = M.plan(p);
  const yb = M.yb(z), hb = M.hb(z), hc0 = M.hc(z);
  const k = sm(0, 0.12, hc0 - hb - M.copa[0]);
  const copa = lerp(M.copa[0] * sm(0.35, 0.97, w / (M.W / 2)), M.copa[1], k), g = Math.max(0, hc0 - hb - copa);
  const sh = Math.min(M.sh, w * 0.4), tk = Math.min(M.tuck, w * 0.25);
  const yw = Math.min(hb - 0.05, Math.max(yb + 0.04, M.cin));
  const xb = w - sh, xr = Math.max(Math.min(0.03, xb), xb - g * M.caida), yr = hb + g;
  let dx = -1, dy = 0;
  if (g > 0) { const l = Math.hypot(xr - xb, g); dx = lerp(-1, (xr - xb) / l, k); dy = lerp(0, g / l, k); const n = Math.hypot(dx, dy); dx /= n; dy /= n; }
  const rr = Math.min(0.14, xr * 0.35, 0.85 * copa / Math.max(0.25, dy));
  const b = 0.008 * k;
  return { p, z, w, yb, hb, g, yr, copa, seg: [
    [[w - tk, yb], [w - tk * 0.15, yb], [w, yb + (yw - yb) * 0.4], [w, yw]],
    [[w, yw], [w, yw + (hb - yw) * 0.62], [xb + sh * 0.55, hb], [xb, hb]],
    [[xb, hb], [lerp(xb, xr, 1 / 3) + b, lerp(hb, yr, 1 / 3)], [lerp(xb, xr, 2 / 3) + b, lerp(hb, yr, 2 / 3)], [xr, yr]],
    [[xr, yr], [xr + dx * rr, yr + dy * rr], [xr * 0.5, yr + copa], [0, yr + copa]]
  ] };
}

function sec(e, t) {
  const i = t >= TS[3] ? 3 : t >= TS[2] ? 2 : t >= TS[1] ? 1 : 0;
  const s = e.seg[i], u = cl((t - TS[i]) / (TS[i + 1] - TS[i]), 0, 1), v = 1 - u;
  const b0 = v * v * v, b1 = 3 * v * v * u, b2 = 3 * v * u * u, b3 = u * u * u;
  return [b0 * s[0][0] + b1 * s[1][0] + b2 * s[2][0] + b3 * s[3][0], b0 * s[0][1] + b1 * s[1][1] + b2 * s[2][1] + b3 * s[3][1]];
}

// Punto 3D de la carrocería (lado +1 derecho, -1 izquierdo), con el morro y la cola inclinados.
function punto(M, e, t, lado) {
  const q = sec(e, t), hl = M.L / 2, Rt = M.pl[0], Rd = M.pl[2], y = q[1], top = e.hb + e.copa;
  let z = e.z;
  // Además del ángulo, el borde de capó y maletero se redondea en perfil (cuarto de círculo de radio rd).
  const rd = 0.075, u = cl((y - top + rd) / rd, 0, 1), red = rd * (1 - Math.sqrt(1 - u * u));
  if (z > hl - Rd) { const f = sm(0, 1, (z - hl + Rd) / Rd); z -= f * (M.rk[0] * sm(M.rk[2], top, y) + M.rk[1] * (1 - sm(e.yb, M.rk[2], y)) + red); }
  else if (z < -hl + Rt) { const f = sm(0, 1, (-hl + Rt - z) / Rt); z += f * (M.rk[3] * sm(M.rk[5], top, y) + M.rk[4] * (1 - sm(e.yb, M.rk[5], y)) + red); }
  return [q[0] * lado, y, z];
}

// Recorte de los pasos de rueda: las caras que caen enteras dentro del arco se quitan y el resto se lleva a su borde.
function enArco(M, P) {
  const Ra = M.R + 0.055;
  return M.ejes.some((zc) => Math.abs(P[2] - zc) < Ra && (P[1] < M.R || Math.hypot(P[2] - zc, P[1] - M.R) < Ra));
}
function arco(M, P) {
  const yc = M.R, Ra = M.R + 0.055;
  for (const zc of M.ejes) {
    const dz = P[2] - zc;
    if (Math.abs(dz) >= Ra) continue;
    const dy = P[1] - yc;
    if (dy < 0) P[2] = zc + (dz < 0 ? -Ra : Ra);
    else { const d = Math.hypot(dz, dy); if (d < Ra) { const k = Ra / (d || 1e-6); P[2] = zc + dz * k; P[1] = yc + dy * k; } }
  }
}

function normal(M, p, t, lado, e) {
  const ep = 0.0015, et = 0.002;
  e = e || est(M, p);
  const a = punto(M, est(M, cl(p - ep, 0, 1)), t, lado), b = punto(M, est(M, cl(p + ep, 0, 1)), t, lado);
  const c = punto(M, e, cl(t - et, 0, 1), lado), d = punto(M, e, cl(t + et, 0, 1), lado);
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [d[0] - c[0], d[1] - c[1], d[2] - c[2]];
  let n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const P = punto(M, e, t, lado), l = Math.hypot(n[0], n[1], n[2]) || 1;
  n = n.map((x) => x / l);
  if (n[0] * P[0] + n[1] * (P[1] - M.ymid) + n[2] * P[2] < 0) n = n.map((x) => -x);
  return n;
}

// t de la sección a una altura dada (la sección sube siempre, así que basta con bisección).
function tDeY(e, y, tmax) {
  let lo = 0, hi = tmax || TS[3];
  if (y <= sec(e, 0)[1]) return 0;
  if (y >= sec(e, hi)[1]) return hi;
  for (let i = 0; i < 30; i++) { const m = (lo + hi) / 2; if (sec(e, m)[1] < y) lo = m; else hi = m; }
  return (lo + hi) / 2;
}

function malla(THREE, pos, nor, idx, extra) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  if (nor) g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  if (extra) Object.keys(extra).forEach((k) => g.setAttribute(k, new THREE.Float32BufferAttribute(extra[k][0], extra[k][1])));
  g.setIndex(idx);
  if (!nor) g.computeVertexNormals();
  return g;
}

// Rejilla de nf x nc puntos. f(i, j) -> [x, y, z]. Orienta las caras hacia fuera del coche.
function rejilla(THREE, M, nf, nc, f, espejo) {
  const pos = [], idx = [];
  for (let i = 0; i < nf; i++) for (let j = 0; j < nc; j++) pos.push(...f(i, j));
  for (let i = 0; i < nf - 1; i++) for (let j = 0; j < nc - 1; j++) { const a = i * nc + j, b = a + 1, c = a + nc + 1, d = a + nc; idx.push(a, b, c, a, c, d); }
  let s = 0;
  for (let k = 0; k < idx.length; k += 3) {
    const A = idx[k] * 3, B = idx[k + 1] * 3, C = idx[k + 2] * 3;
    const ux = pos[B] - pos[A], uy = pos[B + 1] - pos[A + 1], uz = pos[B + 2] - pos[A + 2], vx = pos[C] - pos[A], vy = pos[C + 1] - pos[A + 1], vz = pos[C + 2] - pos[A + 2];
    s += (uy * vz - uz * vy) * pos[A] + (uz * vx - ux * vz) * (pos[A + 1] - M.ymid) + (ux * vy - uy * vx) * pos[A + 2];
  }
  if (s < 0) for (let k = 0; k < idx.length; k += 3) { const t = idx[k + 1]; idx[k + 1] = idx[k + 2]; idx[k + 2] = t; }
  if (espejo) {
    const n = pos.length / 3;
    for (let k = 0; k < n; k++) pos.push(-pos[k * 3], pos[k * 3 + 1], pos[k * 3 + 2]);
    const m = idx.length;
    for (let k = 0; k < m; k += 3) idx.push(idx[k] + n, idx[k + 2] + n, idx[k + 1] + n);
  }
  return malla(THREE, pos, null, idx);
}

// Parche pegado a la carrocería entre las estaciones p0..p1 y las alturas y0(e)..y1(e), separado "off" hacia fuera.
function parche(THREE, M, p0, p1, y0, y1, np, ny, off, espejo, tmax) {
  // Filas suficientes para que el parche no se meta bajo la chapa donde esta se curva mucho (bajos, esquinas).
  for (let i = 0; i <= 4; i++) { const e = est(M, lerp(p0, p1, i / 4)); ny = Math.max(ny, Math.ceil((y1(e) - y0(e)) / 0.022)); }
  ny = Math.min(ny, 12);
  return rejilla(THREE, M, np + 1, ny + 1, (i, j) => {
    const p = lerp(p0, p1, i / np), e = est(M, p), ya = y0(e), y = lerp(ya, Math.max(ya + 0.006, y1(e)), j / ny), t = tDeY(e, y, tmax);
    const P = punto(M, e, t, 1), n = normal(M, p, t, 1, e);
    const Q = [P[0] + n[0] * off, P[1] + n[1] * off, P[2] + n[2] * off];
    arco(M, Q);
    return Q;
  }, espejo);
}

// Parche en el espacio (p, t) de la sección, para lunas, techo y molduras.
function parcheT(THREE, M, p0, p1, t0, t1, np, nt, off) {
  return rejilla(THREE, M, np + 1, 2 * nt + 1, (i, j) => {
    const p = lerp(p0, p1, i / np), e = est(M, p), lado = j <= nt ? 1 : -1, jj = j <= nt ? j : 2 * nt - j;
    const t = lerp(t0, t1, jj / nt), P = punto(M, e, t, lado), n = normal(M, p, t, lado, e);
    return [P[0] + n[0] * off, P[1] + n[1] * off, P[2] + n[2] * off];
  });
}

// Pieza de revolución alrededor del eje x. prof: [[x, r], ...]
function torno(THREE, prof, seg) {
  const pos = [], idx = [], nc = seg + 1;
  prof.forEach(([x, r]) => { for (let j = 0; j <= seg; j++) { const a = (j / seg) * Math.PI * 2; pos.push(x, r * Math.cos(a), r * Math.sin(a)); } });
  for (let i = 0; i < prof.length - 1; i++) for (let j = 0; j < seg; j++) { const a = i * nc + j, b = a + 1, c = a + nc + 1, d = a + nc; idx.push(a, c, b, a, d, c); }
  return malla(THREE, pos, null, idx);
}

function llantaGeo(THREE, rl, estilo, cs) {
  const sh = new THREE.Shape();
  sh.absarc(0, 0, rl, 0, Math.PI * 2, false);
  const cfg = { cinco: [5, 0.34, 0.86, 0.66], seis: [6, 0.36, 0.86, 0.6], diez: [10, 0.36, 0.87, 0.6], aero: [10, 0.64, 0.86, 0.34] }[estilo];
  const [n, ri, ro, abierto] = cfg, rin = rl * ri, rout = rl * ro, half = rl * 0.6 * Math.sin((Math.PI / n) * (1 - abierto));
  const ang = (r, f, sg) => f + sg * Math.asin(Math.min(0.95, half / r));
  for (let k = 0; k < n; k++) {
    const f0 = (k / n) * Math.PI * 2 + Math.PI / 2, f1 = ((k + 1) / n) * Math.PI * 2 + Math.PI / 2, h = new THREE.Path(), A = n > 6 ? 3 : 5;
    for (let i = 0; i <= A; i++) { const f = lerp(ang(rout, f0, 1), ang(rout, f1, -1), i / A); if (i) h.lineTo(rout * Math.cos(f), rout * Math.sin(f)); else h.moveTo(rout * Math.cos(f), rout * Math.sin(f)); }
    for (let i = 0; i <= A; i++) { const f = lerp(ang(rin, f1, -1), ang(rin, f0, 1), i / A); h.lineTo(rin * Math.cos(f), rin * Math.sin(f)); }
    h.closePath(); sh.holes.push(h);
  }
  const g = new THREE.ExtrudeGeometry(sh, { depth: 0.016, bevelEnabled: true, bevelThickness: 0.007, bevelSize: 0.005, bevelSegments: 1, curveSegments: cs });
  // Llanta cóncava: el buje queda hundido respecto al aro.
  const P = g.attributes.position, N = g.attributes.normal, dish = 0.04;
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), y = P.getY(i), r2 = (x * x + y * y) / (rl * rl);
    P.setZ(i, P.getZ(i) - dish * (1 - r2));
    if (N.getZ(i) > 0.99) { const nx = -2 * dish * x / (rl * rl), ny = -2 * dish * y / (rl * rl), l = Math.hypot(nx, ny, 1); N.setXYZ(i, nx / l, ny / l, 1 / l); }
  }
  g.rotateY(Math.PI / 2);
  return g;
}

// Rueda completa mirando a +x, centrada en el origen: neumático, llanta, disco, pinza y fondo oscuro.
function rueda(THREE, M, q) {
  const R = M.R, w = M.ra / 2, rl = M.rl, seg = q.alta ? 32 : 24, out = [];
  const tire = torno(THREE, [[-w + 0.014, rl - 0.006], [-w, rl + 0.03], [-w - 0.006, lerp(rl, R, 0.5)], [-w + 0.004, R - 0.03], [-w + 0.03, R], [w - 0.03, R], [w - 0.004, R - 0.03], [w + 0.006, lerp(rl, R, 0.5)], [w, rl + 0.03], [w - 0.014, rl - 0.006]], seg);
  out.push({ g: tire, k: 'goma' });
  const ll = llantaGeo(THREE, rl - 0.004, M.llanta, q.alta ? 14 : 10);
  ll.translate(w - 0.034, 0, 0);
  out.push({ g: ll, k: M.llantaOscura ? 'llantaOsc' : 'llanta' });
  const barril = torno(THREE, [[w - 0.03, rl - 0.004], [-w + 0.02, rl - 0.012]], seg);
  out.push({ g: barril, k: 'bajos' });
  const disco = new THREE.CylinderGeometry(rl - 0.05, rl - 0.05, 0.022, 20, 1); disco.rotateZ(Math.PI / 2); disco.translate(w - 0.1, 0, 0);
  out.push({ g: disco, k: 'disco' });
  const buje = new THREE.CylinderGeometry(rl * 0.17, rl * 0.19, 0.03, 12, 1); buje.rotateZ(Math.PI / 2); buje.translate(w - 0.055, 0, 0);
  out.push({ g: buje, k: M.llantaOscura ? 'cromo' : 'brillo' });
  const pinza = new THREE.BoxGeometry(0.05, 0.1, 0.07); pinza.translate(w - 0.1, rl * 0.42, rl * 0.42);
  out.push({ g: pinza, k: 'negro' });
  const fondo = new THREE.CylinderGeometry(rl, rl, 0.01, 16, 1); fondo.rotateZ(Math.PI / 2); fondo.translate(-w + 0.04, 0, 0);
  out.push({ g: fondo, k: 'bajos' });
  return out;
}

// Junta las piezas en una sola geometría, con un grupo por material (en el orden de aparición).
function unir(THREE, parts, conColor) {
  const keys = [...new Set(parts.map((p) => p.k))], orden = [];
  keys.forEach((k) => parts.forEach((p) => { if (p.k === k) orden.push(p); }));
  let nv = 0, ni = 0;
  orden.forEach(({ g }) => { nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; });
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), col = conColor ? new Float32Array(nv * 3) : null;
  const idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni), grupos = [];
  let v0 = 0, i0 = 0, k0 = null, gs = 0;
  orden.forEach(({ g, k }) => {
    if (k !== k0) { if (k0 !== null) grupos.push([gs, i0 - gs, keys.indexOf(k0)]); k0 = k; gs = i0; }
    const P = g.attributes.position, n = P.count;
    pos.set(P.array.subarray(0, n * 3), v0 * 3); nor.set(g.attributes.normal.array.subarray(0, n * 3), v0 * 3);
    if (g.attributes.uv) uv.set(g.attributes.uv.array.subarray(0, n * 2), v0 * 2);
    if (col) { const C = g.attributes.color; for (let i = 0; i < n; i++) { const c = C ? C.array[i * C.itemSize] : 1; col[(v0 + i) * 3] = col[(v0 + i) * 3 + 1] = col[(v0 + i) * 3 + 2] = c; } }
    if (g.index) { const I = g.index.array; for (let i = 0; i < I.length; i++) idx[i0 + i] = I[i] + v0; i0 += I.length; }
    else { for (let i = 0; i < n; i++) idx[i0 + i] = i + v0; i0 += n; }
    v0 += n;
  });
  grupos.push([gs, i0 - gs, keys.indexOf(k0)]);
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  if (col) out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  out.setIndex(new THREE.BufferAttribute(idx, 1));
  grupos.forEach(([st, c, m]) => out.addGroup(st, c, m));
  return { g: out, keys };
}

function construir(THREE, M, q) {
  preparar(M);
  const hl = M.L / 2, nS = q.alta ? 72 : 52, nT = q.alta ? [4, 8, 4, 9] : [3, 6, 3, 7];
  // Estaciones repartidas según cuánto cambia la forma: más filas en parabrisas, lunetas y esquinas.
  const F = 1200, acc = [0], pre = [];
  let pC = -1, pA = -1;
  for (let i = 0; i <= F; i++) { const e = est(M, i / F); pre.push([e.z, e.w, e.hb, e.hb + e.g + e.copa, e.yb]); if (e.g > 0.002) { if (pC < 0) pC = i / F; pA = i / F; } }
  for (let i = 1; i <= F; i++) { const a = pre[i], b = pre[i - 1]; acc.push(acc[i - 1] + Math.hypot(a[0] - b[0], a[1] - b[1], 1.3 * (a[2] - b[2]), 1.3 * (a[3] - b[3]), a[4] - b[4])); }
  const ps = [];
  for (let i = 0, k = 0; i <= nS; i++) { const s = (i / nS) * acc[F]; while (k < F - 1 && acc[k + 1] < s) k++; ps.push((k + (s - acc[k]) / ((acc[k + 1] - acc[k]) || 1)) / F); }
  // Inicio y fin de las lunas: filas exactas para que el borde quede limpio.
  const fija = (v) => { let b = 0; ps.forEach((x, i) => { if (Math.abs(x - v) < Math.abs(ps[b] - v)) b = i; }); if (b === 0 || b === ps.length - 1) { ps.push(v); ps.sort((x, y) => x - y); } else ps[b] = v; };
  fija(pC); fija(pA);
  const iC = ps.indexOf(pC), iA = ps.indexOf(pA);
  const ts = [];
  for (let s = 0; s < 4; s++) for (let j = 0; j < nT[s]; j++) ts.push(lerp(TS[s], TS[s + 1], j / nT[s]));
  ts.push(1);
  const nh = ts.length, cols = [];
  for (let j = 0; j < nh; j++) cols.push([ts[j], 1]);
  for (let j = nh - 2; j >= 0; j--) cols.push([ts[j], -1]);
  const nc = cols.length, jG0 = nT[0] + nT[1], jG1 = nc - 1 - jG0;

  // Carrocería: una sola rejilla; las caras de las lunas se quitan para que el pliegue con el cristal quede nítido.
  const pos = [], ao = [], idx = [];
  const E = ps.map((p) => est(M, p));
  E.forEach((e) => cols.forEach(([t, lado]) => pos.push(...punto(M, e, t, lado))));
  const dentro = [];
  for (let v = 0; v < pos.length; v += 3) dentro.push(enArco(M, [pos[v], pos[v + 1], pos[v + 2]]));
  const tri = (a, b, c) => { if (!(dentro[a] && dentro[b] && dentro[c])) idx.push(a, b, c); };
  for (let i = 0; i < ps.length - 1; i++) for (let j = 0; j < nc - 1; j++) {
    if (i >= iC && i < iA && j >= jG0 && j < jG1) continue;
    const a = i * nc + j, b = a + 1, c = a + nc + 1, d = a + nc;
    tri(a, b, c); tri(a, c, d);
  }
  const body = malla(THREE, pos, null, idx);
  const BN = body.attributes.normal, BP = body.attributes.position;
  for (let j = 0; j < nc; j++) [0, ps.length - 1].forEach((i) => { const v = i * nc + j, ny = BN.getY(v), nz = BN.getZ(v), l = Math.hypot(ny, nz) || 1; BN.setXYZ(v, 0, ny / l, nz / l); });
  const ybMin = Math.min(...M.base.map((b) => b[1]));
  for (let v = 0; v < BP.count; v++) {
    const P = [BP.getX(v), BP.getY(v), BP.getZ(v)];
    arco(M, P); BP.setXYZ(v, P[0], P[1], P[2]);
    let o = 0.5 + 0.5 * sm(ybMin, ybMin + 0.34, P[1]);
    const lat = sm(E[Math.floor(v / nc)].w - 0.32, E[Math.floor(v / nc)].w - 0.06, Math.abs(P[0]));
    for (const zc of M.ejes) o *= 1 - lat * 0.38 * (1 - sm(M.R + 0.06, M.R + 0.22, Math.hypot(P[2] - zc, P[1] - M.R)));
    ao.push(o);
  }
  body.setAttribute('color', new THREE.Float32BufferAttribute(ao, 1));

  const paint = [{ g: body, k: 'p' }], rest = [];
  const add = (g, k) => rest.push({ g, k });
  // Lunas: la misma rejilla en su zona (sin rendijas con la chapa), con normales propias.
  const gp = [], gi = [], gc = jG1 - jG0 + 1, nG = iA - iC;
  for (let i = iC; i <= iA; i++) for (let j = jG0; j <= jG1; j++) { const v = (i * nc + j) * 3; gp.push(pos[v], pos[v + 1], pos[v + 2]); }
  for (let i = 0; i < nG; i++) for (let j = 0; j < gc - 1; j++) { const a = i * gc + j, b = a + 1, c = a + gc + 1, d = a + gc; gi.push(a, b, c, a, c, d); }
  add(malla(THREE, gp, null, gi), 'vidrio');
  if (M.techoZ) {
    const p0 = M.pz(M.techoZ[0]), p1 = M.pz(M.techoZ[1]);
    const techo = parcheT(THREE, M, p0, p1, TS[3] + 0.04, 1, Math.round(nG * 0.7), nT[3], 0.004);
    techo.setAttribute('color', new THREE.Float32BufferAttribute(new Array(techo.attributes.position.count).fill(1), 1));
    paint.push({ g: techo, k: 'p' });
  }
  // Moldura cromada al pie de las lunas.
  if (M.cromo) add(parche(THREE, M, pC + 0.02, pA - 0.03, (e) => e.hb + 0.004, (e) => e.hb + 0.022, 40, 1, 0.003, true, TS[3]), 'cromo');

  const F_ = (a0, a1, y0, y1, k, off, n, esp) => add(parche(THREE, M, M.pa(a1, true), M.pa(a0, true), y0, y1, Math.ceil((n || 18) * (q.alta ? 0.8 : 0.6)), 2, off || 0.004, esp !== false), k);
  const T_ = (a0, a1, y0, y1, k, off, n, esp) => add(parche(THREE, M, M.pa(a0, false), M.pa(a1, false), y0, y1, Math.ceil((n || 18) * (q.alta ? 0.8 : 0.6)), 2, off || 0.004, esp !== false), k);
  const Z_ = (z0, z1, y0, y1, k, off, n) => add(parche(THREE, M, M.pz(z0), M.pz(z1), y0, y1, Math.ceil((n || 24) * (q.alta ? 1 : 0.6)), 1, off || 0.004, true), k);
  const H = (d) => (e) => e.hb + d, B = (d) => (e) => e.yb + d, Y = (v) => () => v;
  // Alturas de referencia del frontal y la trasera: las luces y rejillas van en horizontal, no siguen las curvas del borde.
  const ref = (fr, a0, a1, f, mx) => { let r = mx ? -Infinity : Infinity; for (let i = 0; i <= 12; i++) { const v = f(est(M, M.pa(lerp(a0, a1, i / 12), fr))); r = mx ? Math.max(r, v) : Math.min(r, v); } return r; };
  const hF = ref(true, 0.35, 1.05, (e) => e.hb), hT = ref(false, 0, 1.1, (e) => e.hb), bF = est(M, M.pa(0.5, true)).yb, bT = est(M, M.pa(0.5, false)).yb;
  const HF = (d) => () => hF + d, HT = (d) => () => hT + d, BF = (d) => () => bF + d, BT = (d) => () => bT + d;

  // Frontal: faros, firma LED y parrilla según el modelo.
  if (M.faros === 'finos') {
    F_(0.42, 1.03, HF(-0.075), HF(-0.02), 'lente', 0.004, 20);
    F_(0.47, 1.0, HF(-0.04), HF(-0.03), 'led', 0.008, 20);
  } else if (M.faros === 'barra') {
    F_(0.48, 1.02, HF(-0.095), HF(-0.025), 'lente', 0.004, 18);
    F_(0, 1.0, HF(-0.046), HF(-0.037), 'led', 0.008, 30);
  } else if (M.faros === 'suv') {
    F_(0.5, 1.05, HF(-0.125), HF(-0.03), 'lente', 0.004, 18);
    F_(0, 1.03, HF(-0.05), HF(-0.041), 'led', 0.008, 30);
    F_(0.62, 0.96, HF(-0.112), HF(-0.08), 'led2', 0.007, 12);
  } else {
    F_(0.5, 1.02, HF(-0.19), HF(-0.035), 'lente', 0.004, 16);
    F_(0.6, 0.99, HF(-0.068), HF(-0.056), 'led', 0.008, 12);
    F_(0.62, 0.92, HF(-0.165), HF(-0.1), 'led2', 0.007, 10);
  }
  if (M.frente === 'ev') { F_(0, 0.6, BF(0.06), BF(0.16), 'brillo'); F_(0.68, 0.88, BF(0.07), BF(0.14), 'brillo', 0.004, 8); }
  else if (M.frente === 'compacto') { F_(0, 0.46, HF(-0.12), HF(-0.065), 'brillo', 0.004, 10); F_(0, 0.66, BF(0.05), BF(0.18), 'brillo'); }
  else if (M.frente === 'suv') { F_(0, 0.5, BF(0.19), HF(-0.13), 'brillo', 0.004, 12); F_(0, 0.78, B(0), BF(0.13), 'negro'); }
  else if (M.frente === 'xl') { F_(0, 0.5, BF(0.25), HF(-0.05), 'brillo', 0.004, 12); [0.3, 0.42].forEach((v) => F_(0, 0.5, BF(v), BF(v + 0.018), 'cromo', 0.007, 12)); F_(0, 0.84, B(0), BF(0.14), 'negro'); }
  else { F_(0, 0.5, BF(0.2), HF(-0.045), 'brillo', 0.004, 12); [0.3, 0.42].forEach((v) => F_(0, 0.5, BF(v), BF(v + 0.022), 'cromo', 0.007, 12)); F_(0, 0.9, B(0), BF(0.15), 'negro'); }

  // Trasera: pilotos (barra continua, en las esquinas o verticales de pickup) y bajos oscuros.
  if (M.pilotos === 'barra') { T_(0, 1.12, HT(-0.13), HT(-0.075), 'piloto', 0.004, 34); T_(0, 1.08, HT(-0.1), HT(-0.092), 'led3', 0.007, 34); }
  else if (M.pilotos === 'esquinas') {
    T_(0.46, 1.1, HT(-0.2), HT(-0.07), 'piloto', 0.004, 16); T_(0, 0.46, HT(-0.125), HT(-0.1), 'brillo', 0.004, 10);
    [-0.105, -0.16].forEach((d) => T_(0.5, 1.06, HT(d - 0.008), HT(d), 'led3', 0.007, 14));
  } else { T_(0.68, 1.05, HT(-0.42), HT(-0.05), 'piloto', 0.004, 12); [-0.12, -0.3].forEach((d) => T_(0.72, 1.01, HT(d - 0.012), HT(d), 'led3', 0.007, 10)); }
  T_(0, 0.92, B(0), BT(0.12), M.plasticos ? 'negro' : 'brillo', 0.004, 18);

  // Laterales: estribo, molduras de los pasos en los SUV, juntas de puertas y tiradores.
  const zr = M.ejes[0], zf = M.ejes[1], Ra = M.R + 0.055;
  Z_(zr + Ra - 0.02, zf - Ra + 0.02, B(-0.005), B(M.plasticos ? 0.13 : 0.06), M.plasticos ? 'negro' : 'brillo', 0.004);
  if (M.plasticos) M.ejes.forEach((zc) => {
    const n = 22;
    add(rejilla(THREE, M, n + 1, 2, (i, j) => {
      const a = lerp(-0.05, Math.PI + 0.05, i / n), r = Ra + (j ? 0.065 : -0.004), z = zc + r * Math.cos(a), y = M.R + r * Math.max(Math.sin(a), -0.3);
      const p = M.pz(z), e = est(M, p), t = tDeY(e, y), P = punto(M, e, t, 1), nn = normal(M, p, t, 1, e);
      return [P[0] + nn[0] * 0.006, P[1] + nn[1] * 0.006, P[2] + nn[2] * 0.006];
    }, true), 'negro');
  });
  if (pC > 0) {
    const zA = M.plan(pA)[0], zD = zf - Ra - 0.1, zB = zD - (M.caja != null ? 0.95 : 1.05);
    const junta = (z, y0) => Z_(z - 0.0035, z + 0.0035, y0, H(-0.006), 'junta', 0.003, 1);
    const zT = M.caja != null ? M.caja + 0.07 : zr + Ra + 0.05;
    junta(zD, B(0.05)); junta(zB, B(0.05)); junta(zT, M.caja != null ? B(0.05) : Y(M.R + Ra + 0.06));
    const tir = (z) => Z_(z - 0.075, z + 0.075, H(-0.11), H(-0.092), M.cromo ? 'cromo' : 'brillo', 0.006, 4);
    tir(zB + 0.2); tir(zT + 0.2);
    // Espejos retrovisores.
    const zE = zA - 0.2, eE = est(M, M.pz(zE)), xE = eE.w - Math.min(M.sh, eE.w * 0.4) + 0.02;
    const cap = new THREE.IcosahedronGeometry(1, 2); cap.scale(0.1, 0.062, 0.055); cap.translate(xE + 0.13, eE.hb + 0.1, zE);
    const cap2 = cap.clone(); cap2.translate(-2 * (xE + 0.13), 0, 0);
    [cap, cap2].forEach((g) => { g.setAttribute('color', new THREE.Float32BufferAttribute(new Array(g.attributes.position.count).fill(0.92), 1)); paint.push({ g, k: 'p' }); });
    const pie = new THREE.BoxGeometry(0.1, 0.04, 0.07); pie.translate(xE + 0.04, eE.hb + 0.075, zE + 0.01);
    const pie2 = pie.clone(); pie2.translate(-2 * (xE + 0.04), 0, 0);
    add(pie, 'negro'); add(pie2, 'negro');
  }
  if (M.caja != null) {
    // Pickup: separación cabina / caja y lona negra sobre la caja.
    add(parcheT(THREE, M, M.pz(M.caja - 0.012), M.pz(M.caja + 0.012), 0.02, 1, 2, nT[0] + nT[1] + nT[2] + nT[3], 0.003), 'junta');
    add(parcheT(THREE, M, M.pz(-hl + 0.12), M.pz(M.caja - 0.06), TS[1] + 0.21, 1, 20, nT[3] + 4, 0.004), 'mate');
  }

  // Matrículas (formato Mercosur).
  const placa = (frente, y) => {
    const p = frente ? 1 : 0, e = est(M, p), t = tDeY(e, y), P = punto(M, e, t, 1), n = normal(M, Math.abs(p - 0.0004), t, 1);
    const g = new THREE.PlaneGeometry(0.4, 0.13), m = new THREE.Matrix4(), q4 = new THREE.Quaternion();
    if (!frente) g.rotateY(Math.PI);
    q4.setFromUnitVectors(new THREE.Vector3(0, 0, frente ? 1 : -1), new THREE.Vector3(0, n[1], n[2]).normalize());
    m.compose(new THREE.Vector3(0, P[1], P[2] + (frente ? 0.012 : -0.012)), q4, new THREE.Vector3(1, 1, 1));
    g.applyMatrix4(m); add(g, 'placa');
  };
  placa(true, M.placaF); placa(false, M.placaT);

  // Bajos y pasos de rueda oscuros, ruedas.
  const bajos = new THREE.BoxGeometry(M.W - 0.18, 0.26, M.L - 0.9); bajos.translate(0, ybMin + 0.1, 0);
  add(bajos, 'bajos');
  M.ejes.forEach((zc) => [1, -1].forEach((s) => {
    const n = 16, x0 = M.W / 2 - 0.36, x1 = M.W / 2 - 0.004;
    add(rejilla(THREE, M, n + 1, 2, (i, j) => { const a = lerp(-0.25, Math.PI + 0.25, i / n); return [s * (j ? x1 : x0), M.R + (Ra - 0.006) * Math.sin(a), zc + (Ra - 0.006) * Math.cos(a)]; }), 'bajos');
  }));
  const R4 = rueda(THREE, M, q);
  M.ejes.forEach((zc) => [1, -1].forEach((s) => R4.forEach(({ g, k }) => {
    const c = g.clone();
    if (s < 0) c.rotateY(Math.PI);
    c.translate(s * (M.W / 2 - M.ra / 2 - 0.014), M.R - 0.004, zc);
    add(c, k);
  })));

  return { paint: unir(THREE, paint, true).g, rest: unir(THREE, rest, false) };
}

function texPlaca(THREE, txt) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 84;
  const g = c.getContext('2d');
  g.fillStyle = '#F4F5F2'; g.fillRect(0, 0, 256, 84);
  g.fillStyle = '#1E3D93'; g.fillRect(0, 0, 256, 18);
  g.fillStyle = '#F4F5F2'; g.font = '600 11px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('PARAGUAY', 128, 10);
  g.fillStyle = '#16181B'; g.font = '700 48px "Helvetica Neue", Arial, sans-serif';
  const w = g.measureText(txt).width; g.save(); g.translate(128, 54); if (w > 232) g.scale(232 / w, 1); g.fillText(txt, 0, 0); g.restore();
  g.strokeStyle = '#16181B'; g.lineWidth = 3; g.strokeRect(1.5, 1.5, 253, 81);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

// Sombra de contacto suave bajo cada coche, con las cuatro ruedas más marcadas.
function texSombra(THREE) {
  const w = 96, h = 192, c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'), im = g.createImageData(w, h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const x = (i + 0.5) / w * 2 - 1, y = (j + 0.5) / h * 2 - 1;
    const qx = Math.abs(x) * 1.12 - 0.86, qy = Math.abs(y) * 1.07 - 0.78, d = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0);
    let a = 0.62 * (1 - sm(-0.18, 0.1, d));
    const wx = Math.abs(x) - 0.74, wy = Math.abs(y) - 0.6;
    a = Math.max(a, 0.92 * Math.exp(-(wx * wx) / 0.006 - (wy * wy) / 0.012));
    const o = (j * w + i) * 4; im.data[o] = im.data[o + 1] = im.data[o + 2] = 0; im.data[o + 3] = Math.round(cl(a, 0, 1) * 255);
  }
  g.putImageData(im, 0, 0);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function crearFlota(THREE, scene, op) {
  const q = { alta: (op && op.calidad) !== 'media' }, max = (op && op.max) || 32, C = (h) => new THREE.Color(h);
  const Phys = THREE.MeshPhysicalMaterial || THREE.MeshStandardMaterial, fis = !!THREE.MeshPhysicalMaterial;
  const pintura = (metal) => new Phys(Object.assign({ color: C('#ffffff'), vertexColors: true, metalness: metal ? 0.6 : 0.05, roughness: metal ? 0.36 : 0.3, envMapIntensity: 1.1 },
    fis ? { clearcoat: 1, clearcoatRoughness: 0.1 } : {}));
  const S = (o) => new THREE.MeshStandardMaterial(o);
  const MAT = {
    vidrio: new Phys(Object.assign({ color: C('#0A0D11'), metalness: 0.2, roughness: 0.05, envMapIntensity: 1.5 }, fis ? { clearcoat: 1, clearcoatRoughness: 0.02 } : {})),
    negro: S({ color: C('#151618'), roughness: 0.62 }),
    brillo: S({ color: C('#07080A'), metalness: 0.3, roughness: 0.14, envMapIntensity: 1.3 }),
    mate: S({ color: C('#111214'), roughness: 0.8 }),
    junta: S({ color: C('#050506'), roughness: 0.9 }),
    cromo: S({ color: C('#DCE0E5'), metalness: 1, roughness: 0.16 }),
    lente: S({ color: C('#0E1216'), metalness: 0.5, roughness: 0.08, envMapIntensity: 1.6 }),
    led: S({ color: C('#ffffff'), emissive: C('#EAF3FF'), emissiveIntensity: 2.2 }),
    led2: S({ color: C('#8E98A3'), emissive: C('#CFDDF0'), emissiveIntensity: 0.18, metalness: 0.85, roughness: 0.18 }),
    piloto: S({ color: C('#2A0306'), emissive: C('#9A0A14'), emissiveIntensity: 0.4, metalness: 0.3, roughness: 0.1, envMapIntensity: 1.4 }),
    led3: S({ color: C('#ff4050'), emissive: C('#FF2A3A'), emissiveIntensity: 1.8 }),
    placa: S({ roughness: 0.45 }),
    llanta: S({ color: C('#C9CDD2'), metalness: 1, roughness: 0.3 }),
    llantaOsc: S({ color: C('#2A2D32'), metalness: 0.85, roughness: 0.34 }),
    goma: S({ color: C('#17181A'), roughness: 0.9 }),
    disco: S({ color: C('#74777C'), metalness: 0.85, roughness: 0.42 }),
    bajos: S({ color: C('#040405'), roughness: 1, side: THREE.DoubleSide })
  };
  ['negro', 'brillo', 'mate', 'lente', 'led', 'led2', 'led3', 'piloto', 'cromo', 'placa', 'junta'].forEach((k) => { MAT[k].polygonOffset = true; MAT[k].polygonOffsetFactor = -2; MAT[k].polygonOffsetUnits = -2; });
  const PS = pintura(false), PM = pintura(true);
  // Los modelos se construyen de uno en uno, cada uno en su propia tarea, para no frenar el scroll;
  // cada coche aparece en cuanto su modelo está listo.
  const modelos = [], vivo = (op && op.vivo) || (() => true);
  let ultima = null, listo;
  const hecho = new Promise((r) => { listo = r; });
  // Los shaders se compilan antes de meter cada modelo en la escena. Si no, el primer fotograma con coches deja
  // el hilo principal parado mientras la GPU compila la pintura con barniz, justo al llegar al parking.
  // Con KHR_parallel_shader_compile se espera a que la GPU termine sin bloquear nada; sin él, el primer uso de
  // cada programa bloquea igual, así que se fuerza de uno en uno, cada uno en su propia tarea.
  const R = op && op.renderer, cam = new THREE.PerspectiveCamera(), blanco = C('#ffffff');
  const compilar = (objs) => new Promise((ok) => {
    if (!R || !R.compile || !R.properties) { ok(); return; }
    const pre = new THREE.Scene(); pre.add(...objs);
    const progs = [...new Set([...R.compile(pre, cam, scene)].map((m) => R.properties.get(m).currentProgram).filter(Boolean))];
    const paso = () => {
      if (!vivo()) return;
      const i = progs.findIndex((p) => p.isReady());
      if (i >= 0) progs.splice(i, 1)[0].getUniforms();
      if (progs.length) setTimeout(paso, i >= 0 ? 0 : 16); else ok();
    };
    setTimeout(paso, 0);
  });
  const mk = (g, m, tinte) => { const im = new THREE.InstancedMesh(g, m, max); im.count = 0; im.frustumCulled = false; if (tinte) im.setColorAt(0, blanco); return im; };
  const siguiente = (i) => {
    if (!vivo()) return;
    if (i >= MODELOS.length) { listo(); return; }
    const M = Object.assign({}, MODELOS[i]), geo = construir(THREE, M, q);
    // Cada modelo lleva su propia matrícula, así dos coches vecinos no repiten número.
    const mats = geo.rest.keys.map((k) => (k === 'placa' ? Object.assign(MAT.placa.clone(), { map: texPlaca(THREE, PLACAS[i % PLACAS.length]) }) : MAT[k]));
    const o = { M, s: mk(geo.paint, PS, true), m: mk(geo.paint, PM, true), r: mk(geo.rest.g, mats) }, nuevos = i ? [o.s, o.m, o.r] : [sombra, o.s, o.m, o.r];
    const poner = () => {
      if (!vivo()) return;
      scene.add(...nuevos); modelos[i] = o;
      if (ultima) colocar(ultima);
      setTimeout(() => siguiente(i + 1), 0);
    };
    compilar(nuevos).then(poner, poner);
  };
  setTimeout(() => siguiente(0), 0);
  const sombra = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: texSombra(THREE), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }), max);
  sombra.count = 0; sombra.frustumCulled = false; sombra.renderOrder = -1;
  const cols = COLORES.map((c) => [C(c[0]), c[1]]);
  const m4 = new THREE.Matrix4(), qq = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), pv = new THREE.Vector3(), sv = new THREE.Vector3(1, 1, 1);

  function colocar(lista) {
    ultima = lista;
    modelos.forEach((o) => { if (o) { o.s.count = 0; o.m.count = 0; o.r.count = 0; } });
    let ns = 0;
    lista.slice(0, max).forEach((c) => {
      const o = modelos[c.forzar != null ? c.forzar : elegir(MODELOS, c.modelo)];
      if (!o) return;
      const [col, metal] = cols[elegir(COLORES, c.color)];
      qq.setFromAxisAngle(up, c.giro || 0);
      m4.compose(pv.set(c.x, 0, c.z), qq, sv.set(1, 1, 1));
      const pm = metal ? o.m : o.s;
      pm.setMatrixAt(pm.count, m4); pm.setColorAt(pm.count, col); pm.count++;
      o.r.setMatrixAt(o.r.count++, m4);
      m4.compose(pv.set(c.x, 0.006, c.z), qq, sv.set(o.M.W + 0.55, 1, o.M.L + 0.7));
      sombra.setMatrixAt(ns++, m4);
    });
    sombra.count = ns;
    [sombra].concat(...modelos.filter(Boolean).map((o) => [o.s, o.m, o.r])).forEach((im) => { im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true; });
  }

  return {
    colocar,
    listo: hecho,
    largo: (c) => MODELOS[c.forzar != null ? c.forzar : elegir(MODELOS, c.modelo)].L
  };
}
