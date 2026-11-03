// Aquaterra · texturas PBR (color + relieve + rugosidad) generadas en el navegador, y carga de texturas reales
// (assets/textures/<id>/<id>_diff_1k.jpg …) cuando assets/aq-assets.json las declara.
import * as THREE from './vendor/three/three.module.min.js';

export function rng(seed) { let s = seed >>> 0; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const hash2 = (a, b, s = 0) => { let h = (a * 374761393 + b * 668265263 + s * 2147483647) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

// ruido de valor periódico (encaja sin costuras) y fbm
function noiseFn(seed) {
  const R = rng(seed), perm = new Uint16Array(512), val = new Float32Array(256);
  for (let i = 0; i < 256; i++) { perm[i] = i; val[i] = R(); }
  for (let i = 255; i > 0; i--) { const j = Math.floor(R() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
  for (let i = 0; i < 256; i++) perm[i + 256] = perm[i];
  return (x, y, P, Q = P) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const x0 = ((xi % P) + P) % P, y0 = ((yi % Q) + Q) % Q, x1 = (x0 + 1) % P, y1 = (y0 + 1) % Q;
    const h = (a, b) => val[perm[perm[a & 255] + (b & 255)]];
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = h(x0, y0) + (h(x1, y0) - h(x0, y0)) * u, b = h(x0, y1) + (h(x1, y1) - h(x0, y1)) * u;
    return a + (b - a) * v;
  };
}
// fbm sobre la textura (u,v en 0..1) con frecuencias enteras → periódico
function fbm(n, u, v, f, oct, gain = 0.5, fy = f) {
  let s = 0, a = 1, t = 0;
  for (let o = 0; o < oct; o++) { s += n(u * f, v * fy, f, fy) * a; t += a; a *= gain; f *= 2; fy *= 2; }
  return s / t;
}
export const noise2 = noiseFn(77);

// lienzo → texturas: color (sRGB), normal (desde altura) y rugosidad
function build(S, span, px, opt = {}) {
  const col = new Uint8ClampedArray(S * S * 4), hgt = new Float32Array(S * S), rgh = new Uint8ClampedArray(S * S * 4);
  const out = { r: 0, g: 0, b: 0, h: 0, ro: 0.8 };
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    px(x / S, y / S, out); const i = y * S + x, j = i * 4;
    col[j] = out.r; col[j + 1] = out.g; col[j + 2] = out.b; col[j + 3] = 255; hgt[i] = out.h; const r = clamp(out.ro, 0, 1) * 255; rgh[j] = rgh[j + 1] = rgh[j + 2] = r; rgh[j + 3] = 255;
  }
  return pack(S, span, col, hgt, rgh, opt);
}
function pack(S, span, col, hgt, rgh, opt) {
  const res = {};
  const mk = (data, srgb) => { const c = document.createElement('canvas'); c.width = c.height = S; c.getContext('2d').putImageData(new ImageData(data, S, S), 0, 0); const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.repeat.set(1 / span, 1 / span); return t; };
  res.map = mk(col, true);
  if (hgt) {
    const nrm = new Uint8ClampedArray(S * S * 4), k = (opt.bump ?? 2) * S / 256;
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const l = hgt[y * S + (x + S - 1) % S], r = hgt[y * S + (x + 1) % S], u = hgt[((y + S - 1) % S) * S + x], d = hgt[((y + 1) % S) * S + x];
      let nx = -(r - l) * k, ny = (d - u) * k, nz = 1; const L = Math.hypot(nx, ny, nz); nx /= L; ny /= L; nz /= L;
      const j = (y * S + x) * 4; nrm[j] = (nx * 0.5 + 0.5) * 255; nrm[j + 1] = (ny * 0.5 + 0.5) * 255; nrm[j + 2] = (nz * 0.5 + 0.5) * 255; nrm[j + 3] = 255;
    }
    res.normalMap = mk(nrm, false);
  }
  if (rgh) res.roughnessMap = mk(rgh, false);
  res.span = span; return res;
}
// textura dibujada con canvas 2D (hojas, hierba): devuelve CanvasTexture con alfa
function drawn(S, draw, srgb = true) { const c = document.createElement('canvas'); c.width = c.height = S; draw(c.getContext('2d'), S); const t = new THREE.CanvasTexture(c); t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = 4; return t; }
const mix = (a, b, t) => a + (b - a) * t;
const set = (o, r, g, b) => { o.r = r; o.g = g; o.b = b; };

export function makeTextures(low) {
  const S = low ? 256 : 512, S2 = low ? 512 : 1024, n = noise2, n2 = noiseFn(13), n3 = noiseFn(29);
  const T = {};
  // — fachada: revoque fino exterior (arena cálida) —
  T.stucco = build(S, 1.6, (u, v, o) => {
    const lo = fbm(n, u, v, 3, 3), hi = fbm(n2, u, v, 64, 3), sp = n3(u * 256, v * 256, 256);
    const t = lo * 0.6 + hi * 0.4, base = 222 + (t - 0.5) * 26;
    set(o, base + 6, base - 1, base - 14); o.h = hi * 0.7 + (sp > 0.82 ? (sp - 0.82) * 2.4 : 0) + lo * 0.2; o.ro = 0.88 + hi * 0.1;
  }, { bump: 3.2 });
  // — fachada: ladrillo visto (muy típico en Paraguay) 25 × 6,5 cm con junta —
  T.brick = build(S2, 1.2, (u, v, o) => {
    const rows = 16, cols = 5, ry = v * rows, row = Math.floor(ry), fy = ry - row, rx = u * cols + (row % 2) * 0.5, col = Math.floor(rx), fx = rx - col;
    const cid = ((col % cols) + cols) % cols, hr = hash2(cid, row, 3), hb = hash2(cid, row, 9);
    const m = Math.min(Math.min(fx, 1 - fx) / 0.026, Math.min(fy, 1 - fy) / 0.085), grain = fbm(n2, u, v, 96, 3), blot = fbm(n, u, v, 24, 3);
    if (m < 1) { const g = 172 + grain * 30; set(o, g, g - 5, g - 14); o.h = 0.05 + grain * 0.1; o.ro = 0.97; return; }
    const burn = smooth(1, 3.2, m), l = 0.8 + hr * 0.32 - (1 - burn) * 0.14 + (blot - 0.5) * 0.2;
    set(o, clamp(178 * l + hb * 18, 0, 255), clamp(84 * l + hb * 10, 0, 255), clamp(50 * l, 0, 255));
    if (hb > 0.86) { o.r *= 0.7; o.g *= 0.64; o.b *= 0.64; }
    o.h = 0.55 + burn * 0.35 + (grain - 0.5) * 0.3 + (blot - 0.5) * 0.15; o.ro = 0.78 + grain * 0.2;
  }, { bump: 5 });
  // — fachada: piedra natural en hiladas —
  T.stone = build(S2, 2.0, (u, v, o) => {
    const rows = 7, ry = v * rows, row = Math.floor(ry), fy = ry - row, rx = ((u * 4 + hash2(row, 1, 5) * 4) % 4 + 4) % 4;
    const bnd = k => (k < 0 ? bnd(k + 8) - 4 : k >= 8 ? bnd(k - 8) + 4 : k * 0.5 + hash2(row, k, 2) * 0.3);
    let c = 0, a = 0; for (let k = -1; k < 8; k++) { const b0 = bnd(k), b1 = bnd(k + 1); if (rx >= b0 && rx < b1) { c = k; a = (rx - b0) / (b1 - b0); break; } }
    const id = ((c % 8) + 8) % 8, hs = hash2(id, row, 4), dist = Math.min(a, 1 - a) * 4.5, dy = Math.min(fy, 1 - fy) * 5, m = Math.min(dist, dy);
    const g = fbm(n2, u, v, 48, 4), cr = fbm(n3, u, v, 12, 3);
    if (m < 0.18) { const k = 70 + g * 40; set(o, k, k - 3, k - 8); o.h = 0; o.ro = 1; return; }
    const tone = 0.75 + hs * 0.4 + (cr - 0.5) * 0.25, warm = hash2(id, row, 7);
    set(o, clamp((150 + warm * 40) * tone, 0, 255), clamp((140 + warm * 22) * tone, 0, 255), clamp((124 + warm * 4) * tone, 0, 255));
    o.h = smooth(0.18, 0.7, m) * 0.6 + g * 0.35 + cr * 0.2; o.ro = 0.7 + g * 0.25;
  }, { bump: 6 });
  // — interior: pintura plástica mate (piel de naranja muy suave) —
  T.paint = build(S, 1.0, (u, v, o) => { const hi = fbm(n3, u, v, 48, 2), lo = fbm(n, u, v, 2, 2); const b = 241 + (lo - 0.5) * 6; set(o, b, b - 3, b - 9); o.h = hi; o.ro = 0.86 + hi * 0.08; }, { bump: 0.22 });
  // — baño: azulejo 60 × 30 cm brillante —
  T.btile = build(S, 1.2, (u, v, o) => {
    const ry = v * 4, row = Math.floor(ry), fy = ry - row, rx = u * 2 + (row % 2) * 0.5, col = Math.floor(rx), fx = rx - col, g = 0.012 / 0.6, gy = 0.012 / 0.3;
    const e = Math.min(fx / g, (1 - fx) / g, fy / gy, (1 - fy) / gy), hh = hash2(((col % 2) + 2) % 2, row, 11), w = fbm(n2, u, v, 8, 3);
    if (e < 0.5) { set(o, 196, 194, 188); o.h = 0; o.ro = 0.9; return; }
    const b = 236 + hh * 10 + (w - 0.5) * 8; set(o, b - 2, b, b + 1); o.h = 0.6 + smooth(0.5, 2.2, e) * 0.4; o.ro = 0.1 + w * 0.06;
  }, { bump: 3 });
  // — cocina / lavadero: porcelanato 60 × 60 piedra clara con vetas —
  T.ktile = build(S, 1.2, (u, v, o) => {
    const fx = (u * 2) % 1, fy = (v * 2) % 1, g = 0.008 / 0.6, e = Math.min(fx, 1 - fx, fy, 1 - fy) / g, ti = Math.floor(u * 2) + Math.floor(v * 2) * 2;
    const w = fbm(n, u + ti * 0.17, v, 4, 5), vein = Math.abs(Math.sin((u * 3 + w * 4 + ti) * Math.PI)), vv = Math.pow(1 - vein, 18);
    if (e < 0.5) { set(o, 150, 146, 140); o.h = 0; o.ro = 0.9; return; }
    const b = 214 + (w - 0.5) * 22 - vv * 20; set(o, b + 4, b, b - 8); o.h = 0.8 + w * 0.1; o.ro = 0.22 + w * 0.1;
  }, { bump: 2 });
  // — suelo de madera: tablas de roble 18 cm con veta —
  T.wood = build(S2, 2.4, (u, v, o) => {
    const rows = 13, ry = v * rows, row = Math.floor(ry), fy = ry - row, off = hash2(row, 0, 21), rx = u * 2 + off, pl = Math.floor(rx), fx = rx - pl, pid = ((pl % 2) + 2) % 2;
    const hp = hash2(pid, row, 23), grain = fbm(n2, u * 1 + hp, v, 3, 4, 0.55, 3 * rows * 6), fine = n3(u * 512, v * 64, 512);
    const ring = Math.sin((grain * 14 + hp * 6) * Math.PI) * 0.5 + 0.5, gap = Math.min(fy * 0.18 / 0.006, (1 - fy) * 0.18 / 0.006, fx * 1.2 / 0.006, (1 - fx) * 1.2 / 0.006);
    const l = 0.86 + hp * 0.22 - ring * 0.1 - fine * 0.05;
    set(o, 186 * l, 138 * l, 94 * l); o.ro = 0.42 + ring * 0.18 + fine * 0.1; o.h = 0.6 + ring * 0.12 + fine * 0.06;
    if (gap < 1) { o.r *= 0.45; o.g *= 0.42; o.b *= 0.4; o.h = 0; o.ro = 0.9; }
  }, { bump: 2.5 });
  // — chapa de madera (puertas y muebles): veta continua sin juntas —
  T.veneer = build(S, 1.0, (u, v, o) => {
    const w = fbm(n2, u, v, 6, 4, 0.55, 1), ring = Math.sin((u * 26 + w * 5) * Math.PI) * 0.5 + 0.5, fine = n3(u * 256, v * 16, 256, 16);
    const l = 0.9 - ring * 0.12 - fine * 0.06 + (w - 0.5) * 0.1; set(o, 196 * l, 150 * l, 104 * l); o.h = ring * 0.5 + fine * 0.3; o.ro = 0.5 + ring * 0.15;
  }, { bump: 1.2 });
  // — terraza: deck exterior —
  T.deck = build(S, 2.0, (u, v, o) => {
    const rows = 14, ry = v * rows, row = Math.floor(ry), fy = ry - row, hp = hash2(row, 1, 31), grain = fbm(n2, u + hp, v, 4, 4, 0.55, 4 * rows * 5);
    const ring = Math.sin(grain * 18 * Math.PI) * 0.5 + 0.5, l = 0.75 + hp * 0.25 - ring * 0.12; set(o, 150 * l, 104 * l, 72 * l); o.h = 0.7 + ring * 0.1; o.ro = 0.75;
    if (fy < 0.07 || fy > 0.93) { o.r *= 0.3; o.g *= 0.3; o.b *= 0.3; o.h = 0; }
  }, { bump: 3 });
  // — techo interior (yeso) y cubierta (membrana con gravilla) —
  T.roof = build(S, 2.0, (u, v, o) => { const g = fbm(n2, u, v, 96, 2), s = n3(u * 512, v * 512, 512); const b = 150 + g * 40 + (s - 0.5) * 50; set(o, b, b - 2, b - 6); o.h = s * 0.6 + g * 0.4; o.ro = 0.95; }, { bump: 3 });
  // — hormigón / adoquín del camino y la acera —
  T.pavers = build(S, 1.2, (u, v, o) => {
    const fx = (u * 3) % 1, fy = (v * 3) % 1, e = Math.min(fx, 1 - fx, fy, 1 - fy) / 0.03, id = Math.floor(u * 3) + Math.floor(v * 3) * 3, h = hash2(id, 0, 41), g = fbm(n, u, v, 32, 4);
    if (e < 0.5) { const k = 80 + g * 40; set(o, k, k - 6, k - 12); o.h = 0; o.ro = 1; return; }
    const b = 168 + h * 24 + (g - 0.5) * 40; set(o, b, b - 4, b - 12); o.h = 0.5 + smooth(0.5, 2, e) * 0.3 + g * 0.2; o.ro = 0.8 + g * 0.15;
  }, { bump: 3 });
  // — roca (montañas y piedras) —
  T.rock = build(S, 3.0, (u, v, o) => {
    const g = fbm(n, u, v, 4, 6, 0.55), r = 1 - Math.abs(fbm(n3, u, v, 8, 4) * 2 - 1), lay = Math.sin((v * 9 + g * 3) * Math.PI) * 0.5 + 0.5;
    const b = 92 + g * 70 + lay * 16 - r * 20; set(o, b + 8, b + 2, b - 6); o.h = g * 0.7 + r * 0.3; o.ro = 0.85;
  }, { bump: 6 });
  // — corteza —
  T.bark = build(S, 1.0, (u, v, o) => {
    const g = fbm(n2, u, v, 8, 5, 0.55, 2), s = Math.abs(Math.sin((u * 18 + g * 3) * Math.PI)), b = 70 + g * 50 - Math.pow(1 - s, 6) * 40;
    set(o, b + 6, b - 4, b - 14); o.h = s * 0.7 + g * 0.3; o.ro = 0.95;
  }, { bump: 6 });
  // — césped (desde arriba): briznas, tierra colorada y variación —
  {
    const c = document.createElement('canvas'); c.width = c.height = S2; const g = c.getContext('2d'), R = rng(11);
    const img = g.createImageData(S2, S2);
    for (let y = 0; y < S2; y++) for (let x = 0; x < S2; x++) { const u = x / S2, v = y / S2, lo = fbm(n, u, v, 4, 4), dirt = smooth(0.62, 0.8, fbm(n3, u, v, 6, 3)), j = (y * S2 + x) * 4; img.data[j] = mix(52 + lo * 26, 116, dirt); img.data[j + 1] = mix(70 + lo * 26, 74, dirt); img.data[j + 2] = mix(36 + lo * 10, 50, dirt); img.data[j + 3] = 255; }
    g.putImageData(img, 0, 0);
    const blades = low ? 22000 : 70000;
    for (let i = 0; i < blades; i++) {
      const x = R() * S2, y = R() * S2, L = (4 + R() * 9) * S2 / 1024, a = R() * Math.PI * 2, h = 62 + R() * 34, l = 17 + R() * 24;
      g.strokeStyle = `hsla(${h},${26 + R() * 22}%,${l}%,${0.55 + R() * 0.4})`; g.lineWidth = (0.8 + R() * 1.4) * S2 / 1024;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke();
    }
    const d = g.getImageData(0, 0, S2, S2).data, hg = new Float32Array(S2 * S2), rg = new Uint8ClampedArray(S2 * S2 * 4);
    for (let i = 0; i < S2 * S2; i++) { hg[i] = (d[i * 4] * 0.3 + d[i * 4 + 1] * 0.6 + d[i * 4 + 2] * 0.1) / 255; rg[i * 4] = rg[i * 4 + 1] = rg[i * 4 + 2] = 235; rg[i * 4 + 3] = 255; }
    T.grass = pack(S2, 3.2, new Uint8ClampedArray(d), hg, rg, { bump: 4 });
  }
  // — alfombra —
  T.rug = { map: drawn(512, (g, S) => { g.fillStyle = '#d8cab3'; g.fillRect(0, 0, S, S); const R = rng(5); for (let i = 0; i < 26000; i++) { g.fillStyle = `rgba(${R() > 0.5 ? '255,250,240' : '120,96,70'},${0.05 + R() * 0.08})`; g.fillRect(R() * S, R() * S, 1.5, 1.5); } g.strokeStyle = '#a65a35'; g.lineWidth = 16; g.strokeRect(28, 28, S - 56, S - 56); g.lineWidth = 3; g.strokeRect(56, 56, S - 112, S - 112); }) };
  // — tarjetas de follaje con transparencia (árboles y arbustos) —
  const leaves = (seed, hue, light, flowers, nFl = 160) => drawn(512, (g, S) => {
    const R = rng(seed);
    for (let i = 0; i < 14; i++) { g.strokeStyle = `rgba(${70 + R() * 30},${52 + R() * 20},${34},0.9)`; g.lineWidth = 2 + R() * 3; g.beginPath(); g.moveTo(S / 2, S / 2); g.lineTo(S / 2 + (R() - 0.5) * S * 0.8, S / 2 + (R() - 0.5) * S * 0.8); g.stroke(); }
    const N = 260;
    for (let i = 0; i < N; i++) {
      const r = Math.sqrt(R()) * S * 0.44, a = R() * Math.PI * 2, x = S / 2 + Math.cos(a) * r, y = S / 2 + Math.sin(a) * r, L = S * (0.05 + R() * 0.04), W = L * (0.38 + R() * 0.15), rot = R() * Math.PI * 2;
      const l = light + (R() - 0.5) * 16 - (r / S) * 6, h = hue + (R() - 0.5) * 14;
      g.save(); g.translate(x, y); g.rotate(rot);
      const gr = g.createLinearGradient(-W, 0, W, 0); gr.addColorStop(0, `hsl(${h},${48 + R() * 20}%,${l - 6}%)`); gr.addColorStop(0.5, `hsl(${h + 4},${50 + R() * 20}%,${l + 6}%)`); gr.addColorStop(1, `hsl(${h},${45 + R() * 20}%,${l - 8}%)`);
      g.fillStyle = gr; g.beginPath(); g.moveTo(0, -L); g.quadraticCurveTo(W, -L * 0.2, 0, L); g.quadraticCurveTo(-W, -L * 0.2, 0, -L); g.fill();
      g.strokeStyle = `hsla(${h},40%,${l + 14}%,0.5)`; g.lineWidth = 1; g.beginPath(); g.moveTo(0, -L * 0.9); g.lineTo(0, L * 0.9); g.stroke(); g.restore();
    }
    if (flowers) for (let i = 0; i < nFl; i++) { const r = Math.sqrt(R()) * S * 0.42, a = R() * Math.PI * 2, x = S / 2 + Math.cos(a) * r, y = S / 2 + Math.sin(a) * r, s = S * (0.012 + R() * 0.012); for (let p = 0; p < 5; p++) { const pa = p / 5 * Math.PI * 2 + R(); g.fillStyle = `hsl(${flowers[0] + (R() - 0.5) * 10},${flowers[1]}%,${flowers[2] + (R() - 0.5) * 14}%)`; g.beginPath(); g.ellipse(x + Math.cos(pa) * s, y + Math.sin(pa) * s, s, s * 0.6, pa, 0, Math.PI * 2); g.fill(); } g.fillStyle = '#f3d36b'; g.beginPath(); g.arc(x, y, s * 0.45, 0, Math.PI * 2); g.fill(); }
  });
  T.leaf = leaves(3, 96, 30); T.leaf2 = leaves(8, 84, 34); T.lapacho = leaves(12, 330, 72, [326, 62, 72]); T.lapachoY = leaves(15, 52, 60, [48, 90, 58]); T.hibisco = leaves(19, 104, 26, [356, 75, 48], 55);
  T.frond = drawn(512, (g, S) => {
    const R = rng(23); g.strokeStyle = '#6b6a3a'; g.lineWidth = 6; g.beginPath(); g.moveTo(S / 2, S); g.lineTo(S / 2, 0); g.stroke();
    for (let i = 0; i < 46; i++) { const y = S - (i / 46) * S, L = S * 0.47 * Math.sin((i / 46) * Math.PI * 0.9 + 0.15), h = 88 + R() * 20, l = 24 + R() * 16;
      [-1, 1].forEach(sd => { g.strokeStyle = `hsl(${h},${45 + R() * 15}%,${l}%)`; g.lineWidth = 4 + R() * 3; g.beginPath(); g.moveTo(S / 2, y); g.quadraticCurveTo(S / 2 + sd * L * 0.5, y - S * 0.02, S / 2 + sd * L, y + S * 0.05); g.stroke(); }); }
  });
  T.tuft = drawn(256, (g, S) => {
    const R = rng(31);
    for (let i = 0; i < 70; i++) { const x0 = S * (0.15 + R() * 0.7), h = S * (0.45 + R() * 0.55), bend = (R() - 0.5) * S * 0.35, l = 24 + R() * 26, hue = 70 + R() * 30;
      g.fillStyle = `hsl(${hue},${40 + R() * 25}%,${l}%)`; const w = 3 + R() * 4; g.beginPath(); g.moveTo(x0 - w, S); g.quadraticCurveTo(x0 + bend * 0.4, S - h * 0.5, x0 + bend, S - h); g.quadraticCurveTo(x0 + bend * 0.4 + w * 0.3, S - h * 0.5, x0 + w, S); g.fill(); }
  });
  T.flowers = drawn(256, (g, S) => {
    const R = rng(37);
    for (let i = 0; i < 26; i++) { const x0 = S * (0.1 + R() * 0.8), h = S * (0.4 + R() * 0.5); g.strokeStyle = `hsl(${95 + R() * 20},40%,${28 + R() * 10}%)`; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, S); g.quadraticCurveTo(x0 + (R() - 0.5) * 20, S - h / 2, x0 + (R() - 0.5) * 30, S - h); g.stroke(); }
    const cols = [[50, 92, 60], [280, 50, 66], [0, 0, 96], [20, 85, 60]];
    for (let i = 0; i < 22; i++) { const x = S * (0.1 + R() * 0.8), y = S * (0.1 + R() * 0.5), c = cols[Math.floor(R() * cols.length)], s = 5 + R() * 6; for (let p = 0; p < 6; p++) { const a = p / 6 * Math.PI * 2; g.fillStyle = `hsl(${c[0]},${c[1]}%,${c[2] + (R() - 0.5) * 10}%)`; g.beginPath(); g.ellipse(x + Math.cos(a) * s, y + Math.sin(a) * s, s * 0.8, s * 0.45, a, 0, Math.PI * 2); g.fill(); } g.fillStyle = '#e8b93a'; g.beginPath(); g.arc(x, y, s * 0.4, 0, Math.PI * 2); g.fill(); }
  });
  T.stars = drawn(64, (g, S) => { const gr = g.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, S, S); });
  T.moon = drawn(256, (g, S) => { const R = rng(41); g.fillStyle = '#f4f1e6'; g.beginPath(); g.arc(S / 2, S / 2, S * 0.46, 0, Math.PI * 2); g.fill(); for (let i = 0; i < 40; i++) { const r = R() * S * 0.38, a = R() * 6.28, s = S * (0.02 + R() * 0.07); g.fillStyle = `rgba(150,145,135,${0.15 + R() * 0.25})`; g.beginPath(); g.arc(S / 2 + Math.cos(a) * r, S / 2 + Math.sin(a) * r, s, 0, 6.28); g.fill(); } });
  return T;
}

// — carga de texturas reales (Poly Haven y propias) declaradas en assets/aq-assets.json —
export async function loadManifest(base) {
  try { const r = await fetch(base + 'assets/aq-assets.json', { cache: 'no-cache' }); if (!r.ok) return null; return await r.json(); } catch (e) { return null; }
}
const texCache = new Map();
// slots: { clave: { ids: [preferencias], mats: [materiales], tint?: color } } → aplica la primera textura disponible
// color del material para que la textura real, de media, dé el tono deseado (p. ej. pintura blanca)
function gainTo(tex, target) {
  const t = new THREE.Color(target), out = new THREE.Color(1, 1, 1);
  try { const c = document.createElement('canvas'); c.width = c.height = 16; const g = c.getContext('2d'); g.drawImage(tex.image, 0, 0, 16, 16); const d = g.getImageData(0, 0, 16, 16).data; let r = 0, gg = 0, b = 0; for (let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; } const n = d.length / 4, m = new THREE.Color().setRGB(r / n / 255, gg / n / 255, b / n / 255, THREE.SRGBColorSpace); out.setRGB(clampG(t.r / Math.max(m.r, 0.02)), clampG(t.g / Math.max(m.g, 0.02)), clampG(t.b / Math.max(m.b, 0.02))); } catch (e) { out.copy(t); }
  return out;
}
const clampG = v => Math.min(3.2, Math.max(0.2, v));
export function applyRealTextures(base, man, slots, renderer, onSet) {
  if (!man || !man.textures) return Promise.resolve({});
  const L = new THREE.TextureLoader(), maxA = Math.min(8, renderer.capabilities.getMaxAnisotropy()), got = {};
  const url = f => base + 'assets/' + f;
  const ld = (f, srgb) => { if (!f) return Promise.resolve(null); const k = f + srgb; if (!texCache.has(k)) texCache.set(k, new Promise(res => L.load(url(f), t => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = maxA; if (srgb) t.colorSpace = THREE.SRGBColorSpace; res(t); }, undefined, () => res(null)))); return texCache.get(k); };
  const jobs = Object.entries(slots).map(([key, sl]) => {
    const id = sl.ids.find(i => man.textures[i]); if (!id) return null; const d = man.textures[id], f = d.files || {}, span = (d.span || 2) * (sl.scale || 1);
    return Promise.all([ld(f.diff, true), ld(f.nor, false), ld(f.rough || f.arm, false)]).then(([di, no, ro]) => {
      if (!di) return; const rep = t => { if (!t) return null; const c = t.clone(); c.repeat.set(1 / span, 1 / span); c.needsUpdate = true; return c; };
      const set = { map: rep(di), normalMap: rep(no), roughnessMap: rep(ro), span, id }; got[key] = set;
      const col = sl.target !== undefined ? gainTo(di, sl.target) : sl.tint !== undefined ? new THREE.Color(sl.tint) : new THREE.Color(0xffffff); set.color = col;
      (sl.mats || []).forEach(m => { if (sl.mapless) { m.map = null; m.color.set(sl.target); if (set.normalMap) { m.normalMap = set.normalMap; m.normalScale.set(0.6, 0.6); } if (set.roughnessMap) { m.roughnessMap = set.roughnessMap; m.roughness = 1; } m.needsUpdate = true; return; } m.map = set.map; if (set.normalMap) m.normalMap = set.normalMap; if (set.roughnessMap) { m.roughnessMap = set.roughnessMap; m.roughness = 1; } m.color.copy(col); m.needsUpdate = true; });
      onSet && onSet(key, set);
    });
  }).filter(Boolean);
  return Promise.all(jobs).then(() => got);
}
