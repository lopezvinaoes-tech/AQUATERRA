// Aquaterra · motor de render 3D (three.js r170 local). Construye la casa desde un plano «aq-plano» y permite recorrerla.
// Incluye: texturas PBR, entorno exterior, ciclo día/noche con luces por estancia, puertas que se abren y cierran,
// altura de techo editable en vivo y colocación de muebles que nunca atraviesa paredes.
import * as THREE from './vendor/three/three.module.min.js';
import { GLTFLoader } from './vendor/three/GLTFLoader.js';
import { OrbitControls } from './vendor/three/OrbitControls.js';
import { Sky } from './vendor/three/Sky.js';
import { EffectComposer } from './vendor/three/EffectComposer.js';
import { RenderPass } from './vendor/three/RenderPass.js';
import { UnrealBloomPass } from './vendor/three/UnrealBloomPass.js';
import { OutputPass } from './vendor/three/OutputPass.js';
import { mergeGeometries } from './vendor/three/BufferGeometryUtils.js';
import { analyze } from './aq-plan.js';
import { makeTextures, loadManifest, applyRealTextures } from './aq-r3d-mats.js';
import { buildExterior, buildNight, wind, windify } from './aq-r3d-env.js';

export const STEPS = ['Leyendo el plano', 'Terreno y cielo', 'Levantando muros', 'Puertas y ventanas', 'Suelos y techos', 'Muebles 3D', 'Amueblando', 'Luces y sombras'];
const BASE = new URL('.', import.meta.url).href;
// modelos 3D: cada hueco prueba sus candidatos en orden (assets/aq-assets.json + modelos ya incluidos)
const LEGACY = { sofa_03: {}, modern_coffee_table_01: { rot: 90 }, dining_chair_02: {}, round_wooden_table_01: {}, ClassicNightstand_01: {}, modern_ceiling_lamp_01: { hang: true }, wooden_display_shelves_01: { rot: -90 }, potted_plant_02: {} };
const PICK = {
  sofaL: ['sofa_03'], sofaM: ['sofa_02'], sofaS: ['sofa_2p_156'], armchair: ['modern_arm_chair_01', 'mid_century_lounge_chair'], ottoman: ['Ottoman_01'],
  coffee: ['coffee_table_round_01', 'modern_coffee_table_01'], coffeeR: ['modern_coffee_table_01'], chair: ['dining_chair_02'], table: ['round_wooden_table_01'], tableR: ['wooden_table_02'], stool: ['bar_chair_round_01'],
  night: ['side_table_01', 'ClassicNightstand_01'], bedD: ['bed_double_160'], bedS: ['bed_single_90'], wardL: ['wardrobe_150'], wardS: ['wardrobe_100'], dresser: ['drawer_cabinet'], sideboard: ['modern_wooden_cabinet'],
  shelf: ['wooden_display_shelves_01'], plant: ['calathea_orbifolia_01', 'potted_plant_02'], plantB: ['anthurium_botany_01', 'potted_plant_02'], plantS: ['potted_plant_04'], outdoor: ['outdoor_table_chair_set_01'],
  lamp: ['modern_ceiling_lamp_01'], pendant: ['lamp_pendant_01'], pendantI: ['hanging_industrial_lamp'], fan: ['ceiling_fan'], tlamp: ['lamp_table_01'], flamp: ['lamp_floor_01'], dlamp: ['desk_lamp_arm_01'],
  wallLamp: ['industrial_wall_lamp', 'industrial_wall_sconce'], street: ['street_lamp_01'], doorIn: ['door_interior_80'], doorEntry: ['door_entry_90']
};
const EXT_CATS = ['tree', 'shrub', 'hedge', 'grass', 'flower', 'rock', 'mountains'];
const EYE = 1.62, UP = new THREE.Vector3(0, 1, 0), PI = Math.PI, D2R = PI / 180;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const back = t => { const c = 1.4; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };
const angDiff = (a, b) => { let d = b - a; while (d > PI) d -= 2 * PI; while (d < -PI) d += 2 * PI; return d; };
const r2 = v => Math.round(v * 100) / 100;

function materials(T) {
  const S = o => new THREE.MeshStandardMaterial(o);
  const tex = (t, o = {}) => S(Object.assign({ map: t.map, normalMap: t.normalMap, roughnessMap: t.roughnessMap, roughness: 1 }, o));
  const foliage = (map, o = {}) => { const m = S(Object.assign({ map, alphaTest: 0.42, side: THREE.DoubleSide, roughness: 0.78 }, o)); return m; };
  const glow = (color, emissive, base, o = {}) => { const m = S(Object.assign({ color, emissive, emissiveIntensity: 0, roughness: 0.6 }, o)); m.userData.glow = base; return m; };
  const M = {
    paint: tex(T.paint), facade: tex(T.stucco), ceil: tex(T.paint, { color: 0xfbfaf7, normalScale: new THREE.Vector2(0.4, 0.4) }), roof: tex(T.roof),
    wallTile: tex(T.btile), wood: tex(T.wood), tile: tex(T.ktile), bathFloor: tex(T.ktile), deck: tex(T.deck), pavers: tex(T.pavers), sidewalk: tex(T.pavers), rug: S({ map: T.rug.map, roughness: 1 }),
    rock: tex(T.rock), bark: tex(T.bark), forest: S({ color: 0x9aa88a, roughness: 0.95 }),
    leaf: foliage(T.leaf), leaf2: foliage(T.leaf2), lapacho: foliage(T.lapacho), lapachoY: foliage(T.lapachoY), hibisco: foliage(T.hibisco), frond: foliage(T.frond),
    tuft: foliage(T.tuft, { alphaTest: 0.5, roughness: 0.9 }), flowers: foliage(T.flowers, { alphaTest: 0.5 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0xe2eff2, roughness: 0.03, metalness: 0, transparent: true, opacity: 0.16, depthWrite: false, envMapIntensity: 1.6 }),
    frame: S({ color: 0x2a2b2d, roughness: 0.38, metalness: 0.65 }), oak: tex(T.veneer), front: tex(T.veneer, { color: 0x7a5236 }),
    white: S({ color: 0xf3f1ec, roughness: 0.45 }), stone: S({ color: 0x3b3936, roughness: 0.25 }), steel: S({ color: 0xc7c9cb, roughness: 0.28, metalness: 1 }), brass: S({ color: 0xc9a46a, roughness: 0.3, metalness: 1 }),
    black: S({ color: 0x141517, roughness: 0.15, metalness: 0.2 }), ceramic: S({ color: 0xfbfbf9, roughness: 0.12 }), linen: S({ color: 0xe8e1d5, roughness: 1 }), fabric: S({ color: 0x9a8e7e, roughness: 1 }),
    pillow: S({ color: 0xf7f4ef, roughness: 1 }), accent: S({ color: 0xb8653a, roughness: 1 }), sage: S({ color: 0x7a8a5e, roughness: 0.95 }), duvet: S({ color: 0xece6dc, roughness: 1 }),
    mirror: S({ color: 0xffffff, roughness: 0.02, metalness: 1 }), dome: S({ color: 0x1d1e20, roughness: 0.35, metalness: 0.6, side: THREE.DoubleSide }), tv: S({ color: 0x0b0c0e, roughness: 0.08, metalness: 0.3 }),
    bulb: glow(0xfff6e8, 0xffe2b8, 6), shade: glow(0xf1e9dc, 0xffc98a, 1.4, { side: THREE.DoubleSide, roughness: 1 }), led: glow(0xffffff, 0xfff0d4, 3), glowOut: glow(0xfff3dc, 0xffd59a, 5), diffuser: glow(0xf7f5f0, 0xfff1dc, 3.5)
  };
  M.render = M.facade;
  M.bark.userData.span = 1;
  return M;
}
function boxGeo(w, h, d) {
  const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv, dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let k = 0; k < 4; k++) { const i = f * 4 + k; uv.setXY(i, uv.getX(i) * dims[f][0], uv.getY(i) * dims[f][1]); }
  g.translate(0, h / 2, 0); return g;
}
// UV en coordenadas de mundo (metros): la textura continúa entre tramos de muro y entre estancias
function worldUV(g, ox, oy, oz) {
  const p = g.attributes.position, n = g.attributes.normal, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i)), x = p.getX(i) + ox, y = p.getY(i) + oy, z = p.getZ(i) + oz;
    if (ay >= ax && ay >= az) uv.setXY(i, x, z); else if (ax >= az) uv.setXY(i, z * Math.sign(n.getX(i) || 1), y); else uv.setXY(i, -x * Math.sign(n.getZ(i) || 1), y);
  }
  return g;
}
function mesh(geo, mat, x = 0, y = 0, z = 0) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; return m; }
const add = (g, geo, mat, x, y, z) => { const m = mesh(geo, mat, x, y, z); g.add(m); return m; };
const cyl = (r, h, seg = 28, r2b) => { const g = new THREE.CylinderGeometry(r, r2b ?? r, h, seg); g.translate(0, h / 2, 0); return g; };
const sub = (ivs, a, b) => ivs.flatMap(([p, q]) => (b <= p || a >= q) ? [[p, q]] : [[p, a], [b, q]].filter(([x, y]) => y - x > 0.05));
const rounded = (w, h, d, r) => { const s = new THREE.Shape(), x = -w / 2, y = -d / 2; s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + d - r); s.quadraticCurveTo(x + w, y + d, x + w - r, y + d); s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: true, bevelThickness: Math.min(0.03, h / 4), bevelSize: Math.min(0.03, r / 2), bevelSegments: 3, curveSegments: 6 }); g.rotateX(-PI / 2); g.translate(0, 0, 0); g.computeVertexNormals(); return g; };

// — muebles e iluminación procedurales (frente hacia +Z, base en y=0) —
const F = {
  bed(M, W) {
    const g = new THREE.Group(), L = 2.05;
    add(g, boxGeo(W + 0.08, 0.28, L), M.oak, 0, 0.04, 0); add(g, boxGeo(W, 0.24, L - 0.06), M.pillow, 0, 0.32, 0.02);
    const du = add(g, rounded(W + 0.1, 0.09, L * 0.7, 0.06), M.duvet, 0, 0.52, L / 2 - L * 0.35); void du;
    add(g, rounded(W + 0.14, 0.06, 0.5, 0.04), M.accent, 0, 0.6, L / 2 - 0.4);
    const n = W > 1.2 ? 2 : 1; for (let i = 0; i < n; i++) add(g, rounded(W > 1.2 ? 0.62 : 0.7, 0.13, 0.4, 0.08), M.pillow, n > 1 ? (i ? 1 : -1) * W / 4 : 0, 0.56, -L / 2 + 0.32);
    add(g, rounded(W + 0.18, 1.0, 0.1, 0.04), M.fabric, 0, 0.12, -L / 2 - 0.05);
    return { g, w: W + 0.18, d: L + 0.1, h: 1.12 };
  },
  wardrobe(M, W) { const g = new THREE.Group(); add(g, boxGeo(W, 2.3, 0.6), M.white, 0, 0, 0); const n = Math.max(2, Math.round(W / 0.6)); for (let i = 1; i < n; i++) add(g, boxGeo(0.006, 2.24, 0.004), M.black, -W / 2 + i * W / n, 0.03, 0.301); for (let i = 0; i < n; i++) add(g, boxGeo(0.02, 0.35, 0.025), M.steel, -W / 2 + (i + 0.5) * W / n + (i % 2 ? -1 : 1) * (W / n / 2 - 0.06), 1.0, 0.31); return { g, w: W, d: 0.6, h: 2.3 }; },
  kitchen(M, L, upper, fridge) { const g = new THREE.Group(); let x0 = -L / 2; if (fridge) { add(g, boxGeo(0.66, 2.05, 0.64), M.steel, x0 + 0.33, 0, 0.01); x0 += 0.68; } const cl = L / 2 - x0, cx = (x0 + L / 2) / 2; add(g, boxGeo(cl, 0.1, 0.55), M.black, cx, 0, -0.02); add(g, boxGeo(cl, 0.76, 0.6), M.white, cx, 0.1, 0); add(g, boxGeo(cl + 0.02, 0.04, 0.63), M.stone, cx, 0.86, 0.015); for (let i = 1; i < Math.round(cl / 0.6); i++) add(g, boxGeo(0.005, 0.74, 0.004), M.black, x0 + i * cl / Math.round(cl / 0.6), 0.11, 0.301); add(g, boxGeo(0.58, 0.008, 0.5), M.black, cx - cl * 0.22, 0.9, 0); add(g, boxGeo(0.5, 0.012, 0.4), M.steel, cx + cl * 0.22, 0.895, 0); add(g, cyl(0.015, 0.3, 12), M.steel, cx + cl * 0.22, 0.9, -0.24); let led = null; if (upper) { add(g, boxGeo(cl, 0.72, 0.35), M.white, cx, 1.48, -0.125); led = add(g, boxGeo(cl - 0.1, 0.012, 0.03), M.led, cx, 1.465, 0.02); led.castShadow = false; } return { g, w: L, d: 0.63, h: 2.2, led: upper ? { x: cx, y: 1.4, z: 0.1, len: cl } : null }; },
  island(M, stools = true) { const g = new THREE.Group(); add(g, boxGeo(1.8, 0.88, 0.9), M.white, 0, 0, 0); add(g, boxGeo(1.95, 0.04, 1.05), M.stone, 0, 0.88, 0); if (stools) [-0.45, 0.45].forEach(x => { add(g, cyl(0.025, 0.62, 12), M.steel, x, 0.02, 0.85); add(g, cyl(0.2, 0.02), M.steel, x, 0, 0.85); add(g, cyl(0.19, 0.05), M.oak, x, 0.64, 0.85); }); return { g, w: 1.95, d: 1.05 + 0.4, h: 0.92 }; },
  tv(M) { const g = new THREE.Group(); add(g, boxGeo(1.8, 0.42, 0.42), M.oak, 0, 0.08, 0); [-0.8, 0.8].forEach(x => add(g, boxGeo(0.04, 0.08, 0.3), M.black, x, 0, 0)); add(g, boxGeo(0.3, 0.06, 0.18), M.black, 0, 0.5, -0.02); add(g, boxGeo(1.3, 0.76, 0.045), M.tv, 0, 0.56, -0.02); return { g, w: 1.8, d: 0.42, h: 1.32 }; },
  vanity(M) { const g = new THREE.Group(); add(g, boxGeo(0.8, 0.45, 0.46), M.oak, 0, 0.4, 0.02); add(g, boxGeo(0.82, 0.03, 0.5), M.ceramic, 0, 0.85, 0.02); add(g, cyl(0.17, 0.11), M.ceramic, 0, 0.88, 0.05); add(g, cyl(0.014, 0.22, 12), M.steel, 0, 0.88, -0.17); add(g, boxGeo(0.7, 0.8, 0.02), M.mirror, 0, 1.12, -0.23); const bar = add(g, boxGeo(0.6, 0.04, 0.05), M.diffuser, 0, 1.98, -0.22); bar.castShadow = false; return { g, w: 0.82, d: 0.5, h: 2.0, sconce: { x: 0, y: 1.9, z: 0 } }; },
  toilet(M) { const g = new THREE.Group(); const b = add(g, cyl(0.19, 0.4), M.ceramic, 0, 0, 0.06); b.scale.z = 1.35; add(g, boxGeo(0.36, 0.03, 0.46), M.white, 0, 0.4, 0.06); add(g, boxGeo(0.4, 0.42, 0.12), M.ceramic, 0, 0.3, -0.24); add(g, boxGeo(0.2, 0.14, 0.012), M.steel, 0, 1.0, -0.3); return { g, w: 0.42, d: 0.62, h: 0.75 }; },
  shower(M) { const g = new THREE.Group(); add(g, boxGeo(0.9, 0.05, 0.9), M.ceramic, 0, 0, 0); const gl = add(g, boxGeo(0.012, 2.0, 0.9), M.glass, 0.44, 0.05, 0); gl.castShadow = false; add(g, cyl(0.12, 0.012), M.steel, 0, 2.05, -0.15); add(g, boxGeo(0.02, 0.8, 0.02), M.steel, 0, 1.3, -0.44); return { g, w: 0.9, d: 0.9, h: 2.1 }; },
  desk(M) { const g = new THREE.Group(); add(g, boxGeo(1.4, 0.03, 0.7), M.oak, 0, 0.72, 0); [[-0.66, -0.31], [0.66, -0.31], [-0.66, 0.31], [0.66, 0.31]].forEach(([x, z]) => add(g, boxGeo(0.035, 0.72, 0.035), M.black, x, 0, z)); add(g, boxGeo(0.36, 0.015, 0.25), M.steel, 0.2, 0.75, 0.05); return { g, w: 1.4, d: 0.7, h: 0.75 }; },
  console(M) { const g = new THREE.Group(); add(g, boxGeo(1.0, 0.03, 0.34), M.oak, 0, 0.8, 0); [-0.46, 0.46].forEach(x => add(g, boxGeo(0.03, 0.8, 0.3), M.black, x, 0, 0)); return { g, w: 1.0, d: 0.34, h: 0.83 }; },
  washer(M) { const g = new THREE.Group(); [-0.31, 0.31].forEach(x => { add(g, boxGeo(0.6, 0.85, 0.6), M.white, x, 0, 0); const d = add(g, new THREE.CylinderGeometry(0.19, 0.19, 0.03, 28), M.black, x, 0.45, 0.3); d.rotation.x = PI / 2; }); add(g, boxGeo(1.24, 0.03, 0.62), M.stone, 0, 0.85, 0); return { g, w: 1.24, d: 0.62, h: 0.88 }; },
  rug(M, w, d) { const g = new THREE.Group(); const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), M.rug); p.rotation.x = -PI / 2; p.position.y = 0.006; p.receiveShadow = true; g.add(p); return { g, w, d, h: 0.01 }; },
  sofa(M, W) {
    const g = new THREE.Group(), D = 0.92;
    add(g, rounded(W, 0.42, D, 0.06), M.fabric, 0, 0.08, 0); add(g, rounded(W - 0.04, 0.5, 0.22, 0.08), M.fabric, 0, 0.42, -D / 2 + 0.13);
    [-1, 1].forEach(s => add(g, rounded(0.2, 0.62, D, 0.07), M.fabric, s * (W / 2 - 0.1), 0.06, 0));
    const n = W > 1.8 ? 3 : 2, cw = (W - 0.4) / n; for (let i = 0; i < n; i++) add(g, rounded(cw - 0.02, 0.13, D - 0.3, 0.06), M.linen, -W / 2 + 0.2 + cw * (i + 0.5), 0.5, 0.1);
    [-1, 1].forEach(s => [-1, 1].forEach(t => add(g, cyl(0.02, 0.08, 8), M.black, s * (W / 2 - 0.08), 0, t * (D / 2 - 0.08))));
    return { g, w: W, d: D, h: 0.9 };
  },
  fallback(M, k) { const g = new THREE.Group(); const b = { sofa: [2.1, 0.8, 0.9, M.linen], coffee: [1.1, 0.4, 0.6, M.oak], chair: [0.45, 0.85, 0.5, M.oak], table: [1.1, 0.75, 1.1, M.oak], night: [0.45, 0.55, 0.4, M.oak], shelf: [1.0, 1.8, 0.35, M.oak], plant: [0.5, 1.1, 0.5, M.sage], lamp: [0.4, 0.3, 0.4, M.shade] }[k]; add(g, boxGeo(b[0], b[1], b[2]), b[3], 0, k === 'lamp' ? -b[1] : 0, 0); return { g, w: b[0], d: b[2], h: b[1] }; },
  // luminarias: devuelven la posición local de la luz (lx, ly, lz)
  tableLamp(M) { const g = new THREE.Group(); add(g, cyl(0.07, 0.02, 20), M.brass, 0, 0, 0); add(g, cyl(0.06, 0.22, 20, 0.085), M.ceramic, 0, 0.02, 0); add(g, cyl(0.008, 0.12, 8), M.brass, 0, 0.24, 0); const sh = add(g, new THREE.CylinderGeometry(0.11, 0.15, 0.2, 28, 1, true).translate(0, 0.1, 0), M.shade, 0, 0.3, 0); sh.castShadow = false; const b = add(g, new THREE.SphereGeometry(0.035, 12, 8), M.bulb, 0, 0.38, 0); b.castShadow = false; return { g, w: 0.3, d: 0.3, h: 0.5, lx: 0, ly: 0.4, lz: 0 }; },
  floorLamp(M) { const g = new THREE.Group(); add(g, cyl(0.16, 0.025, 28), M.black, 0, 0, 0); add(g, cyl(0.014, 1.45, 10), M.black, 0, 0.02, 0); const sh = add(g, new THREE.CylinderGeometry(0.17, 0.22, 0.3, 32, 1, true).translate(0, 0.15, 0), M.shade, 0, 1.38, 0); sh.castShadow = false; const b = add(g, new THREE.SphereGeometry(0.04, 12, 8), M.bulb, 0, 1.5, 0); b.castShadow = false; return { g, w: 0.45, d: 0.45, h: 1.7, lx: 0, ly: 1.5, lz: 0 }; },
  pendant(M, drop) { const g = new THREE.Group(); add(g, cyl(0.06, 0.02, 20), M.black, 0, -0.02, 0); add(g, cyl(0.004, drop, 6), M.black, 0, -drop, 0); const sh = add(g, new THREE.SphereGeometry(0.22, 32, 12, 0, PI * 2, 0, PI / 2).scale(1, 0.75, 1), M.dome, 0, -drop - 0.02, 0); sh.castShadow = false; const b = add(g, new THREE.SphereGeometry(0.05, 12, 8), M.bulb, 0, -drop - 0.06, 0); b.castShadow = false; const ring = add(g, new THREE.CircleGeometry(0.205, 32).rotateX(PI / 2), M.diffuser, 0, -drop - 0.025, 0); ring.castShadow = false; return { g, w: 0.45, d: 0.45, h: drop + 0.2, lx: 0, ly: -drop - 0.15, lz: 0 }; },
  pendants3(M, drop, L) { const g = new THREE.Group(); add(g, boxGeo(L, 0.03, 0.08), M.black, 0, -0.03, 0); [-1, 0, 1].forEach(i => { add(g, cyl(0.004, drop, 6), M.black, i * L / 3, -drop, 0); const gl = add(g, new THREE.SphereGeometry(0.11, 24, 16), M.diffuser, i * L / 3, -drop - 0.1, 0); gl.castShadow = false; }); return { g, w: L, d: 0.25, h: drop + 0.2, lx: 0, ly: -drop - 0.2, lz: 0 }; },
  plafon(M, r = 0.2) { const g = new THREE.Group(); add(g, cyl(r, 0.03, 32), M.white, 0, -0.03, 0); const d = add(g, new THREE.CylinderGeometry(r - 0.02, r - 0.02, 0.012, 32), M.diffuser, 0, -0.036, 0); d.castShadow = false; return { g, w: r * 2, d: r * 2, h: 0.04, lx: 0, ly: -0.25, lz: 0 }; },
  lantern(M) { const g = new THREE.Group(); add(g, boxGeo(0.14, 0.04, 0.12), M.frame, 0, 0.3, -0.06); const gl = add(g, boxGeo(0.12, 0.24, 0.12), M.glowOut, 0, 0.06, 0); gl.castShadow = false; add(g, boxGeo(0.16, 0.03, 0.16), M.frame, 0, 0.3, 0); add(g, boxGeo(0.16, 0.03, 0.16), M.frame, 0, 0.03, 0); return { g, w: 0.16, d: 0.16, h: 0.35, lx: 0, ly: 0.18, lz: 0.15 }; }
};

export async function createViewer(el, input, cb = {}) {
  const low = matchMedia('(pointer:coarse)').matches || innerWidth < 800;
  const renderer = new THREE.WebGLRenderer({ antialias: !!low, preserveDrawingBuffer: false, powerPreference: 'high-performance' });
  const PR = Math.min(devicePixelRatio || 1, low ? 1.5 : 2);
  renderer.setPixelRatio(PR);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.8; renderer.outputColorSpace = THREE.SRGBColorSpace;
  const cv = renderer.domElement; cv.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;outline:none'; cv.tabIndex = 0; el.appendChild(cv);
  const scene = new THREE.Scene(); scene.background = new THREE.Color(0xdfe6ea);
  const camera = new THREE.PerspectiveCamera(60, 1, 0.05, 30000);
  const controls = new OrbitControls(camera, cv); controls.enableDamping = true; controls.maxPolarAngle = PI / 2 - 0.04; controls.autoRotate = true; controls.autoRotateSpeed = 0.7;
  controls.addEventListener('start', () => { controls.autoRotate = false; });
  // posprocesado: resplandor de las lámparas (bloom) en equipos de escritorio
  let composer = null, bloom = null;
  if (!low) {
    try {
      const rt = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 });
      composer = new EffectComposer(renderer, rt); composer.addPass(new RenderPass(scene, camera));
      bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.2, 0.55, 0.9); composer.addPass(bloom); composer.addPass(new OutputPass());
    } catch (e) { composer = null; bloom = null; renderer.dispose(); }
  }
  const resize = () => { const w = el.clientWidth || 1, h = el.clientHeight || 1; renderer.setSize(w, h, false); if (composer) { composer.setPixelRatio(PR); composer.setSize(w, h); } camera.aspect = w / h; camera.updateProjectionMatrix(); };
  const ro = new ResizeObserver(resize); ro.observe(el); resize();
  const draw = () => { if (composer) composer.render(); else renderer.render(scene, camera); };

  const anims = [];
  const anim = (ms, fn) => new Promise(res => anims.push({ t0: performance.now(), ms, fn, res }));
  const wait = ms => anim(ms, () => {});
  const prog = (step, f, extra) => cb.onProgress && cb.onProgress({ step, pct: Math.round(((step + clamp(f, 0, 1)) / STEPS.length) * 100), label: extra || STEPS[step] });

  let mode = 'orbit', tw = null, tour = null, dead = false, lift = 0, curRoom = null, mmFrame = 0;
  const P = { pos: new THREE.Vector3(), yaw: 0, pitch: 0 }, keys = new Set(), joy = { id: null, x: 0, y: 0, ox: 0, oy: 0 }, look = { id: null, x: 0, y: 0 };
  let solids = [], ceilings = [], rooms = [], an = null, plan = null, cx = 0, cz = 0, size = 12, center = new THREE.Vector3();

  // — texturas y materiales —
  prog(0, 0.1, 'Preparando texturas');
  await new Promise(r => setTimeout(r, 30));
  const T = makeTextures(low), M = materials(T); windify(M);
  const facadeKeys = { revoque: 'stucco', ladrillo: 'brick', piedra: 'stone' };
  let facade = 'revoque';
  const manifest = await loadManifest(BASE), REAL = {};
  if (manifest) applyRealTextures(BASE, manifest, {
    revoque: { ids: ['plastered_wall_02', 'white_plaster_02'], target: 0xe4d9c6 }, ladrillo: { ids: ['red_brick_03', 'brick_wall_001'] }, piedra: { ids: ['stacked_stone_wall'] },
    paint: { ids: ['painted_plaster_wall', 'white_plaster_02'], mats: [M.paint], target: 0xebe7e0, mapless: true }, ceil: { ids: ['white_plaster_02', 'painted_plaster_wall'], mats: [M.ceil], target: 0xf4f2ee, mapless: true },
    btile: { ids: ['long_white_tiles', 'square_tiles_03'], mats: [M.wallTile], target: 0xeeece6 }, bathFloor: { ids: ['marble_tiles', 'square_tiles_03'], mats: [M.bathFloor] }, ktile: { ids: ['floor_tiles_06', 'terrazzo_tiles'], mats: [M.tile] },
    wood: { ids: ['wood_floor', 'wooden_floor_02'], mats: [M.wood] }, deck: { ids: ['terracotta_floor_tiles', 'oak_wood_planks'], mats: [M.deck] }, roof: { ids: ['concrete'], mats: [M.roof] },
    path: { ids: ['brick_pavement', 'sandy_gravel'], mats: [M.pavers] }, sidewalk: { ids: ['brushed_concrete', 'concrete'], mats: [M.sidewalk] }, rock: { ids: ['rocky_terrain_02'], mats: [M.rock] },
    veneer: { ids: ['fine_grained_wood'], mats: [M.oak] }, front: { ids: ['fine_grained_wood'], mats: [M.front], tint: 0x8a5e3e }, fabric: { ids: ['fabric_pattern_07'], mats: [M.fabric], target: 0xa89c8a },
    stone: { ids: ['granite_tile'], mats: [M.stone] }, grass: { ids: ['grass_ground'], target: 0x5b6f36 }, terrainRock: { ids: ['rocky_terrain_02'] }
  }, renderer, (k, set) => { REAL[k] = set; if (k === facade) refreshFacade(); if ((k === 'grass' || k === 'terrainRock') && ext && ext.setGround) ext.setGround(k, set); });
  const setFacadeMat = k => { const t = REAL[k] || T[facadeKeys[k] || 'stucco']; M.facade.map = t.map; M.facade.normalMap = t.normalMap; M.facade.roughnessMap = t.roughnessMap; M.facade.color.copy(t.color || new THREE.Color(0xffffff)); if (t.roughnessMap) M.facade.roughness = 1; M.facade.needsUpdate = true; };
  const refreshFacade = () => setFacadeMat(facade);

  // — sol, luna, cielo y entorno —
  const sky = new Sky(); sky.scale.setScalar(10000); const su = sky.material.uniforms; su.turbidity.value = 5; su.rayleigh.value = 1.4; su.mieCoefficient.value = 0.004; su.mieDirectionalG.value = 0.8;
  const skyEnv = new Sky(); skyEnv.material = sky.material; skyEnv.scale.setScalar(10000); const envScene = new THREE.Scene(); envScene.add(skyEnv);
  const pmrem = new THREE.PMREMGenerator(renderer); let envRT = null, envDirty = true, envAt = 0;
  const sunDir = new THREE.Vector3(), moonDir = new THREE.Vector3();
  const sun = new THREE.DirectionalLight(0xfff1de, 3.2); sun.castShadow = true; sun.shadow.mapSize.set(low ? 1024 : 2048, low ? 1024 : 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
  const hemi = new THREE.HemisphereLight(0xdfeaf2, 0x8a7a62, 0.55);
  const night = buildNight(T); scene.add(night.group);
  scene.fog = new THREE.FogExp2(0xc5d3dc, 0.0011);
  let hour = cb.hour ?? 10.5, lightsMode = 'auto', lf = 0, lTarget = 0, dayF = 1;
  const fogDay = new THREE.Color(0xc4d2dc), fogDusk = new THREE.Color(0xd8a77e), fogNight = new THREE.Color(0x0b1222), tmpC = new THREE.Color();

  // — fondo precalculado: cerros y bosque lejano horneados en dos imágenes (fondo/aq-pano-0/1.webp) —
  // RGB = color con luz de mediodía (a mitad de intensidad) · A = 1 − 0,96 × niebla (0 = cielo)
  const PANO = { tanTop: 0.6249, tanBot: -0.0875, R: 4000, files: ['aq-pano-0.webp', 'aq-pano-1.webp'] };
  const panoU = { tint: { value: new THREE.Color(2, 2, 2) }, fogC: { value: new THREE.Color() } };
  let pano = null;
  const loadPano = () => cb.pano === false ? Promise.resolve(null) : Promise.all(PANO.files.map(f => new Promise(res => new THREE.TextureLoader().load(BASE + 'fondo/' + f, t => res(t), undefined, () => res(null))))).then(ts => ts.every(Boolean) ? ts : null);
  function makePano(ts) {
    const g = new THREE.Group(), N = 96;
    ts.forEach((t, k) => {
      t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
      const pos = [], uv = [], idx = [];
      for (let j = 0; j <= N; j++) { const a = (k + j / N) * PI, x = Math.cos(a) * PANO.R, z = Math.sin(a) * PANO.R; pos.push(x, PANO.tanBot * PANO.R, z, x, PANO.tanTop * PANO.R, z); uv.push(j / N, 0, j / N, 1); if (j < N) { const b = j * 2; idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); } }
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
      const mat = new THREE.ShaderMaterial({
        uniforms: { map: { value: t }, tint: panoU.tint, fogC: panoU.fogC }, side: THREE.DoubleSide, fog: false,
        vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: `uniform sampler2D map; uniform vec3 tint; uniform vec3 fogC; varying vec2 vUv;
          void main(){ vec4 t = texture2D(map, vUv); if (t.a < 0.02) discard; float f = clamp((1.0 - t.a) / 0.96, 0.0, 1.0);
            gl_FragColor = vec4(mix(t.rgb * tint, fogC, f), 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }`
      });
      const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = -1; g.add(m);
    });
    return g;
  }
  const panoP = loadPano();
  function applyTime() {
    const lat = -25.3 * D2R, dec = -9 * D2R, H = (hour - 12.25) * 15 * D2R;
    const E = -Math.cos(dec) * Math.sin(H), Nn = Math.sin(dec) * Math.cos(lat) - Math.cos(dec) * Math.sin(lat) * Math.cos(H), U = Math.sin(dec) * Math.sin(lat) + Math.cos(dec) * Math.cos(lat) * Math.cos(H);
    sunDir.set(E, U, -Nn).normalize(); moonDir.set(-sunDir.x * 0.7, Math.max(0.35, -sunDir.y), -sunDir.z * 0.7 + 0.25).normalize();
    const day = smooth(-0.1, 0.1, U), gold = 1 - smooth(0.04, 0.4, U); dayF = day;
    su.sunPosition.value.copy(sunDir); su.turbidity.value = 4 + gold * 6; su.rayleigh.value = 1.2 + gold * 1.6 + (1 - day) * 1.5; su.mieCoefficient.value = 0.004 + gold * 0.004;
    const sI = 3.4 * smooth(-0.02, 0.22, U), mI = 0.32 * (1 - smooth(-0.16, -0.02, U));
    if (sI >= mI) { sun.color.setHex(0xfff3e4).lerp(tmpC.setHex(0xff9a52), gold * 0.85); sun.intensity = sI; sun.position.copy(sunDir).multiplyScalar(size + 30); }
    else { sun.color.setHex(0x8fa6ff); sun.intensity = mI; sun.position.copy(moonDir).multiplyScalar(size + 30); }
    hemi.intensity = 0.12 + 0.26 * day; hemi.color.setHex(0x2a3a5c).lerp(tmpC.setHex(0xdfeaf2), day); hemi.groundColor.setHex(0x14120f).lerp(tmpC.setHex(0x8a7a62), day);
    scene.environmentIntensity = 0.04 + 0.34 * day;
    renderer.toneMappingExposure = 0.72 + (1 - day) * 0.34;
    scene.fog.color.copy(fogNight).lerp(fogDusk, smooth(-0.12, 0.02, U)).lerp(fogDay, smooth(0.05, 0.3, U));
    night.set(1 - smooth(-0.16, 0.0, U), moonDir);
    // el panorama se horneó a mediodía con media luz: se reescala y se tiñe como el sol y el cielo
    panoU.fogC.value.copy(scene.fog.color); panoU.tint.value.setRGB(0.05, 0.06, 0.1).lerp(tmpC.setRGB(1.8, 1.75, 1.7).lerp(new THREE.Color(1.9, 1.35, 0.95), gold * 0.7), smooth(-0.12, 0.25, U));
    if (bloom) { bloom.strength = 0.06 + 0.32 * (1 - day); bloom.threshold = 0.9 + 1.6 * day; }
    lTarget = lightsMode === 'on' ? 1 : lightsMode === 'off' ? 0 : (U < 0.14 ? 1 : 0);
    envDirty = true;
    cb.onTime && cb.onTime({ hour, day: U > 0, sunElevation: Math.round(Math.asin(clamp(U, -1, 1)) / D2R) });
  }
  function regenEnv() { if (envRT) envRT.dispose(); envRT = pmrem.fromScene(envScene, 0.02); scene.environment = envRT.texture; envDirty = false; envAt = performance.now(); }

  // — luces: reserva fija (no se recompilan sombreadores al cambiar) —
  const POOL = low ? 6 : 16, pool = [], LP = 0.32;
  for (let i = 0; i < POOL; i++) { const l = new THREE.PointLight(0xffd6a6, 0, 6, 2); l.userData.base = 0; pool.push(l); scene.add(l); }
  const glowMats = [M.bulb, M.shade, M.led, M.glowOut, M.diffuser];
  let fixtures = []; const fans = [];
  function assignLights() {
    const list = fixtures.slice().sort((a, b) => b.prio - a.prio);
    pool.forEach((l, i) => { const f = list[i]; if (!f) { l.userData.base = 0; l.intensity = 0; return; } l.position.copy(f.pos); l.color.setHex(f.color || 0xffd6a6); l.distance = f.dist || 6; l.userData.base = (f.power || 12) * LP; });
  }

  // — puertas —
  const doors = [], doorState = new Map();
  const doorKey = o => o.seg.o + o.seg.c + ':' + o.mid;
  const setDoorPose = d => { if (d.kind === 'slide') d.pane.position.x = d.closedX + (d.openX - d.closedX) * ease(d.a); else d.pv.rotation.y = d.maxA * ease(d.a); };
  function toggleDoor(d, v) { d.open = v === undefined ? !d.open : v; doorState.set(d.key, d.open); cb.onDoors && cb.onDoors(doorSummary()); }
  const doorSummary = () => ({ total: doors.length, open: doors.filter(d => d.open).length });

  const loop = () => {
    if (dead) return;
    const now = performance.now(), dt = Math.min(0.05, (now - (loop.t || now)) / 1000); loop.t = now;
    for (let i = anims.length - 1; i >= 0; i--) { const a = anims[i], k = clamp((now - a.t0) / a.ms, 0, 1); a.fn(k); if (k >= 1) { anims.splice(i, 1); a.res(); } }
    if (tw) stepTween(now); else if (tour) stepTour(dt); else if (mode === 'orbit') controls.update(); else stepWalk(dt);
    if (mode !== 'orbit' || tour) detectRoom();
    for (const d of doors) { const t = d.open ? 1 : 0; if (d.a !== t) { d.a = d.a < t ? Math.min(t, d.a + dt * 1.6) : Math.max(t, d.a - dt * 1.6); setDoorPose(d); } }
    if (lf !== lTarget) { lf += clamp(lTarget - lf, -dt * 1.5, dt * 1.5); }
    for (const l of pool) l.intensity = l.userData.base * lf;
    for (const m of glowMats) m.emissiveIntensity = m.userData.glow * lf;
    wind.value = now / 1000; if (pano) pano.position.copy(camera.position); for (const b of fans) b.rotation.y += dt * 2.4;
    if (envDirty && now - envAt > (low ? 400 : 160)) regenEnv();
    if (cb.minimap && ++mmFrame % 2 === 0) drawMinimap();
    draw();
  };
  renderer.setAnimationLoop(loop);

  // — utilidades de mundo —
  const wx = x => x - cx, wz = z => z - cz;
  const doorBlocks = (x, z, r) => doors.some(d => d.a < 0.6 && d.box && x > d.box[0] - r && x < d.box[1] + r && z > d.box[2] - r && z < d.box[3] + r);
  const collide = (x, z, r = 0.22) => solids.some(b => x > b[0] - r && x < b[1] + r && z > b[2] - r && z < b[3] + r) || doorBlocks(x, z, r);
  const roomAt = (x, z) => rooms.find(R => x + cx >= R.x && x + cx <= R.x + R.w && z + cz >= R.y && z + cz <= R.y + R.d) || null;
  const into = (o, R) => { const s = o.seg, sg = s.pos === R ? 1 : -1; return s.o === 'h' ? [0, sg] : [sg, 0]; };
  function viewOf(R) {
    const ctr = [R.x + R.w / 2, R.y + R.d / 2];
    const o = (an ? an.ops : []).find(o => o.rooms && o.rooms.includes(R) && o.kind !== 'window');
    let p = ctr;
    if (o) { const n = into(o, R); p = [o.x + n[0] * 0.9, o.y + n[1] * 0.9]; }
    for (let i = 0; i < 12 && collide(wx(p[0]), wz(p[1])); i++) p = [p[0] + (ctr[0] - p[0]) * 0.2, p[1] + (ctr[1] - p[1]) * 0.2];
    return { pos: new THREE.Vector3(wx(p[0]), EYE, wz(p[1])), look: new THREE.Vector3(wx(ctr[0]), 1.3, wz(ctr[1])) };
  }
  function tweenTo(pos, lookAt, ms = 1100, after) {
    const m = new THREE.Matrix4().lookAt(pos, lookAt, UP);
    tw = { p0: camera.position.clone(), q0: camera.quaternion.clone(), p1: pos.clone(), q1: new THREE.Quaternion().setFromRotationMatrix(m), t0: performance.now(), ms, after, look: lookAt.clone() };
  }
  function stepTween(now) {
    const k = ease(clamp((now - tw.t0) / tw.ms, 0, 1));
    camera.position.lerpVectors(tw.p0, tw.p1, k); camera.quaternion.slerpQuaternions(tw.q0, tw.q1, k);
    if (k >= 1) { const t = tw; tw = null; syncPlayer(); if (mode === 'orbit') { controls.target.copy(t.look); controls.update(); } if (t.after) t.after(); }
  }
  function syncPlayer() { const e = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ'); P.pos.copy(camera.position); P.yaw = e.y; P.pitch = e.x; }
  function applyPlayer() { camera.position.copy(P.pos); camera.rotation.set(P.pitch, P.yaw, 0, 'YXZ'); }
  function stepWalk(dt) {
    const f = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0) - joy.y;
    const r = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0) + joy.x;
    const run = keys.has('ShiftLeft') || keys.has('ShiftRight') ? 2 : 1, len = Math.hypot(f, r), k = len > 1 ? 1 / len : 1;
    const sy = Math.sin(P.yaw), cy = Math.cos(P.yaw);
    if (mode === 'walk') {
      const sp = 1.7 * run * dt * k, dx = (-sy * f + cy * r) * sp, dz = (-cy * f - sy * r) * sp;
      if (!collide(P.pos.x + dx, P.pos.z)) P.pos.x += dx;
      if (!collide(P.pos.x, P.pos.z + dz)) P.pos.z += dz;
      P.pos.y += (EYE + groundAt(P.pos.x, P.pos.z) - P.pos.y) * Math.min(1, dt * 6);
    } else {
      const sp = 3.2 * run * dt * k, cp = Math.cos(P.pitch);
      P.pos.x += (-sy * cp * f + cy * r) * sp; P.pos.z += (-cy * cp * f - sy * r) * sp; P.pos.y += Math.sin(P.pitch) * f * sp;
      const v = (keys.has('KeyE') || keys.has('Space') ? 1 : 0) - (keys.has('KeyQ') || keys.has('KeyC') ? 1 : 0) + lift;
      P.pos.y = clamp(P.pos.y + v * 2.4 * run * dt, groundAt(P.pos.x, P.pos.z) + 0.35, 80);
    }
    applyPlayer();
  }
  let ext = null; const groundAt = (x, z) => (roomAt(x, z) || !ext) ? 0 : Math.max(0, ext.gh(x, z) + 0.06);
  function detectRoom() { const R = roomAt(camera.position.x, camera.position.z); if (R !== curRoom) { curRoom = R; cb.onRoom && cb.onRoom(R ? { id: R.id, nombre: R.nombre, area: R.w * R.d, dbl: R.dbl } : null); } }

  // — entrada: teclado, ratón/táctil, clic en puertas —
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pickDoor(clientX, clientY) {
    const rc = cv.getBoundingClientRect(); ndc.set(((clientX - rc.left) / rc.width) * 2 - 1, -((clientY - rc.top) / rc.height) * 2 + 1);
    ray.setFromCamera(ndc, camera); ray.far = 60;
    for (const h of ray.intersectObjects([house], true)) {
      if (!h.object.visible) continue; let o = h.object; while (o && !o.userData.door) o = o.parent;
      if (o) return o.userData.door; if (h.object.material === M.glass) continue; return null;
    }
    return null;
  }
  function nearestDoor(maxD = 2.4) {
    const p = camera.position, f = new THREE.Vector3(); camera.getWorldDirection(f); let best = null, bs = Infinity;
    doors.forEach(d => { const dx = d.wx - p.x, dz = d.wz - p.z, dist = Math.hypot(dx, dz); if (dist > maxD) return; const facing = (dx * f.x + dz * f.z) / (dist || 1); const s = dist - facing * 0.8; if (facing > -0.2 && s < bs) { bs = s; best = d; } });
    return best;
  }
  const onKey = e => {
    if (/INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || '')) return;
    if (e.type === 'keydown') {
      if (mode !== 'orbit' && /^(Arrow|Space)/.test(e.code)) e.preventDefault(); keys.add(e.code); if (tour && /Key[WASD]|Arrow/.test(e.code)) api.stopTour();
      if (e.code === 'KeyF' && !e.repeat && mode !== 'orbit') { const d = nearestDoor(); if (d) toggleDoor(d); }
    } else keys.delete(e.code);
  };
  const ring = document.createElement('div'); ring.style.cssText = 'position:absolute;width:110px;height:110px;margin:-55px 0 0 -55px;border-radius:50%;border:2px solid rgba(255,255,255,.55);background:rgba(20,20,20,.18);pointer-events:none;display:none;z-index:3';
  const knob = document.createElement('div'); knob.style.cssText = 'position:absolute;left:50%;top:50%;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:50%;background:rgba(255,255,255,.85)'; ring.appendChild(knob);
  el.style.position = el.style.position || 'relative'; el.appendChild(ring);
  const click = { x: 0, y: 0, t: 0, id: null };
  const onDownAll = e => { click.x = e.clientX; click.y = e.clientY; click.t = performance.now(); click.id = e.pointerId; };
  const onUpAll = e => {
    if (e.pointerId !== click.id || Math.hypot(e.clientX - click.x, e.clientY - click.y) > 7 || performance.now() - click.t > 450 || tw) return;
    const d = pickDoor(e.clientX, e.clientY); if (d) toggleDoor(d);
  };
  let hoverT = 0;
  const onHover = e => { if (e.buttons || e.pointerType === 'touch') return; const now = performance.now(); if (now - hoverT < 90) return; hoverT = now; cv.style.cursor = pickDoor(e.clientX, e.clientY) ? 'pointer' : ''; };
  const onDown = e => {
    if (mode === 'orbit' || tw) return;
    if (tour) api.stopTour();
    const rc = cv.getBoundingClientRect(), lx = e.clientX - rc.left;
    if (e.pointerType === 'touch' && lx < rc.width * 0.45 && joy.id === null) { joy.id = e.pointerId; joy.ox = e.clientX; joy.oy = e.clientY; ring.style.display = 'block'; ring.style.left = lx + 'px'; ring.style.top = (e.clientY - rc.top) + 'px'; knob.style.transform = ''; }
    else if (look.id === null) { look.id = e.pointerId; look.x = e.clientX; look.y = e.clientY; }
    cv.setPointerCapture && cv.setPointerCapture(e.pointerId);
  };
  const onMove = e => {
    if (e.pointerId === joy.id) { let dx = (e.clientX - joy.ox) / 50, dy = (e.clientY - joy.oy) / 50; const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; } joy.x = dx; joy.y = dy; knob.style.transform = `translate(${dx * 32}px,${dy * 32}px)`; }
    else if (e.pointerId === look.id) { P.yaw -= (e.clientX - look.x) * 0.0045; P.pitch = clamp(P.pitch - (e.clientY - look.y) * 0.0038, -1.35, 1.35); look.x = e.clientX; look.y = e.clientY; }
  };
  const onUp = e => { if (e.pointerId === joy.id) { joy.id = null; joy.x = joy.y = 0; ring.style.display = 'none'; } if (e.pointerId === look.id) look.id = null; };
  addEventListener('keydown', onKey); addEventListener('keyup', onKey);
  cv.addEventListener('pointerdown', onDownAll, true); cv.addEventListener('pointerup', onUpAll, true); cv.addEventListener('pointermove', onHover);
  cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove); cv.addEventListener('pointerup', onUp); cv.addEventListener('pointercancel', onUp);
  const onBlur = () => keys.clear(); addEventListener('blur', onBlur);

  // — minimapa —
  let mm = null;
  const onMM = e => { const m = mm && mm._map; if (!m) return; const r = mm.getBoundingClientRect(), x = (e.clientX - r.left - m.ox) / m.s, y = (e.clientY - r.top - m.oy) / m.s; const R = rooms.find(R => x >= R.x && x <= R.x + R.w && y >= R.y && y <= R.y + R.d); if (R) api.goRoom(R.id); };
  function drawMinimap() {
    const el2 = typeof cb.minimap === 'function' ? cb.minimap() : cb.minimap; if (el2 !== mm) { if (mm) mm.removeEventListener('click', onMM); mm = el2; if (mm) mm.addEventListener('click', onMM); }
    if (!an || !mm) return;
    const dpr = devicePixelRatio || 1, W = mm.clientWidth, H = mm.clientHeight; if (!W) return;
    if (mm.width !== Math.round(W * dpr)) { mm.width = Math.round(W * dpr); mm.height = Math.round(H * dpr); }
    const g = mm.getContext('2d'), b = an.bounds, pad = 10, s = Math.min((W - pad * 2) / (b.x1 - b.x0), (H - pad * 2) / (b.y1 - b.y0));
    const ox = (W - (b.x1 - b.x0) * s) / 2 - b.x0 * s, oy = (H - (b.y1 - b.y0) * s) / 2 - b.y0 * s, X = x => ox + x * s, Y = y => oy + y * s;
    mm._map = { ox, oy, s };
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    rooms.forEach(R => { g.fillStyle = R === curRoom ? '#f0c9a6' : (R.tipo === 'terraza' ? '#c6d1b1' : '#f4ede1'); g.fillRect(X(R.x), Y(R.y), R.w * s, R.d * s); });
    g.lineCap = 'butt'; g.strokeStyle = '#2d2924';
    an.segs.forEach(sg => { g.lineWidth = Math.max(1.5, sg.t * s); g.beginPath(); if (sg.o === 'h') { g.moveTo(X(sg.a), Y(sg.c)); g.lineTo(X(sg.b), Y(sg.c)); } else { g.moveTo(X(sg.c), Y(sg.a)); g.lineTo(X(sg.c), Y(sg.b)); } g.stroke(); });
    (an.free || []).forEach(sg => { g.lineWidth = Math.max(1.5, sg.t * s); g.beginPath(); g.moveTo(X(sg.x1), Y(sg.y1)); g.lineTo(X(sg.x2), Y(sg.y2)); g.stroke(); });
    an.ops.forEach(o => { const sg = o.seg, d = doors.find(d => d.o === o), shut = d && d.a < 0.5; g.strokeStyle = o.kind === 'window' ? '#8db3c2' : shut ? '#8a6a4a' : (o.kind === 'entry' ? '#c67139' : '#f4ede1'); g.lineWidth = Math.max(2, sg.t * s + 1); g.beginPath(); if (sg.free) { g.moveTo(X(sg.x1 + sg.ux * o.s), Y(sg.y1 + sg.uy * o.s)); g.lineTo(X(sg.x1 + sg.ux * o.e), Y(sg.y1 + sg.uy * o.e)); } else if (sg.o === 'h') { g.moveTo(X(o.s), Y(sg.c)); g.lineTo(X(o.e), Y(sg.c)); } else { g.moveTo(X(sg.c), Y(o.s)); g.lineTo(X(sg.c), Y(o.e)); } g.stroke(); });
    const px = X(camera.position.x + cx), py = Y(camera.position.z + cz), e = new THREE.Euler().setFromQuaternion(camera.quaternion, 'YXZ'), a = -e.y - PI / 2;
    g.fillStyle = 'rgba(198,113,57,.25)'; g.beginPath(); g.moveTo(px, py); g.arc(px, py, 26, a - 0.5, a + 0.5); g.fill();
    g.fillStyle = '#c67139'; g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(px, py, 5, 0, PI * 2); g.fill(); g.stroke();
  }

  // — modelos 3D —
  const loaded = {}, metaOf = id => (manifest && manifest.models && manifest.models[id]) || LEGACY[id] || null;
  const fileOf = (id, m) => m && m.file ? `${BASE}assets/${m.file}` : `${BASE}assets/models/${id}/${id}.gltf.json`;
  const gltf = new GLTFLoader(), gcache = new Map();
  const loadId = id => { if (!gcache.has(id)) gcache.set(id, new Promise(res => gltf.load(fileOf(id, metaOf(id)), g => res(g.scene), undefined, () => res(null)))); return gcache.get(id); };
  // las bombillas y pantallas de los modelos se iluminan al encender las luces
  const glowify = sc => sc.traverse(o => {
    if (!o.isMesh) return; const n = (o.name + ' ' + (o.material && o.material.name || '')).toLowerCase();
    const bulb = /bombilla|bulb|light_bulb|foco/.test(n), shade = /pantalla_int|cupula_int|shade_in|difus|glass|cristal|vidrio/.test(n);
    if (!bulb && !shade) return; const m = o.material.clone(); m.emissive = new THREE.Color(bulb ? 0xffe2b8 : 0xffc98a); m.emissiveIntensity = 0; m.userData.glow = bulb ? 7 : 1.2; o.material = m; glowMats.push(m); o.castShadow = false;
  });
  const loadModels = onP => {
    const want = Object.entries(PICK).map(([slot, ids]) => [slot, ids.find(id => metaOf(id))]).filter(q => q[1]);
    let done = 0; if (!want.length) return Promise.resolve();
    return Promise.all(want.map(([slot, id]) => loadId(id).then(sc => { if (sc) { const m = metaOf(id) || {}; if (/lamp|sconce|street|fan/.test(slot + ' ' + (m.cat || ''))) glowify(sc); loaded[slot] = { sc, meta: m, id }; } onP(++done / want.length); })));
  };
  let vr = 1; const vrand = () => (vr = (vr * 16807) % 2147483647) / 2147483647;
  function inst(k, opt = {}) {
    const L = loaded[k]; if (!L) { const fb = { sofaL: 'sofa', coffee: 'coffee', coffeeR: 'coffee', chair: 'chair', table: 'table', night: 'night', shelf: 'shelf', plant: 'plant', plantB: 'plant', lamp: 'lamp' }[k]; return fb ? F.fallback(M, fb) : null; }
    const o = L.sc.clone(true), meta = L.meta, vs = meta.variants;
    if (vs && vs.length) { const keep = vs[(opt.v ?? Math.floor(vrand() * vs.length)) % vs.length]; vs.forEach(n => { if (n === keep) return; const x = o.getObjectByName(n); if (x && x.parent) x.parent.remove(x); }); }
    o.position.set(0, 0, 0); o.rotation.set(0, (meta.rot || 0) * D2R, 0); o.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(o), c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3());
    o.position.set(-c.x, meta.hang ? -box.max.y : -box.min.y, -c.z); o.updateMatrixWorld(true);
    // sólo proyectan sombra las piezas grandes (manillas, tornillos o cojines pequeños no se notan y cuestan una llamada de dibujo más)
    const ws = new THREE.Vector3(); o.traverse(m => { if (m.isMesh) { if (!m.geometry.boundingSphere) m.geometry.computeBoundingSphere(); m.getWorldScale(ws); const big = m.geometry.boundingSphere.radius * Math.max(ws.x, ws.y, ws.z) > 0.14; m.castShadow = big && !(m.material && m.material.userData && m.material.userData.glow); m.receiveShadow = true; } });
    const g = new THREE.Group(); g.userData.model = true; g.add(o); g.updateMatrixWorld(true);
    const it = { g, w: s.x, d: s.z, h: s.y, model: true, meta, root: o };
    let lp = null; if (meta.light === 'node:light' || meta.light === undefined) { const n = o.getObjectByName('light'); if (n) lp = n.getWorldPosition(new THREE.Vector3()); } else if (Array.isArray(meta.light)) lp = new THREE.Vector3(...meta.light).applyMatrix4(o.matrixWorld);
    if (lp) { it.lx = lp.x; it.ly = lp.y; it.lz = lp.z; }
    return it;
  }
  const has = k => !!loaded[k];
  const sizeOf = k => { const L = loaded[k]; if (!L) return null; const sz = L.meta.size; if (sz) { const r = Math.abs(Math.sin((L.meta.rot || 0) * D2R)) > 0.5; return { w: r ? sz[2] : sz[0], h: sz[1], d: r ? sz[0] : sz[2] }; } const it = inst(k); return { w: it.w, h: it.h, d: it.d }; };

  // — construcción —
  const world = new THREE.Group(), house = new THREE.Group(), furn = new THREE.Group(); world.add(house, furn); scene.add(world);
  let items = [];
  // contexto de encaje por estancia: interior útil y huellas ocupadas (muebles y barrido de puertas)
  let ctx = null;
  const fpOf = (w, d, x, z, ry) => { const c = Math.abs(Math.cos(ry)), s = Math.abs(Math.sin(ry)), hw = (w * c + d * s) / 2, hd = (w * s + d * c) / 2; return [x - hw, x + hw, z - hd, z + hd]; };
  const over = (a, b, t = 0.015) => a[0] < b[1] - t && a[1] > b[0] + t && a[2] < b[3] - t && a[3] > b[2] + t;
  // une las piezas de un mueble procedural que comparten material: muchas menos llamadas de dibujo
  function compact(g) {
    g.updateMatrixWorld(true); const inv = g.matrixWorld.clone().invert(), buckets = new Map();
    g.traverse(m => { if (!m.isMesh || m.isInstancedMesh || Array.isArray(m.material) || !m.geometry.index) return; const k = m.material.uuid + '|' + Object.keys(m.geometry.attributes).sort().join(',') + '|' + m.castShadow; if (!buckets.has(k)) buckets.set(k, []); buckets.get(k).push(m); });
    buckets.forEach(list => {
      if (list.length < 2) return; const geos = list.map(m => m.geometry.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld))), merged = mergeGeometries(geos); geos.forEach(q => q.dispose()); if (!merged) return;
      const n = new THREE.Mesh(merged, list[0].material); n.castShadow = list[0].castShadow; n.receiveShadow = true;
      list.forEach(m => { m.parent.remove(m); if (!m.userData.shared) m.geometry.dispose(); }); g.add(n);
    });
  }
  function place(it, x, z, ry, solid, y = 0, o = {}) {
    if (!it.model && !it.packed) { try { compact(it.g); } catch (e) { /* se queda sin unir */ } it.packed = true; }
    if (it.w0 === undefined) { it.w0 = it.w; it.d0 = it.d; it.h0 = it.h; }
    if (!o.keepScale) { const s0 = o.scale || 1; it.w = it.w0 * s0; it.d = it.d0 * s0; it.h = (it.h0 || 0) * s0; it.g.scale.setScalar(s0); }
    if (ctx && !o.free) {
      const I = ctx.inner; let fp = fpOf(it.w, it.d, x, z, ry); const fw = fp[1] - fp[0], fd = fp[3] - fp[2], iw = I[1] - I[0], id = I[3] - I[2];
      if (fw > iw || fd > id) { const s = Math.min(iw / fw, id / fd) * 0.99; if (it.g.scale.x * s < (o.minScale ?? 0.8)) return null; it.g.scale.multiplyScalar(s); it.w *= s; it.d *= s; if (it.h) it.h *= s; fp = fpOf(it.w, it.d, x, z, ry); }
      const dx = Math.max(0, I[0] - fp[0]) - Math.max(0, fp[1] - I[1]), dz = Math.max(0, I[2] - fp[2]) - Math.max(0, fp[3] - I[3]);
      x += dx; z += dz; fp = [fp[0] + dx, fp[1] + dx, fp[2] + dz, fp[3] + dz];
      if (!o.rug && ctx.occ.some(q => !(o.ignore && o.ignore.includes(q)) && !(q.tag === 'door' && o.overDoor) && over(fp, q.b))) return null;
      if (!o.rug && y < 1.6) { const rec = { b: fp, tag: o.tag || 'f' }; ctx.occ.push(rec); it.rec = rec; }
    }
    it.g.position.set(wx(x), y, wz(z)); it.g.rotation.y = ry; it.g.visible = false; furn.add(it.g); items.push({ g: it.g, y }); it.x = x; it.z = z; it.ry = ry;
    if (solid) { const fp = fpOf(it.w, it.d, x, z, ry); solids.push([wx(fp[0]), wx(fp[1]), wz(fp[2]), wz(fp[3])]); }
    return it;
  }
  const IN = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] }, RY = { N: 0, S: PI, W: PI / 2, E: -PI / 2 }, OPP = { N: 'S', S: 'N', W: 'E', E: 'W' };
  function sidesOf(R) {
    const defs = { N: ['h', R.y, 'pos', R.x, R.x + R.w], S: ['h', r2(R.y + R.d), 'neg', R.x, R.x + R.w], W: ['v', R.x, 'pos', R.y, R.y + R.d], E: ['v', r2(R.x + R.w), 'neg', R.y, R.y + R.d] }, sd = {};
    for (const k in defs) { const [o, c, side, lo, hi] = defs[k], pass = [], win = []; let t = 0.12, glass = 0, any = false; an.segs.forEach(s => { if (s.o !== o || Math.abs(s.c - c) > 1e-6 || s[side] !== R) return; any = true; t = Math.max(t, s.t); s.ops.forEach(op => { (op.kind === 'window' ? win : pass).push([op.s, op.e]); if (op.kind === 'window' || op.kind === 'slide') glass += op.e - op.s; }); }); sd[k] = { k, c, lo, hi, t: any ? t : 0.04, pass, win, glass }; }
    const near = 1.05;
    [['N', R.y, R.y + near], ['S', R.y + R.d - near, R.y + R.d]].forEach(([k, z0, z1]) => { sd.W.pass.forEach(([s, e]) => { if (e > z0 && s < z1) sd[k].pass.push([R.x, R.x + near]); }); sd.E.pass.forEach(([s, e]) => { if (e > z0 && s < z1) sd[k].pass.push([R.x + R.w - near, R.x + R.w]); }); });
    [['W', R.x, R.x + near], ['E', R.x + R.w - near, R.x + R.w]].forEach(([k, x0, x1]) => { sd.N.pass.forEach(([s, e]) => { if (e > x0 && s < x1) sd[k].pass.push([R.y, R.y + near]); }); sd.S.pass.forEach(([s, e]) => { if (e > x0 && s < x1) sd[k].pass.push([R.y + R.d - near, R.y + R.d]); }); });
    for (const k in sd) { const S = sd[k]; let low = [[S.lo + S.t / 2 + 0.02, S.hi - S.t / 2 - 0.02]]; S.pass.forEach(([a, b]) => { low = sub(low, a - 0.15, b + 0.15); }); let tall = low; S.win.forEach(([a, b]) => { tall = sub(tall, a - 0.05, b + 0.05); }); S.low = low; S.tall = tall; }
    return sd;
  }
  const depthOf = (R, sd, k) => (k === 'N' || k === 'S') ? R.d - (sd.N.t + sd.S.t) / 2 : R.w - (sd.W.t + sd.E.t) / 2;
  function cands(R, sd, tall, need, excl = [], depth = 0) {
    const out = [];
    for (const k in sd) { if (excl.includes(k) || depthOf(R, sd, k) < depth) continue; (tall ? sd[k].tall : sd[k].low).forEach(iv => { const L = iv[1] - iv[0]; if (L >= need) out.push({ k, iv, L }); }); }
    return out.sort((a, b) => b.L - a.L);
  }
  const best = (sd, tall, need, excl = []) => { let r = null; for (const k in sd) { if (excl.includes(k)) continue; (tall ? sd[k].tall : sd[k].low).forEach(iv => { const L = iv[1] - iv[0]; if (L >= need && (!r || L > r.L)) r = { k, iv, L }; }); } return r; };
  function against(R, sd, k, iv, it, at, solid = true, gap = 0.02, o = {}) {
    const S = sd[k], L = iv[1] - iv[0]; if (it.w0 === undefined) { it.w0 = it.w; it.d0 = it.d; it.h0 = it.h; }
    const dep = depthOf(R, sd, k) - 0.05, sc = Math.min(1, L / it.w0, dep / it.d0);
    if (sc < (o.minScale ?? 0.8)) return null;
    const w = it.w0 * sc, d = it.d0 * sc;
    let along = at ?? (iv[0] + iv[1]) / 2; along = clamp(along, iv[0] + w / 2, iv[1] - w / 2);
    const off = S.t / 2 + gap + d / 2, n = IN[k];
    const x = k === 'N' || k === 'S' ? along : S.c + n[0] * off, z = k === 'N' || k === 'S' ? S.c + n[1] * off : along;
    const p = place(it, x, z, RY[k], solid, 0, Object.assign({}, o, { scale: sc, minScale: o.minScale ?? 0.8 })); if (!p) return null;
    const a2 = k === 'N' || k === 'S' ? p.x : p.z;
    S.low = sub(S.low, a2 - p.w / 2 - 0.05, a2 + p.w / 2 + 0.05); S.tall = sub(S.tall, a2 - p.w / 2 - 0.05, a2 + p.w / 2 + 0.05);
    return { x: p.x, z: p.z, n, it: p, k };
  }
  // prueba cada pared libre (de la más larga a la más corta) hasta que el mueble quepa sin chocar con nada
  function tryWalls(R, sd, { tall = false, need = 0, excl = [], depth = 0, at, gap, solid = true, minScale } = {}, make) {
    for (const c of cands(R, sd, tall, need, excl, depth)) { const it = make(c); if (!it) continue; const p = against(R, sd, c.k, c.iv, it, at ? at(c) : undefined, solid, gap, { minScale }); if (p) return p; }
    return null;
  }
  const W2 = (R, x, z) => new THREE.Vector3(wx(x), 0, wz(z));
  function addFixture(R, it, x, z, y, ry, o = {}) {
    const p = place(it, x, z, ry, false, y, { free: true, scale: o.scale }); if (!p) return null;
    const c = Math.cos(ry), s = Math.sin(ry), lx = (it.lx || 0) * p.g.scale.x, lz = (it.lz || 0) * p.g.scale.x;
    const pos = W2(R, x + lx * c + lz * s, z - lx * s + lz * c); pos.y = y + (it.ly || 0) * p.g.scale.y;
    fixtures.push({ pos, prio: o.prio ?? 5, power: o.power ?? 14, dist: o.dist ?? 5, color: o.color ?? 0xffd2a0, room: R });
    return p;
  }
  // primer modelo de la lista que entra en el largo (y fondo) disponibles
  const pickFit = (keys, L, D = 99) => keys.find(k => { const s = sizeOf(k); return s && s.w <= L && s.d <= D; });
  // local (x, z) de un mueble girado ry → planta
  const rot = (x, z, ry) => [x * Math.cos(ry) + z * Math.sin(ry), -x * Math.sin(ry) + z * Math.cos(ry)];
  // lámpara colgante de modelo: alarga el cable hasta que el borde inferior quede a 'bottom' m del suelo
  function hangLamp(R, k, x, z, bottom, o = {}) {
    if (!has(k)) return null; const it = inst(k), room = R.h - bottom; if (room < 0.25) return null;
    const s = Math.min(1, room / it.h), ext = Math.max(0, room - it.h * s);
    if (ext > 0.03) {
      const e = ext / s, cord = mesh(new THREE.CylinderGeometry(0.004 / s, 0.004 / s, e, 6).translate(0, e / 2, 0), M.black, 0, 0, 0); cord.castShadow = false; it.g.add(cord);
      const top = it.root.getObjectByName('florón') || it.root.getObjectByName('floron'); if (top) top.position.y += e; else { const cp = mesh(new THREE.CylinderGeometry(0.05 / s, 0.05 / s, 0.025 / s, 20), M.black, 0, e - 0.0125 / s, 0); it.g.add(cp); }
    }
    return addFixture(R, it, x, z, R.h - ext, o.ry || 0, Object.assign({ scale: s }, o));
  }
  function ceilingLight(R, kind, at) {
    const x = at ? at[0] : R.x + R.w / 2, z = at ? at[1] : R.y + R.d / 2, A = R.w * R.d, dist = Math.hypot(R.w, R.d) * 0.62 + 1.2;
    const power = clamp(6 + A * 1.0, 8, 40) * (R.dbl ? 1.8 : 1), prio = 10 + Math.min(A, 40) / 4 + (R.dbl ? 3 : 0);
    if (kind === 'model' && has('lamp')) {
      const it = inst('lamp'), drop = Math.min(it.h, R.h - 2.0); if (drop >= 0.35) { const s = drop / it.h; const p = place(it, x, z, 0, false, R.h, { free: true, scale: s }); if (p) { fixtures.push({ pos: W2(R, x, z).setY(R.h - drop * 0.8), prio, power, dist, room: R }); return; } }
    }
    if (kind === 'pendant' || kind === 'model') { if (hangLamp(R, R.h > 3.3 ? 'pendantI' : 'pendant', x, z, Math.max(2.05, R.h - 1.0), { prio, power, dist })) return; const drop = clamp(R.h - 2.25, 0.25, R.dbl ? 2.6 : 0.9), it = F.pendant(M, drop); addFixture(R, it, x, z, R.h, 0, { prio, power, dist }); return; }
    addFixture(R, F.plafon(M, A > 12 ? 0.25 : 0.19), x, z, R.h, 0, { prio, power: power * 0.9, dist });
  }
  // ventilador de techo (dormitorios) con plafón desplazado; si no entra, lámpara normal
  function fanAndLight(R) {
    const cX = R.x + R.w / 2, cZ = R.y + R.d / 2, alongX = R.w >= R.d, half = (alongX ? R.w : R.d) / 2;
    if (has('fan') && R.h >= 2.45 && Math.min(R.w, R.d) >= 2.4 && half >= 1.35) {
      const it = inst('fan'), p = place(it, cX, cZ, 0, false, R.h, { free: true });
      if (p) { const b = it.root.getObjectByName('ceiling_fan_blades'); if (b) fans.push(b); ceilingLight(R, 'plafon', alongX ? [cX + 1.1, cZ] : [cX, cZ + 1.1]); return; }
    }
    ceilingLight(R, 'model');
  }
  function furnish(R) {
    const sd = sidesOf(R), cX = R.x + R.w / 2, cZ = R.y + R.d / 2, t = R.tipo;
    const tN = sd.N.t / 2 + 0.01, tS = sd.S.t / 2 + 0.01, tW = sd.W.t / 2 + 0.01, tE = sd.E.t / 2 + 0.01;
    ctx = { R, inner: [R.x + tW, R.x + R.w - tE, R.y + tN, R.y + R.d - tS], occ: [] };
    // barrido de puertas y pasos libres: ningún mueble puede ocuparlos
    an.ops.forEach(o => {
      if (o.kind === 'window' || !(o.rooms && o.rooms.includes(R))) return; const n = into(o, R), s = o.seg;
      const dep = o.kind === 'door' ? o.w + 0.1 : o.kind === 'entry' ? 1.2 : o.kind === 'slide' ? 0.8 : 0.55;
      const a0 = o.s - 0.05, a1 = o.e + 0.05, c0 = s.c, c1 = s.c + (s.o === 'h' ? n[1] : n[0]) * dep;
      ctx.occ.push({ tag: 'door', b: s.o === 'h' ? [a0, a1, Math.min(c0, c1), Math.max(c0, c1)] : [Math.min(c0, c1), Math.max(c0, c1), a0, a1] });
    });
    // paredes libres que cruzan la estancia: ningún mueble se mete en ellas ni delante de sus puertas
    (an.free || []).forEach(s => {
      for (let u = 0; u <= s.len + 1e-6; u += 0.2) { const x = s.x1 + s.ux * u, z = s.y1 + s.uy * u; if (x < R.x - 0.2 || x > R.x + R.w + 0.2 || z < R.y - 0.2 || z > R.y + R.d + 0.2) continue; ctx.occ.push({ tag: 'wall', b: [x - 0.12, x + 0.12, z - 0.12, z + 0.12] }); }
      s.ops.forEach(o => { const r = o.w / 2 + 0.6; ctx.occ.push({ tag: 'door', b: [o.x - r, o.x + r, o.y - r, o.y + r] }); });
    });
    const plant = (where = 'end', k = 'plant') => tryWalls(R, sd, { need: 0.6, at: c => where === 'end' ? c.iv[1] - 0.35 : c.iv[0] + 0.35, gap: 0.12, minScale: 0.6 }, () => inst(has(k) ? k : 'plant'));
    const isNS = k => k === 'N' || k === 'S';
    if (t === 'salon') {
      const mkSofa = c => { const k = pickFit(['sofaL', 'sofaM', 'sofaS'], c.L - 0.1); if (k) return inst(k); return F.sofa(M, clamp(c.L - 0.25, 1.4, 2.3)); };
      const s1 = tryWalls(R, sd, { need: 1.55, depth: 1.6, minScale: 0.85 }, mkSofa);
      if (s1) {
        const sofa = s1.it, d2 = depthOf(R, sd, s1.k);
        if (d2 >= sofa.d + 1.8) {
          const big = sofa.w >= 1.9 && d2 >= sofa.d + 2.7;
          for (const k of (big ? ['coffee', 'coffeeR'] : ['coffeeR', 'coffee'])) {
            const tb = inst(k), dist = sofa.d / 2 + 0.42 + tb.d / 2, tx = s1.x + s1.n[0] * dist, tz = s1.z + s1.n[1] * dist, p = place(tb, tx, tz, RY[s1.k], true, 0, { minScale: 0.7 }); if (!p) continue;
            place(F.rug(M, Math.min(sofa.w + 0.6, 2.8), Math.min(2.0, d2 - 0.6)), s1.x + s1.n[0] * (dist - 0.1), s1.z + s1.n[1] * (dist - 0.1), RY[s1.k], false, 0, { rug: true });
            // butaca a un lado de la mesa, mirando hacia ella
            if (has('armchair')) for (const sg of [1, -1]) { const a = inst('armchair'), off = p.w / 2 + 0.3 + a.d / 2, x = isNS(s1.k) ? p.x + sg * off : p.x, z = isNS(s1.k) ? p.z : p.z + sg * off; if (place(a, x, z, Math.atan2(p.x - x, p.z - z), true, 0, { minScale: 0.85, tag: 'chair' })) break; }
            break;
          }
        }
        const o = OPP[s1.k]; if (d2 >= sofa.d + 2.2) tryWalls(R, sd, { need: 1.9, excl: ['N', 'S', 'W', 'E'].filter(k => k !== o), at: c => isNS(s1.k) ? clamp(s1.x, c.iv[0] + 0.95, c.iv[1] - 0.95) : clamp(s1.z, c.iv[0] + 0.95, c.iv[1] - 0.95) }, () => F.tv(M));
        // lámpara de pie junto al sofá
        const along = isNS(s1.k) ? s1.x : s1.z;
        for (const sg of [1, -1]) { const fl = has('flamp') ? inst('flamp') : F.floorLamp(M), a = along + sg * (sofa.w / 2 + 0.3), x = isNS(s1.k) ? a : s1.x - s1.n[0] * (sofa.d / 2 - 0.25), z = isNS(s1.k) ? s1.z - s1.n[1] * (sofa.d / 2 - 0.25) : a; const p = place(fl, x, z, RY[s1.k], false, 0, { tag: 'lamp' }); if (p) { const lp = W2(R, p.x, p.z); lp.y = (fl.ly || 1.45) * p.g.scale.y; fixtures.push({ pos: lp, prio: 8, power: 10, dist: 4.5, room: R }); break; } }
        plant('end', 'plantB');
      } else {
        const k = pickFit(['sofaS', 'sofaM'], Math.min(R.w, R.d) - 0.4), sofa = k ? inst(k) : F.sofa(M, clamp(Math.min(R.w, R.d) - 0.6, 1.4, 2.1)); place(sofa, cX, cZ, 0, true, 0, { minScale: 0.7 });
      }
      tryWalls(R, sd, { tall: true, need: 1.1 }, () => inst('shelf'));
      ceilingLight(R, 'model');
    } else if (t === 'comedor') {
      const roundFirst = Math.min(R.w, R.d) >= 3.0 && Math.abs(R.w - R.d) < 1.2, ryT = R.w >= R.d ? 0 : PI / 2; let p = null, kind = null;
      for (const k of (roundFirst ? ['table', 'tableR'] : ['tableR', 'table'])) {
        for (const [ox, oz] of [[0, 0], [0.35, 0], [-0.35, 0], [0, 0.35], [0, -0.35], [0.6, 0.6], [-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6]]) { p = place(inst(k), cX + ox, cZ + oz, k === 'tableR' ? ryT : 0, true, 0, { minScale: 0.7 }); if (p) break; }
        if (p) { kind = k; break; }
      }
      if (p) {
        const tX = p.x, tZ = p.z, sc = p.g.scale.x;
        const seats = kind === 'tableR' ? (() => { const L = p.w0 * sc, D = p.d0 * sc, n = L >= 1.5 ? 3 : 2, out = []; for (let i = 0; i < n; i++) { const lx = (i - (n - 1) / 2) * (L / n); [-1, 1].forEach(sg => out.push([lx, sg * (D / 2 + 0.2), lx, 0])); } if (Math.min(R.w, R.d) >= 3.2) [-1, 1].forEach(sg => out.push([sg * (L / 2 + 0.2), 0, 0, 0])); return out.map(([x, z, ax, az]) => { const [a, b] = rot(x, z, p.ry), [c2, d2] = rot(ax, az, p.ry); return [tX + a, tZ + b, tX + c2, tZ + d2]; }); })()
          : (() => { const r = Math.max(p.w, p.d) / 2, out = []; for (let i = 0; i < 4; i++) { const a = i * PI / 2, dd = r + 0.22 * Math.min(1, p.w / 1.2); out.push([tX + Math.sin(a) * dd, tZ + Math.cos(a) * dd, tX, tZ]); } return out; })();
        seats.forEach(([x, z, ax, az]) => place(inst('chair'), x, z, Math.atan2(ax - x, az - z), false, 0, { ignore: [p.rec], tag: 'chair', minScale: 0.9 }));
        const bottom = 0.75 + 0.85, P0 = { prio: 14 + R.w * R.d / 6, power: 16, dist: 5 };
        if (has('pendant')) { if (kind === 'tableR') { const L = p.w0 * sc; [-1, 1].forEach(sg => { const [a, b] = rot(sg * L / 4, 0, p.ry); hangLamp(R, 'pendant', tX + a, tZ + b, bottom, Object.assign({}, P0, { power: 10 })); }); } else hangLamp(R, 'pendant', tX, tZ, bottom, P0); }
        else { const drop = clamp(R.h - 1.62, 0.3, R.dbl ? 3 : 1.2), L = Math.min(1.1, p.w * 0.85); addFixture(R, F.pendants3(M, drop, L), tX, tZ, R.h, 0, P0); }
      } else ceilingLight(R, 'pendant');
      if (has('sideboard')) tryWalls(R, sd, { need: 1.75, depth: 2.6, minScale: 0.7 }, () => inst('sideboard'));
      plant('start', 'plantB');
    } else if (t === 'terraza') {
      let p = null;
      if (has('outdoor')) { const ry = R.w >= R.d ? PI / 2 : 0; for (const [ox, oz] of [[0, 0], [0.4, 0], [-0.4, 0], [0, 0.4], [0, -0.4]]) { p = place(inst('outdoor'), cX + ox, cZ + oz, ry, true, 0, { minScale: 0.8 }); if (p) break; } }
      if (!p) { const tb = inst('table'); for (const [ox, oz] of [[0, 0], [0.35, 0], [-0.35, 0], [0, 0.35], [0, -0.35]]) { p = place(tb, cX + ox, cZ + oz, 0, true, 0, { minScale: 0.62 }); if (p) break; } if (p) { const r = Math.max(p.w, p.d) / 2; [PI / 2, -PI / 2].forEach(a => { const x = p.x + Math.sin(a) * (r + 0.2), z = p.z + Math.cos(a) * (r + 0.2); place(inst('chair'), x, z, Math.atan2(p.x - x, p.z - z), false, 0, { ignore: [p.rec], tag: 'chair', minScale: 0.9 }); }); } }
      plant('start', 'plantB'); plant('end', 'plantB');
    } else if (t === 'cocina') {
      const k = tryWalls(R, sd, { need: 1.5, depth: 1.3 }, c => { const L = Math.min(c.L, 4.2), upper = !sd[c.k].win.some(([a, b]) => b > c.iv[0] && a < c.iv[1]), fr = L >= 2.4; return F.kitchen(M, L, upper, fr); });
      let island = null;
      if (k) {
        const depth = depthOf(R, sd, k.k), wide = isNS(k.k) ? R.w : R.d;
        if (depth >= 3.7 && wide >= 2.6) {
          const st = has('stool'), is = F.island(M, !st), dd = 0.63 / 2 + 1.05 + 0.45, ry = RY[k.k] + PI;
          island = place(is, isNS(k.k) ? cX : k.x + k.n[0] * dd, isNS(k.k) ? k.z + k.n[1] * dd : cZ, ry, true);
          if (island && st) [-0.45, 0.45].forEach(lx => { const [a, b] = rot(lx, 0.82, ry), x = island.x + a, z = island.z + b, [c2, d2] = rot(lx, 0, ry); place(inst('stool'), x, z, Math.atan2(island.x + c2 - x, island.z + d2 - z), false, 0, { ignore: [island.rec], tag: 'chair', free: true }); });
        }
        if (k.it.led) { const c = Math.cos(RY[k.k]), s = Math.sin(RY[k.k]); const lp = W2(R, k.x + k.it.led.x * c + k.it.led.z * s, k.z - k.it.led.x * s + k.it.led.z * c); lp.y = 1.4; fixtures.push({ pos: lp, prio: 6, power: 6, dist: 2.5, room: R, color: 0xfff0dc }); }
      }
      if (island && (has('pendantI') || has('pendant'))) { const kk = has('pendantI') ? 'pendantI' : 'pendant'; [-0.5, 0.5].forEach(lx => { const [a, b] = rot(lx, 0, island.ry); hangLamp(R, kk, island.x + a, island.z + b, 1.75, { prio: 12, power: 9, dist: 4 }); }); }
      else ceilingLight(R, 'plafon');
    } else if (t === 'dormitorio') {
      const minD = Math.min(R.w, R.d); let bed = null;
      const opts = (minD >= 3.0 ? ['bedD', 1.6, 'bedS', 0.9] : minD >= 2.5 ? ['bedD', 1.4, 'bedS', 0.9] : ['bedS', 0.9]);
      for (const o of opts) {
        if (typeof o === 'string' && !has(o)) continue;
        const sz = typeof o === 'string' ? sizeOf(o) : { w: o, d: 2.15 }, dbl = sz.w > 1.3;
        const mk = () => typeof o === 'string' ? inst(o) : F.bed(M, o);
        bed = tryWalls(R, sd, { need: sz.w + 0.1 + (dbl ? 0.9 : 0.45), depth: sz.d + 0.55, minScale: 0.9 }, mk) || tryWalls(R, sd, { need: sz.w + 0.05, depth: sz.d + 0.05, minScale: 0.85 }, mk);
        if (bed) break;
      }
      if (bed) {
        const along = isNS(bed.k) ? bed.x : bed.z;
        [-1, 1].forEach(sg => {
          const ns = inst('night'), a = along + sg * (bed.it.w / 2 + 0.3), iv = sd[bed.k].low.find(([x, y]) => a >= x && a <= y && y - x >= 0.4); if (!iv) return;
          const p = against(R, sd, bed.k, iv, ns, a, true, 0.02, { minScale: 0.7 }); if (!p) return;
          const lamp = has('tlamp') ? inst('tlamp') : F.tableLamp(M), y = p.it.h || 0.55;
          addFixture(R, lamp, p.x, p.z, y, RY[bed.k], { prio: 7, power: 5, dist: 3 });
        });
      }
      const mkW = c => { const k = pickFit(['wardL', 'wardS'], c.L - 0.05); return k ? inst(k) : F.wardrobe(M, Math.min(c.L - 0.1, 2.4)); };
      const wr = tryWalls(R, sd, { tall: true, need: 1.0, excl: bed ? [bed.k] : [], depth: 1.4, at: c => { const s = sizeOf(pickFit(['wardL', 'wardS'], c.L - 0.05)) || { w: Math.min(c.L - 0.1, 2.4) }; return c.iv[1] - s.w / 2 - 0.05; } }, mkW);
      if (has('dresser') && R.w * R.d >= 11) tryWalls(R, sd, { tall: true, need: 1.25, excl: [bed && bed.k, wr && wr.k].filter(Boolean), depth: 1.6, minScale: 0.85 }, () => inst('dresser'));
      if (R.w * R.d >= 12) plant('start', 'plant');
      fanAndLight(R);
    } else if (t === 'bano') {
      const v = tryWalls(R, sd, { need: 0.9, depth: 1.2 }, () => F.vanity(M));
      if (v) { const lp = W2(R, v.x, v.z); lp.y = 1.9; fixtures.push({ pos: lp, prio: 6, power: 6, dist: 2.5, room: R, color: 0xfff2e0 }); }
      tryWalls(R, sd, { need: 0.8, depth: 1.25, at: c => c.iv[0] + 0.4 }, () => F.toilet(M));
      tryWalls(R, sd, { need: 0.95, depth: 1.0, at: c => c.iv[1] - 0.47, gap: 0 }, () => F.shower(M));
      ceilingLight(R, 'plafon');
    } else if (t === 'estudio') {
      const s1 = tryWalls(R, sd, { need: 1.5, depth: 1.6 }, () => F.desk(M));
      if (s1) {
        place(inst('chair'), s1.x + s1.n[0] * 0.62, s1.z + s1.n[1] * 0.62, RY[s1.k] + PI, false, 0, { ignore: [s1.it.rec], tag: 'chair' });
        const ry = RY[s1.k], [a, b] = rot(-0.5, -0.2, ry);
        if (has('dlamp')) addFixture(R, inst('dlamp'), s1.x + a, s1.z + b, 0.75, ry + PI, { prio: 6, power: 5, dist: 3 });
        else { const [c2, d2] = rot(-0.5, 0, ry); addFixture(R, F.tableLamp(M), s1.x + c2, s1.z + d2, 0.75, ry, { prio: 6, power: 5, dist: 3 }); }
      }
      tryWalls(R, sd, { tall: true, need: 1.1, excl: s1 ? [s1.k] : [] }, () => inst('shelf'));
      if (has('armchair') && R.w * R.d >= 9) tryWalls(R, sd, { need: 1.0, excl: s1 ? [s1.k] : [], depth: 2.2, minScale: 0.85 }, () => inst('armchair'));
      plant('end', 'plant');
      ceilingLight(R, 'model');
    } else if (t === 'lavadero') {
      tryWalls(R, sd, { need: 1.3, depth: 1.3 }, () => F.washer(M)); ceilingLight(R, 'plafon');
    } else {
      if (Math.min(R.w, R.d) >= 1.45) { tryWalls(R, sd, { need: 1.1, depth: 1.45 }, () => F.console(M)); if (t === 'recibidor') plant('end', 'plantB'); }
      const L = Math.max(R.w, R.d), n = clamp(Math.round(L / 3.2), 1, 4);
      for (let i = 0; i < n; i++) { const f = (i + 0.5) / n; ceilingLight(R, 'plafon', R.w >= R.d ? [R.x + R.w * f, cZ] : [cX, R.y + R.d * f]); if (i > 0) fixtures[fixtures.length - 1].prio = 3; }
    }
    ctx = null;
  }

  function opening(o, grp) {
    const s = o.seg, g = new THREE.Group(), w = o.e - o.s, hh = o.top - o.bot, T2 = s.t, f = 0.06;
    let d = null;
    if (o.kind === 'window' || o.kind === 'slide') {
      add(g, boxGeo(w, f, T2 * 0.5), M.frame, 0, o.top - f, 0); if (o.bot > 0.01) add(g, boxGeo(w + 0.04, 0.03, T2 + 0.06), M.white, 0, o.bot - 0.03, 0.02); add(g, boxGeo(w, f, T2 * 0.5), M.frame, 0, o.bot, 0);
      [-1, 1].forEach(sg => add(g, boxGeo(f, hh, T2 * 0.5), M.frame, sg * (w / 2 - f / 2), o.bot, 0));
      const panes = o.kind === 'slide' ? 2 : Math.max(1, Math.round(w / 1.4));
      for (let i = 1; i < panes; i++) add(g, boxGeo(0.045, hh, 0.07), M.frame, -w / 2 + i * w / panes, o.bot, o.kind === 'slide' ? -0.04 : 0);
      if (o.kind === 'slide') {
        const gl1 = add(g, boxGeo(w / 2 - f, hh - f * 2, 0.012), M.glass, -w / 4, o.bot + f, -0.04); gl1.castShadow = false;
        const pane = new THREE.Group(); pane.position.z = 0.04; const gl2 = add(pane, boxGeo(w / 2 - f, hh - f * 2, 0.012), M.glass, 0, o.bot + f, 0); gl2.castShadow = false;
        [-1, 1].forEach(sg => add(pane, boxGeo(0.045, hh, 0.05), M.frame, sg * (w / 4 - f / 2), o.bot, 0)); add(pane, boxGeo(w / 2 - f, 0.04, 0.05), M.frame, 0, o.bot + 0.02, 0); add(pane, boxGeo(w / 2 - f, 0.04, 0.05), M.frame, 0, o.top - 0.08, 0);
        add(pane, boxGeo(0.02, 0.3, 0.03), M.steel, -(w / 4 - 0.12), 1.0, 0.035);
        g.add(pane); d = { kind: 'slide', pane, closedX: w / 4 - f / 2, openX: -w / 4 + 0.1, hit: pane };
      }
      else { const gl = add(g, boxGeo(w - f * 2, hh - f * 2, 0.012), M.glass, 0, o.bot + f, 0); gl.castShadow = false; if (o.top - o.bot > 3) add(g, boxGeo(w, 0.05, 0.07), M.frame, 0, o.bot + 2.3, 0); }
    } else if ((o.kind === 'door' || o.kind === 'entry') && loaded[o.kind === 'entry' ? 'doorEntry' : 'doorIn']) {
      // puerta modelada (marco con tapajuntas + hoja con bisagras y manilla), adaptada al hueco y al grosor del muro
      const L = loaded[o.kind === 'entry' ? 'doorEntry' : 'doorIn'], m = L.sc.clone(true); m.userData.model = true; m.updateMatrixWorld(true);
      const fr = m.getObjectByName('door_frame'), pvN = m.getObjectByName('door_pivot'), hb = new THREE.Box3();
      (fr || m).traverse(q => { if (q.isMesh && /^(jamba|dintel)/.test(q.name)) hb.expandByObject(q); });
      const holeW = hb.isEmpty() ? w : hb.max.x - hb.min.x, holeH = hb.isEmpty() ? o.top : hb.max.y, sx = w / holeW, sy = o.top / holeH, sz = T2 / (+L.meta.wall || 0.12);
      if (fr) fr.scale.set(sx, sy, sz);
      const inner = new THREE.Group(); inner.scale.set(sx, sy, 1); [...pvN.children].forEach(c => inner.add(c)); pvN.add(inner); pvN.position.set(pvN.position.x * sx, pvN.position.y * sy, pvN.position.z * sz);
      m.traverse(q => { if (q.isMesh) { q.castShadow = q.receiveShadow = true; } }); g.add(m);
      const oy = (L.meta.doors && L.meta.doors[0] && L.meta.doors[0].open_y) || -1.5708;
      d = { kind: o.kind, pv: pvN, maxA: oy * (o.kind === 'entry' ? 0.9 : 0.98), hit: pvN };
    } else if (o.kind === 'door' || o.kind === 'entry') {
      const th = o.kind === 'entry' ? 0.05 : 0.04, lw = w - 0.06, lh = o.top - 0.03; [-1, 1].forEach(sg => add(g, boxGeo(0.05, o.top, T2 + 0.04), M.white, sg * (w / 2 - 0.025), 0, 0)); add(g, boxGeo(w, 0.05, T2 + 0.04), M.white, 0, o.top - 0.05, 0);
      const pv = new THREE.Group(); pv.position.set(-w / 2 + 0.05, 0, T2 / 2 - th / 2); const leaf = mesh(boxGeo(lw, lh, th), o.kind === 'entry' ? M.front : M.oak, lw / 2, 0, 0); pv.add(leaf);
      if (o.kind === 'entry') { [0.45, 1.05, 1.65].forEach(y => add(pv, boxGeo(lw - 0.2, 0.012, 0.012), M.black, lw / 2, y, th / 2 + 0.006)); add(pv, boxGeo(0.025, 0.9, 0.03), M.steel, lw - 0.1, 0.6, th / 2 + 0.04); add(pv, boxGeo(0.025, 0.9, 0.03), M.steel, lw - 0.1, 0.6, -th / 2 - 0.04); }
      else [1, -1].forEach(sd => { add(pv, cyl(0.012, 0.13, 10), M.steel, lw - 0.08, 1.0, sd * (th / 2 + 0.03)).rotation.z = PI / 2; add(pv, cyl(0.025, 0.012, 16), M.steel, lw - 0.08, 0.994, sd * (th / 2 + 0.006)).rotation.x = PI / 2; });
      g.add(pv); d = { kind: o.kind, pv, maxA: o.kind === 'entry' ? -1.35 : -1.55, hit: pv };
    }
    if (s.free) { g.position.set(wx(o.x), 0, wz(o.y)); g.rotation.y = -s.ang; }
    else if (s.o === 'h') g.position.set(wx(o.mid), 0, wz(s.c)); else { g.position.set(wx(s.c), 0, wz(o.mid)); g.rotation.y = -PI / 2; }
    if (d) {
      const key = doorKey(o), open = doorState.has(key) ? doorState.get(key) : (o.kind === 'door' || o.kind === 'slide');
      Object.assign(d, { key, o, open, a: open ? 1 : 0, wx: g.position.x, wz: g.position.z });
      const half = 0.09, a0 = o.kind === 'slide' ? o.mid : o.s, a1 = o.e;
      if (s.free) { const xa = s.x1 + s.ux * a0, za = s.y1 + s.uy * a0, xb = s.x1 + s.ux * a1, zb = s.y1 + s.uy * a1; d.box = [wx(Math.min(xa, xb)) - half, wx(Math.max(xa, xb)) + half, wz(Math.min(za, zb)) - half, wz(Math.max(za, zb)) + half]; }
      else d.box = s.o === 'h' ? [wx(a0), wx(a1), wz(s.c) - half, wz(s.c) + half] : [wx(s.c) - half, wx(s.c) + half, wz(a0), wz(a1)];
      d.hit.userData.door = d; setDoorPose(d); doors.push(d);
    }
    grp.add(g); return g;
  }

  function disposeGroup(G) { G.traverse(o => { if (o.isMesh && o.geometry && !o.userData.shared) { let p = o; let model = false; while (p) { if (p.userData.model) { model = true; break; } p = p.parent; } if (!model) o.geometry.dispose(); } }); G.clear(); }
  function setHeights(Hh) {
    plan.H = Hh;
    rooms.forEach(R => { if (R.tipo === 'terraza') R.h = 0; else if (R.alt) R.h = R.dbl ? Math.max(R.alt, r2(Hh * 2)) : R.alt; else R.h = R.dbl ? r2(Hh * 2) : Hh; });
  }
  // construye muros, aberturas, suelos, techos, muebles y luminarias (sin animación)
  function construct() {
    disposeGroup(house); disposeGroup(furn); solids = []; ceilings = []; items = []; fixtures = []; doors.length = 0; fans.length = 0;
    an = analyze(plan);
    const walls = [], opG = [], floors = [];
    an.segs.forEach(s => {
      const H = s.h + (s.ext ? 0.4 : 0.2), ext = s.t / 2, mat = r => !r || r.tipo === 'terraza' ? M.facade : (r.tipo === 'bano' ? M.wallTile : M.paint);
      const ops = s.ops.slice().sort((a, b) => a.s - b.s), pcs = []; let cur = s.a - ext;
      ops.forEach(o => { if (o.s > cur + 0.005) pcs.push([cur, o.s, 0, H]); if (o.bot > 0.01) pcs.push([o.s, o.e, 0, o.bot]); if (o.top < H - 0.01) pcs.push([o.s, o.e, o.top, H]); cur = Math.max(cur, o.e); });
      if (s.b + ext > cur + 0.005) pcs.push([cur, s.b + ext, 0, H]);
      pcs.forEach(([p, q, y0, y1]) => {
        const L = q - p, hh = y1 - y0, mid = (p + q) / 2, endM = s.ext ? M.facade : M.paint;
        const geo = s.o === 'h' ? boxGeo(L, hh, s.t) : boxGeo(s.t, hh, L);
        const px = s.o === 'h' ? wx(mid) : wx(s.c), pz = s.o === 'h' ? wz(s.c) : wz(mid); worldUV(geo, px + cx, y0, pz + cz);
        const m = s.o === 'h' ? new THREE.Mesh(geo, [endM, endM, M.roof, M.paint, mat(s.pos), mat(s.neg)]) : new THREE.Mesh(geo, [mat(s.pos), mat(s.neg), M.roof, M.paint, endM, endM]);
        m.castShadow = m.receiveShadow = true; m.position.set(px, y0, pz);
        house.add(m); walls.push({ m, d: (m.position.x + m.position.z + size) / (size * 2) });
        if (y0 < 0.9) solids.push(s.o === 'h' ? [wx(p), wx(q), wz(s.c) - s.t / 2, wz(s.c) + s.t / 2] : [wx(s.c) - s.t / 2, wx(s.c) + s.t / 2, wz(p), wz(q)]);
      });
    });
    // paredes libres (cualquier ángulo): tramos girados entre puertas, con dintel encima de cada hueco
    (an.free || []).forEach(s => {
      const H = s.h + 0.2, ops = s.ops.slice().sort((a, b) => a.s - b.s), pcs = []; let cur = -s.t / 2;
      ops.forEach(o => { if (o.s > cur + 0.005) pcs.push([cur, o.s, 0, H]); if (o.top < H - 0.01) pcs.push([o.s, o.e, o.top, H]); cur = Math.max(cur, o.e); });
      if (s.len + s.t / 2 > cur + 0.005) pcs.push([cur, s.len + s.t / 2, 0, H]);
      pcs.forEach(([p, q, y0, y1]) => {
        const L = q - p, hh = y1 - y0, k = (p + q) / 2, px = s.x1 + s.ux * k, pz = s.y1 + s.uy * k;
        const geo = boxGeo(L, hh, s.t); worldUV(geo, px, y0, pz);
        const m = new THREE.Mesh(geo, [M.paint, M.paint, M.roof, M.paint, M.paint, M.paint]);
        m.castShadow = m.receiveShadow = true; m.position.set(wx(px), y0, wz(pz)); m.rotation.y = -s.ang;
        house.add(m); walls.push({ m, d: (m.position.x + m.position.z + size) / (size * 2) });
        if (y0 < 0.9) for (let u = p; u <= q + 1e-6; u += 0.2) { const ux = s.x1 + s.ux * Math.min(u, q), uz = s.y1 + s.uy * Math.min(u, q); solids.push([wx(ux) - 0.08, wx(ux) + 0.08, wz(uz) - 0.08, wz(uz) + 0.08]); }
      });
    });
    an.rails.forEach(r => { const L = r.b - r.a, g = new THREE.Group(); const gl = add(g, boxGeo(L, 1.0, 0.02), M.glass, 0, 0, 0); gl.castShadow = false; add(g, boxGeo(L, 0.04, 0.06), M.steel, 0, 1.0, 0); if (r.o === 'h') g.position.set(wx((r.a + r.b) / 2), 0, wz(r.c)); else { g.position.set(wx(r.c), 0, wz((r.a + r.b) / 2)); g.rotation.y = PI / 2; } house.add(g); walls.push({ m: g, d: 1, rail: 1 }); solids.push(r.o === 'h' ? [wx(r.a), wx(r.b), wz(r.c) - 0.05, wz(r.c) + 0.05] : [wx(r.c) - 0.05, wx(r.c) + 0.05, wz(r.a), wz(r.b)]); });
    an.ops.forEach(o => { if (o.kind === 'open') return; const g = opening(o, house); opG.push(g); if (o.kind === 'slide') { const s = o.seg; solids.push(s.o === 'h' ? [wx(o.s), wx(o.mid), wz(s.c) - 0.1, wz(s.c) + 0.1] : [wx(s.c) - 0.1, wx(s.c) + 0.1, wz(o.s), wz(o.mid)]); } if (o.kind === 'window') { const s = o.seg; if (o.bot < 0.9) solids.push(s.o === 'h' ? [wx(o.s), wx(o.e), wz(s.c) - 0.1, wz(s.c) + 0.1] : [wx(s.c) - 0.1, wx(s.c) + 0.1, wz(o.s), wz(o.e)]); } });
    rooms.forEach(R => {
      const fm = R.tipo === 'terraza' ? M.deck : R.tipo === 'bano' ? M.bathFloor : (['cocina', 'lavadero'].includes(R.tipo) ? M.tile : M.wood);
      const fg = boxGeo(R.w, 0.03, R.d); worldUV(fg, R.x + R.w / 2, -0.03, R.y + R.d / 2);
      const f = mesh(fg, fm, wx(R.x + R.w / 2), -0.03, wz(R.y + R.d / 2)); f.castShadow = false; house.add(f); floors.push(f);
      if (R.tipo !== 'terraza') { const cg = boxGeo(R.w, 0.2, R.d); worldUV(cg, R.x + R.w / 2, R.h, R.y + R.d / 2); const c = new THREE.Mesh(cg, [M.facade, M.facade, M.roof, M.ceil, M.facade, M.facade]); c.position.set(wx(R.x + R.w / 2), R.h, wz(R.y + R.d / 2)); c.castShadow = true; c.receiveShadow = true; c.visible = mode !== 'orbit' || !!tour; house.add(c); ceilings.push(c); }
    });
    rooms.forEach(R => { try { furnish(R); } catch (e) { console.warn('furnish', R.id, e); ctx = null; } });
    // farol exterior junto a la puerta de entrada
    if (an.entry) {
      const o = an.entry, n = into(o, o.room), s = o.seg, sideA = o.e + 0.25, y = 1.75;
      const lt = has('wallLamp') ? inst('wallLamp') : F.lantern(M), off = s.t / 2 + (lt.model ? lt.d / 2 + 0.005 : 0.08), x = s.o === 'h' ? sideA : s.c - n[0] * off, z = s.o === 'h' ? s.c - n[1] * off : sideA;
      const ry = s.o === 'h' ? (n[1] > 0 ? PI : 0) : (n[0] > 0 ? -PI / 2 : PI / 2);
      if (!lt.model) { lt.lx = 0; lt.ly = 0.18; lt.lz = 0.25; } else lt.lz = (lt.lz || 0) + 0.12; addFixture(null, lt, x, z, y, ry, { prio: 9, power: 9, dist: 6, color: 0xffcf94 });
    }
    // farola al principio del camino de entrada
    if (an.entry && has('street')) {
      const o = an.entry, n = into(o, o.room), px = o.x - n[0] * 8.6 - n[1] * 1.45, pz = o.y - n[1] * 8.6 + n[0] * 1.45, gy = ext && ext.gh ? Math.max(0, ext.gh(wx(px), wz(pz))) : 0;
      addFixture(null, inst('street'), px, pz, gy, Math.atan2(n[1], -n[0]), { prio: 8.5, power: 22, dist: 9, color: 0xffc98a });
    }
    if (ext) ext.fixtures.forEach(f => fixtures.push(f));
    assignLights();
    cb.onDoors && cb.onDoors(doorSummary());
    return { walls, opG, floors };
  }

  async function buildPlan(p) {
    prog(0, 0.2); plan = p; rooms = plan.rooms; an = analyze(plan); cb.onWarnings && cb.onWarnings(an.warnings);
    rooms.forEach(R => { if (R.alt === undefined) R.alt = R.altura || 0; });
    const b = an.bounds; cx = (b.x0 + b.x1) / 2; cz = (b.y0 + b.y1) / 2; size = Math.max(b.x1 - b.x0, b.y1 - b.y0, 6);
    const maxH = Math.max(...rooms.map(r => r.h), 2.7); center.set(0, maxH * 0.3, 0);
    const D = size * 0.9 + 5; camera.position.set(D * 0.62, D * 0.72, D * 0.86); controls.target.copy(center); controls.minDistance = 2; controls.maxDistance = Math.max(D * 3, 120); controls.update();
    const modelsP = loadModels(f => prog(5, f, `Muebles 3D · ${Math.round(f * 100)} %`));
    await wait(300); prog(0, 1);
    // terreno, vegetación y cielo
    scene.add(sky); scene.background = null; applyTime(); regenEnv(); refreshFacade();
    const sc = sun.shadow.camera, ex = size / 2 + 6; sc.left = -ex; sc.right = ex; sc.top = ex; sc.bottom = -ex; sc.near = 1; sc.far = size * 3 + 90; sc.updateProjectionMatrix(); scene.add(sun, sun.target, hemi);
    const plinth = mesh(boxGeo(b.x1 - b.x0 + 1.6, 0.42, b.y1 - b.y0 + 1.6), M.sidewalk, 0, -0.45, 0); worldUV(plinth.geometry, 0, 0, 0); scene.add(plinth);
    let entryW = null; if (an.entry) { const o = an.entry, n = into(o, o.room); entryW = { x: wx(o.x), z: wz(o.y), nx: n[0], nz: n[1] }; }
    const pt = await panoP; if (pt && !pano) { pano = makePano(pt); scene.add(pano); }
    ext = buildExterior({ T, M, low, hx: (b.x1 - b.x0) / 2 + 0.8, hz: (b.y1 - b.y0) / 2 + 0.8, entry: entryW, camDir: { x: 0.62, z: 0.86 }, maxH, far: !pano }); scene.add(ext.group); ['grass', 'terrainRock'].forEach(k => REAL[k] && ext.setGround(k, REAL[k]));
    await anim(700, k => { prog(1, k); });
    await modelsP;
    // muros, aberturas, suelos y muebles
    const { walls, opG, floors } = construct();
    walls.forEach(w => { if (w.rail) w.m.visible = false; else w.m.scale.y = 0.001; }); opG.forEach(g => g.scale.set(1, 0.001, 1)); floors.forEach(f => f.scale.set(0.001, 1, 0.001)); items.forEach(it => { it.g.visible = false; });
    await anim(1900, k => { walls.forEach(w => { const t = clamp((k - w.d * 0.45) / 0.55, 0, 1); if (w.rail) w.m.visible = t > 0; else w.m.scale.y = Math.max(0.001, back(t)); }); prog(2, k); });
    await anim(1000, k => { opG.forEach((g, i) => { g.scale.y = Math.max(0.001, ease(clamp(k * 1.6 - i / opG.length * 0.6, 0, 1))); }); prog(3, k); });
    await anim(800, k => { floors.forEach((f, i) => { const t = ease(clamp(k * 1.5 - i / floors.length * 0.5, 0, 1)); f.scale.set(Math.max(0.001, t), 1, Math.max(0.001, t)); }); prog(4, k); });
    prog(5, 1);
    await anim(1500, k => { items.forEach((it, i) => { const t = clamp(k * 1.7 - (i / items.length) * 0.7, 0, 1); it.g.visible = t > 0; it.g.position.y = it.y + (1 - back(t)) * 1.6; }); prog(6, k); });
    items.forEach(it => { it.g.position.y = it.y; it.g.visible = true; });
    await anim(600, k => prog(7, k)); renderer.compile(scene, camera);
    // vegetación y rocas reales: se cargan después, sin bloquear la vista
    if (ext.upgrade) ext.upgrade({ load: loadId, meta: metaOf }).then(() => { envDirty = true; cb.onExterior && cb.onExterior(true); }).catch(e => console.warn('exterior', e));
    return { rooms: rooms.map(R => ({ id: R.id, nombre: R.nombre, tipo: R.tipo, area: Math.round(R.w * R.d * 10) / 10, dbl: R.dbl })), H: plan.H, doors: doors.length };
  }

  async function buildGlb(url) {
    prog(0, 0.3, 'Leyendo el modelo');
    scene.add(sky); scene.background = null; applyTime(); regenEnv();
    const gl = await new Promise((res, rej) => new GLTFLoader().load(url, res, e => e.total && prog(5, e.loaded / e.total, `Modelo 3D · ${Math.round(e.loaded / e.total * 100)} %`), rej));
    const o = gl.scene, box = new THREE.Box3().setFromObject(o), c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3());
    o.position.sub(new THREE.Vector3(c.x, box.min.y, c.z)); o.traverse(m => { if (m.isMesh) { m.castShadow = m.receiveShadow = true; } }); scene.add(o);
    size = Math.max(s.x, s.z, 4); center.set(0, s.y * 0.3, 0);
    const sc = sun.shadow.camera, ex = size / 2 + 4; sc.left = -ex; sc.right = ex; sc.top = ex; sc.bottom = -ex; sc.far = size * 3 + 60; sc.updateProjectionMatrix(); scene.add(sun, sun.target, hemi);
    const pt = await panoP; if (pt && !pano) { pano = makePano(pt); scene.add(pano); }
    ext = buildExterior({ T, M, low, hx: s.x / 2 + 0.5, hz: s.z / 2 + 0.5, entry: null, camDir: { x: 0.6, z: 0.8 }, maxH: s.y, far: !pano }); scene.add(ext.group); fixtures = ext.fixtures.slice(); assignLights();
    const D = size * 1.2 + 4; camera.position.set(D * 0.6, D * 0.6, D * 0.8); controls.target.copy(center); controls.maxDistance = Math.max(D * 3, 120); controls.update();
    await anim(500, k => prog(7, k));
    return { rooms: [], H: null, doors: 0 };
  }

  // — recorrido guiado —
  function tourPath() {
    const pts = [], seen = new Set(), wp = (x, z, extra) => pts.push(Object.assign({ p: new THREE.Vector3(wx(x), EYE, wz(z)) }, extra || {}));
    const E = an.entry;
    const visit = (R, v) => { seen.add(R.id); an.adj.get(R.id).forEach(({ to, o }) => { if (seen.has(to.id)) return; const nR = into(o, R), nT = into(o, to), ctr = [to.x + to.w / 2, to.y + to.d / 2], pin = [o.x + nT[0] * 0.6, o.y + nT[1] * 0.6], v2 = [pin[0] + (ctr[0] - pin[0]) * 0.35, pin[1] + (ctr[1] - pin[1]) * 0.35]; wp(o.x + nR[0] * 0.6, o.y + nR[1] * 0.6); wp(pin[0], pin[1]); wp(v2[0], v2[1], { room: to }); visit(to, v2); wp(pin[0], pin[1]); wp(o.x + nR[0] * 0.6, o.y + nR[1] * 0.6); wp(v[0], v[1]); }); };
    if (E) { const R = E.room, n = into(E, R), ctr = [R.x + R.w / 2, R.y + R.d / 2]; wp(E.x - n[0] * 6, E.y - n[1] * 6); wp(E.x - n[0] * 0.7, E.y - n[1] * 0.7); wp(E.x + n[0] * 0.6, E.y + n[1] * 0.6); const v = [E.x + n[0] * 0.6 + (ctr[0] - E.x - n[0] * 0.6) * 0.35, E.y + n[1] * 0.6 + (ctr[1] - E.y - n[1] * 0.6) * 0.35]; wp(v[0], v[1], { room: R }); visit(R, v); }
    else { const R = rooms[0]; wp(R.x + R.w / 2, R.y + R.d / 2, { room: R }); visit(R, [R.x + R.w / 2, R.y + R.d / 2]); }
    while (pts.length > 2 && !pts[pts.length - 1].room && pts[pts.length - 2] && !pts[pts.length - 2].room) pts.pop();
    return pts;
  }
  function stepTour(dt) {
    const T3 = tour, pts = T3.pts;
    doors.forEach(d => { if (!d.open && Math.hypot(d.wx - P.pos.x, d.wz - P.pos.z) < 2.6) toggleDoor(d, true); });
    if (T3.pause > 0) {
      const R = pts[T3.i].room, dur = 3.4, k = 1 - T3.pause / dur; T3.pause -= dt;
      const ctr = new THREE.Vector3(wx(R.x + R.w / 2), 0, wz(R.y + R.d / 2)), base = Math.atan2(-(ctr.x - P.pos.x), -(ctr.z - P.pos.z));
      P.yaw += angDiff(P.yaw, base + Math.sin(k * PI * 2) * 0.55) * Math.min(1, dt * 3);
      const up = R.dbl ? Math.sin(k * PI) : 0; P.pos.y = EYE + up * (R.h / 2 - 0.8); P.pitch += ((R.dbl ? -0.3 * up : -0.05) - P.pitch) * Math.min(1, dt * 3);
      applyPlayer(); if (T3.pause <= 0) T3.i++;
      return;
    }
    if (T3.i >= pts.length - 1) { tour = null; cb.onTour && cb.onTour(false); syncPlayer(); return; }
    const a = P.pos, b = pts[T3.i + 1].p, d = new THREE.Vector3(b.x - a.x, 0, b.z - a.z), L = d.length(), sp = (T3.i === 0 ? 2.2 : 1.35) * dt;
    if (L <= sp) { a.x = b.x; a.z = b.z; T3.i++; if (pts[T3.i].room) { T3.pause = 3.4; cb.onRoom && cb.onRoom({ id: pts[T3.i].room.id, nombre: pts[T3.i].room.nombre, area: pts[T3.i].room.w * pts[T3.i].room.d, dbl: pts[T3.i].room.dbl }); } }
    else { d.multiplyScalar(sp / L); a.add(d); }
    a.y += (EYE + groundAt(a.x, a.z) - a.y) * Math.min(1, dt * 4);
    if (L > 0.05) P.yaw += angDiff(P.yaw, Math.atan2(-(b.x - a.x), -(b.z - a.z))) * Math.min(1, dt * 3.2);
    P.pitch += (-0.04 - P.pitch) * Math.min(1, dt * 3);
    applyPlayer();
  }

  let hT = null;
  const api = {
    get mode() { return mode; },
    setMode(m) {
      if (m === mode && !tour) return; if (tour) { tour = null; cb.onTour && cb.onTour(false); }
      const prev = mode; mode = m; ceilings.forEach(c => { c.visible = m !== 'orbit'; }); controls.enabled = m === 'orbit'; keys.clear();
      if (m === 'orbit') { const D = size * 0.9 + 5; tweenTo(new THREE.Vector3(D * 0.62, D * 0.72, D * 0.86), center, 1300); }
      else if (prev === 'orbit') { const R = (an && (an.entry ? an.entry.room : rooms.find(r => r.tipo !== 'terraza'))) || null; if (R) { const v = viewOf(R); tweenTo(v.pos, v.look, 1600); } else tweenTo(new THREE.Vector3(0, EYE, size * 0.8), new THREE.Vector3(0, EYE, 0), 1400); }
      cb.onMode && cb.onMode(m);
    },
    goRoom(id, instant) {
      const R = rooms.find(r => r.id === id); if (!R) return; if (tour) { tour = null; cb.onTour && cb.onTour(false); }
      if (mode === 'orbit') { const t = new THREE.Vector3(wx(R.x + R.w / 2), R.h * 0.25, wz(R.y + R.d / 2)), dir = camera.position.clone().sub(controls.target).setY(0).normalize(), D = Math.max(R.w, R.d) * 1.3 + 4; tweenTo(t.clone().add(dir.multiplyScalar(D)).setY(D * 0.95), t, 1100); }
      else { const v = viewOf(R); if (instant) { tw = null; camera.position.copy(v.pos); camera.lookAt(v.look); syncPlayer(); } else tweenTo(v.pos, v.look, 1200); }
    },
    startTour() {
      if (!an) return; const pts = tourPath(); if (pts.length < 2) return;
      ceilings.forEach(c => { c.visible = true; }); controls.enabled = false; mode = 'walk'; cb.onMode && cb.onMode('walk');
      tweenTo(pts[0].p, pts[1].p, 1500, () => { tour = { pts, i: 0, pause: 0 }; }); cb.onTour && cb.onTour(true);
    },
    stopTour() { if (tour || (tw && mode !== 'orbit')) { tour = null; tw = null; syncPlayer(); cb.onTour && cb.onTour(false); } },
    setLift(v) { lift = v; },
    // hora del día (0–24): mueve el sol, el cielo y enciende las luces al anochecer
    setTime(h) { hour = ((+h % 24) + 24) % 24; applyTime(); },
    get time() { return hour; },
    // luces interiores: 'auto' (según la hora), 'on' u 'off'
    setLights(m) { lightsMode = m; applyTime(); },
    // altura libre del techo en metros (2,20–4,50): reconstruye muros, techos y luminarias en vivo
    setHeight(h) {
      if (!plan) return; const Hh = r2(clamp(+h, 2.2, 4.5)); if (Hh === plan.H) return;
      setHeights(Hh); clearTimeout(hT);
      hT = setTimeout(() => { construct(); items.forEach(it => { it.g.visible = true; }); cb.onHeight && cb.onHeight(Hh); }, 60);
    },
    get height() { return plan ? plan.H : null; },
    // puertas: abre/cierra todas (true/false) o devuelve el resumen
    setDoors(open) { doors.forEach(d => { d.open = !!open; doorState.set(d.key, d.open); }); cb.onDoors && cb.onDoors(doorSummary()); },
    toggleNearestDoor() { const d = nearestDoor(3); if (d) toggleDoor(d); return !!d; },
    get doors() { return doorSummary(); },
    // fachada: 'revoque' | 'ladrillo' | 'piedra'
    setFacade(k) { if (!facadeKeys[k]) return; facade = k; refreshFacade(); },
    photo() { draw(); return cv.toDataURL('image/jpeg', 0.92); },
    // herramienta interna: hornea el fondo lejano (> 600 m) en dos imágenes WebP de 4096 px. Requiere el modo 3D completo (pano: false)
    bakePano(W = 8192, slices = 128) {
      const Hh = Math.round(W / (2 * PI) * (PANO.tanTop - PANO.tanBot) / 2) * 2, sw = W / slices, d = 2 * PI / slices, near = 600, far = 29000, eye = 1.7;
      const keep = { fog: scene.fog, tm: renderer.toneMapping, hour, si: 0, hi: 0, ei: 0 };
      hour = 12.25; applyTime(); sun.intensity *= 0.5; hemi.intensity *= 0.5; scene.environmentIntensity *= 0.5;
      const hidden = [sky, night.group, house, furn].filter(o => o.visible); hidden.forEach(o => { o.visible = false; });
      scene.fog = null; renderer.toneMapping = THREE.NoToneMapping; const bg = scene.background; scene.background = null; renderer.setClearColor(0x000000, 0);
      const rtC = new THREE.WebGLRenderTarget(sw, Hh), rtF = new THREE.WebGLRenderTarget(sw, Hh); rtC.texture.colorSpace = THREE.SRGBColorSpace;
      const distM = new THREE.ShaderMaterial({ uniforms: { dens: { value: 0.0011 } }, side: THREE.DoubleSide,
        vertexShader: '#include <common>\nvarying vec3 vW; void main(){ vec4 p = vec4(position, 1.0);\n#ifdef USE_INSTANCING\np = instanceMatrix * p;\n#endif\np = modelMatrix * p; vW = p.xyz; gl_Position = projectionMatrix * viewMatrix * p; }',
        fragmentShader: 'uniform float dens; varying vec3 vW; void main(){ float dd = length(vW - cameraPosition) * dens; float f = 1.0 - exp(-dd * dd); gl_FragColor = vec4(f, f, f, 1.0); }' });
      const cam = new THREE.PerspectiveCamera(), bufC = new Uint8Array(sw * Hh * 4), bufF = new Uint8Array(sw * Hh * 4), half = W / 2;
      const outs = [0, 1].map(() => { const c = document.createElement('canvas'); c.width = half; c.height = Hh; return c; }), imgs = outs.map(c => c.getContext('2d').createImageData(half, Hh));
      const gy = ext && ext.gh ? Math.max(0, ext.gh(0, 0)) : 0;
      for (let i = 0; i < slices; i++) {
        const a = (i + 0.5) * d, tw = Math.tan(d / 2);
        cam.position.set(0, gy + eye, 0); cam.up.set(0, 1, 0); cam.lookAt(Math.cos(a), gy + eye, Math.sin(a));
        cam.projectionMatrix.makePerspective(-near * tw, near * tw, near * PANO.tanTop, near * PANO.tanBot, near, far); cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
        renderer.setRenderTarget(rtC); renderer.clear(); renderer.render(scene, cam); renderer.readRenderTargetPixels(rtC, 0, 0, sw, Hh, bufC);
        scene.overrideMaterial = distM; renderer.setRenderTarget(rtF); renderer.clear(); renderer.render(scene, cam); renderer.readRenderTargetPixels(rtF, 0, 0, sw, Hh, bufF); scene.overrideMaterial = null;
        const k = Math.floor(i * sw / half), img = imgs[k], x0 = i * sw - k * half;
        for (let y = 0; y < Hh; y++) for (let x = 0; x < sw; x++) {
          const s4 = ((Hh - 1 - y) * sw + x) * 4, o4 = (y * half + x0 + x) * 4, cov = bufC[s4 + 3] > 127;
          img.data[o4] = bufC[s4]; img.data[o4 + 1] = bufC[s4 + 1]; img.data[o4 + 2] = bufC[s4 + 2]; img.data[o4 + 3] = cov ? Math.round(255 * (1 - 0.96 * bufF[s4] / 255)) : 0;
        }
      }
      renderer.setRenderTarget(null); rtC.dispose(); rtF.dispose(); distM.dispose();
      outs.forEach((c, k) => c.getContext('2d').putImageData(imgs[k], 0, 0));
      scene.fog = keep.fog; renderer.toneMapping = keep.tm; scene.background = bg; hidden.forEach(o => { o.visible = true; }); hour = keep.hour; applyTime();
      return outs.map(c => c.toDataURL('image/webp', 0.9));
    },
    get three() { return { THREE, camera, controls, scene, renderer, doors, fixtures, pool, items }; },
    dispose() { dead = true; renderer.setAnimationLoop(null); ro.disconnect(); clearTimeout(hT); removeEventListener('keydown', onKey); removeEventListener('keyup', onKey); removeEventListener('blur', onBlur); if (mm) mm.removeEventListener('click', onMM); controls.dispose(); if (envRT) envRT.dispose(); pmrem.dispose(); if (composer) composer.dispose(); renderer.dispose(); try { renderer.forceContextLoss(); } catch (e) {} el.innerHTML = ''; }
  };
  const info = input && input.glb ? await buildGlb(input.glb) : await buildPlan(input);
  cb.onReady && cb.onReady(info);
  return api;
}
