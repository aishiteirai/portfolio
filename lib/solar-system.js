/* Solar system: a star with one body per project, a scroll-driven camera, an explore mode opened from the
   star, and the collapse into the nebula cat's galaxy near the contact section. */
import * as THREE from 'three';

export function initSolarSystem({ canvas, projects: P, shared }) {
const off = [];
const on = (target, type, fn, opts) => { target.addEventListener(type, fn, opts); off.push(() => target.removeEventListener(type, fn, opts)); };
let raf = 0;

/* which scene is in the middle of the viewport */
const scenes = [...document.querySelectorAll('[data-scene]')];
let state = {name:'hero', i:-1};
function readScene(){
  const mid = innerHeight*.5;
  for (const el of scenes){ const r = el.getBoundingClientRect(); if (r.top <= mid && r.bottom >= mid){ state = {name:el.dataset.scene, i: el.dataset.i ? +el.dataset.i : -1}; return; } }
}
on(window, 'scroll', readScene, {passive:true}); readScene();

/* ================= three.js ================= */
let renderer;
try {
  renderer = new THREE.WebGLRenderer({canvas:canvas, antialias:true, alpha:false});
} catch(e){ document.body.classList.add('nogl'); return () => { off.forEach(f => f()); }; }

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobile = () => innerWidth < 760;
renderer.setPixelRatio(Math.min(devicePixelRatio||1, 1.75));
renderer.setClearColor(0x0B0909, 1);
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0B0909, 0.012);
const camera = new THREE.PerspectiveCamera(45, 1, .1, 600);
camera.position.set(0, 8, 40);

const C = {bone:0xE6DED6, wine:0x7A1A2C, lit:0xC25467, cacau:0x5a3324};

/* lights */
scene.add(new THREE.AmbientLight(0x3a2228, 1.1));
const sys = new THREE.Group(); scene.add(sys);   // star, dust and orbits: scaled down as the page reaches the cat
const coreLight = new THREE.PointLight(0xFFE6E0, 3.2, 110, 1.4); sys.add(coreLight);
const key = new THREE.DirectionalLight(C.bone, .55); key.position.set(10, 20, 30); scene.add(key);

/* stars */
function starField(n, rMin, rMax, size, color, opacity){
  const g = new THREE.BufferGeometry(), a = new Float32Array(n*3);
  for (let i=0;i<n;i++){ const u=Math.random()*2-1, th=Math.random()*Math.PI*2, r=rMin+Math.random()*(rMax-rMin), s=Math.sqrt(1-u*u);
    a[i*3]=r*s*Math.cos(th); a[i*3+1]=r*u; a[i*3+2]=r*s*Math.sin(th); }
  g.setAttribute('position', new THREE.BufferAttribute(a,3));
  return new THREE.Points(g, new THREE.PointsMaterial({size, color, transparent:true, opacity, sizeAttenuation:true, depthWrite:false, fog:false}));
}
const stars = new THREE.Group();
stars.add(starField(mobile()?1400:2600, 140, 300, .9, C.bone, .75));
stars.add(starField(260, 140, 300, 1.4, C.lit, .7));
scene.add(stars);

/* the star: hot white core, rose limb, boiling granulation */
const coreMat = new THREE.ShaderMaterial({
  uniforms:{uT:{value:0}},
  vertexShader:`varying vec3 vN; varying vec3 vP; varying vec3 vV;
    void main(){ vN=normalize(normalMatrix*normal); vP=position; vec4 mv=modelViewMatrix*vec4(position,1.); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }`,
  fragmentShader:`uniform float uT; varying vec3 vN; varying vec3 vP; varying vec3 vV;
    float h(vec3 p){ p=fract(p*.3183099+.1); p*=17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
    float n(vec3 x){ vec3 i=floor(x), f=fract(x); f=f*f*(3.-2.*f);
      return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),
                 mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z); }
    float fbm(vec3 p){ float s=0., a=.5; for(int i=0;i<5;i++){ s+=a*n(p); p*=2.07; a*=.5; } return s; }
    void main(){
      vec3 p = vP*1.6;
      float g = fbm(p + vec3(0., uT*.12, uT*.08) + fbm(p*2.2 - uT*.1));
      float ndv = max(dot(vN,vV),0.);
      vec3 hot = vec3(1.,.97,.93), warm = vec3(1.,.78,.74), rose = vec3(.92,.42,.50);
      vec3 col = mix(rose, warm, smoothstep(.0,.55,ndv));
      col = mix(col, hot, smoothstep(.45,1.,ndv));
      col *= .82 + g*.42;
      gl_FragColor = vec4(col*1.08,1.);
    }`
});
const core = new THREE.Mesh(new THREE.SphereGeometry(2.4, 96, 96), coreMat);
sys.add(core);

/* light around the star: soft glow, a wide corona and slow diffraction spikes (all additive sprites) */
function radialTex(stops){ const c=document.createElement('canvas'); c.width=c.height=256; const x=c.getContext('2d');
  const g=x.createRadialGradient(128,128,0,128,128,128); stops.forEach(([o,col])=>g.addColorStop(o,col));
  x.fillStyle=g; x.fillRect(0,0,256,256); return new THREE.CanvasTexture(c); }
function raysTex(){ const c=document.createElement('canvas'); c.width=c.height=512; const x=c.getContext('2d'); x.translate(256,256);
  for (let i=0;i<14;i++){ const a=i/14*Math.PI*2 + (i%2?.11:0), len = i%2 ? 150 : 250, w = i%2 ? 3 : 6;
    x.save(); x.rotate(a); const g=x.createLinearGradient(0,0,len,0); g.addColorStop(0,'rgba(255,236,232,.55)'); g.addColorStop(1,'rgba(194,84,103,0)');
    x.fillStyle=g; x.beginPath(); x.moveTo(0,-w); x.lineTo(len,0); x.lineTo(0,w); x.fill(); x.restore(); }
  return new THREE.CanvasTexture(c); }
const addSprite = (tex, size, opacity) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({map:tex, blending:THREE.AdditiveBlending, depthWrite:false, transparent:true, opacity, fog:false})); sp.scale.set(size,size,1); sys.add(sp); return sp; };
const halo = addSprite(radialTex([[0,'rgba(255,244,236,1)'],[.18,'rgba(255,214,210,.75)'],[.45,'rgba(194,84,103,.25)'],[1,'rgba(0,0,0,0)']]), 11, 1);
const glow = addSprite(radialTex([[0,'rgba(194,84,103,.5)'],[.3,'rgba(122,26,44,.22)'],[1,'rgba(0,0,0,0)']]), 46, 1);
const rays = addSprite(raysTex(), 26, .7);
const rays2 = addSprite(raysTex(), 18, .45);

/* dust disc */
const dust = (() => {
  const n = mobile()?1800:3600, g = new THREE.BufferGeometry(), pos = new Float32Array(n*3), col = new Float32Array(n*3);
  const a = new THREE.Color(C.bone), b = new THREE.Color(C.lit), w = new THREE.Color(C.wine);
  for (let i=0;i<n;i++){ const r = 5 + Math.pow(Math.random(),1.6)*24, th = Math.random()*Math.PI*2;
    pos[i*3]=Math.cos(th)*r; pos[i*3+1]=(Math.random()-.5)*(.25+r*.03); pos[i*3+2]=Math.sin(th)*r;
    const c = Math.random()<.5 ? w : (Math.random()<.6 ? b : a); col[i*3]=c.r; col[i*3+1]=c.g; col[i*3+2]=c.b; }
  g.setAttribute('position', new THREE.BufferAttribute(pos,3)); g.setAttribute('color', new THREE.BufferAttribute(col,3));
  const m = new THREE.Points(g, new THREE.PointsMaterial({size:.08, vertexColors:true, transparent:true, opacity:.75, depthWrite:false, blending:THREE.AdditiveBlending}));
  m.rotation.x = .12; sys.add(m); return m;
})();

/* planets */
const orbits = [ {r:9, s:.16, tilt:.10, a:.6}, {r:13, s:.11, tilt:-.08, a:2.4}, {r:17, s:.08, tilt:.16, a:4.1}, {r:21.5, s:.06, tilt:-.05, a:5.4} ];
const std = (color, extra={}) => new THREE.MeshStandardMaterial(Object.assign({color, roughness:.55, metalness:.1}, extra));
const bodies = orbits.map((o,i) => {
  const plane = new THREE.Group(); plane.rotation.x = o.tilt; plane.rotation.z = o.tilt*.6; sys.add(plane);
  const ring = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(Array.from({length:180},(_,k)=>{const t=k/180*Math.PI*2;return new THREE.Vector3(Math.cos(t)*o.r,0,Math.sin(t)*o.r);})),
    new THREE.LineBasicMaterial({color:C.bone, transparent:true, opacity:.12}));
  plane.add(ring);
  const body = new THREE.Group(); plane.add(body);
  return {o, plane, body, ring, angle:o.a, anim:null};
});

/* 1 · Notifier: a bright node sending out signal rings */
(() => { const b = bodies[0];
  b.body.add(new THREE.Mesh(new THREE.SphereGeometry(.6,48,48), std(C.bone,{emissive:C.lit, emissiveIntensity:.25})));
  const rings = [0,1,2].map(() => { const m = new THREE.Mesh(new THREE.RingGeometry(.78,.82,64), new THREE.MeshBasicMaterial({color:C.lit, transparent:true, side:THREE.DoubleSide, depthWrite:false})); b.body.add(m); return m; });
  b.anim = (t) => rings.forEach((m,k) => { const ph = (t*.45 + k/3) % 1; m.scale.setScalar(1+ph*3.2); m.material.opacity = (1-ph)*.8; m.quaternion.copy(camera.quaternion); });
})();
/* 2 · Naquela Mesa: a faceted body with a table-top ring and orders circling it */
(() => { const b = bodies[1];
  const ico = new THREE.Mesh(new THREE.IcosahedronGeometry(.95,0), std(C.wine,{flatShading:true, roughness:.4}));
  const top = new THREE.Mesh(new THREE.TorusGeometry(1.6,.025,8,96), std(C.bone,{emissive:C.bone, emissiveIntensity:.15})); top.rotation.x = Math.PI/2 - .25;
  const orders = new THREE.Group(); top.add(orders);
  for (let k=0;k<6;k++){ const c = new THREE.Mesh(new THREE.BoxGeometry(.14,.14,.14), std(C.bone)); const t=k/6*Math.PI*2; c.position.set(Math.cos(t)*1.6, Math.sin(t)*1.6, 0); orders.add(c); }
  b.body.add(ico, top);
  b.anim = (t) => { ico.rotation.y = t*.3; ico.rotation.x = t*.17; orders.rotation.z = t*.5; };
})();
/* 3 · Site do Cacau: a cacao-brown heart in a wireframe cage, with a small moon */
(() => { const b = bodies[2];
  const heart = new THREE.Mesh(new THREE.SphereGeometry(.55,32,32), std(C.cacau,{roughness:.8}));
  const cage = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.DodecahedronGeometry(1.05)), new THREE.LineBasicMaterial({color:C.bone, transparent:true, opacity:.6}));
  const moonPivot = new THREE.Group(); const moon = new THREE.Mesh(new THREE.SphereGeometry(.16,24,24), std(C.lit,{emissive:C.lit, emissiveIntensity:.4})); moon.position.x = 1.8; moonPivot.add(moon);
  b.body.add(heart, cage, moonPivot);
  b.anim = (t) => { cage.rotation.y = t*.25; cage.rotation.z = t*.12; moonPivot.rotation.y = t*1.1; moonPivot.rotation.x = .4; };
})();
/* 4 · EverythingIsPDF: a loose cloud of tumbling pages, one of them red */
(() => { const b = bodies[3];
  const pages = [];
  for (let k=0;k<9;k++){ const m = new THREE.Mesh(new THREE.PlaneGeometry(.52,.74), std(k===4?C.lit:C.bone,{side:THREE.DoubleSide, roughness:.9}));
    m.position.set((Math.random()-.5)*2.2,(Math.random()-.5)*1.6,(Math.random()-.5)*2.2); m.rotation.set(Math.random()*3,Math.random()*3,Math.random()*3);
    m.userData.v = new THREE.Vector3(Math.random()-.5,Math.random()-.5,Math.random()-.5).multiplyScalar(.9); pages.push(m); b.body.add(m); }
  b.anim = (t, dt) => pages.forEach(m => { m.rotation.x += m.userData.v.x*dt; m.rotation.y += m.userData.v.y*dt; m.rotation.z += m.userData.v.z*dt; });
})();

/* floating labels on the bodies */
const labelBox = document.getElementById('labels');
const labels = P.map((p,i) => { const a = document.createElement('a'); a.className='tag3d'; a.href='#p-'+p.id; a.textContent=p.title; labelBox.appendChild(a); return a; });
const sunTag = document.createElement('button'); sunTag.type = 'button'; sunTag.className = 'tag3d sun'; sunTag.textContent = 'Explorar o sistema';
sunTag.style.cssText = 'background:none;border:0;font:inherit;cursor:pointer'; labelBox.appendChild(sunTag);

/* ---------- explore mode: only the system, a free camera and short cards ---------- */
const ex = { on:false, theta:0, phi:1.2, r:44, sel:-1, focus:new THREE.Vector3(), drag:null, pts:new Map(), pinch:0 };
const exUi = document.getElementById('exUi'), exCard = document.getElementById('exCard'), exHint = document.getElementById('exHint');
const glEl = renderer.domElement;
function enterExplore(){
  if (ex.on) return;
  ex.on = true; ex.sel = -1; exCard.hidden = true;
  const v = camera.position.clone().sub(look);
  ex.r = 46; ex.theta = Math.atan2(v.x, v.z);
  ex.phi = Math.min(1.35, Math.max(.35, Math.acos(Math.min(1, Math.max(-1, v.y / (v.length() || 1))))));
  document.body.classList.add('explore'); exUi.hidden = false; exHint.classList.remove('off');
  sunTag.textContent = 'Ryan Corazza';
  document.getElementById('exClose').focus({preventScroll:true});
}
function exitExplore(){
  if (!ex.on) return;
  ex.on = false; ex.sel = -1; exCard.hidden = true; exUi.hidden = true;
  document.body.classList.remove('explore'); sunTag.textContent = 'Explorar o sistema';
  labels.forEach(l => l.classList.remove('on'));
}
function select(i){
  ex.sel = i; labels.forEach((l,k) => l.classList.toggle('on', k === i));
  exHint.classList.add('off');
  const close = '<button class="x" type="button" aria-label="Fechar">×</button>';
  if (i < 0){
    ex.r = Math.max(ex.r, 30);
    exCard.innerHTML = close + `<p class="label">A estrela</p><h3>Ryan Corazza</h3><p class="kind">Dev full-stack com foco em back-end</p>
      <p class="b">Tudo aqui orbita em volta do que eu construo: APIs, integrações e filas, do banco ao deploy.</p>
      <div class="acts"><a href="https://github.com/aishiteirai" target="_blank" rel="noopener">GitHub</a><a href="https://www.linkedin.com/in/ryancorazza" target="_blank" rel="noopener">LinkedIn</a><button type="button" data-go="contato">Contato</button></div>`;
  } else {
    const p = P[i]; ex.r = mobile() ? 13 : 10;
    exCard.innerHTML = close + `<p class="label">${p.area} · ${p.where}</p><h3>${p.title}</h3><p class="kind">${p.kind}</p><p class="b">${p.brief}</p>
      <div class="chips">${p.stack.slice(0,5).map(x => `<span>${x}</span>`).join('')}</div>
      <div class="acts"><button type="button" data-go="p-${p.id}">Ler mais</button>${p.internal ? '<span>Código privado</span>' : `<a href="${p.repo}" target="_blank" rel="noopener">Repositório</a>`}</div>`;
  }
  exCard.hidden = false;
}
function deselect(){ ex.sel = -1; exCard.hidden = true; ex.r = Math.max(ex.r, 40); labels.forEach(l => l.classList.remove('on')); }
on(exCard, 'click', e => {
  if (e.target.closest('.x')) { deselect(); return; }
  const go = e.target.closest('[data-go]'); if (!go) return;
  exitExplore(); const el = document.getElementById(go.dataset.go); if (el) el.scrollIntoView();
});
on(document.getElementById('exClose'), 'click', exitExplore);
on(window, 'keydown', e => { if (e.key === 'Escape' && ex.on){ if (!exCard.hidden) deselect(); else exitExplore(); } });
on(sunTag, 'click', () => ex.on ? select(-1) : enterExplore());
labels.forEach((l,i) => on(l, 'click', e => { if (!ex.on) return; e.preventDefault(); select(i); }));

/* picking by screen distance: bodies are small, so a generous radius beats exact ray hits */
const pickV = new THREE.Vector3();
function screenOf(obj){ obj.getWorldPosition(pickV); pickV.project(camera); return [(pickV.x*.5+.5)*innerWidth, (-pickV.y*.5+.5)*innerHeight, pickV.z]; }
function pxRadius(obj, worldR){ obj.getWorldPosition(pickV); const d = pickV.distanceTo(camera.position) || 1; return worldR * sys.scale.x / d * innerHeight / (2*Math.tan(camera.fov*Math.PI/360)); }
function pick(x, y){
  let best = null, bd = Infinity;
  bodies.forEach((b,i) => { const [sx,sy,sz] = screenOf(b.body); if (sz > 1) return; const d = Math.hypot(sx-x, sy-y), lim = Math.max(30, pxRadius(b.body, 1.8)); if (d < lim && d < bd){ bd = d; best = i; } });
  if (best !== null) return best;
  const [cx,cy,cz] = screenOf(core); if (cz <= 1 && Math.hypot(cx-x, cy-y) < Math.max(36, pxRadius(core, 3.4))) return -1;
  return null;
}
/* from the page: clicking the star opens the explore mode */
const sunHit = (x, y) => { if (!sys.visible || leave > .2) return false; const [cx,cy,cz] = screenOf(core); return cz <= 1 && Math.hypot(cx-x, cy-y) < Math.max(36, pxRadius(core, 3.4)); };
on(window, 'click', e => {
  if (ex.on || e.target.closest('a,button,input,label,.catstage,.chips,.mail')) return;
  if (sunHit(e.clientX, e.clientY)) enterExplore();
});
on(window, 'pointermove', e => {
  if (ex.on) { document.documentElement.style.cursor = ''; return; }
  const over = !e.target.closest('a,button,.catstage') && sunHit(e.clientX, e.clientY);
  document.documentElement.style.cursor = over ? 'pointer' : '';
}, {passive:true});
/* orbit, zoom and pinch on the canvas */
on(glEl, 'pointerdown', e => {
  if (!ex.on) return;
  ex.pts.set(e.pointerId, {x:e.clientX, y:e.clientY});
  if (ex.pts.size === 1) ex.drag = {x:e.clientX, y:e.clientY, sx:e.clientX, sy:e.clientY, t:performance.now()};
  if (ex.pts.size === 2){ const [a,b] = [...ex.pts.values()]; ex.pinch = Math.hypot(a.x-b.x, a.y-b.y); ex.drag = null; }
  glEl.setPointerCapture(e.pointerId); glEl.classList.add('dragging');
});
on(glEl, 'pointermove', e => {
  if (!ex.on || !ex.pts.has(e.pointerId)) return;
  ex.pts.set(e.pointerId, {x:e.clientX, y:e.clientY});
  if (ex.pts.size === 2){ const [a,b] = [...ex.pts.values()]; const d = Math.hypot(a.x-b.x, a.y-b.y); if (ex.pinch) ex.r = Math.min(120, Math.max(5, ex.r * ex.pinch / d)); ex.pinch = d; return; }
  if (!ex.drag) return;
  ex.theta -= (e.clientX - ex.drag.x) * .006; ex.phi = Math.min(1.5, Math.max(.12, ex.phi - (e.clientY - ex.drag.y) * .005));
  ex.drag.x = e.clientX; ex.drag.y = e.clientY;
  if (Math.hypot(e.clientX - ex.drag.sx, e.clientY - ex.drag.sy) > 6) exHint.classList.add('off');
});
const endPointer = e => {
  if (!ex.pts.has(e.pointerId)) return;
  ex.pts.delete(e.pointerId); if (ex.pts.size < 2) ex.pinch = 0;
  if (ex.drag && ex.pts.size === 0){
    const moved = Math.hypot(e.clientX - ex.drag.sx, e.clientY - ex.drag.sy);
    if (e.type === 'pointerup' && moved < 6 && performance.now() - ex.drag.t < 600){ const hit = pick(e.clientX, e.clientY); if (hit !== null) select(hit); else if (!exCard.hidden) deselect(); }
    ex.drag = null;
  }
  if (ex.pts.size === 0) glEl.classList.remove('dragging');
};
on(glEl, 'pointerup', endPointer); on(glEl, 'pointercancel', endPointer);
on(glEl, 'wheel', e => { if (!ex.on) return; e.preventDefault(); ex.r = Math.min(120, Math.max(5, ex.r * Math.exp(e.deltaY * .0012))); exHint.classList.add('off'); }, {passive:false});

/* camera choreography */
const camPos = new THREE.Vector3(0, 8, 40), look = new THREE.Vector3(), lookTarget = new THREE.Vector3();
const tmp = new THREE.Vector3(), wp = new THREE.Vector3();
let offX = 0, offY = 0, timeScale = 1, mx = 0, my = 0;
on(window, 'pointermove', e => { mx = e.clientX/innerWidth - .5; my = e.clientY/innerHeight - .5; }, {passive:true});

function targets(){
  const m = mobile();
  let tx = m ? 0 : -.25, ty = m ? .22 : 0, ts = 1;
  if (state.name === 'hero'){ camPos.set(0, m ? 10 : 7, m ? 50 : 46); lookTarget.set(0,0,0); }
  else if (state.name === 'system'){ camPos.set(0, 24, m ? 52 : 38); lookTarget.set(0,0,0); }
  else if (state.name === 'planet'){
    const b = bodies[state.i]; b.body.getWorldPosition(wp);
    tmp.set(wp.x, 0, wp.z).normalize();
    camPos.copy(wp).addScaledVector(tmp, m ? 15 : 8).add(new THREE.Vector3(0, m ? 9 : 2.4, 0));
    lookTarget.copy(wp); ts = .12;
  }
  else if (state.name === 'overview'){ camPos.set(0, 62, 6); lookTarget.set(0,0,0); tx = 0; ty = 0; ts = .6; }
  if (ex.on){
    /* free orbit around the star, or around the selected body */
    if (ex.sel >= 0) bodies[ex.sel].body.getWorldPosition(ex.focus); else ex.focus.set(0,0,0);
    lookTarget.copy(ex.focus);
    camPos.set(Math.sin(ex.phi)*Math.sin(ex.theta), Math.cos(ex.phi), Math.sin(ex.phi)*Math.cos(ex.theta)).multiplyScalar(ex.r).add(ex.focus);
    const card = !exCard.hidden;
    return { tx: card && !m ? .17 : 0, ty: card && m ? .2 : 0, ts: ex.sel >= 0 ? .1 : .4 };
  }
  if (leave > .35 && catStageEl){
    /* aim the collapsing system at the left third of the cat's area, so the galaxy forms right there */
    camPos.set(0, 22, m ? 80 : 72); lookTarget.set(0,0,0); ts = .5;
    const r = catStageEl.getBoundingClientRect();
    tx = .5 - (r.left + r.width*.28)/innerWidth;
    ty = Math.max(-.45, Math.min(.45, .5 - (r.top + r.height*.45)/innerHeight));
  }
  return {tx, ty, ts};
}

function resize(){
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false); camera.aspect = w/h; camera.updateProjectionMatrix();
}
on(window, 'resize', resize); resize();

let last = performance.now(), t = 0, first = true;
const contactEl = document.getElementById('contato'), catStageEl = document.getElementById('catStage');
let leave = 0, entered = false;
const sysScreen = new THREE.Vector3();
const smooth01 = (a, b, x) => { const u = Math.min(1, Math.max(0, (x-a)/(b-a))); return u*u*(3-2*u); };
function frame(now){
  const dt = Math.min((now-last)/1000, .05); last = now;
  const tg = targets();
  const k = reduce || first ? 1 : 1 - Math.exp(-dt*(ex.on ? 6 : 2.2));
  timeScale += (tg.ts - timeScale) * (reduce ? 1 : 1 - Math.exp(-dt*3));
  const swirl = 1 + 9 * smooth01(.08, .62, leave) * (1 - smooth01(.8, .9, leave));
  const step = reduce ? 0 : dt*timeScale*swirl;
  t += step;

  bodies.forEach(b => {
    b.angle += b.o.s * step;
    b.body.position.set(Math.cos(b.angle)*b.o.r, 0, Math.sin(b.angle)*b.o.r);
    b.anim && b.anim(reduce ? 0 : now/1000, reduce ? 0 : dt);
    b.ring.material.opacity += (((state.name==='planet' && !ex.on && bodies[state.i]===b) || (ex.on && ex.sel >= 0 && bodies[ex.sel]===b) ? .35 : ex.on ? .2 : .12) - b.ring.material.opacity) * .05;
  });
  core.rotation.y += step*.06; coreMat.uniforms.uT.value = reduce ? 0 : now/1000;
  const pulse = reduce ? 1 : 1 + Math.sin(now/900)*.04;
  /* leaving for the cat: the system spins faster and faster as it shrinks, then collapses into the galaxy
     the cat plays with, at the same spot on screen */
  const cr = contactEl.getBoundingClientRect();
  const pRaw = Math.min(1, Math.max(0, 1 - cr.top / innerHeight));
  leave += (pRaw - leave) * (reduce ? 1 : 1 - Math.exp(-dt*6));
  const shrink = smooth01(.05, .62, leave), vanish = smooth01(.6, .8, leave);
  sys.scale.setScalar(Math.max(.0001, (1 - .86*shrink) * (1 - vanish)));
  sys.visible = vanish < .999;
  rays.material.opacity = .7 + .3*shrink; rays2.material.opacity = .45 + .4*shrink;
  dust.material.opacity = .75;
  if (catStageEl){
    catStageEl.style.opacity = smooth01(.45, .72, leave).toFixed(3);
    const nc = shared.cat;
    if (nc){
      if (leave < .86 && leave > .4){
        sys.updateMatrixWorld(); sysScreen.setFromMatrixPosition(sys.matrixWorld).project(camera);
        nc.pin((sysScreen.x*.5 + .5)*innerWidth, (-sysScreen.y*.5 + .5)*innerHeight, smooth01(.6, .82, leave));
        entered = false;
      } else if (leave >= .86 && !entered){ entered = true; nc.unpin(); }
    }
  }
  halo.scale.setScalar(11*pulse); rays.material.rotation = reduce ? 0 : now/26000; rays2.material.rotation = reduce ? 0 : -now/19000;
  dust.rotation.y += step*.03; stars.rotation.y += step*.004;

  camera.position.lerp(camPos, k);
  look.lerp(lookTarget, k);
  if (!reduce && !ex.on){ camera.position.x += mx*.9; camera.position.y -= my*.6; }
  camera.lookAt(look);
  offX += (tg.tx - offX)*k; offY += (tg.ty - offY)*k;
  const w = innerWidth, h = innerHeight;
  camera.setViewOffset(w, h, offX*w, offY*h, w, h);
  renderer.render(scene, camera);

  /* labels */
  const show = ex.on || ((state.name === 'hero' || state.name === 'system') && leave < .2);
  labelBox.classList.toggle('show', show);
  { const [sx,sy,sz] = screenOf(core); const rpx = pxRadius(core, 2.4);
    sunTag.style.visibility = sz > 1 || !sys.visible ? 'hidden' : '';
    const tw = sunTag.offsetWidth, tx0 = Math.min(Math.max(8, sx + rpx + 22), w - tw - 8);
    sunTag.style.transform = `translate(${tx0.toFixed(1)}px, ${(sy - rpx - 18).toFixed(1)}px)`; }
  bodies.forEach((b,i) => {
    b.body.getWorldPosition(wp); wp.project(camera);
    const el = labels[i];
    if (wp.z > 1){ el.style.visibility = 'hidden'; return; }
    el.style.visibility = '';
    const lx = Math.min(Math.max(8, (wp.x*.5+.5)*w + 16), w - el.offsetWidth - 8);
    el.style.transform = `translate(${lx.toFixed(1)}px, ${((-wp.y*.5+.5)*h - 12).toFixed(1)}px)`;
  });
  first = false;
  raf = requestAnimationFrame(frame);
}
raf = requestAnimationFrame(frame);

return () => {
  cancelAnimationFrame(raf);
  off.forEach(f => f());
  document.body.classList.remove('explore');
  document.documentElement.style.cursor = '';
  labelBox.replaceChildren();
  renderer.dispose();
};
}
