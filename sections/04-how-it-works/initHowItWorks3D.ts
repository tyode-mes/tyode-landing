/* Section 04: a live 3D solid tyre, scroll-choreographed through the eight stages.
   Studio lighting, real reflections on the steel band, exploded view, assembly, cure glow and a scan ring.
   Runs once on mount and returns a cleanup function (safe under React Strict Mode). */

import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

type Stage = {
  explode: number; rubber: number; band: number; dist: number; yaw: number; pitch: number; focus: number;
  heat: number; idGlow: number; labels: string[];
};

/* camera and tyre state for each stage; the build stage (3) scrubs explode 1 -> 0 with scroll */
const STAGES: Stage[] = [
  { explode: 1.0, rubber: 0.12, band: 0.12, dist: 10.5, yaw: -0.75, pitch: 0.28, focus: 0, heat: 0, idGlow: 0, labels: [] },
  { explode: 1.0, rubber: 1.0, band: 0.14, dist: 10.5, yaw: -0.65, pitch: 0.26, focus: 0, heat: 0, idGlow: 0, labels: ["base", "cush", "tread"] },
  { explode: 1.0, rubber: 0.0, band: 1.0, dist: 6.4, yaw: -0.95, pitch: 0.12, focus: 1, heat: 0, idGlow: 1, labels: ["band"] },
  { explode: 1.0, rubber: 1.0, band: 1.0, dist: 9.4, yaw: -0.55, pitch: 0.22, focus: 0, heat: 0, idGlow: 0.35, labels: ["band", "base", "cush", "tread"] },
  { explode: 0.0, rubber: 1.0, band: 1.0, dist: 9.2, yaw: -0.5, pitch: 0.18, focus: 0, heat: 1, idGlow: 0, labels: ["cure"] },
  { explode: 0.0, rubber: 1.0, band: 1.0, dist: 9.2, yaw: -0.62, pitch: 0.18, focus: 0, heat: 0, idGlow: 0, labels: ["check"] },
  { explode: 0.0, rubber: 1.0, band: 1.0, dist: 10.4, yaw: -1.25, pitch: 0.12, focus: 0, heat: 0, idGlow: 0, labels: ["store"] },
  { explode: 0.0, rubber: 1.0, band: 1.0, dist: 10.6, yaw: -0.38, pitch: 0.26, focus: 0, heat: 0, idGlow: 0, labels: ["ship"] },
];

const CAPTIONS_N = STAGES.length;

/* closed, rounded profile in (radius, axial) for LatheGeometry */
function ringProfile(rin: number, rout: number, h: number, rad: number, seg = 6) {
  const pts: THREE.Vector2[] = [];
  const corners: [number, number, number, number][] = [
    [rout - rad, -h + rad, -Math.PI / 2, 0],
    [rout - rad, h - rad, 0, Math.PI / 2],
    [rin + rad, h - rad, Math.PI / 2, Math.PI],
    [rin + rad, -h + rad, Math.PI, Math.PI * 1.5],
  ];
  for (const [cx, cy, a0, a1] of corners)
    for (let i = 0; i <= seg; i++) {
      const a = a0 + ((a1 - a0) * i) / seg;
      pts.push(new THREE.Vector2(cx + rad * Math.cos(a), cy + rad * Math.sin(a)));
    }
  pts.push(pts[0].clone());
  return pts;
}

/* the tyre ID, etched around the face of the steel band */
function idTexture() {
  const S = 2048, c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, S, S);
  g.translate(S / 2, S / 2);
  g.fillStyle = "#ffffff";
  g.font = "600 46px Inter, Helvetica, Arial, sans-serif";
  g.textBaseline = "middle";
  const R = (1.0 / 1.045) * (S / 2);
  const text = "P1-2611-00427";
  for (let rep = 0; rep < 3; rep++) {
    const start = rep * ((Math.PI * 2) / 3);
    let a = start;
    /* small data-matrix block before each ID */
    g.save(); g.rotate(a); g.translate(0, -R);
    for (let r = 0; r < 6; r++) for (let q = 0; q < 6; q++) {
      const on = q === 0 || r === 5 || (r === 0 && q % 2 === 0) || (q === 5 && r % 2 === 1) || ((r * 7 + q * 3) % 5 < 2);
      if (on) g.fillRect(-24 + q * 8, -24 + r * 8, 8, 8);
    }
    g.restore();
    a += 0.06;
    for (const ch of text) {
      const w = g.measureText(ch).width;
      g.save(); g.rotate(a + w / 2 / R); g.translate(0, -R);
      g.fillText(ch, -w / 2, 0);
      g.restore();
      a += (w + 6) / R;
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function glowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, "rgba(255,150,80,0.55)");
  grd.addColorStop(0.45, "rgba(255,130,60,0.22)");
  grd.addColorStop(1, "rgba(255,120,50,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function shadowTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, "rgba(0,0,0,0.55)");
  grd.addColorStop(0.5, "rgba(0,0,0,0.18)");
  grd.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(c);
}

export function initHowItWorks3D(sec: HTMLElement): () => void {
  const $ = <T extends Element = HTMLElement>(sel: string) => sec.querySelector(sel) as T;
  const scroll = $(".h3-scroll"), stageEl = $(".h3-stage"), canvas = $<HTMLCanvasElement>(".h3-canvas");
  const items = Array.from(sec.querySelectorAll<HTMLElement>(".h3-item"));
  const segs = Array.from(sec.querySelectorAll<HTMLElement>(".h3-seg li"));
  const rows = Array.from(sec.querySelectorAll<HTMLElement>(".h3-pass li"));
  const count = $(".h3-count");
  const tags = new Map(Array.from(sec.querySelectorAll<HTMLElement>("[data-tag]")).map((t) => [t.dataset.tag!, t]));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const N = CAPTIONS_N;

  /* ---------- renderer, scene, camera ---------- */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envRT.texture;

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);

  const key = new THREE.DirectionalLight(0xffffff, 1.6); key.position.set(4, 6, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 1.2); rim.position.set(-6, 3, -4); scene.add(rim);
  const warm = new THREE.PointLight(0xff9a5a, 0, 14); warm.position.set(0, 1.2, -3.5); scene.add(warm);

  /* ---------- the tyre ---------- */
  const root = new THREE.Group(); scene.add(root);
  const yaw = new THREE.Group(); root.add(yaw);
  const pitch = new THREE.Group(); yaw.add(pitch);
  const tilt = new THREE.Group(); tilt.rotation.z = Math.PI / 2; pitch.add(tilt); /* tyre axis -> world X */
  const spin = new THREE.Group(); tilt.add(spin);

  const SEG = 160;
  const rubberMat = (hex: number) =>
    new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.82, metalness: 0, clearcoat: 0.12, clearcoatRoughness: 0.7, side: THREE.DoubleSide, emissive: 0xff7a2e, emissiveIntensity: 0 });
  const mats = { base: rubberMat(0x2c2c30), cush: rubberMat(0x232326), tread: rubberMat(0x161618) };
  const bandMat = new THREE.MeshPhysicalMaterial({ color: 0xcfd3d8, metalness: 1, roughness: 0.26, side: THREE.DoubleSide });

  const layer = (name: string) => { const g = new THREE.Group(); g.name = name; spin.add(g); return g; };
  const gBand = layer("band"), gBase = layer("base"), gCush = layer("cush"), gTread = layer("tread");

  gBand.add(new THREE.Mesh(new THREE.LatheGeometry(ringProfile(0.95, 1.05, 0.5, 0.012), SEG), bandMat));
  gBase.add(new THREE.Mesh(new THREE.LatheGeometry(ringProfile(1.05, 1.33, 0.48, 0.02), SEG), mats.base));
  gCush.add(new THREE.Mesh(new THREE.LatheGeometry(ringProfile(1.33, 1.62, 0.47, 0.02), SEG), mats.cush));
  gTread.add(new THREE.Mesh(new THREE.LatheGeometry(ringProfile(1.62, 1.86, 0.46, 0.09, 8), SEG), mats.tread));

  /* tread lugs: staggered blocks around the crown */
  const LUGS = 64, lugGeo = new THREE.BoxGeometry(0.1, 0.34, 0.17);
  const lugs = new THREE.InstancedMesh(lugGeo, mats.tread, LUGS * 2);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), pos = new THREE.Vector3(), sc = new THREE.Vector3(1, 1, 1);
  for (let i = 0; i < LUGS * 2; i++) {
    const side = i % 2 ? 1 : -1, th = (Math.floor(i / 2) + (side > 0 ? 0.5 : 0)) * ((Math.PI * 2) / LUGS);
    const R = 1.86 + 0.035;
    pos.set(R * Math.sin(th), side * 0.21, R * Math.cos(th));
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), th + Math.PI / 2);
    m4.compose(pos, q, sc);
    lugs.setMatrixAt(i, m4);
  }
  gTread.add(lugs);

  /* etched ID on the band face */
  const idTex = idTexture();
  const idMat = new THREE.MeshStandardMaterial({ map: idTex, transparent: true, metalness: 0.4, roughness: 0.4, emissive: 0xffffff, emissiveMap: idTex, emissiveIntensity: 0, depthWrite: false });
  const idRing = new THREE.Mesh(new THREE.RingGeometry(0.955, 1.045, 180), idMat);
  idRing.rotation.x = -Math.PI / 2; idRing.position.y = 0.503;
  const idRing2 = idRing.clone(); idRing2.rotation.x = Math.PI / 2; idRing2.position.y = -0.503;
  gBand.add(idRing, idRing2);

  /* scan ring for the quality check */
  const scanGroup = new THREE.Group(); tilt.add(scanGroup);
  const scanCore = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.006, 8, 220), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 }));
  const scanGlow = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.03, 8, 220), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  [scanCore, scanGlow].forEach((m) => { m.rotation.x = Math.PI / 2; scanGroup.add(m); });

  /* soft contact shadow */
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false, opacity: 0.5 }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -2.35; scene.add(shadow);

  /* cure: warm halo behind the tyre */
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshBasicMaterial({ map: glowTexture(), transparent: true, depthWrite: false, opacity: 0 }));
  glow.renderOrder = -1; scene.add(glow);

  /* ---------- state ---------- */
  const cur = { explode: 1, rubber: 0.12, band: 0.12, dist: 10.5, yaw: -0.75, pitch: 0.28, focus: 0, heat: 0, idGlow: 0, scan: -1 };
  const tgt = { ...cur };
  let stage = -1, local = 0, stacked = false, visible = false, raf = 0, last = performance.now(), spinA = 0;
  let mx = 0, my = 0, smx = 0, smy = 0;

  const setOpacity = (m: THREE.Material & { opacity: number }, o: number) => {
    m.opacity = o; m.transparent = o < 0.995; m.depthWrite = o > 0.5; m.visible = o > 0.01;
  };

  /* label anchors: point on each ring, fanned from "up" so the tags never stack */
  const centers: Record<string, THREE.Group> = { band: gBand, base: gBase, cush: gCush, tread: gTread };
  const radii: Record<string, number> = { band: 1.0, base: 1.2, cush: 1.48, tread: 1.9 };
  const fan: Record<string, number> = { tread: 0.15, cush: 0.55, base: 0.95, band: 1.35 };
  const v = new THREE.Vector3(), axis = new THREE.Vector3(), up = new THREE.Vector3(), right = new THREE.Vector3();

  function placeTags(w: number, h: number) {
    axis.set(0, 1, 0).applyQuaternion(spin.getWorldQuaternion(new THREE.Quaternion())).normalize();
    up.set(0, 1, 0).addScaledVector(axis, -axis.y).normalize();
    right.crossVectors(up, axis).normalize();
    if (right.x < 0) right.negate();
    const show = new Set(STAGES[stage]?.labels ?? []);
    tags.forEach((el, k) => {
      let anchor: THREE.Vector3;
      if (centers[k]) {
        const c = centers[k].getWorldPosition(new THREE.Vector3());
        const a = fan[k];
        anchor = c.addScaledVector(up, Math.cos(a) * radii[k]).addScaledVector(right, Math.sin(a) * radii[k]);
      } else {
        anchor = gTread.getWorldPosition(new THREE.Vector3()).addScaledVector(up, 1.95).addScaledVector(right, 0.9);
      }
      v.copy(anchor).project(camera);
      const x = (v.x * 0.5 + 0.5) * w, y = (-v.y * 0.5 + 0.5) * h;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      el.classList.toggle("on", show.has(k));
    });
  }

  function resize() {
    const r = stageEl.getBoundingClientRect();
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / Math.max(1, r.height);
    /* keep the tyre framed on narrow screens */
    camera.fov = camera.aspect < 0.8 ? 40 : camera.aspect < 1.2 ? 33 : 28;
    /* frame the tyre right of centre on wide screens (copy sits left), and high on phones (copy sits below) */
    const w = Math.round(r.width), h = Math.round(r.height);
    if (camera.aspect >= 1.2) camera.setViewOffset(w, h, -Math.round(w * 0.1), -Math.round(h * 0.03), w, h);
    else camera.setViewOffset(w, h, Math.round(w * 0.12), Math.round(h * 0.17), w, h);
    camera.updateProjectionMatrix();
  }

  function setStage(i: number) {
    if (i === stage) return;
    stage = i;
    items.forEach((it, k) => it.classList.toggle("on", k === i));
    rows.forEach((r, k) => {
      const em = r.querySelector("em")!;
      r.classList.toggle("on", k <= i);
      r.classList.toggle("now", k === i);
      em.textContent = k <= i ? em.getAttribute("data-v") ?? "" : "—";
    });
    count.textContent = `${i + 1} / ${N}`;
    Object.assign(tgt, STAGES[i]);
  }

  function onScroll() {
    const r = scroll.getBoundingClientRect(), total = scroll.offsetHeight - window.innerHeight;
    const p = Math.min(1, Math.max(0, -r.top / (total || 1)));
    const f = Math.min(N - 0.0001, p * N);
    setStage(Math.floor(f));
    local = f - Math.floor(f);
    segs.forEach((s, k) => { s.style.setProperty("--f", String(k < stage ? 1 : k === stage ? local : 0)); s.classList.toggle("on", k === stage); });
    sec.style.setProperty("--p", p.toFixed(4));
    /* scroll-scrubbed moments */
    if (stage === 3) tgt.explode = 1 - THREE.MathUtils.smoothstep(local, 0.1, 0.85);
    tgt.scan = stage === 5 ? THREE.MathUtils.lerp(-0.62, 0.62, THREE.MathUtils.smoothstep(local, 0.05, 0.9)) : -1;
  }

  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    if (!visible) return;
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    const k = reduce.matches ? 1 : 1 - Math.exp(-dt * 4.5);
    (Object.keys(cur) as (keyof typeof cur)[]).forEach((key) => { cur[key] += (tgt[key] - cur[key]) * k; });
    smx += (mx - smx) * (reduce.matches ? 1 : 1 - Math.exp(-dt * 3));
    smy += (my - smy) * (reduce.matches ? 1 : 1 - Math.exp(-dt * 3));

    /* exploded view along the tyre axis, centred */
    const e = cur.explode;
    const offs = { band: 0, base: 0.95 * e, cush: 1.9 * e, tread: 2.85 * e };
    const mid = 1.425 * e;
    gBand.position.y = offs.band - mid; gBase.position.y = offs.base - mid;
    gCush.position.y = offs.cush - mid; gTread.position.y = offs.tread - mid;

    setOpacity(mats.base, cur.rubber); setOpacity(mats.cush, cur.rubber); setOpacity(mats.tread, cur.rubber);
    setOpacity(bandMat, cur.band);
    idMat.opacity = Math.min(1, cur.band * 1.2);
    idMat.emissiveIntensity = cur.idGlow * 1.6;

    /* cure: warm glow breathing through the rubber */
    const breath = 0.75 + 0.25 * Math.sin(now / 420);
    [mats.base, mats.cush, mats.tread].forEach((m) => (m.emissiveIntensity = cur.heat * 0.012 * breath));
    warm.intensity = cur.heat * 26 * breath;
    (glow.material as THREE.MeshBasicMaterial).opacity = cur.heat * (0.7 + 0.3 * breath);
    glow.visible = cur.heat > 0.01;

    /* scan ring sweeping along the axis */
    const scanOn = cur.scan > -0.98 ? 1 : 0;
    scanGroup.position.y = Math.max(-0.62, cur.scan);
    scanGroup.visible = scanOn > 0;
    (scanCore.material as THREE.MeshBasicMaterial).opacity = scanOn * 0.95;
    (scanGlow.material as THREE.MeshBasicMaterial).opacity = scanOn * 0.35;

    if (!reduce.matches) spinA += dt * 0.12;
    spin.rotation.y = spinA;
    yaw.rotation.y = cur.yaw + smx * 0.12;
    pitch.rotation.x = cur.pitch + smy * 0.06;

    /* focus: slide the whole model so the band sits at the centre of the frame */
    root.position.set(0, 0, 0); root.updateMatrixWorld(true);
    const bw = gBand.getWorldPosition(new THREE.Vector3());
    root.position.set(-bw.x * cur.focus, 0, -bw.z * cur.focus);
    const near = camera.aspect < 0.8 ? 1.5 : camera.aspect < 1.2 ? 1.18 : 1;
    camera.position.set(0, 0.35 + cur.pitch * 1.6, cur.dist * 1.55 * near);
    camera.lookAt(0, 0, 0);
    glow.quaternion.copy(camera.quaternion);
    glow.position.copy(root.position).addScaledVector(new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion), 3);

    const w = renderer.domElement.clientWidth, h = renderer.domElement.clientHeight;
    renderer.render(scene, camera);
    placeTags(w, h);
  }

  /* ---------- wiring ---------- */
  const goButtons = Array.from(sec.querySelectorAll<HTMLElement>("[data-go]"));
  const onGo = (ev: Event) => {
    const i = Number((ev.currentTarget as HTMLElement).dataset.go), total = scroll.offsetHeight - window.innerHeight;
    window.scrollTo({ top: scroll.getBoundingClientRect().top + window.scrollY + total * ((i + 0.5) / N), behavior: reduce.matches ? "auto" : "smooth" });
  };
  goButtons.forEach((b) => b.addEventListener("click", onGo));

  const onPointer = (e: PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    mx = (e.clientX / window.innerWidth) * 2 - 1; my = (e.clientY / window.innerHeight) * 2 - 1;
  };
  const layout = () => {
    stacked = false;
    scroll.style.height = N * 70 + 100 + "vh";
    resize(); onScroll();
  };
  const introIO = new IntersectionObserver((es, o) => es.forEach((en) => { if (en.isIntersecting) { sec.classList.add("in"); o.disconnect(); } }), { threshold: 0.25 });
  introIO.observe($(".h3-intro"));
  const viewIO = new IntersectionObserver((es) => es.forEach((en) => { visible = en.isIntersecting; last = performance.now(); }), { rootMargin: "200px 0px" });
  viewIO.observe(scroll);

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", layout);
  window.addEventListener("pointermove", onPointer, { passive: true });
  layout();
  setStage(0);
  raf = requestAnimationFrame(frame);
  void stacked;

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", layout);
    window.removeEventListener("pointermove", onPointer);
    goButtons.forEach((b) => b.removeEventListener("click", onGo));
    introIO.disconnect(); viewIO.disconnect();
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose()); else mat?.dispose();
    });
    idTex.dispose(); envRT.dispose(); pmrem.dispose(); renderer.dispose();
    scroll.style.height = "";
  };
}
