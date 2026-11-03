// Aquaterra · exterior del Render 3D: terreno con colinas y montañas, bosque lejano, árboles cercanos
// (lapachos, palmeras pindó y frondosos), arbustos, hierba con viento, flores, rocas, camino y cielo nocturno.
import * as THREE from './vendor/three/three.module.min.js';
import { mergeGeometries } from './vendor/three/BufferGeometryUtils.js';
import { rng, noise2 } from './aq-r3d-mats.js';
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

const PI = Math.PI, V = (x, y, z) => new THREE.Vector3(x, y, z);
const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const N = (x, z) => noise2(x, z, 4096);
const fbm = (x, z, o = 4) => { let s = 0, a = 1, t = 0; for (let i = 0; i < o; i++) { s += N(x, z) * a; t += a; a *= 0.5; x *= 2.03; z *= 2.03; } return s / t; };
const ridge = (x, z, o = 5) => { let s = 0, a = 1, t = 0; for (let i = 0; i < o; i++) { const n = 1 - Math.abs(N(x, z) * 2 - 1); s += n * n * a; t += a; a *= 0.5; x *= 2.1; z *= 2.1; } return s / t; };

// viento: desplaza los vértices según su altura (uv.y) y la posición de la instancia
export const wind = { value: 0 };
function windy(mat, amp, inst) {
  mat.onBeforeCompile = sh => {
    sh.uniforms.uWind = wind;
    sh.vertexShader = 'uniform float uWind;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
      ${inst ? 'vec3 wp = vec3(instanceMatrix[3][0], 0.0, instanceMatrix[3][2]);' : 'vec3 wp = (modelMatrix * vec4(position, 1.0)).xyz;'}
      float wk = ${inst ? 'uv.y' : 'clamp(position.y * 0.12, 0.0, 1.0)'};
      transformed.x += sin(uWind * 1.6 + wp.x * 0.35 + wp.z * 0.2) * ${amp.toFixed(3)} * wk;
      transformed.z += cos(uWind * 1.3 + wp.z * 0.33) * ${(amp * 0.6).toFixed(3)} * wk;`);
  };
  mat.customProgramCacheKey = () => 'wind' + amp + (inst ? 'i' : '');
  return mat;
}

export function windify(M) { windy(M.leaf, 0.03, false); windy(M.leaf2, 0.03, false); windy(M.lapacho, 0.03, false); windy(M.lapachoY, 0.03, false); windy(M.hibisco, 0.02, false); windy(M.frond, 0.05, false); windy(M.tuft, 0.07, true); windy(M.flowers, 0.06, true); }
function cylBetween(a, b, ra, rb, seg) {
  const d = b.clone().sub(a), L = d.length(), g = new THREE.CylinderGeometry(rb, ra, L, seg, 1, true);
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 2 * PI * ra * 1.5, uv.getY(i) * L);
  g.translate(0, L / 2, 0); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.normalize())); g.translate(a.x, a.y, a.z);
  return g;
}
function card(c, s, q, center) {
  const g = new THREE.PlaneGeometry(s, s); g.applyQuaternion(q); g.translate(c.x, c.y, c.z);
  const p = g.attributes.position, n = g.attributes.normal;
  for (let i = 0; i < p.count; i++) { const v = V(p.getX(i), p.getY(i), p.getZ(i)).sub(center); v.y += 0.4; v.normalize(); n.setXYZ(i, v.x, v.y, v.z); }
  return g;
}
const rq = R => new THREE.Quaternion().setFromEuler(new THREE.Euler(R() * PI * 2, R() * PI * 2, R() * PI * 2));

// árbol frondoso (ramas recursivas + tarjetas de hojas con normales esféricas)
function broadleaf(seed, opt = {}) {
  const R = rng(seed), wood = [], tips = [];
  const H = (opt.h || 5.5) * (0.85 + R() * 0.3);
  const br = (p0, dir, len, rad, depth) => {
    const p1 = p0.clone().addScaledVector(dir, len); wood.push(cylBetween(p0, p1, rad, rad * 0.68, depth > 2 ? 7 : 5));
    if (depth === 0) { tips.push(p1); return; }
    if (depth <= 1) tips.push(p0.clone().lerp(p1, 0.6));
    const n = depth >= 3 ? 3 : 2 + (R() < 0.45 ? 1 : 0), off = R() * PI * 2;
    for (let k = 0; k < n; k++) {
      const ang = (opt.spread || 0.55) + R() * 0.35, az = off + k * 2 * PI / n + (R() - 0.5) * 0.6;
      const axis = V(Math.cos(az), 0, Math.sin(az)).cross(dir).normalize(), nd = dir.clone().applyAxisAngle(axis.lengthSq() > 0.01 ? axis : V(1, 0, 0), ang);
      nd.y += 0.18; nd.normalize(); br(p1, nd, len * (0.6 + R() * 0.16), rad * 0.62, depth - 1);
    }
  };
  br(V(0, 0, 0), V((R() - 0.5) * 0.12, 1, (R() - 0.5) * 0.12).normalize(), H * 0.42, opt.r || 0.2, 4);
  const ctr = tips.reduce((a, p) => a.add(p), V(0, 0, 0)).multiplyScalar(1 / tips.length), leaves = [];
  tips.forEach(p => { const n = opt.dense || 4; for (let i = 0; i < n; i++) { const s = (opt.leaf || 1.25) * (0.75 + R() * 0.5); leaves.push(card(p.clone().add(V((R() - 0.5) * 0.7, (R() - 0.3) * 0.5, (R() - 0.5) * 0.7)), s, rq(R), ctr)); } });
  return { wood: mergeGeometries(wood), leaves: mergeGeometries(leaves), h: H };
}
// palmera pindó: tronco curvo anillado + corona de frondas arqueadas
function palm(seed) {
  const R = rng(seed), H = 6 + R() * 3, lean = V((R() - 0.5) * 0.9, 0, (R() - 0.5) * 0.9), pts = [], wood = [], fr = [];
  for (let i = 0; i <= 8; i++) { const t = i / 8; pts.push(V(lean.x * t * t, H * t, lean.z * t * t)); }
  for (let i = 0; i < 8; i++) wood.push(cylBetween(pts[i], pts[i + 1], 0.2 - i * 0.008, 0.19 - (i + 1) * 0.008, 9));
  const top = pts[8], nF = 15;
  for (let f = 0; f < nF; f++) {
    const az = f / nF * 2 * PI + R() * 0.3, el = 0.25 + R() * 0.75, L = 2.6 + R() * 1.1, segs = 8, pos = [], uv = [], idx = [], W = 0.95;
    const out = V(Math.cos(az), 0, Math.sin(az)), side = V(-Math.sin(az), 0, Math.cos(az));
    for (let s = 0; s <= segs; s++) {
      const t = s / segs, droop = t * t * (1.6 + R() * 0.2), p = top.clone().addScaledVector(out, Math.cos(el) * L * t).add(V(0, Math.sin(el) * L * t - droop, 0));
      const tw = side.clone().multiplyScalar(W / 2).applyAxisAngle(out, (t - 0.5) * 0.6);
      [-1, 1].forEach(k => { const q = p.clone().addScaledVector(tw, k); pos.push(q.x, q.y, q.z); uv.push(k < 0 ? 0 : 1, t); });
      if (s < segs) { const b = s * 2; idx.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
    const nrm = []; for (let i = 0; i < pos.length; i += 3) { const v = V(pos[i] - top.x, pos[i + 1] - top.y + 1.5, pos[i + 2] - top.z).normalize(); nrm.push(v.x, v.y, v.z); }
    g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); fr.push(g);
  }
  return { wood: mergeGeometries(wood), leaves: mergeGeometries(fr), h: H };
}
function shrub(seed, r) {
  const R = rng(seed), cs = [], ctr = V(0, r * 0.55, 0), n = Math.round(10 + r * 18);
  for (let i = 0; i < n; i++) { const a = R() * PI * 2, e = R() * PI * 0.5, d = r * (0.35 + R() * 0.6); cs.push(card(V(Math.cos(a) * Math.cos(e) * d, ctr.y + Math.sin(e) * d * 0.8 - r * 0.15, Math.sin(a) * Math.cos(e) * d), r * (0.8 + R() * 0.5), rq(R), ctr)); }
  return mergeGeometries(cs);
}
function tuftGeo(w, h) { const gs = []; for (let k = 0; k < 3; k++) { const g = new THREE.PlaneGeometry(w, h); g.translate(0, h / 2, 0); g.rotateY(k * PI / 3); const n = g.attributes.normal; for (let i = 0; i < n.count; i++) n.setXYZ(i, 0, 1, 0); gs.push(g); } return mergeGeometries(gs); }

// far = true: cerros y bosque lejano en 3D (hasta 2,6 km). far = false: sólo hasta ~620 m; lo demás lo pone el panorama precalculado
export function buildExterior({ T, M, low, hx, hz, entry, camDir, maxH, far = true }) {
  const G = new THREE.Group(), R = rng(2024), fixtures = [], rockU = { value: T.rock.map }, tintU = { value: new THREE.Color(1, 1, 1) }; let terrainMat = null;
  const flatR = Math.max(hx, hz) + 10;
  const inHouse = (x, z, m) => Math.abs(x) < hx + m && Math.abs(z) < hz + m;
  const pathRect = entry ? (() => { const L = 9, w = 1.6; const x0 = entry.x - entry.nx * 0.6, z0 = entry.z - entry.nz * 0.6, x1 = entry.x - entry.nx * (L + 0.6), z1 = entry.z - entry.nz * (L + 0.6); return [Math.min(x0, x1) - (entry.nx ? 0 : w / 2), Math.max(x0, x1) + (entry.nx ? 0 : w / 2), Math.min(z0, z1) - (entry.nz ? 0 : w / 2), Math.max(z0, z1) + (entry.nz ? 0 : w / 2)]; })() : null;
  const onPath = (x, z, m) => pathRect && x > pathRect[0] - m && x < pathRect[1] + m && z > pathRect[2] - m && z < pathRect[3] + m;
  const gh = (x, z) => {
    const r = Math.hypot(x, z), t = smooth(flatR, flatR + 45, r);
    const und = (fbm(x * 0.015 + 7, z * 0.015 + 3, 3) - 0.5) * 5 * t;
    const ang = Math.atan2(z, x), amp = 70 + 190 * smooth(0.25, 0.75, fbm(Math.cos(ang) * 1.7 + 11, Math.sin(ang) * 1.7 + 5, 2));
    const hill = smooth(170, 650, r) * ridge(x * 0.0022 + 40, z * 0.0022 + 17) * amp + smooth(90, 260, r) * fbm(x * 0.008, z * 0.008, 3) * 22;
    // bajo la casa y su acera el terreno se hunde para que nunca asome por el suelo
    const bx = Math.max(0, Math.abs(x) - hx), bz = Math.max(0, Math.abs(z) - hz), dip = 0.22 * (1 - smooth(0, 3.5, Math.hypot(bx, bz)));
    return -0.06 - dip + und + hill;
  };

  // — terreno radial (denso cerca de la casa, amplio en las montañas) —
  {
    const NR = far ? (low ? 56 : 84) : (low ? 34 : 46), NA = low ? 96 : 160, RMAX = far ? 2600 : 620, pos = [], uv = [], col = [], bl = [], idx = [];
    for (let i = 0; i <= NR; i++) {
      const r = i === 0 ? 0 : RMAX * Math.pow(i / NR, 2.35);
      for (let j = 0; j < NA; j++) {
        const a = j / NA * 2 * PI, x = Math.cos(a) * r, z = Math.sin(a) * r, y = gh(x, z);
        pos.push(x, y, z); uv.push(x, z);
        const hgt = Math.max(0, y), e = 0.004, sl = Math.hypot(gh(x + 3, z) - y, gh(x, z + 3) - y) / 3, forest = smooth(25, 90, hgt) * (1 - smooth(0.9, 1.4, sl)), rock = Math.max(smooth(0.55, 1.1, sl), smooth(150, 230, hgt) * 0.8) * smooth(60, 120, r);
        const patch = fbm(x * 0.05 + 3, z * 0.05 + 9, 3), dry = smooth(0.55, 0.75, fbm(x * 0.02 + 1, z * 0.02 + 2, 3)) * (1 - forest);
        let cr = 1 - forest * 0.48 + (patch - 0.5) * 0.25 + dry * 0.18, cg = 1 - forest * 0.32 + (patch - 0.5) * 0.18 + dry * 0.05, cb = 1 - forest * 0.5 + (patch - 0.5) * 0.12 - dry * 0.1;
        col.push(cr, cg, cb); bl.push(rock); void e;
      }
    }
    for (let i = 0; i < NR; i++) for (let j = 0; j < NA; j++) { const a = i * NA + j, b = i * NA + (j + 1) % NA, c = (i + 1) * NA + j, d = (i + 1) * NA + (j + 1) % NA; idx.push(a, b, c, b, d, c); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('blend', new THREE.Float32BufferAttribute(bl, 1)); g.setIndex(idx); g.computeVertexNormals();
    const mat = new THREE.MeshStandardMaterial({ map: T.grass.map, normalMap: T.grass.normalMap, roughness: 1, vertexColors: true, normalScale: new THREE.Vector2(0.8, 0.8) });
    mat.onBeforeCompile = sh => {
      sh.uniforms.rockMap = rockU; sh.uniforms.grassTint = tintU;
      sh.vertexShader = 'attribute float blend;\nvarying float vBlend;\nvarying vec2 vWorldUv;\n' + sh.vertexShader.replace('#include <uv_vertex>', '#include <uv_vertex>\nvBlend = blend; vWorldUv = uv;');
      sh.fragmentShader = 'uniform sampler2D rockMap;\nuniform vec3 grassTint;\nvarying float vBlend;\nvarying vec2 vWorldUv;\n' + sh.fragmentShader.replace('#include <map_fragment>', `
        vec4 gC = texture2D(map, vMapUv); vec4 gF = texture2D(map, vMapUv * 0.083 + 0.37); gC.rgb = mix(gC.rgb, gF.rgb, 0.35) * grassTint;
        vec4 rC = texture2D(rockMap, vWorldUv * 0.11);
        diffuseColor *= mix(gC, rC * vec4(1.15, 1.1, 1.05, 1.0), clamp(vBlend, 0.0, 1.0));`);
    };
    mat.customProgramCacheKey = () => 'terrain';
    const m = new THREE.Mesh(g, mat); m.receiveShadow = true; G.add(m); terrainMat = mat;
  }

  // — camino de entrada con adoquines y balizas —
  if (entry) {
    const L = 9, w = 1.5, cx = entry.x - entry.nx * (L / 2 + 0.7), cz = entry.z - entry.nz * (L / 2 + 0.7), gx = entry.nx ? L : w, gz = entry.nx ? w : L;
    const g = new THREE.BoxGeometry(gx, 0.36, gz); const uv = g.attributes.uv, p = g.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) + cx, p.getZ(i) + cz);
    const m = new THREE.Mesh(g, M.pavers); m.position.set(cx, -0.2, cz); m.receiveShadow = true; G.add(m);
    for (let k = 1; k <= 3; k++) [-1, 1].forEach(sd => {
      const t = k / 3.4, bx = entry.x - entry.nx * (0.7 + L * t) + (entry.nx ? 0 : sd * (w / 2 + 0.25)), bz = entry.z - entry.nz * (0.7 + L * t) + (entry.nz ? 0 : sd * (w / 2 + 0.25));
      const b = new THREE.Group(); const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.55, 12), M.frame); post.position.y = 0.27; post.castShadow = true;
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.061, 0.061, 0.1, 12), M.glowOut); lens.position.y = 0.46; b.add(post, lens); b.position.set(bx, 0, bz); G.add(b);
      fixtures.push({ pos: V(bx, 0.45, bz), kind: 'bollard', prio: k === 1 && sd === 1 ? 4 : 0, room: null });
    });
  }

  // — árboles cercanos —
  const kinds = [['lapacho', 6.2], ['broad', 7], ['palm', 0], ['lapachoY', 5.8], ['broad2', 6.5], ['palm', 0]];
  const variants = {}, mk = (k, i) => {
    const key = k + i; if (variants[key]) return variants[key];
    const geo = k === 'palm' ? palm(100 + i) : broadleaf(200 + i * 7 + k.length, { h: kinds.find(q => q[0] === k)[1], leaf: k.startsWith('lapacho') ? 1.15 : 1.35, dense: low ? 3 : 4, spread: k === 'broad2' ? 0.75 : 0.55 });
    const lm = k === 'palm' ? M.frond : k === 'lapacho' ? M.lapacho : k === 'lapachoY' ? M.lapachoY : k === 'broad2' ? M.leaf2 : M.leaf;
    return (variants[key] = { geo, lm });
  };
  const trees = [], cd = camDir ? Math.atan2(camDir.z, camDir.x) : PI / 4;
  const nT = low ? 9 : 16;
  for (let tries = 0; tries < 900 && trees.length < nT; tries++) {
    const a = R() * PI * 2, rr = Math.max(hx, hz) + 4 + Math.pow(R(), 0.8) * 24, x = Math.cos(a) * rr * (0.8 + R() * 0.3), z = Math.sin(a) * rr * (0.8 + R() * 0.3);
    if (inHouse(x, z, 3.2) || onPath(x, z, 2.6)) continue;
    let da = Math.abs(((a - cd + PI) % (2 * PI) + 2 * PI) % (2 * PI) - PI); if (da < 0.5 && rr < 22) continue;
    if (trees.some(t => Math.hypot(t.x - x, t.z - z) < 5.2)) continue;
    trees.push({ x, z, k: kinds[trees.length % kinds.length][0], i: trees.length % 2 });
  }
  trees.forEach(t => {
    const v = mk(t.k, t.i), s = 0.85 + R() * 0.35, y = gh(t.x, t.z);
    const w = new THREE.Mesh(v.geo.wood, M.bark), l = new THREE.Mesh(v.geo.leaves, v.lm);
    const ry = R() * PI * 2; [w, l].forEach(m => { m.position.set(t.x, y, t.z); m.scale.setScalar(s); m.rotation.y = ry; m.castShadow = true; m.receiveShadow = true; G.add(m); }); Object.assign(t, { meshes: [w, l], y, s, ry });
  });

  // — bosque y arboledas lejanas (instanciado) —
  {
    const crownG = new THREE.IcosahedronGeometry(1, 2), p = crownG.attributes.position;
    for (let i = 0; i < p.count; i++) { const v = V(p.getX(i), p.getY(i), p.getZ(i)), k = 0.78 + N(v.x * 2.3 + 5, v.z * 2.3 + v.y * 1.7) * 0.45; p.setXYZ(i, v.x * k, v.y * k * 0.85, v.z * k); }
    crownG.computeVertexNormals(); const uv = crownG.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 3, uv.getY(i) * 2);
    const trunkG = new THREE.CylinderGeometry(0.12, 0.2, 1, 5); trunkG.translate(0, 0.5, 0);
    const n = far ? (low ? 700 : 2200) : (low ? 220 : 520), crowns = new THREE.InstancedMesh(crownG, M.forest, n), trunks = new THREE.InstancedMesh(trunkG, M.bark, n);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), c = new THREE.Color(); let k = 0;
    for (let tries = 0; tries < n * 8 && k < n; tries++) {
      const a = R() * PI * 2, r = 42 + Math.pow(R(), 1.6) * (far ? 900 : 540), x = Math.cos(a) * r, z = Math.sin(a) * r, y = gh(x, z);
      const dens = fbm(x * 0.012 + 50, z * 0.012 + 20, 3) + (y > 20 ? 0.18 : 0); if (dens < 0.52) continue;
      if (Math.abs(((a - cd + PI) % (2 * PI) + 2 * PI) % (2 * PI) - PI) < 0.35 && r < 80) continue;
      const h = 5 + R() * 7, cr = 2 + R() * 2.4;
      // tronco desde el suelo hasta dentro de la copa (antes flotaba y asomaba por encima: parecían árboles al revés)
      m4.compose(V(x, y - 0.2, z), q.identity(), V(0.8 + cr * 0.12, h * 0.42 + cr * 0.5, 0.8 + cr * 0.12)); trunks.setMatrixAt(k, m4);
      m4.compose(V(x, y + h * 0.42 + cr * 0.75, z), q.setFromEuler(new THREE.Euler(0, R() * 6.28, 0)), V(cr, cr * (0.9 + R() * 0.3), cr)); crowns.setMatrixAt(k, m4);
      c.setHSL(0.22 + R() * 0.08, 0.3 + R() * 0.2, 0.42 + R() * 0.16, THREE.SRGBColorSpace); if (R() < 0.05) c.setHSL(0.92, 0.5, 0.72, THREE.SRGBColorSpace); crowns.setColorAt(k, c); k++;
    }
    crowns.count = trunks.count = k; crowns.receiveShadow = true; G.add(crowns, trunks);
  }

  // — arbustos alrededor de la casa y del camino —
  let shrubSpots = []; const shrubIMs = [];
  {
    const vars = [[shrub(5, 0.7), M.leaf], [shrub(9, 0.55), M.hibisco], [shrub(13, 0.9), M.leaf2]], spots = [];
    const per = 2 * (hx + hz), nS = low ? 18 : 40;
    for (let i = 0; i < nS * 3 && spots.length < nS; i++) {
      let x, z; const t = R() * per, off = 0.75 + R() * 1.1;
      if (t < 2 * hx) { x = -hx + t; z = (R() < 0.5 ? -1 : 1) * (hz + off); } else { x = (R() < 0.5 ? -1 : 1) * (hx + off); z = -hz + (t - 2 * hx) / (2 * hz) * 2 * hz; }
      if (i % 3 === 0 && pathRect) { const along = R(); x = pathRect[0] + (pathRect[1] - pathRect[0]) * (entry.nx ? along : (R() < 0.5 ? -0.6 : 1.6)); z = pathRect[2] + (pathRect[3] - pathRect[2]) * (entry.nz ? along : (R() < 0.5 ? -0.6 : 1.6)); }
      if (onPath(x, z, 0.35) || inHouse(x, z, 0.45) || spots.some(s => Math.hypot(s.x - x, s.z - z) < 1.1)) continue;
      spots.push({ x, z, v: Math.floor(R() * vars.length) }); shrubSpots = spots;
    }
    vars.forEach(([geo, mat], vi) => {
      const list = spots.filter(s => s.v === vi); if (!list.length) return; const im = new THREE.InstancedMesh(geo, mat, list.length), m4 = new THREE.Matrix4();
      list.forEach((s, i) => { const sc = 0.8 + R() * 0.5; m4.compose(V(s.x, gh(s.x, s.z), s.z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, R() * 6.28, 0)), V(sc, sc * (0.8 + R() * 0.4), sc)); im.setMatrixAt(i, m4); });
      im.castShadow = true; im.receiveShadow = true; G.add(im); shrubIMs.push(im);
    });
  }

  // — hierba alta y flores (instanciadas, con viento) —
  let tufts = null, flowers = null;
  {
    const place = (geo, mat, n, rmin, rmax) => {
      const im = new THREE.InstancedMesh(geo, mat, n), m4 = new THREE.Matrix4(), list = []; let k = 0;
      for (let t = 0; t < n * 6 && k < n; t++) {
        const a = R() * PI * 2, r = rmin + Math.pow(R(), 0.7) * (rmax - rmin), x = Math.cos(a) * r * 1.2, z = Math.sin(a) * r;
        if (inHouse(x, z, 0.95) || onPath(x, z, 0.35)) continue; if (N(x * 0.2 + 3, z * 0.2) < 0.38) continue;
        const s = 0.6 + R() * 0.9; m4.compose(V(x, gh(x, z) - 0.02, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, R() * 6.28, 0)), V(s, s * (0.7 + R() * 0.6), s)); im.setMatrixAt(k++, m4); list.push({ x, z, r: Math.hypot(x, z), m: m4.clone() });
      }
      im.count = k; im.receiveShadow = true; G.add(im); return { im, list };
    };
    const rH = Math.max(hx, hz);
    tufts = place(tuftGeo(0.42, 0.34), M.tuft, low ? 1400 : 5200, rH * 0.6, rH + 34);
    flowers = place(tuftGeo(0.36, 0.36), M.flowers, low ? 70 : 220, rH * 0.6, rH + 18);
  }

  // — rocas decorativas —
  const rocks = [];
  {
    const geo = new THREE.IcosahedronGeometry(1, 3), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const v = V(p.getX(i), p.getY(i), p.getZ(i)), k = 0.7 + N(v.x * 1.8 + 9, v.z * 1.8 + v.y * 2.2) * 0.55; p.setXYZ(i, v.x * k, v.y * k * 0.62, v.z * k); }
    geo.computeVertexNormals(); const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 4, uv.getY(i) * 2);
    for (let i = 0, k = 0; i < 60 && k < 9; i++) {
      const a = R() * PI * 2, r = Math.max(hx, hz) + 3 + R() * 14, x = Math.cos(a) * r, z = Math.sin(a) * r; if (inHouse(x, z, 2) || onPath(x, z, 1)) continue;
      const m = new THREE.Mesh(geo, M.rock), s = 0.25 + R() * 0.6; m.scale.set(s * (1 + R() * 0.6), s, s); m.position.set(x, gh(x, z) - s * 0.15, z); m.rotation.y = R() * 6; m.castShadow = m.receiveShadow = true; G.add(m); rocks.push({ m, x, z, s }); k++;
    }
  }
  void maxH;

  // — texturas reales del suelo (césped y roca) cuando terminan de cargar —
  function setGround(k, set) {
    if (!terrainMat || !set || !set.map) return;
    if (k === 'grass') { terrainMat.map = set.map; if (set.normalMap) terrainMat.normalMap = set.normalMap; if (set.color) tintU.value.copy(set.color); terrainMat.needsUpdate = true; }
    else if (k === 'terrainRock') rockU.value = set.map;
  }

  // — sustituye la vegetación y las rocas procedurales por modelos reales, en segundo plano —
  // lib = { load(id) → Promise<scene|null>, meta(id) → manifest entry|null }
  async function upgrade(lib) {
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = V(1, 1, 1);
    const get = async list => { const out = []; for (const id of list) { const sc = await lib.load(id); if (sc) out.push({ id, sc, meta: lib.meta(id) || {} }); } return out; };
    // piezas (malla + matriz relativa) de un modelo o de una de sus variantes
    const parts = (sc, vname) => {
      const root = (vname && sc.getObjectByName(vname)) || sc; sc.updateMatrixWorld(true); const out = [], box = new THREE.Box3();
      root.traverse(o => { if (o.isMesh) { out.push({ geo: o.geometry, mat: o.material, rel: o.matrixWorld.clone() }); box.expandByObject(o); } });
      return { out, size: box.getSize(V()), min: box.min.clone() };
    };
    // una InstancedMesh por pieza, con todas las posiciones
    const instanced = (P, mats, shadow = true) => { if (!mats.length) return []; return P.out.map(pt => { const im = new THREE.InstancedMesh(pt.geo, pt.mat, mats.length); mats.forEach((M4, i) => im.setMatrixAt(i, m4.multiplyMatrices(M4, pt.rel))); im.castShadow = shadow; im.receiveShadow = true; G.add(im); return im; }); };
    const at = (x, y, z, ry, s, sy) => new THREE.Matrix4().compose(V(x, y, z), q.setFromEuler(e.set(0, ry, 0)), V(s, sy ?? s, s));
    const variantsOf = m => (m.meta.variants && m.meta.variants.length ? m.meta.variants : [null]);

    // árboles: los frondosos genéricos pasan a ser modelos reales; lapachos y palmeras se quedan
    const tm = await get(['island_tree_01', 'tree_small_02', 'island_tree_02'].filter(id => lib.meta(id)));
    if (tm.length) {
      const slots = tm.map(() => []); let n = 0;
      trees.forEach(t => { if (!t.k.startsWith('broad')) return; const k = n++ % tm.length, P = parts(tm[k].sc), s = clamp((5.6 + R() * 2.2) / P.size.y, 0.9, 1.8); slots[k].push(at(t.x, t.y - 0.05, t.z, t.ry, s)); t.meshes.forEach(m => { m.visible = false; }); });
      tm.forEach((m, k) => instanced(parts(m.sc), slots[k]));
    }
    // un jacarandá grande detrás de la casa (solo en equipos potentes)
    if (!low && lib.meta('jacaranda_tree')) {
      const a = Math.atan2(-(camDir ? camDir.z : 0.8), -(camDir ? camDir.x : 0.6)) + 0.5, rr = Math.max(hx, hz) + 13, x = Math.cos(a) * rr, z = Math.sin(a) * rr;
      if (!onPath(x, z, 6)) { const [j] = await get(['jacaranda_tree']); if (j) { const s = 0.42; trees.forEach(t => { if (t.meshes && Math.hypot(t.x - x, t.z - z) < 7) t.meshes.forEach(m => { m.visible = false; }); }); instanced(parts(j.sc), [at(x, gh(x, z) - 0.1, z, 0.7, s)]); } }
    }
    // arbustos
    const sm = await get(['bush_small_01', 'shrub_02', 'bush_large_01'].filter(id => lib.meta(id)));
    if (sm.length && shrubSpots.length) {
      const opts = []; sm.forEach(m => variantsOf(m).forEach(v => opts.push({ m, v, P: parts(m.sc, v) })));
      const slots = opts.map(() => []);
      shrubSpots.forEach((s, i) => { const k = i % opts.length, P = opts[k].P, target = 1.2 + R() * 1.1, sc = clamp(target / Math.max(P.size.x, P.size.z), 0.45, 1.6); slots[k].push(at(s.x, gh(s.x, s.z) - 0.03, s.z, R() * 6.28, sc)); });
      opts.forEach((o, k) => instanced(o.P, slots[k])); shrubIMs.forEach(im => { im.visible = false; });
    }
    // rocas
    const rm = await get(['rock_moss_set_01', 'namaqualand_boulder_02', 'namaqualand_boulder_05', 'coast_rocks_05'].filter(id => lib.meta(id)));
    if (rm.length && rocks.length) {
      const opts = []; rm.forEach(m => variantsOf(m).forEach(v => opts.push({ P: parts(m.sc, v) })));
      const slots = opts.map(() => []);
      rocks.forEach((r, i) => { const k = (i * 5) % opts.length, P = opts[k].P, sc = clamp((r.s * 2.4) / Math.max(P.size.x, P.size.z), 0.2, 1.5); slots[k].push(at(r.x, gh(r.x, r.z) - P.size.y * sc * 0.18, r.z, R() * 6.28, sc)); r.m.visible = false; });
      opts.forEach((o, k) => instanced(o.P, slots[k]));
    }
    if (low) return;
    // flores reales en lugar de las tarjetas de flores
    const fm = await get(['flower_gazania', 'flower_empodium'].filter(id => lib.meta(id)));
    if (fm.length && flowers) {
      const opts = []; fm.forEach(m => variantsOf(m).slice(0, 3).forEach(v => opts.push({ P: parts(m.sc, v) })));
      const slots = opts.map(() => []), sp = flowers.list.filter(f => !inHouse(f.x, f.z, 1.1));
      sp.slice(0, 130).forEach(f => { const k = Math.floor(R() * opts.length); slots[k].push(at(f.x, gh(f.x, f.z) - 0.01, f.z, R() * 6.28, 1.0 + R() * 0.6)); });
      opts.forEach((o, k) => instanced(o.P, slots[k], false)); flowers.im.visible = false;
    }
    // hierba real cerca de la casa; las tarjetas quedan sólo en la lejanía
    const gm = await get(['grass_medium_02', 'fern_02'].filter(id => lib.meta(id)));
    if (gm.length && tufts) {
      const opts = []; gm.forEach(m => variantsOf(m).filter(v => !v || !/tiny|small/.test(v)).slice(0, 4).forEach(v => opts.push({ P: parts(m.sc, v), fern: m.id === 'fern_02' })));
      const rH = Math.max(hx, hz), near = tufts.list.filter(t => t.r < rH + 11), far = tufts.list.filter(t => t.r >= rH + 11);
      far.forEach((t, i) => tufts.im.setMatrixAt(i, t.m)); tufts.im.count = far.length; tufts.im.instanceMatrix.needsUpdate = true; tufts.im.computeBoundingSphere();
      const slots = opts.map(() => []), cap = Math.min(near.length, 300);
      near.slice(0, cap).forEach((t, i) => { let k = i % opts.length; if (opts[k].fern && R() < 0.7) k = (k + 1) % opts.length; slots[k].push(at(t.x, gh(t.x, t.z) - 0.02, t.z, R() * 6.28, (opts[k].fern ? 0.6 : 1.1) + R() * 0.7)); });
      opts.forEach((o, k) => instanced(o.P, slots[k], false));
    }
  }
  return { group: G, gh, fixtures, setGround, upgrade };
}

// — cielo nocturno: estrellas y luna —
export function buildNight(T) {
  const G = new THREE.Group(), R = rng(99), n = 2600, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const u = R(), v = R() * 0.95 + 0.05, th = u * PI * 2, ph = Math.acos(v), r = 7000; pos[i * 3] = Math.sin(ph) * Math.cos(th) * r; pos[i * 3 + 1] = Math.cos(ph) * r; pos[i * 3 + 2] = Math.sin(ph) * Math.sin(th) * r; const b = 0.5 + R() * 0.5, w = R(); col[i * 3] = b * (0.85 + w * 0.15); col[i * 3 + 1] = b * 0.92; col[i * 3 + 2] = b * (1.05 - w * 0.1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const sm = new THREE.PointsMaterial({ size: 2.2, sizeAttenuation: false, map: T.stars, vertexColors: true, transparent: true, depthWrite: false, opacity: 0, fog: false, blending: THREE.AdditiveBlending });
  const stars = new THREE.Points(g, sm); stars.renderOrder = -1; stars.frustumCulled = false; G.add(stars);
  const mm = new THREE.SpriteMaterial({ map: T.moon, transparent: true, opacity: 0, fog: false, depthWrite: false }), moon = new THREE.Sprite(mm); moon.scale.setScalar(260); moon.renderOrder = -1; G.add(moon);
  return { group: G, set(f, moonDir) { sm.opacity = f; mm.opacity = Math.min(1, f * 1.2); moon.position.copy(moonDir).multiplyScalar(6500); G.visible = f > 0.01; } };
}
