/* Nebula cat: a cat made of particles that chases, swats and pounces on a spiral galaxy.
   Renders into its own transparent canvas inside `stage`. The galaxy can be dragged and thrown. */
import * as THREE from 'three';

export function startNebulaCat(stage, hint) {
let cvRect = null;   // the canvas rect, cached between scrolls and resizes
/* ---------- utilidades ---------- */
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t * t * (3 - 2 * t);
const rand = (a, b) => a + Math.random() * (b - a);
const damp = (k, dt) => 1 - Math.exp(-k * dt);
const mix = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) * 0.8;

/* ---------- renderer / cena ---------- */
const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, premultipliedAlpha: true });
renderer.setClearColor(0x000000, 0);
const baseDpr = Math.min(window.devicePixelRatio || 1, 1.5);
renderer.setPixelRatio(baseDpr);
stage.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 300);

const DENS = Math.min(innerWidth, innerHeight) < 600 ? 0.6 : 0.9;
const N = n => Math.max(4, Math.round(n * DENS));

/* ---------- material de partículas (um só para tudo) ---------- */
const uniforms = { uTime: { value: 0 }, uScale: { value: 800 }, uLight: { value: 0 } };
const mat = new THREE.ShaderMaterial({
  uniforms,
  vertexShader: `
    attribute vec3 aColor; attribute float aSize; attribute float aSeed; attribute float aBright;
    uniform float uTime; uniform float uScale;
    varying vec3 vColor; varying float vBright;
    void main() {
      float s = aSeed * 6.2831;
      vec3 p = position + 0.012 * vec3(sin(uTime*1.3 + s*3.0), cos(uTime*1.1 + s*5.0), sin(uTime*0.9 + s*7.0));
      vec4 mv = modelViewMatrix * vec4(p, 1.0);
      vColor = aColor;
      vBright = aBright * (0.72 + 0.28 * sin(uTime * (0.8 + aSeed * 2.2) + s * 11.0));
      gl_PointSize = aSize * uScale / -mv.z;
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `
    uniform float uLight;
    varying vec3 vColor; varying float vBright;
    void main() {
      vec2 c = gl_PointCoord - 0.5;
      float d2 = dot(c, c);
      if (d2 > 0.25) discard;
      float a = (exp(-d2 * 60.0) + 0.45 * exp(-d2 * 14.0)) * vBright;
      vec3 col = vColor;
      float al = 0.6;
      if (uLight > 0.5) { col = pow(vColor, vec3(1.8)) * 0.42; a *= 1.15; al = 0.9; }
      gl_FragColor = vec4(col * a, min(a, 1.0) * al);
    }`,
  transparent: true, depthWrite: false, depthTest: false,
  blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
  blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
  blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor
});

/* ---------- construção das nuvens de partículas ---------- */
const clouds = new Map();
function put(bone, x, y, z, col, size, bright) {
  let c = clouds.get(bone);
  if (!c) { c = { p: [], c: [], s: [], r: [], b: [] }; clouds.set(bone, c); }
  c.p.push(x, y, z); c.c.push(col[0], col[1], col[2]); c.s.push(size); c.r.push(Math.random()); c.b.push(bright);
}
function finalize() {
  for (const [bone, c] of clouds) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(c.p, 3));
    g.setAttribute('aColor', new THREE.Float32BufferAttribute(c.c, 3));
    g.setAttribute('aSize', new THREE.Float32BufferAttribute(c.s, 1));
    g.setAttribute('aSeed', new THREE.Float32BufferAttribute(c.r, 1));
    g.setAttribute('aBright', new THREE.Float32BufferAttribute(c.b, 1));
    const pts = new THREE.Points(g, mat);
    pts.frustumCulled = false;
    bone.add(pts);
  }
}

const DEEP = [0.42, 0.08, 0.15], LAV = [0.82, 0.36, 0.45], ICE = [0.93, 0.82, 0.79], WHITE = [1, 0.97, 0.94];
const GOLD = [1.0, 0.80, 0.30], GREENGOLD = [0.78, 1.0, 0.45], PINK = [1.0, 0.55, 0.78];
const furColor = w => mix(mix(DEEP, Math.random() < 0.5 ? LAV : ICE, Math.random() * 0.7), WHITE, clamp(w, 0, 1));
function fur(b, x, y, z, w, dim) {
  if (Math.random() < 0.055) put(b, x, y, z, mix(furColor(w), WHITE, 0.75), rand(0.16, 0.3), 0.75 * dim);
  else put(b, x, y, z, furColor(w), rand(0.075, 0.13), rand(0.15, 0.32) * dim);
}
function rdir() {
  let x, y, z, l;
  do { x = Math.random() * 2 - 1; y = Math.random() * 2 - 1; z = Math.random() * 2 - 1; l = x * x + y * y + z * z; } while (l > 1 || l < 1e-4);
  l = Math.sqrt(l); return [x / l, y / l, z / l];
}
const shellR = () => Math.random() < 0.07 ? rand(1.04, 1.14) : 1 - 0.22 * Math.random() ** 2;

function ellipsoid(b, cx, cy, cz, rx, ry, rz, n, fn) {
  for (let i = 0; i < n; i++) {
    const d = rdir(), r = shellR();
    const x = cx + d[0] * rx * r, y = cy + d[1] * ry * r, z = cz + d[2] * rz * r;
    const o = fn ? fn(x, y, z, d) : { w: 0, dim: 1 };
    fur(b, x, y, z, o.w, (r > 1.03 ? 0.5 : 1) * o.dim);
  }
}
const _A = new THREE.Vector3(), _B = new THREE.Vector3(), _D = new THREE.Vector3(), _U = new THREE.Vector3(), _W = new THREE.Vector3(), _P = new THREE.Vector3();
function segment(b, a, e, r0, r1, n, opt = {}) {
  const zs = opt.zs ?? 0.8;
  _A.set(...a); _B.set(...e); _D.subVectors(_B, _A); const L = _D.length(); _D.normalize();
  _U.set(0, 0, 1).cross(_D); if (_U.lengthSq() < 1e-6) _U.set(1, 0, 0); _U.normalize();
  _W.crossVectors(_D, _U).normalize();
  for (let i = 0; i < n; i++) {
    const s = rand(-r0, L + r1);
    let rr, t;
    if (s < 0) { t = 0; rr = r0 * Math.sqrt(Math.max(0, 1 - (s / r0) ** 2)); }
    else if (s > L) { t = 1; rr = r1 * Math.sqrt(Math.max(0, 1 - ((s - L) / r1) ** 2)); }
    else { t = s / L; rr = lerp(r0, r1, t) * (opt.bulge ? opt.bulge(t) : 1); }
    const th = Math.random() * Math.PI * 2, R = shellR(), cu = Math.cos(th);
    const pu = cu * rr * R + (opt.shift ? opt.shift(t) : 0), pw = Math.sin(th) * rr * R * zs;
    _P.copy(_A).addScaledVector(_D, s).addScaledVector(_U, pu).addScaledVector(_W, pw);
    fur(b, _P.x, _P.y, _P.z, opt.white ? opt.white(t, cu) : 0, (R > 1.03 ? 0.5 : 1) * (opt.dim ? opt.dim(t) : 1));
  }
}

/* ---------- esqueleto do gato (rest pose: todas as rotações zero) ---------- */
const root = new THREE.Group(); scene.add(root);
const body = new THREE.Group(); root.add(body);
const mid = new THREE.Group(); body.add(mid);
const front = new THREE.Group(); front.position.set(0.6, 0, 0); body.add(front);
const rear = new THREE.Group(); rear.position.set(-0.7, 0, 0); body.add(rear);
const neck = new THREE.Group(); neck.position.set(0.95, 0.3, 0); front.add(neck);
const head = new THREE.Group(); head.position.set(0.55, 0.45, 0); head.rotation.order = 'YZX'; head.scale.setScalar(1.12); neck.add(head);

function makeLeg(parent, pos, L1, L2, L3, kind) {
  const up = new THREE.Group(); up.position.set(...pos); parent.add(up);
  const lo = new THREE.Group(); lo.position.set(0, -L1, 0); up.add(lo);
  const en = new THREE.Group(); en.position.set(0, -L2, 0); lo.add(en);
  const paw = new THREE.Group(); paw.position.set(0, -L3, 0); en.add(paw);
  return { up, lo, en, paw, L1, L2, L3, kind, side: Math.sign(pos[2]) };
}
const FL = [makeLeg(front, [0.75, -0.2, -0.3], 0.92, 0.92, 0.22, 'f'), makeLeg(front, [0.75, -0.2, 0.3], 0.92, 0.92, 0.22, 'f')];
const RL = [makeLeg(rear, [-0.75, -0.05, -0.33], 0.88, 0.88, 0.7, 'r'), makeLeg(rear, [-0.75, -0.05, 0.33], 0.88, 0.88, 0.7, 'r')];
const TAIL_N = 9, TL = 0.34, tail = [];
{ let p = rear; for (let i = 0; i < TAIL_N; i++) { const b = new THREE.Group(); b.position.set(i ? -TL : -1.35, i ? 0 : 0.28, 0); p.add(b); tail.push(b); p = b; } }

/* tronco: perfil anatômico (peito fundo, cintura, barriguinha primordial, quadril) */
const TK = {
  x:  [-2.3, -2.05, -1.7, -1.1, -0.4, 0.35, 1.0, 1.55, 1.95, 2.15],
  ry: [0.05, 0.42, 0.62, 0.64, 0.64, 0.70, 0.78, 0.74, 0.48, 0.06],
  rz: [0.05, 0.40, 0.56, 0.55, 0.52, 0.56, 0.58, 0.55, 0.40, 0.06],
  cy: [0.20, 0.18, 0.12, 0.05, 0.00, -0.04, 0.00, 0.05, 0.12, 0.15]
};
function prof(arr, x) {
  const X = TK.x;
  if (x <= X[0]) return arr[0];
  for (let i = 0; i < X.length - 1; i++) if (x <= X[i + 1]) {
    const t = (x - X[i]) / (X[i + 1] - X[i]);
    return lerp(arr[i], arr[i + 1], (1 - Math.cos(Math.PI * t)) / 2);
  }
  return arr[arr.length - 1];
}
for (let i = 0, n = N(4600); i < n;) {
  const x = rand(-2.3, 2.15);
  const ry = prof(TK.ry, x), rz = prof(TK.rz, x), cy = prof(TK.cy, x);
  if (Math.random() * 1.5 > ry + rz) continue;
  i++;
  const th = Math.random() * Math.PI * 2, R = shellR(), sn = Math.sin(th);
  let y = sn * ry * R; const z = Math.cos(th) * rz * R;
  if (y < 0 && x > -1.4 && x < 0.2) y *= 1 + 0.12 * Math.sin((x + 1.4) / 1.6 * Math.PI);
  if (y > 0) y *= 0.94;
  let w = Math.max(0, -sn - 0.35) * 0.7 + clamp((x - 1.2) / 0.7, 0, 1) * 0.35 * (1 - Math.max(0, sn));
  let dim = (sn > -0.2 && Math.sin(x * 5.2 + sn * 1.2) > 0.55) ? 0.55 : 1;   // listras tabby
  if (R > 1.03) dim *= 0.5;
  const j = (Math.random() - 0.5) * 0.3;
  if (x > 0.6 + j) fur(front, x - 0.6, cy + y, z, w, dim);
  else if (x < -0.7 + j) fur(rear, x + 0.7, cy + y, z, w, dim);
  else fur(mid, x, cy + y, z, w, dim);
}

/* pescoço */
segment(neck, [-0.1, -0.1, 0], [0.55, 0.45, 0], 0.44, 0.36, N(600), { zs: 0.85, white: (t, c) => c < -0.3 ? 0.35 : 0 });

/* cabeça: crânio, bochechas, almofadas dos bigodes, ponte do nariz, queixo */
ellipsoid(head, -0.04, 0.05, 0, 0.46, 0.42, 0.46, N(1000), (x, y, z, d) => ({ w: 0, dim: d[1] > 0.3 && Math.sin(z * 28) > 0.6 ? 0.6 : 1 }));
ellipsoid(head, 0.12, -0.12, 0, 0.36, 0.28, 0.5, N(600), (x, y, z, d) => ({ w: d[1] < -0.2 ? 0.25 : 0, dim: 0.65 }));
for (const s of [-1, 1]) ellipsoid(head, 0.42, -0.14, 0.11 * s, 0.15, 0.12, 0.13, N(180), () => ({ w: 0.35, dim: 0.7 }));
ellipsoid(head, 0.33, 0.0, 0, 0.16, 0.1, 0.11, N(120));
ellipsoid(head, 0.35, -0.29, 0, 0.12, 0.07, 0.1, N(70), () => ({ w: 0.6, dim: 1 }));
for (let i = 0; i < N(40); i++) put(head, 0.53 + Math.random() * 0.03, -0.05 + gauss() * 0.025, gauss() * 0.035, PINK, 0.06, 0.9);

/* olhos amendoados, íris dourada, pupila em fenda vertical */
const eyes = [];
for (const s of [-1, 1]) {
  const e = new THREE.Group(); e.position.set(0.43, 0.07, 0.2 * s); e.rotation.y = -0.4 * s; head.add(e); eyes.push(e);
  for (let i = 0; i < N(130); i++) {
    const t = Math.random() * Math.PI * 2, rim = Math.random() < 0.45, rr = rim ? 1 : Math.sqrt(Math.random());
    const ez = Math.cos(t) * 0.11 * rr;
    let ey = Math.sin(t) * 0.07 * rr * (1 - 0.2 * Math.cos(t));
    ey += 0.2 * ez * s;
    if (!rim && Math.abs(ez) < 0.018) continue;
    put(e, 0.02 + 0.03 * (1 - rr * rr), ey, ez, rim ? [0.96, 0.92, 0.88] : mix(GOLD, GREENGOLD, rr * Math.random()), rim ? 0.07 : 0.1, rim ? 0.8 : 1.4);
  }
  put(e, 0.06, 0.03, -0.03 * s, WHITE, 0.12, 1.2);
}

/* orelhas: triângulo de ponta arredondada, em concha */
const ears = [];
const earW = h => Math.sqrt(Math.max(0, 1 - h * h)) * (1 - 0.3 * h);
for (const s of [-1, 1]) {
  const ear = new THREE.Group(); ear.position.set(0.0, 0.32, 0.25 * s); head.add(ear); ears.push(ear);
  const A = [0.15, 0.0, -0.06 * s], B = [-0.17, -0.02, 0.1 * s], C = [0.03, 0.56, 0.17 * s];
  const M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2, (A[2] + B[2]) / 2];
  const H = [(A[0] - B[0]) / 2, (A[1] - B[1]) / 2, (A[2] - B[2]) / 2], U = [C[0] - M[0], C[1] - M[1], C[2] - M[2]];
  for (let i = 0; i < N(440); i++) {
    let h; do { h = Math.random(); } while (Math.random() > earW(h));
    const wv = earW(h), edge = Math.random() < 0.4;
    const sv = edge ? (Math.random() < 0.5 ? -wv : wv) : (Math.random() * 2 - 1) * wv;
    const cup = edge ? 0 : 0.08 * (1 - (sv / (wv || 1)) ** 2) * (1 - h * 0.7) + (Math.random() < 0.35 ? 0.03 : 0);
    const x = M[0] + U[0] * h + H[0] * sv - cup, y = M[1] + U[1] * h + H[1] * sv, z = M[2] + U[2] * h + H[2] * sv;
    if (edge) fur(ear, x, y, z, h > 0.85 ? 0.6 : 0.1, 1.6);
    else put(ear, x, y, z, mix([0.95, 0.62, 0.68], PINK, Math.random() * 0.4), rand(0.06, 0.1), rand(0.3, 0.5));
  }
}

/* bigodes */
for (const s of [-1, 1]) for (let k = 0; k < 4; k++) {
  const o = [0.5, -0.11 - 0.03 * k, 0.15 * s];
  const d = new THREE.Vector3(0.6 - 0.35 * k, 0.15 - 0.1 * k, 0.8 * s).normalize(), len = 0.85 - 0.05 * k, n = N(22);
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    put(head, o[0] + d.x * len * t, o[1] + d.y * len * t - 0.12 * t * t, o[2] + d.z * len * t, [0.96, 0.92, 0.88], 0.045, 0.55 * (1 - 0.5 * t));
  }
}

/* patas: digitígrado, com dedinhos */
function buildPaw(b, len) {
  ellipsoid(b, 0.06, -0.01, 0, len, 0.085, 0.145, N(160), () => ({ w: 0.2, dim: 0.9 }));
  for (let k = 0; k < 4; k++) { const z = -0.09 + k * 0.06; ellipsoid(b, 0.06 + len * 0.85 - Math.abs(z) * 0.5, -0.03, z, 0.05, 0.05, 0.04, N(18), () => ({ w: 0.3, dim: 1 })); }
}
for (const l of FL) {
  segment(l.up, [0, 0.18, 0], [0, -l.L1, 0], 0.26, 0.16, N(450), { zs: 0.7 });
  segment(l.lo, [0, 0, 0], [0, -l.L2, 0], 0.15, 0.105, N(320), { zs: 0.85, white: t => 0.1 * t, dim: () => 1.1 });
  segment(l.en, [0, 0, 0], [0, -l.L3, 0], 0.105, 0.095, N(90), { white: () => 0.15, dim: () => 1.1 });
  buildPaw(l.paw, 0.19);
}
for (const l of RL) {
  segment(l.up, [0, 0.22, 0], [0, -l.L1, 0], 0.42, 0.2, N(800), { zs: 0.62, bulge: t => 1 + 0.18 * Math.sin(Math.PI * t) });
  segment(l.lo, [0, 0, 0], [0, -l.L2, 0], 0.2, 0.1, N(380), { zs: 0.75, shift: t => -0.05 * (1 - t), dim: () => 1.05 });
  segment(l.en, [0, 0, 0], [0, -l.L3, 0], 0.1, 0.085, N(200), { zs: 0.85, white: () => 0.1, dim: () => 1.1 });
  buildPaw(l.paw, 0.21);
}
/* cauda anelada */
tail.forEach((b, i) => {
  const r0 = 0.17 - 0.055 * i / TAIL_N, r1 = 0.17 - 0.055 * (i + 1) / TAIL_N, tip = i === TAIL_N - 1;
  segment(b, [0.04, 0, 0], [-TL, 0, 0], r0 * (tip ? 1.1 : 1), r1 * (tip ? 0.9 : 1), N(130), { zs: 1, white: () => tip ? 0.5 : 0, dim: () => i % 2 ? 0.8 : 1.25 });
});

/* ---------- galáxia espiral (o "planeta" que o gato persegue) ---------- */
const PR = 0.8;   // raio de colisão; o disco visível é um pouco maior
const planet = new THREE.Group(); scene.add(planet);
const tilt = new THREE.Group(); tilt.rotation.set(0.72, 0, 0.4); planet.add(tilt);   // disco inclinado, visto quase de lado
const pSpin = new THREE.Group(); tilt.add(pSpin);
const CORAL = [0.88, 0.40, 0.47], AMBER = [0.90, 0.68, 0.45], CREAM = [1.0, 0.92, 0.80], ROSE = [0.92, 0.45, 0.55];
const CORE = [1.0, 0.93, 0.82], YOUNG = [0.90, 0.90, 1.0];
const GR = 1.5;
/* bojo central com barra, como na Via Láctea */
for (let i = 0; i < N(1300); i++) {
  const bar = Math.random() < 0.55, d = rdir(), r = Math.abs(gauss());
  const x = d[0] * r * (bar ? 0.5 : 0.22), y = d[1] * r * (bar ? 0.14 : 0.2), z = d[2] * r * 0.11;
  put(pSpin, x, y, z, mix(CORE, AMBER, Math.min(1, Math.hypot(x, y) * 2.5) * Math.random()), rand(0.07, 0.13), rand(0.6, 1.1) * (1 - Math.min(0.8, r * 0.6)));
}
/* braços: dois principais saindo das pontas da barra e dois secundários, mais fracos */
for (let i = 0; i < N(4200); i++) {
  const arm = i % 4, major = arm < 2, t = Math.pow(Math.random(), 0.85), r = 0.42 + t * (GR - 0.42);
  const th = (arm === 0 ? 0 : arm === 1 ? Math.PI : arm === 2 ? Math.PI * 0.5 : Math.PI * 1.5) + Math.log(r / 0.42) / 0.42 + gauss() * 0.22;
  const sc = gauss() * 0.11 * (0.55 + t) * (major ? 1 : 1.3);
  const x = Math.cos(th) * r - Math.sin(th) * sc, y = Math.sin(th) * r + Math.cos(th) * sc, z = gauss() * 0.025;
  const dim = major ? 1 : 0.55;
  if (Math.random() < 0.03 * dim) { put(pSpin, x, y, z, mix(YOUNG, WHITE, 0.5), rand(0.12, 0.2), 0.9); continue; }
  const c = mix(mix(AMBER, ROSE, Math.min(1, t * 1.3)), Math.random() < 0.35 ? CREAM : CORAL, Math.random() * 0.45);
  put(pSpin, x, y, z, c, rand(0.06, 0.11), rand(0.3, 0.55) * (1 - 0.45 * t) * dim);
}
/* disco difuso entre os braços */
for (let i = 0; i < N(1600); i++) {
  const r = Math.pow(Math.random(), 0.6) * GR, a = Math.random() * Math.PI * 2;
  put(pSpin, Math.cos(a) * r, Math.sin(a) * r, gauss() * 0.03, mix(ROSE, CREAM, Math.random() * 0.5), rand(0.05, 0.09), 0.2 * (1 - 0.6 * r / GR));
}
/* halo esparso de estrelas velhas */
for (let i = 0; i < N(220); i++) {
  const d = rdir(), r = rand(0.3, GR * 1.15);
  put(pSpin, d[0] * r, d[1] * r, d[2] * r * 0.5, CREAM, rand(0.05, 0.08), 0.18);
}
finalize();

/* rastro de poeira estelar */
const TRAIL = N(350);
const tGeo = new THREE.BufferGeometry();
const tPos = new Float32Array(TRAIL * 3), tCol = new Float32Array(TRAIL * 3), tSize = new Float32Array(TRAIL), tSeed = new Float32Array(TRAIL), tBr = new Float32Array(TRAIL);
const tVel = new Float32Array(TRAIL * 3), tLife = new Float32Array(TRAIL);
for (let i = 0; i < TRAIL; i++) tSeed[i] = Math.random();
tGeo.setAttribute('position', new THREE.BufferAttribute(tPos, 3));
tGeo.setAttribute('aColor', new THREE.BufferAttribute(tCol, 3));
tGeo.setAttribute('aSize', new THREE.BufferAttribute(tSize, 1));
tGeo.setAttribute('aSeed', new THREE.BufferAttribute(tSeed, 1));
tGeo.setAttribute('aBright', new THREE.BufferAttribute(tBr, 1));
const trailPts = new THREE.Points(tGeo, mat); trailPts.frustumCulled = false; scene.add(trailPts);
let tIdx = 0, trailAcc = 0, trailSpawned = false, trailAlive = 0;
function spawn(p, spread = 0.35, speed = 0.4) {
  const i = tIdx++ % TRAIL, c = [CORAL, AMBER, CREAM, WHITE][(Math.random() * 4) | 0];
  tPos[i * 3] = p.x + gauss() * spread; tPos[i * 3 + 1] = p.y + gauss() * spread; tPos[i * 3 + 2] = gauss() * spread;
  tVel[i * 3] = gauss() * speed; tVel[i * 3 + 1] = gauss() * speed + 0.2; tVel[i * 3 + 2] = gauss() * speed;
  tCol.set(c, i * 3); tSize[i] = rand(0.08, 0.18); tLife[i] = 1;
  trailSpawned = true;
}
const burst = (p, n) => { for (let i = 0; i < n; i++) spawn(p, 0.25, 1.6); };

/* ---------- câmera, limites ---------- */
const view = { xMin: -9, xMax: 9, yMin: -5, yMax: 5 };
/* The canvas is larger than `stage` and fades out at its edges (CSS), so nothing is ever cut by a hard border.
   The cat and the galaxy are kept inside the stage's box; the extra canvas only catches particles and trails. */
function resize() {
  const cv = renderer.domElement;
  const w = cv.clientWidth || stage.clientWidth || innerWidth, h = cv.clientHeight || stage.clientHeight || innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  const cr = cv.getBoundingClientRect(), zr = stage.getBoundingClientRect();
  const fx0 = cr.width ? clamp((zr.left - cr.left) / cr.width, 0, 1) : 0, fx1 = cr.width ? clamp((zr.right - cr.left) / cr.width, 0, 1) : 1;
  const fy0 = cr.height ? clamp((zr.top - cr.top) / cr.height, 0, 1) : 0, fy1 = cr.height ? clamp((zr.bottom - cr.top) / cr.height, 0, 1) : 1;
  const zw = Math.max(fx1 - fx0, 0.2), zh = Math.max(fy1 - fy0, 0.2);
  const tanH = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const minW = (zr.width / (zr.height || 1)) < 1 ? 10.5 : 18;
  /* frame the stage, not the whole canvas: the stage is `zw` of the canvas width and `zh` of its height */
  const dist = Math.max(minW / (2 * tanH * camera.aspect * zw), 10 / (2 * tanH * zh));
  const vh = 2 * dist * tanH, vw = vh * camera.aspect;
  /* aim the camera at the stage's centre, which need not be the canvas centre */
  const cx = -vw / 2 + vw * (fx0 + fx1) / 2, cy = vh / 2 - vh * (fy0 + fy1) / 2;
  camera.position.set(cx, cy + 0.6, dist);
  camera.lookAt(cx, cy, 0);
  camera.updateProjectionMatrix();
  cvRect = null;
  view.xMin = -vw / 2 + vw * fx0 + 0.2; view.xMax = -vw / 2 + vw * fx1 - 0.2;
  view.yMin = vh / 2 - vh * fy1 + 0.3; view.yMax = vh / 2 - vh * fy0 - 0.3;
  uniforms.uScale.value = renderer.domElement.height / (2 * tanH);
}
const ro = new ResizeObserver(resize); ro.observe(stage);
resize();

/* ---------- estado ---------- */
const P = { pinned: false, vis: 1, homing: false, pinT: new THREE.Vector3(), visT: 1, pos: new THREE.Vector3(view.xMax * 0.35, 1.5, 0), vel: new THREE.Vector3(-2.5, -0.5, 0), spin: 0.4, grabbed: false, target: new THREE.Vector3(), wob: 0, wobV: 0 };
const cat = {
  x: view.xMin * 0.4, y: 0, vx: 0, vy: 0, side: -1, facing: 1,
  frontY: 0, midY: 0, rearY: 0, tailY: 0, pitch: 0, st: 0, sw: 0,
  act: null, cool: 0.8, hits: 0, holdT: 0,
  sq: 1, sqV: 0, fz: 0, rz: 0, wig: 0, eye: 1, tuck: 0,
  hy: 0, hp: 0, lookCamT: 0, slowBlink: false, bl: null, blinkT: 3, ear: null, earT: 2, flat: 0,
  tail: [-0.15, 0.06, 0.28, 1.8, 0]
};
const _v = new THREE.Vector3(), _v2 = new THREE.Vector3(), _d = new THREE.Vector3(), _n = new THREE.Vector3(), plN = new THREE.Vector3();
const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _q3 = new THREE.Quaternion(), _prev = new THREE.Vector3();
const easeOutBack = t => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2; };
const SH_F = new THREE.Vector3(1.35, -0.2, 0), HIP = new THREE.Vector3(-1.45, -0.05, 0);   // ombro e quadril no referencial do corpo
const ARM = 0.6;   // segundos segurando até o gato armar o bote

/* ---------- interação: arrastar e arremessar ---------- */
const cv = renderer.domElement;
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), _hit = new THREE.Vector3();
const grabOff = new THREE.Vector3(), hist = [];
const GRAB_R = Math.max(PR * 2.2, 1.3);
const staleRect = () => { cvRect = null; };
addEventListener('scroll', staleRect, { passive: true });
function toWorld(e) {
  const r = cvRect || (cvRect = cv.getBoundingClientRect());
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  return ray.ray.intersectPlane(plane, _hit);
}
cv.addEventListener('pointerdown', e => {
  const w = toWorld(e); if (!w) return;
  if (!P.pinned && w.distanceTo(P.pos) < GRAB_R) {
    P.grabbed = true; grabOff.subVectors(P.pos, w); P.target.copy(P.pos);
    hist.length = 0; hist.push({ x: P.pos.x, y: P.pos.y, t: performance.now() });
    cv.setPointerCapture(e.pointerId); cv.style.cursor = 'grabbing';
    if (hint) hint.classList.add('off'); cat.act = null;
  }
});
cv.addEventListener('pointermove', e => {
  const w = toWorld(e); if (!w) return;
  if (P.grabbed) {
    P.target.set(w.x + grabOff.x, w.y + grabOff.y, 0);
    const now = performance.now();
    hist.push({ x: P.target.x, y: P.target.y, t: now });
    while (hist.length > 2 && now - hist[0].t > 110) hist.shift();
  } else cv.style.cursor = w.distanceTo(P.pos) < GRAB_R ? 'grab' : 'default';
});
function release() {
  if (!P.grabbed) return;
  P.grabbed = false;
  const armed = cat.holdT >= ARM;
  let vx = 0, vy = 0;
  const now = performance.now();
  if (hist.length >= 2) {
    const a = hist[0], b = hist[hist.length - 1], dt = Math.max((b.t - a.t) / 1000, 0.016);
    if (now - b.t < 120) { vx = (b.x - a.x) / dt; vy = (b.y - a.y) / dt; }
  }
  const sp = Math.hypot(vx, vy), mx = 20;
  if (sp > mx) { vx *= mx / sp; vy *= mx / sp; }
  P.vel.set(vx, vy, 0); P.spin = -vx / PR * 0.5;
  cv.style.cursor = 'grab';
  if (armed) startLeap();
}
cv.addEventListener('pointerup', release);
/* on phones the canvas lets the page scroll (touch-action: pan-y); a touch that starts on the galaxy
   takes the gesture instead, so it can be dragged and thrown in any direction */
const holdTouch = e => { if (P.grabbed) e.preventDefault(); };
cv.addEventListener('touchstart', holdTouch, { passive: false });
cv.addEventListener('touchmove', holdTouch, { passive: false });
cv.addEventListener('pointercancel', release);

/* ---------- ações ---------- */
function startLeap() {
  cat.facing = P.pos.x - cat.x >= 0 ? 1 : -1; cat.side = -cat.facing;
  cat.act = { type: 'leap', t: 0, dur: 0.85, sx: cat.x, sy: cat.y, hit: false, ex: null, ey: 0 };
  cat.sqV += 4;
}
const startTap = () => { cat.act = { type: 'tap', t: 0, dur: 0.5, legs: [cat.facing > 0 ? FL[1] : FL[0]], hit: false }; };
const startKick = () => { cat.act = { type: 'kick', t: 0, dur: 0.6, legs: RL, hit: false }; };
const startStalk = () => { cat.act = { type: 'stalk', t: 0, dur: 1.3 }; };
const blink = d => { cat.bl = { p: 0, d }; };

function hitPlanet(power, dx, dy) {
  const l = Math.hypot(dx, dy) || 1;
  P.vel.set(dx / l * power + cat.vx * 0.3, dy / l * power + cat.vy * 0.3, 0);
  P.spin = -(Math.sign(dx) || cat.facing) * power * 0.5;
  P.wobV += power * 0.6;
  cat.hits++;
  burst(P.pos, Math.round(power * 3));
}

/* ---------- colisão macia e mútua (os dois flutuam, então os dois se empurram) ---------- */
function collideCat() {
  _v.copy(P.pos); body.worldToLocal(_v);
  const ax = 2.05 + PR, ay = 0.8 + PR, az = 0.6 + PR;
  const rx = _v.x / ax, ry = _v.y / ay, rz = _v.z / az, e = rx * rx + ry * ry + rz * rz;
  if (e < 1) {
    if (cat.act && cat.act.type === 'leap' && !cat.act.hit) {
      cat.act.hit = true; head.getWorldPosition(_d);
      hitPlanet(rand(14, 18), P.pos.x - _d.x + cat.facing, P.pos.y - _d.y); return;
    }
    _d.copy(_v).multiplyScalar(1 / Math.sqrt(Math.max(e, 1e-4))); body.localToWorld(_d);
    const cx = _d.x - P.pos.x, cy = _d.y - P.pos.y;
    P.pos.x += cx * 0.8; P.pos.y += cy * 0.8; cat.x -= cx * 0.2; cat.y -= cy * 0.2;
    body.getWorldQuaternion(_q);
    _n.set(rx / ax, ry / ay, rz / az).applyQuaternion(_q); _n.z = 0; _n.normalize();
    bounce(_n.x, _n.y);
  }
  head.getWorldPosition(_v);
  const dx = P.pos.x - _v.x, dy = P.pos.y - _v.y, d = Math.hypot(dx, dy), m = 0.6 + PR;
  if (d < m && d > 1e-4) {
    const nx = dx / d, ny = dy / d, pen = m - d;
    P.pos.x += nx * pen * 0.8; P.pos.y += ny * pen * 0.8; cat.x -= nx * pen * 0.2; cat.y -= ny * pen * 0.2;
    bounce(nx, ny);
  }
}
function bounce(nx, ny) {
  const vn = (P.vel.x - cat.vx) * nx + (P.vel.y - cat.vy) * ny;
  if (vn < 0) {
    const j = -1.5 * vn;
    P.vel.x += j * nx * 0.8; P.vel.y += j * ny * 0.8; cat.vx -= j * nx * 0.2; cat.vy -= j * ny * 0.2;
    P.wobV += Math.min(4, j * 0.4);
    if (vn < -3) cat.flat = 1;
  }
}
function stepPlanet(dt, time) {
  const x0 = view.xMin + PR, x1 = view.xMax - PR, y0 = view.yMin + PR, y1 = view.yMax - PR;
  if (P.pinned) {
    _prev.copy(P.pos);
    P.pos.lerp(P.pinT, damp(P.homing ? 3.2 : 14, dt));
    P.vel.subVectors(P.pos, _prev).divideScalar(Math.max(dt, 1e-3));
    if (P.homing && P.pos.distanceTo(P.pinT) < 0.35) P.homing = false;
    const vt = P.homing ? 1 : P.visT;                     // stays whole while flying home, then shrinks into the point
    P.vis += (vt - P.vis) * damp(P.homing ? 20 : 10, dt);
    P.spin = lerp(7, 0.6, P.vis) * (P.homing ? 1.6 : 1);   // spins up as it collapses
  } else if (P.grabbed) {
    _prev.copy(P.pos);
    const k = damp(26, dt);
    P.pos.x = clamp(lerp(P.pos.x, P.target.x, k), x0, x1);
    P.pos.y = clamp(lerp(P.pos.y, P.target.y, k), y0, y1);
    P.vel.subVectors(P.pos, _prev).divideScalar(Math.max(dt, 1e-3));
  } else {
    P.pos.addScaledVector(P.vel, dt);
    P.vel.multiplyScalar(Math.exp(-0.5 * dt));
    if (P.vel.lengthSq() < 0.0004) P.vel.set(0, 0, 0);
    if (P.pos.x < x0) { P.pos.x = x0; P.vel.x = Math.abs(P.vel.x) * 0.7; P.wobV += 3; }
    if (P.pos.x > x1) { P.pos.x = x1; P.vel.x = -Math.abs(P.vel.x) * 0.7; P.wobV += 3; }
    if (P.pos.y < y0) { P.pos.y = y0; P.vel.y = Math.abs(P.vel.y) * 0.7; P.wobV += 3; }
    if (P.pos.y > y1) { P.pos.y = y1; P.vel.y = -Math.abs(P.vel.y) * 0.7; P.wobV += 3; }
    const m = 1.6, push = 1.2 * dt;
    if (P.pos.x < view.xMin + m) P.vel.x += push; if (P.pos.x > view.xMax - m) P.vel.x -= push;
    if (P.pos.y < view.yMin + m) P.vel.y += push; if (P.pos.y > view.yMax - m) P.vel.y -= push;
    collideCat();
  }
  P.spin = lerp(P.spin, 0.25, damp(0.6, dt));
  pSpin.rotation.z += P.spin * dt;
  P.wobV += (-P.wob * 220 - P.wobV * 9) * dt; P.wob += P.wobV * dt;
  planet.position.set(P.pos.x, P.pos.y + Math.sin(time * 1.1) * 0.06, 0);
  planet.scale.set((1 + P.wob * 0.12) * P.vis, (1 - P.wob * 0.12) * P.vis, P.vis);
  const sp = P.vel.length();
  if (sp > 2.5) { trailAcc += dt * sp * 14; while (trailAcc > 1) { trailAcc--; spawn(P.pos); } }
}

/* ---------- IK de 2 ossos + segmento final + pata (no referencial do corpo) ---------- */
function solveLeg(leg, fx, fy, fz, endAng, pawAng) {
  const par = leg.up.parent;
  _v.set(fx, fy, fz); body.localToWorld(_v); par.worldToLocal(_v);
  body.getWorldQuaternion(_q2); par.getWorldQuaternion(_q);
  _q3.copy(_q2).invert().multiply(_q).invert();
  _d.set(Math.cos(endAng), Math.sin(endAng), 0).applyQuaternion(_q3); const aE = Math.atan2(_d.y, _d.x);
  _d.set(Math.cos(pawAng), Math.sin(pawAng), 0).applyQuaternion(_q3); const aP = Math.atan2(_d.y, _d.x);
  const wx = _v.x - leg.L3 * Math.cos(aE), wy = _v.y - leg.L3 * Math.sin(aE);
  const sx = leg.up.position.x, sy = leg.up.position.y, L1 = leg.L1, L2 = leg.L2;
  const vx = wx - sx, vy = wy - sy;
  const d = clamp(Math.hypot(vx, vy), Math.abs(L1 - L2) + 0.05, L1 + L2 - 0.005);
  const base = Math.atan2(vy, vx);
  const A = Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
  const a1 = leg.kind === 'f' ? base - A : base + A;   // cotovelo para trás, joelho para frente
  const ex = sx + L1 * Math.cos(a1), ey = sy + L1 * Math.sin(a1);
  const a2 = Math.atan2(wy - ey, wx - ex);
  leg.up.rotation.z = a1 + Math.PI / 2;
  leg.lo.rotation.z = a2 - a1;
  leg.en.rotation.z = aE - a2;
  leg.paw.rotation.z = aP - aE - Math.PI / 2;
}
/* trajetória de golpe genérica: prepara, acerta passando um pouco através do planeta, volta ao repouso */
function strike(u, r, o, pl, rear) {
  const dx = pl.x - o.x, dy = pl.y - o.y, l = Math.hypot(dx, dy) || 1, nx = dx / l, ny = dy / l;
  const kx = pl.x - nx * (PR - 0.25), ky = pl.y - ny * (PR - 0.25);
  const near = a => { while (a - r[2] > Math.PI) a -= 2 * Math.PI; while (a - r[2] < -Math.PI) a += 2 * Math.PI; return a; };
  const aim = Math.atan2(ny, nx);
  const sea = near(rear ? aim : aim - 0.4), spa = near(rear ? aim : aim - 0.6);
  const wx = rear ? o.x + 0.35 : lerp(r[0], kx, 0.25) - 0.15, wy = rear ? o.y - 0.6 : Math.max(r[1], ky) + 0.8;
  const wea = rear ? -1.0 : -0.2, wpa = rear ? -0.8 : -0.6;
  let k;
  if (u < 0.42) { k = ease(u / 0.42); return [lerp(r[0], wx, k), lerp(r[1], wy, k), lerp(r[2], wea, k), lerp(r[3], wpa, k)]; }
  if (u < 0.6) { k = ease((u - 0.42) / 0.18); return [lerp(wx, kx, k), lerp(wy, ky, k), lerp(wea, sea, k), lerp(wpa, spa, k)]; }
  k = ease(Math.min(1, (u - 0.6) / 0.4));
  return [lerp(kx, r[0], k), lerp(ky, r[1], k) + (rear ? 0 : 0.2 * Math.sin(Math.PI * k)), lerp(sea, r[2], k), lerp(spa, r[3], k)];
}
const LEGS = [[FL[0], 0], [FL[1], Math.PI], [RL[0], Math.PI / 2], [RL[1], Math.PI * 1.5]];
const T_IDLE = [-0.15, 0.06, 0.28, 1.8, 0], T_SWIM = [0.0, 0.02, 0.14, 4, 0], T_STALK = [0.25, 0.02, 0.35, 9, 1], T_LEAP = [0.05, -0.01, 0.05, 6, 0];

/* ---------- loop ---------- */
let time = 0, last = performance.now(), running = false, raf = 0;
function frame(now) {
  if (!running) { raf = 0; return; }
  const dt = Math.min((now - last) / 1000, 1 / 30) || 1 / 60; last = now; time += dt;
  uniforms.uTime.value = time;
  stepPlanet(dt, time);

  const cx0 = Math.min(view.xMin + 2.9, 0), cx1 = Math.max(view.xMax - 2.9, 0);
  const cy0 = Math.min(view.yMin + 2.3, 0), cy1 = Math.max(view.yMax - 1.9, 0);
  if (P.grabbed) cat.holdT += dt; else cat.holdT = 0;
  const armed = P.grabbed && cat.holdT >= ARM;
  if (P.grabbed) { cat.act = null; cat.lookCamT = 0; }

  /* lado de aproximação: fica do lado mais perto do planeta, troca só quando compensa */
  let back = P.pinned ? 4.6 : 3.0;   // gives the forming galaxy some room
  if (cat.act && cat.act.type === 'stalk') back += 0.8 * ease(Math.min(1, cat.act.t / 0.5));
  const spot = sd => [clamp(P.pos.x + sd * back, cx0, cx1), clamp(P.pos.y + 0.5, cy0, cy1)];
  if (!cat.act) {
    if (armed) {
      const want = Math.sign(P.pos.x - cat.x) || cat.facing;
      if (want !== cat.facing && Math.abs(P.pos.x - cat.x) > 0.4) cat.side = -want;
    } else {
      const s1 = spot(cat.side), s2 = spot(-cat.side);
      const d1 = Math.hypot(s1[0] - cat.x, s1[1] - cat.y), d2 = Math.hypot(s2[0] - cat.x, s2[1] - cat.y);
      const bad1 = (s1[0] - P.pos.x) * cat.side < 2.0, bad2 = (s2[0] - P.pos.x) * -cat.side < 2.0;   // lado sem espaço (prensado na borda)
      /* espaço livre na direção do golpe: evita ficar batendo o planeta contra a parede */
      const room = sd => sd < 0 ? view.xMax - P.pos.x : P.pos.x - view.xMin;
      const cramped = room(cat.side) < 4.5 && room(-cat.side) > 6;
      if (!bad2 && (bad1 || cramped || d2 < d1 - 1.5)) cat.side = -cat.side;
    }
  }
  cat.facing = -cat.side;
  const Y = cat.facing > 0 ? 0 : -Math.PI;
  /* coluna em cadeia: cabeça e peito viram primeiro, quadril e cauda seguem */
  cat.frontY = lerp(cat.frontY, Y, damp(7, dt));
  cat.midY = lerp(cat.midY, Y, damp(4.2, dt));
  cat.rearY = lerp(cat.rearY, Y, damp(3, dt));
  cat.tailY = lerp(cat.tailY, Y, damp(2, dt));
  const [tx, ty] = armed ? [cat.x, cat.y] : spot(cat.side);

  /* ações em andamento */
  let poseF = 0, poseR = 0, sqT = 1, wigT = 0, eyeT = 1, tuckT = 0, tailP = null, leapW = 0;
  if (armed) {
    poseF = -0.26; poseR = 0.42; sqT = 0.82; tuckT = 1; eyeT = 1.3; tailP = T_STALK;
    wigT = Math.min(1, 0.3 + (cat.holdT - ARM) * 0.6);
  }
  cat.cool -= dt;
  if (cat.act) {
    const A = cat.act; A.t += dt; const u = A.t / A.dur;
    if (A.type === 'stalk') {
      poseF = -0.26; poseR = 0.42; sqT = 0.82; wigT = 0.4 + 0.8 * u; eyeT = 1.3; tuckT = 1; tailP = T_STALK;
      if (P.vel.length() > 1.2) cat.act = null;
      else if (u >= 1) { cat.act = { type: 'leap', t: 0, dur: 0.8, sx: cat.x, sy: cat.y, hit: false, ex: null, ey: 0 }; cat.sqV += 4; }
    } else if (A.type === 'leap') {
      eyeT = 1.2; tailP = T_LEAP; poseF = 0.1; poseR = -0.06;
      if (A.ex === null) {
        const px = P.pos.x + P.vel.x * 0.3, py = P.pos.y + P.vel.y * 0.3;
        let ex = px - cat.facing * 1.6 - A.sx, ey = py + 0.4 - A.sy;
        const L = Math.hypot(ex, ey); if (L > 7) { ex *= 7 / L; ey *= 7 / L; }
        A.ex = clamp(A.sx + ex, cx0, cx1); A.ey = clamp(A.sy + ey, cy0, cy1);
      }
      const k = Math.min(1, u / 0.55), e = easeOutBack(k);
      const nx = lerp(A.sx, A.ex, e), ny = lerp(A.sy, A.ey, e) + Math.sin(Math.PI * k) * 0.4;
      cat.vx = (nx - cat.x) / dt; cat.vy = (ny - cat.y) / dt; cat.x = nx; cat.y = ny;
      sqT = u < 0.35 ? 1.32 : 1;
      leapW = u < 0.6 ? 1 : 1 - ease((u - 0.6) / 0.4);
      if (!A.hit && u < 0.7) for (const l of FL) {
        l.paw.getWorldPosition(_v);
        if (_v.distanceTo(P.pos) < PR + 0.4) { A.hit = true; head.getWorldPosition(_d); hitPlanet(rand(14, 18), P.pos.x - _d.x + cat.facing, P.pos.y - _d.y); break; }
      }
      if (u >= 1) {
        cat.act = null; cat.vx = cat.facing * 1.2; cat.vy = 0; cat.sqV -= 3; cat.cool = rand(0.8, 1.5);
        if (Math.random() < 0.45) { cat.lookCamT = rand(1.8, 2.8); cat.slowBlink = Math.random() < 0.7; }
      }
    } else {   // tap (pata da frente) ou kick (coelhinho com as de trás)
      const kick = A.type === 'kick';
      poseF = kick ? 0.05 : -0.06; poseR = kick ? -0.18 : 0; if (kick) { tailP = T_STALK; eyeT = 1.2; }
      if (!A.hit && u > 0.45 && u < 0.78) for (const l of A.legs) {
        l.paw.getWorldPosition(_v);
        if (_v.distanceTo(P.pos) < PR + 0.4) {
          A.hit = true; l.up.getWorldPosition(_d);
          const dx = P.pos.x - _d.x, dy = P.pos.y - _d.y, ll = Math.hypot(dx, dy) || 1;
          if (kick) hitPlanet(rand(8, 11), dx, dy);
          else {
            /* perto da parede: em vez de prensar o planeta, devolve para o meio da tela */
            const ahead = cat.facing > 0 ? view.xMax - P.pos.x : P.pos.x - view.xMin;
            let hx = dx / ll + cat.facing * 0.5, hy = dy / ll + rand(-0.35, 0.55);
            let pw = rand(6.5, 9);
            if (ahead < 5) {   /* cavada: lança por cima/por baixo do próprio gato, para o outro lado da tela */
              hx = -cat.facing * rand(0.8, 1); hy = (P.pos.y >= cat.y ? 1 : -1) * rand(0.35, 0.6); pw = rand(10, 13);
            }
            if (view.yMax - P.pos.y < 2) hy = -Math.abs(hy) - 0.3;
            if (P.pos.y - view.yMin < 2) hy = Math.abs(hy) + 0.3;
            hitPlanet(pw, hx, hy);
          }
          break;
        }
      }
      if (u >= 1) {
        cat.act = null; cat.cool = kick ? rand(0.6, 1.1) : rand(0.25, 0.8);
        if (Math.random() < 0.2) { cat.lookCamT = rand(1.6, 2.4); cat.slowBlink = Math.random() < 0.6; }
      }
    }
  }

  /* nado: mola criticamente amortecida + desvio do planeta (contorna em vez de atravessar) */
  if (!(cat.act && cat.act.type === 'leap')) {
    const k = 9, c = 2 * Math.sqrt(k);
    let ax = (tx - cat.x) * k - cat.vx * c, ay = (ty - cat.y) * k - cat.vy * c;
    const rdx = cat.x - P.pos.x, rdy = cat.y - P.pos.y, q = (rdx / 2.7) ** 2 + (rdy / 1.7) ** 2;
    if (q < 1 && !armed) { const f = (1 - q) * 40; ax += f * rdx / 2.7; ay += f * (rdy / 1.7 + (rdy >= 0 ? 0.5 : -0.5)); }
    const am = Math.hypot(ax, ay); if (am > 32) { ax *= 32 / am; ay *= 32 / am; }
    cat.vx += ax * dt; cat.vy += ay * dt;
    const vm = Math.hypot(cat.vx, cat.vy); if (vm > 9) { cat.vx *= 9 / vm; cat.vy *= 9 / vm; }
    cat.x += cat.vx * dt; cat.y += cat.vy * dt;
  }
  const speed = Math.hypot(cat.vx, cat.vy);

  /* reflexo: se o planeta está ao alcance, bate na hora (pata da frente ou chute de coelhinho) */
  _v2.copy(P.pos); body.worldToLocal(_v2);
  const df = Math.hypot(_v2.x - SH_F.x, _v2.y - SH_F.y), dr = Math.hypot(_v2.x - HIP.x, _v2.y - HIP.y);
  const frontOK = df < 2.5 && df > 0.75 && _v2.x > 0.7 && Math.abs(_v2.z) < 1.2;
  const rearOK = dr < 2.4 && _v2.y < -0.4 && _v2.x < 0.7 && _v2.x > -3.3 && Math.abs(_v2.z) < 1.2;
  if (!cat.act && !P.grabbed && !P.pinned && cat.cool <= 0 && Math.abs(Y - cat.frontY) < 0.5 && P.vel.length() < 9) {
    if (frontOK) {
      const calm = P.vel.length() < 0.7 && speed < 1 && cat.hits >= 1;
      if (calm && Math.random() < 0.35) startStalk(); else startTap();
      cat.lookCamT = 0;
    } else if (rearOK) { startKick(); cat.lookCamT = 0; }
  }
  if (cat.lookCamT > 0) {
    cat.lookCamT -= dt;
    if (cat.slowBlink && cat.lookCamT < 1.3) { cat.slowBlink = false; blink(1.1); }
  }
  const lookCam = cat.lookCamT > 0 && !cat.act && !P.grabbed;

  /* postura (tudo suavizado) */
  cat.fz += (poseF - cat.fz) * damp(8, dt);
  cat.rz += (poseR - cat.rz) * damp(8, dt);
  cat.wig += (wigT - cat.wig) * damp(6, dt);
  cat.eye += (eyeT - cat.eye) * damp(10, dt);
  cat.tuck += (tuckT - cat.tuck) * damp(6, dt);
  cat.sqV += ((sqT - cat.sq) * 160 - cat.sqV * 11) * dt; cat.sq = clamp(cat.sq + cat.sqV * dt, 0.6, 1.5);
  cat.st += (clamp(speed / 6, 0, 1) - cat.st) * damp(4, dt);
  const moving = speed > 0.8 || (cat.act && cat.act.type === 'leap');
  const pitchT = moving ? clamp(Math.atan2(cat.vy, Math.abs(cat.vx) + 0.8), -0.55, 0.55) * 0.8 : -0.08 - 0.14 * cat.tuck;
  cat.pitch += (pitchT - cat.pitch) * damp(4, dt);
  cat.sw += dt * (1.5 + 1.9 * Math.min(speed, 7));

  const isq = 1 / Math.sqrt(cat.sq);
  root.position.set(cat.x, cat.y + Math.sin(time * 1.3) * 0.08, 0);
  root.rotation.y = cat.midY;
  body.rotation.set(clamp((cat.frontY - cat.rearY) * 0.25, -0.35, 0.35), 0, cat.pitch);
  body.scale.set(cat.sq, isq, isq);
  front.rotation.set(0, clamp(cat.frontY - cat.midY, -1, 1), cat.fz + 0.03 * Math.sin(cat.sw) * cat.st);
  rear.rotation.set(0, clamp(cat.rearY - cat.midY, -1, 1) + Math.sin(time * 18) * 0.2 * cat.wig, cat.rz - 0.03 * Math.sin(cat.sw) * cat.st);
  const br = 1 + 0.015 * Math.sin(time * 2.2);
  mid.scale.set(1, br, br);
  neck.rotation.z = cat.fz * 1.2 + 0.05 * Math.sin(time * 0.8) + 0.4 * cat.hp;
  root.updateMatrixWorld(true);

  /* cabeça segue o planeta (ou olha para você) */
  _v.copy(lookCam ? camera.position : P.pos); neck.worldToLocal(_v).sub(head.position);
  const hy = clamp(Math.atan2(-_v.z, _v.x), -1.1, 1.1), hp = clamp(Math.atan2(_v.y, Math.hypot(_v.x, _v.z)), -0.45, 0.45);
  cat.hy += (hy - cat.hy) * damp(8, dt); cat.hp += (hp - cat.hp) * damp(8, dt);
  head.rotation.set(0.08 * Math.sin(time * 0.6), cat.hy, cat.hp);
  head.updateMatrixWorld(true);

  /* pernas: pedalada no espaço, esticadas em velocidade, encolhidas na tocaia */
  const st = cat.st, amp = 1 - 0.7 * cat.tuck;
  const Am = (0.16 + 0.28 * st) * amp, Bm = (0.12 + 0.18 * st) * amp;
  plN.copy(P.pos); body.worldToLocal(plN);
  for (const [leg, off] of LEGS) {
    const isF = leg.kind === 'f', ph = cat.sw + off, cs = Math.cos(ph), sn = Math.sin(ph);
    let r;
    if (isF) {
      const nx = lerp(lerp(1.55, 2.05, st), 1.45, cat.tuck), ny = lerp(lerp(-1.5, -1.0, st), -1.15, cat.tuck);
      r = [nx + Am * cs, ny + Bm * sn, lerp(-1.25, -0.5, st) + 0.45 * Math.sin(ph + 0.6) * amp, -0.35 + 0.35 * sn * amp];
    } else {
      const nx = lerp(lerp(-1.85, -3.0, st), -1.55, cat.tuck), ny = lerp(lerp(-1.4, -0.75, st), -1.15, cat.tuck);
      r = [nx + Am * cs, ny + Bm * sn, lerp(-1.5, -2.7, st) + 0.35 * sn * amp, lerp(-0.3, -2.7, st) + 0.3 * sn * amp];
    }
    const A = cat.act;
    if (A && (A.type === 'tap' || A.type === 'kick') && A.legs.includes(leg)) r = strike(A.t / A.dur, r, isF ? SH_F : HIP, plN, !isF);
    if (leapW > 0) {
      const o = isF ? [plN.x - 0.45, plN.y + 0.15 + leg.side * 0.05, -0.25, -0.4] : [-3.1, -0.45, -2.9, -3.0];
      for (let i = 0; i < 4; i++) r[i] = lerp(r[i], o[i], leapW);
    }
    solveLeg(leg, r[0], r[1], leg.side * (isF ? 0.28 : 0.33), r[2], r[3]);
  }

  /* cauda: atrasa na virada (chicote) e chicoteia na tocaia */
  const tp = tailP || (speed > 1.5 ? T_SWIM : T_IDLE);
  for (let i = 0; i < 5; i++) cat.tail[i] += (tp[i] - cat.tail[i]) * damp(3, dt);
  const lag = clamp(cat.tailY - cat.rearY, -1, 1);
  tail.forEach((b, i) => {
    const k = i / (TAIL_N - 1), T = cat.tail;
    const ta = T[2] * lerp(0.3 + k, k * k * 1.8, T[4]);
    b.rotation.z = (i === 0 ? T[0] : T[1]) + Math.sin(time * T[3] - i * 0.6) * ta;
    b.rotation.y = Math.sin(time * T[3] * 0.5 - i * 0.45) * 0.08 * k + (i === 0 ? lag * 0.6 : i < 3 ? lag * 0.2 : 0);
  });

  /* orelhas */
  cat.earT -= dt;
  if (cat.earT <= 0) { cat.ear = { i: Math.random() < 0.5 ? 0 : 1, p: 0 }; cat.earT = rand(1.5, 4.5); }
  cat.flat *= Math.exp(-2.5 * dt);
  ears.forEach((e, i) => {
    const s = i ? 1 : -1;
    const tw = cat.ear && cat.ear.i === i ? Math.sin(Math.PI * Math.min(1, cat.ear.p)) : 0;
    e.rotation.x = s * (0.45 * tw + 0.35 * cat.flat + 0.15 * cat.tuck);
    e.rotation.z = -0.2 * cat.tuck + 0.6 * cat.flat;
  });
  if (cat.ear) { cat.ear.p += dt / 0.22; if (cat.ear.p >= 1) cat.ear = null; }

  /* piscadas (inclui a piscada lenta de carinho) e olhos arregalados na tocaia */
  cat.blinkT -= dt;
  if (cat.blinkT <= 0 && !cat.bl) { blink(0.16); cat.blinkT = rand(2.5, 6); }
  let ek = 0;
  if (cat.bl) {
    cat.bl.p += dt / cat.bl.d;
    ek = cat.bl.d > 0.5 ? clamp(Math.sin(Math.PI * cat.bl.p) * 1.7, 0, 1) : Math.sin(Math.PI * Math.min(1, cat.bl.p));
    if (cat.bl.p >= 1) cat.bl = null;
  }
  eyes.forEach(e => e.scale.set(cat.eye, cat.eye * (1 - 0.88 * ek), cat.eye));

  /* rastro */
  const wasAlive = trailAlive; trailAlive = 0;
  for (let i = 0; i < TRAIL; i++) {
    if (tLife[i] <= 0) { tBr[i] = 0; continue; }
    tLife[i] -= dt * 0.9; trailAlive++;
    tPos[i * 3] += tVel[i * 3] * dt; tPos[i * 3 + 1] += tVel[i * 3 + 1] * dt; tPos[i * 3 + 2] += tVel[i * 3 + 2] * dt;
    tBr[i] = Math.max(0, tLife[i]) * 0.8;
  }
  if (trailAlive || wasAlive) { tGeo.attributes.position.needsUpdate = true; tGeo.attributes.aBright.needsUpdate = true; }
  if (trailSpawned) { trailSpawned = false; tGeo.attributes.aColor.needsUpdate = true; tGeo.attributes.aSize.needsUpdate = true; }

  renderer.render(scene, camera);
  raf = requestAnimationFrame(frame);
}

/* the solar system collapses into this galaxy: the page pins it to the point on screen where the system
   vanished and grows it from nothing, then lets go so the cat can pounce */
function pin(clientX, clientY, vis){
  const w = toWorld({clientX, clientY});
  if (w) P.pinT.set(clamp(w.x, view.xMin + PR, view.xMax - PR), clamp(w.y, view.yMin + PR, view.yMax - PR), 0);
  if (!P.pinned){
    P.pinned = true; P.grabbed = false;
    /* coming back from play: fly home in one piece; the cat makes one last leap after it */
    P.homing = P.vis > 0.5 && P.pos.distanceTo(P.pinT) > 0.4;
    if (P.homing){ burst(P.pos, 30); startLeap(); }
    else { P.pos.copy(P.pinT); P.vis = clamp(vis, 0, 1); }
  }
  P.visT = clamp(vis, 0, 1);
  if (cat.act && cat.act.type !== 'leap') cat.act = null;
  if (!cat.act) cat.side = 1;   // wait on the right, facing the galaxy as it forms
}
function unpin(){
  if (!P.pinned) return;
  P.pinned = false; P.homing = false; P.vis = 1;
  P.vel.set(rand(2.5, 3.5), rand(-0.6, 0.9), 0); P.wobV += 4;
  burst(P.pos, 70);
  cat.cool = 0.4;
}
return {
  pin, unpin,
  setQuality(q){ renderer.setPixelRatio(baseDpr * q); resize(); },
  play(on){ if (on === running) return; running = on; if (on){ last = performance.now(); if (!raf) raf = requestAnimationFrame(frame); } },
  dispose(){
    running = false; if (raf) cancelAnimationFrame(raf); raf = 0;
    ro.disconnect(); removeEventListener('scroll', staleRect);
    renderer.dispose(); renderer.domElement.remove();
  }
};
}
