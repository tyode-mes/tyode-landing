/* Section 04: a live 3D solid tyre, scroll-choreographed through the eight stages.
   Driven by scrollBus (zero layout reads during scroll, cached tag widths, zero per-frame allocations,
   auto-sleeps WebGL rAF completely when off-screen). */

import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { scrollBus } from "@/lib/scrollBus";

type Stage = {
  explode: number; rubber: number; band: number; dist: number; yaw: number; pitch: number; focus: number;
  heat: number; idGlow: number; labels: string[];
};

const STAGES: Stage[] = [
  { explode: 1.0, rubber: 1.0, band: 1.0, dist: 9.6, yaw: -0.72, pitch: 0.24, focus: 0, heat: 0, idGlow: 0, labels: [] },
  { explode: 1.0, rubber: 1.0, band: 0.22, dist: 9.8, yaw: -0.62, pitch: 0.24, focus: 0, heat: 0, idGlow: 0, labels: ["base", "cush", "tread"] },
  { explode: 1.0, rubber: 0.0, band: 1.0, dist: 6.2, yaw: -0.95, pitch: 0.12, focus: 1, heat: 0, idGlow: 1, labels: ["band"] },
  { explode: 1.0, rubber: 1.0, band: 1.0, dist: 9.0, yaw: -0.55, pitch: 0.2, focus: 0, heat: 0, idGlow: 0.35, labels: ["band", "base", "cush", "tread"] },
  { explode: 0.0, rubber: 1.0, band: 1.0, dist: 8.8, yaw: -0.5, pitch: 0.18, focus: 0, heat: 1, idGlow: 0, labels: ["cure"] },
  { explode: 0.0, rubber: 1.0, band: 1.0, dist: 8.8, yaw: -0.62, pitch: 0.18, focus: 0, heat: 0, idGlow: 0, labels: ["check"] },
  { explode: 0.0, rubber: 1.0, band: 1.0, dist: 9.8, yaw: -1.22, pitch: 0.12, focus: 0, heat: 0, idGlow: 0, labels: ["store"] },
  { explode: 0.0, rubber: 1.0, band: 1.0, dist: 10.0, yaw: -0.38, pitch: 0.24, focus: 0, heat: 0, idGlow: 0, labels: ["ship"] },
];

const CAPTIONS_N = STAGES.length;

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

function idTexture() {
  const S = 1024, c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, S, S);
  g.translate(S / 2, S / 2);
  g.fillStyle = "#ffffff";
  g.font = "600 23px Inter, Helvetica, Arial, sans-serif";
  g.textBaseline = "middle";
  const R = (1.0 / 1.045) * (S / 2);
  const text = "P1-2611-00427";
  for (let rep = 0; rep < 3; rep++) {
    const start = rep * ((Math.PI * 2) / 3);
    let a = start;
    g.save(); g.rotate(a); g.translate(0, -R);
    for (let r = 0; r < 6; r++) for (let q = 0; q < 6; q++) {
      const on = q === 0 || r === 5 || (r === 0 && q % 2 === 0) || (q === 5 && r % 2 === 1) || ((r * 7 + q * 3) % 5 < 2);
      if (on) g.fillRect(-12 + q * 4, -12 + r * 4, 4, 4);
    }
    g.restore();
    a += 0.06;
    for (const ch of text) {
      const w = g.measureText(ch).width;
      g.save(); g.rotate(a + w / 2 / R); g.translate(0, -R);
      g.fillText(ch, -w / 2, 0);
      g.restore();
      a += (w + 3) / R;
    }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
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
  grd.addColorStop(0, "rgba(0,0,0,0.48)");
  grd.addColorStop(0.5, "rgba(0,0,0,0.16)");
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

  scroll.style.height = N * 58 + 100 + "vh";

  /* ---------- renderer, scene, camera ---------- */
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04);
  scene.environment = envRT.texture;

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);

  const key = new THREE.DirectionalLight(0xffffff, 1.65); key.position.set(4, 6, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffffff, 1.25); rim.position.set(-6, 3, -4); scene.add(rim);
  const warm = new THREE.PointLight(0xff9a5a, 0, 14); warm.position.set(0, 1.2, -3.5); scene.add(warm);

  /* ---------- the tyre ---------- */
  const root = new THREE.Group(); scene.add(root);
  const yaw = new THREE.Group(); root.add(yaw);
  const pitch = new THREE.Group(); yaw.add(pitch);
  const tilt = new THREE.Group(); tilt.rotation.z = Math.PI / 2; pitch.add(tilt);
  const spin = new THREE.Group(); tilt.add(spin);

  const SEG = 96;
  const rubberMat = (hex: number) =>
    new THREE.MeshPhysicalMaterial({ color: hex, roughness: 0.8, metalness: 0, clearcoat: 0.14, clearcoatRoughness: 0.65, side: THREE.FrontSide, emissive: 0xff7a2e, emissiveIntensity: 0 });
  const mats = { base: rubberMat(0x2c2c30), cush: rubberMat(0x232326), tread: rubberMat(0x161618) };
  const bandMat = new THREE.MeshPhysicalMaterial({ color: 0xcfd3d8, metalness: 1, roughness: 0.24, side: THREE.FrontSide });

  const layer = (name: string) => { const g = new THREE.Group(); g.name = name; spin.add(g); return g; };
  const gBand = layer("band"), gBase = layer("base"), gCush = layer("cush"), gTread = layer("tread");

  gBand.add(new THREE.Mesh(new THREE.LatheGeometry(ringProfile(0.95, 1.05, 0.5, 0.012), SEG), bandMat));
  gBase.add(new THREE.Mesh(new THREE.LatheGeometry(ringProfile(1.05, 1.33, 0.48, 0.02), SEG), mats.base));
  gCush.add(new THREE.Mesh(new THREE.LatheGeometry(ringProfile(1.33, 1.62, 0.47, 0.02), SEG), mats.cush));
  gTread.add(new THREE.Mesh(new THREE.LatheGeometry(ringProfile(1.62, 1.86, 0.46, 0.09, 8), SEG), mats.tread));

  const LUGS = 64, lugGeo = new THREE.BoxGeometry(0.1, 0.34, 0.17);
  const lugs = new THREE.InstancedMesh(lugGeo, mats.tread, LUGS * 2);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), pos = new THREE.Vector3(), sc = new THREE.Vector3(1, 1, 1);
  const yAxis = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < LUGS * 2; i++) {
    const side = i % 2 ? 1 : -1, th = (Math.floor(i / 2) + (side > 0 ? 0.5 : 0)) * ((Math.PI * 2) / LUGS);
    const R = 1.86 + 0.035;
    pos.set(R * Math.sin(th), side * 0.21, R * Math.cos(th));
    q.setFromAxisAngle(yAxis, th + Math.PI / 2);
    m4.compose(pos, q, sc);
    lugs.setMatrixAt(i, m4);
  }
  gTread.add(lugs);

  const idTex = idTexture();
  const idMat = new THREE.MeshStandardMaterial({ map: idTex, transparent: true, metalness: 0.4, roughness: 0.4, emissive: 0xffffff, emissiveMap: idTex, emissiveIntensity: 0, depthWrite: false });
  const idRing = new THREE.Mesh(new THREE.RingGeometry(0.955, 1.045, 120), idMat);
  idRing.rotation.x = -Math.PI / 2; idRing.position.y = 0.503;
  const idRing2 = idRing.clone(); idRing2.rotation.x = Math.PI / 2; idRing2.position.y = -0.503;
  gBand.add(idRing, idRing2);

  const scanGroup = new THREE.Group(); tilt.add(scanGroup);
  const scanCore = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.006, 8, 140), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0 }));
  const scanGlow = new THREE.Mesh(new THREE.TorusGeometry(2.0, 0.03, 8, 140), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }));
  [scanCore, scanGlow].forEach((m) => { m.rotation.x = Math.PI / 2; scanGroup.add(m); });

  const shadowTex = shadowTexture();
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(7, 7), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, opacity: 0.3 }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -2.35; scene.add(shadow);

  const glowTex = glowTexture();
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, opacity: 0 }));
  glow.renderOrder = -1; scene.add(glow);

  /* ---------- state + cached bounds ---------- */
  const cur = { explode: 1, rubber: 1.0, band: 1.0, dist: 9.6, yaw: -0.72, pitch: 0.24, focus: 0, heat: 0, idGlow: 0, scan: -1 };
  const tgt = { ...cur };
  let stage = -1, local = 0, raf = 0, running = false, last = performance.now(), spinA = 0;
  let mx = 0, my = 0, smx = 0, smy = 0;
  let scrollTop = 0, scrollHeight = 1, stageW = 1, stageH = 1, fit = 1;
  let lastPStr = "";
  const lastSegF = new Array<string>(N).fill("");
  const tagWidths = new Map<string, number>();
  const tagFlip = new Map<string, boolean>();
  const tagOn = new Map<string, boolean>();

  const v = new THREE.Vector3();
  const axis = new THREE.Vector3();
  const up = new THREE.Vector3();
  const right = new THREE.Vector3();
  const tmpQuat = new THREE.Quaternion();
  const tmpPos = new THREE.Vector3();
  const tmpBandPos = new THREE.Vector3();
  const tmpCamBack = new THREE.Vector3();

  const centers: Record<string, THREE.Group> = { band: gBand, base: gBase, cush: gCush, tread: gTread };
  const radii: Record<string, number> = { band: 1.0, base: 1.2, cush: 1.48, tread: 1.9 };
  const fan: Record<string, number> = { tread: 0.15, cush: 0.55, base: 0.95, band: 1.35 };

  const setOpacity = (m: THREE.Material & { opacity: number }, o: number) => {
    const trans = o < 0.995;
    if (m.transparent !== trans) {
      m.transparent = trans;
      m.needsUpdate = true;
    }
    m.opacity = o;
    m.depthWrite = o > 0.5;
    m.visible = o > 0.01;
  };

  function measureTagWidths() {
    tags.forEach((el, k) => {
      tagWidths.set(k, el.offsetWidth || 140);
    });
  }

  function placeTags() {
    const show = STAGES[stage]?.labels ?? [];
    axis.set(0, 1, 0).applyQuaternion(spin.getWorldQuaternion(tmpQuat)).normalize();
    up.set(0, 1, 0).addScaledVector(axis, -axis.y).normalize();
    right.crossVectors(up, axis).normalize();
    if (right.x < 0) right.negate();

    tags.forEach((el, k) => {
      const isOn = show.includes(k);
      if (tagOn.get(k) !== isOn) {
        tagOn.set(k, isOn);
        el.classList.toggle("on", isOn);
      }
      if (!isOn) return;

      if (centers[k]) {
        centers[k].getWorldPosition(tmpPos);
        const a = fan[k];
        tmpPos.addScaledVector(up, Math.cos(a) * radii[k]).addScaledVector(right, Math.sin(a) * radii[k]);
      } else {
        gTread.getWorldPosition(tmpPos).addScaledVector(up, 1.95).addScaledVector(right, 0.9);
      }
      v.copy(tmpPos).project(camera);
      const x = (v.x * 0.5 + 0.5) * stageW;
      const y = (-v.y * 0.5 + 0.5) * stageH;
      const tw = tagWidths.get(k) ?? 140;
      const flip = x + tw > stageW - 12;
      if (tagFlip.get(k) !== flip) {
        tagFlip.set(k, flip);
        el.classList.toggle("flip", flip);
      }
      const tx = Math.max(8, flip ? x - tw : x);
      el.style.transform = `translate3d(${tx.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    });
  }

  function measure() {
    fit = 1;
    const r = stageEl.getBoundingClientRect();
    stageW = Math.max(1, r.width);
    stageH = Math.max(1, r.height);

    const sr = scroll.getBoundingClientRect();
    scrollTop = sr.top + window.scrollY;
    scrollHeight = scroll.offsetHeight;

    renderer.setSize(stageW, stageH, false);
    camera.aspect = stageW / stageH;
    camera.fov = camera.aspect < 0.8 ? 40 : camera.aspect < 1.2 ? 33 : 28;
    const w = Math.round(stageW), h = Math.round(stageH);
    if (camera.aspect >= 1.2) {
      camera.setViewOffset(w, h, -Math.round(w * 0.04), Math.round(h * 0.085), w, h);
    } else {
      camera.setViewOffset(w, h, 0, Math.round(h * 0.16), w, h);
      const gap = Math.max(140, h - 320 - 96);
      fit = Math.max(1.06, (0.34 * h) / (0.85 * gap));
    }
    camera.updateProjectionMatrix();
    measureTagWidths();
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

  const isNearViewport = (y: number, vh: number) =>
    y + vh > scrollTop - 300 && y < scrollTop + scrollHeight + 300;

  const stopLoop = () => {
    if (!running) return;
    running = false;
    cancelAnimationFrame(raf);
    raf = 0;
  };

  const startLoop = () => {
    if (running || document.hidden) return;
    running = true;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  };

  function syncFromScroll(y: number, vh: number) {
    if (isNearViewport(y, vh)) {
      if (!running) startLoop();
    } else {
      if (running) stopLoop();
      return;
    }

    const total = Math.max(1, scrollHeight - vh);
    const p = Math.min(1, Math.max(0, (y - scrollTop) / total));
    const f = Math.min(N - 0.0001, p * N);
    setStage(Math.floor(f));
    local = f - Math.floor(f);

    for (let k = 0; k < segs.length; k++) {
      const fv = (k < stage ? 1 : k === stage ? local : 0).toFixed(3);
      if (lastSegF[k] !== fv) {
        lastSegF[k] = fv;
        segs[k].style.setProperty("--f", fv);
      }
      segs[k].classList.toggle("on", k === stage);
    }

    const pStr = p.toFixed(4);
    if (pStr !== lastPStr) {
      lastPStr = pStr;
      sec.style.setProperty("--p", pStr);
    }

    if (stage === 3) tgt.explode = 1 - THREE.MathUtils.smoothstep(local, 0.1, 0.85);
    tgt.scan = stage === 5 ? THREE.MathUtils.lerp(-0.62, 0.62, THREE.MathUtils.smoothstep(local, 0.05, 0.9)) : -1;
  }

  function frame(now: number) {
    if (!running) return;
    const bus = scrollBus.getState();
    if (!isNearViewport(bus.y, bus.vh)) {
      stopLoop();
      return;
    }
    raf = requestAnimationFrame(frame);

    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const k = reduce.matches ? 1 : 1 - Math.exp(-dt * 5.2);
    cur.explode += (tgt.explode - cur.explode) * k;
    cur.rubber += (tgt.rubber - cur.rubber) * k;
    cur.band += (tgt.band - cur.band) * k;
    cur.dist += (tgt.dist - cur.dist) * k;
    cur.yaw += (tgt.yaw - cur.yaw) * k;
    cur.pitch += (tgt.pitch - cur.pitch) * k;
    cur.focus += (tgt.focus - cur.focus) * k;
    cur.heat += (tgt.heat - cur.heat) * k;
    cur.idGlow += (tgt.idGlow - cur.idGlow) * k;
    cur.scan += (tgt.scan - cur.scan) * k;

    const pk = reduce.matches ? 1 : 1 - Math.exp(-dt * 3.5);
    smx += (mx - smx) * pk;
    smy += (my - smy) * pk;

    const e = cur.explode;
    const mid = 1.425 * e;
    gBand.position.y = -mid;
    gBase.position.y = 0.95 * e - mid;
    gCush.position.y = 1.9 * e - mid;
    gTread.position.y = 2.85 * e - mid;

    setOpacity(mats.base, cur.rubber);
    setOpacity(mats.cush, cur.rubber);
    setOpacity(mats.tread, cur.rubber);
    setOpacity(bandMat, cur.band);
    idMat.opacity = Math.min(1, cur.band * 1.2);
    idMat.emissiveIntensity = cur.idGlow * 1.6;

    const breath = 0.75 + 0.25 * Math.sin(now / 420);
    const heatEmissive = cur.heat * 0.012 * breath;
    mats.base.emissiveIntensity = heatEmissive;
    mats.cush.emissiveIntensity = heatEmissive;
    mats.tread.emissiveIntensity = heatEmissive;
    warm.intensity = cur.heat * 26 * breath;
    (glow.material as THREE.MeshBasicMaterial).opacity = cur.heat * (0.7 + 0.3 * breath);
    glow.visible = cur.heat > 0.01;

    const scanOn = cur.scan > -0.98 ? 1 : 0;
    scanGroup.position.y = Math.max(-0.62, cur.scan);
    scanGroup.visible = scanOn > 0;
    (scanCore.material as THREE.MeshBasicMaterial).opacity = scanOn * 0.95;
    (scanGlow.material as THREE.MeshBasicMaterial).opacity = scanOn * 0.35;

    if (!reduce.matches) spinA += dt * 0.12;
    spin.rotation.y = spinA;
    yaw.rotation.y = cur.yaw + smx * 0.12;
    pitch.rotation.x = cur.pitch + smy * 0.06;

    root.position.set(0, 0, 0);
    root.updateMatrixWorld(true);
    gBand.getWorldPosition(tmpBandPos);
    root.position.set(-tmpBandPos.x * cur.focus, 0, -tmpBandPos.z * cur.focus);

    const near = camera.aspect < 0.8 ? 1.28 * fit : camera.aspect < 1.2 ? 1.18 : 1;
    camera.position.set(0, 0.35 + cur.pitch * 1.6, cur.dist * 1.7 * near);
    camera.lookAt(0, 0, 0);

    glow.quaternion.copy(camera.quaternion);
    tmpCamBack.set(0, 0, -1).applyQuaternion(camera.quaternion);
    glow.position.copy(root.position).addScaledVector(tmpCamBack, 3);

    renderer.render(scene, camera);
    placeTags();
  }

  /* ---------- wiring ---------- */
  const goButtons = Array.from(sec.querySelectorAll<HTMLElement>("[data-go]"));
  const onGo = (ev: Event) => {
    const i = Number((ev.currentTarget as HTMLElement).dataset.go);
    const total = Math.max(1, scrollHeight - scrollBus.getState().vh);
    scrollBus.scrollTo(scrollTop + total * ((i + 0.5) / N), { duration: 0.95 });
  };
  goButtons.forEach((b) => b.addEventListener("click", onGo));

  const onPointer = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" || !running) return;
    mx = (e.clientX / window.innerWidth) * 2 - 1;
    my = (e.clientY / window.innerHeight) * 2 - 1;
  };

  const onVisibility = () => {
    if (document.hidden) stopLoop();
    else {
      const b = scrollBus.getState();
      if (isNearViewport(b.y, b.vh)) startLoop();
    }
  };

  const introIO = new IntersectionObserver(
    (es, o) => es.forEach((en) => { if (en.isIntersecting) { sec.classList.add("in"); o.disconnect(); } }),
    { threshold: 0.2 }
  );
  introIO.observe($(".h3-intro"));

  document.fonts.ready.then(measureTagWidths);
  measure();
  setStage(0);

  const unsubResize = scrollBus.onResize(measure);
  const unsubScroll = scrollBus.subscribe((s) => syncFromScroll(s.y, s.vh));
  window.addEventListener("pointermove", onPointer, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);

  scrollBus.refresh();

  return () => {
    stopLoop();
    unsubScroll();
    unsubResize();
    window.removeEventListener("pointermove", onPointer);
    document.removeEventListener("visibilitychange", onVisibility);
    goButtons.forEach((b) => b.removeEventListener("click", onGo));
    introIO.disconnect();
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose()); else mat?.dispose();
    });
    idTex.dispose(); shadowTex.dispose(); glowTex.dispose(); envRT.dispose(); pmrem.dispose(); renderer.dispose();
    scroll.style.height = "";
  };
}