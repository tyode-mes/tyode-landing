"use client";

/* Tyre Passport: a guided concept demo with sample data.
   One tyre is followed through the plant. The default is a pneumatic line (raw materials, mixing,
   building with the stitch count and label, curing, inspection, storage, dispatch); the solid line shows the same product with
   steel band IDs. The camera flies to each station, each scan adds a line to the tyre's passport, and
   then the passport is used to solve real problems. Nothing runs on its own: the visitor drives it. */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import TyodeLogo from "@/components/brand/TyodeLogo";
import Scene, { P, ROUTE, VIEW, tickScene, type Carry, type Mover, type SceneProps } from "./scene";
import Lens from "./Lens";
import { AT, SERVER, STATIONS, rackSlot, station, type Scenario, type StationId, type V3 } from "./story";
import { LINES, type LineCfg, type LineKind } from "./lines";
import s from "./PassportDemo.module.css";

/* ---------- state ---------- */

type Sim = Pick<SceneProps, "lot" | "batch" | "tyre" | "movers" | "fx" | "pressClosed" | "layers" | "label" | "spot" | "save" | "agv" | "tow" | "later" | "mark" | "back" | "expired" | "wifi"> & { entries: number; checks: number };
const START: Sim = {
  lot: "dock", batch: "none", tyre: { stage: "blank", at: "bench" }, movers: [], fx: null, pressClosed: false,
  layers: 0, label: false, spot: null, save: null, agv: null, tow: false, entries: 0, checks: 0, later: false, mark: "none", back: false, expired: false, wifi: "ok",
};
const LATER: Sim = { ...START, lot: "mixer", batch: "build", tyre: { stage: "cured", at: "truck" }, layers: 3, checks: 3, entries: 8, later: true };
/* the pneumatic line has no steel band: the drum starts empty and the tyre gets a printed label */
const START_P: Sim = { ...START, tyre: { stage: "band", at: "drum" } };
const LATER_P: Sim = { ...START_P, lot: "mixer", batch: "build", tyre: { stage: "cured", at: "truck" }, layers: 3, label: true, checks: 3, entries: 7, later: true };
const startOf = (l: LineKind) => (l === "solid" ? START : START_P);
const laterOf = (l: LineKind) => (l === "solid" ? LATER : LATER_P);

type View = StationId | "all" | "offline" | "free";
type Cam = { x: number; y: number; k: number };
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const glide = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/* a drive along the floor: the cart on the aisle, or a trolley being pushed */
type Trip = { who: "agv" | "tow"; pts: [number, number][]; t0: number; dur: number; follow: boolean; done?: () => void };
const routeIndex = (st: number) => (st < 4 ? st : st + 2);
const lane = (a: number, b: number): [number, number][] => {
  const i = routeIndex(a), j = routeIndex(b);
  return i <= j ? ROUTE.slice(i, j + 1) : ROUTE.slice(j, i + 1).reverse();
};
const along = (pts: [number, number][], k: number): [number, number] => {
  const seg = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]));
  let d = k * seg.reduce((a, b) => a + b, 0);
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i] || i === seg.length - 1) { const f = seg[i] ? Math.min(1, d / seg[i]) : 0; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f]; }
    d -= seg[i];
  }
  return pts[0];
};
const pathLen = (pts: [number, number][]) => pts.slice(1).reduce((n, q, i) => n + Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]), 0);
const HOP = 1150;

/* one caption on screen: a beat of the story, timed so there is time to read it and watch it happen */
type Beat = { text: string; ms: number; run?: () => void };
type Caption = { id: number; text: string; i: number; n: number; ms: number };
type Card = { at: V3; title: string; rows: [string, string][]; tone?: "warn" };
const SAVE_FROM: Record<StationId, V3> = {
  receive: [14, 22, 2], mix: [59.6, 22, 3], band: [72.5, 13.4, 5], build: [102, 15, 6], cure: [102.5, 56, 6],
  inspect: [67.5, 62.5, 2], store: [44.5, 64, 10], dispatch: [19.5, 60, 4],
};
/* where the intro labels sit: lifted where two stations are close together in the whole-plant view */
const TAG_AT = (st: StationId): V3 => { const q = SAVE_FROM[st]; return [q[0], q[1], q[2] + (st === "band" ? 12 : st === "mix" ? 2 : 3)]; };
type Pin = { key: string; at: V3; rows?: [string, string][]; warn?: boolean; kind: "pill" | "callout" | "hero" | "count" | "fact" | "card" | "paper" | "kit"; text: string; sub?: string; tone?: "warn" | "bad" | "ok"; n?: number | string; pick?: StationId; delay?: number };

/* ---------- small pieces ---------- */

/* a Data Matrix style mark for the tyre ID. Decorative: the pattern is fixed, not an encoded value. */
function Matrix({ size = 44 }: { size?: number }) {
  const n = 12, cells: React.ReactNode[] = [];
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const on = x === 0 || y === n - 1 || (y === 0 && x % 2 === 0) || (x === n - 1 && y % 2 === 1) || (x > 0 && x < n - 1 && y > 0 && y < n - 1 && ((x * 7 + y * 13 + x * y * 3) % 5 < 2));
    if (on) cells.push(<rect key={`${x}-${y}`} x={x} y={y} width="1.03" height="1.03" />);
  }
  return <svg className={s.matrix} width={size} height={size} viewBox="0 0 12 12" aria-hidden="true">{cells}</svg>;
}

function CureCurve({ L }: { L: LineCfg }) {
  if (L.cure.cool) {
    const pts = [[0, 30], [6, 22], [14, 12], [24, 9.5], [60, 9], [96, 9.4], [118, 9.2], [126, 15], [136, 25], [140, 30]];
    return (
      <svg className={s.curve} viewBox="0 0 140 34" role="img" aria-label="Press temperature across the cure, under the limit">
        <line x1="0" x2="140" y1="5" y2="5" className={s.curveLimit} />
        <polyline points={pts.map((q) => q.join(",")).join(" ")} className={s.curveCool} />
        <text x="139" y="3.4" textAnchor="end" className={s.curveLimitT}>Limit 155 °C</text>
        <text x="71" y="20" textAnchor="middle">{L.cure.peak}</text>
        <text x="71" y="31" textAnchor="middle">{L.cure.dur}</text>
      </svg>
    );
  }
  const pts = [[0, 30], [6, 22], [14, 9], [24, 5], [60, 4], [96, 4.5], [118, 5], [126, 12], [136, 24], [140, 30]];
  return (
    <svg className={s.curve} viewBox="0 0 140 34" role="img" aria-label="Press temperature across the cure">
      <rect x="20" y="2" width="102" height="6" className={s.curveBand} />
      <polyline points={pts.map((q) => q.join(",")).join(" ")} />
      <text x="71" y="17" textAnchor="middle">Usual range</text>
      <text x="71" y="30" textAnchor="middle">2 h 40 min</text>
    </svg>
  );
}

function PassportCard({ sim, hot, L }: { sim: Sim; hot: boolean; L: LineCfg }) {
  const list = useRef<HTMLOListElement>(null);
  const born = sim.entries >= L.firstId;
  useEffect(() => { const el = list.current; if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" }); }, [sim.entries]);
  const status = sim.mark === "held" ? ["On hold", s.stBad] : sim.mark === "found" ? [L.markStatus, s.stWarn]
    : [L.status[sim.entries], sim.entries >= L.entries.length - 2 ? s.stOk : ""];
  return (
    <section className={`${s.passport} ${hot ? s.passportHot : ""}`} aria-label="Tyre passport">
      <header className={s.ppHead}>
        <div className={born ? s.ppCode : `${s.ppCode} ${s.ppCodeEmpty}`}>{born && <Matrix />}</div>
        <div className={s.ppId}>
          <span>Tyre passport</span>
          <b>{born ? L.hero : "No ID yet"}</b>
          <em>{born ? L.heroDesc : L.idNote}</em>
        </div>
        <i className={`${s.status} ${status[1]}`}>{status[0]}</i>
      </header>
      {sim.entries === 0 ? <p className={s.ppEmpty}>Nothing recorded yet. Every scan on the floor adds a line here.</p> : (
        <ol className={s.ppList} ref={list}>
          {L.entries.slice(0, sim.entries).map((e) => (
            <li key={e.n}>
              <i>{e.n}</i>
              <div>
                <div className={s.ppRow}><b>{e.title}</b><time>{e.when}</time></div>
                <dl>
                  {e.facts.map(([k, v]) => (
                    <div key={k} className={sim.mark !== "none" && v.includes(L.markFact.match) && e.n === L.markFact.entry ? (sim.mark === "held" ? s.factBad : s.factWarn) : ""}><dt>{k}</dt><dd>{v}</dd></div>
                  ))}
                </dl>
                {e.extra === "cure" && <CureCurve L={L} />}
                {e.extra === "inspect" && (
                  <ul className={s.readings}>
                    {L.readings.map(([k, v, spec]) => <li key={k}><span>{k}</span><b>{v}</b><em>{spec}</em><i aria-label="within spec">✓</i></li>)}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/* ---------- page ---------- */

export default function PassportDemo() {
  const [line, setLine] = useState<LineKind>("pneumatic");
  const L = LINES[line];
  const [sim, setSim] = useState<Sim>(START_P);
  const [mode, setMode] = useState<"walk" | "menu" | "scenario">("walk");
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [scen, setScen] = useState<Scenario | null>(null);
  const [stage, setStage] = useState(0);
  const [tried, setTried] = useState<Record<string, boolean>>({});
  const [look, setLook] = useState<View | null>(null);
  const [lens, setLens] = useState<string | null>(null);
  const [tick, setTick] = useState<string | null>(null);
  const [auto, setAuto] = useState(false);
  const [cap, setCap] = useState<Caption | null>(null);
  const [card, setCard] = useState<Card | null>(null);
  const [saving, setSaving] = useState(false);
  const [kit, setKit] = useState<0 | 1 | 2 | 3>(0);     // intro: 1 paper logs, 2 searching them, 3 scanners
  const [net, setNet] = useState(false);
  const [showKit, setShowKit] = useState(false);       // "What Tyode installs" toggle
  const [hotPass, setHotPass] = useState(false);
  const [intro, setIntro] = useState(false);
  const [det, setDet] = useState(0);                   // the Detective's report: steps 1-4, 5 approved
  const [chip, setChip] = useState<{ id: number; text: string; x0: number; y0: number; x1: number; y1: number } | null>(null);
  const passRef = useRef<HTMLDivElement>(null);

  const timers = useRef<number[]>([]);
  const counter = useRef(0);
  const later = (ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, ms)); };
  const clearTimers = () => { timers.current.forEach((t) => window.clearTimeout(t)); timers.current = []; };
  useEffect(() => clearTimers, []);

  /* ----- camera and motion. The drawing's viewBox, the tags laid over it and the cart are moved
     directly, frame by frame, so React only re-renders when the story itself changes. ----- */
  const wrap = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const agvA = useRef<SVGGElement>(null);
  const agvB = useRef<SVGGElement>(null);
  const towRef = useRef<SVGGElement>(null);
  const cam = useRef<Cam>({ x: VIEW.w / 2, y: VIEW.h / 2, k: 1 });
  const size = useRef({ w: 0, h: 0 });
  const tween = useRef<{ from: Cam; to: Cam; t0: number; dur: number } | null>(null);
  const trips = useRef<Trip[]>([]);
  const agvAt = useRef(0);                         // station the cart is parked at
  const agvXY = useRef<[number, number]>(STATIONS[0].node);
  const cine = useRef(false);                      // a carry is in progress: the camera is being directed
  const still = useRef(false);
  const dragging = useRef(false);

  /* the camera at rest is never quite still: a slow drift, faded in when nothing else is moving it */
  const drift = useRef({ w: 0, x: 0, y: 0, k: 1 });
  const apply = useCallback(() => {
    const { w, h } = size.current, d = drift.current;
    if (!w || !h) return;
    const c = { x: cam.current.x + (d.x * d.w) / cam.current.k, y: cam.current.y + (d.y * d.w) / cam.current.k, k: cam.current.k * (1 + (d.k - 1) * d.w) };
    const vw = w / c.k, vh = h / c.k, vx = c.x - vw / 2, vy = c.y - vh / 2;
    svg.current?.setAttribute("viewBox", `${vx.toFixed(2)} ${vy.toFixed(2)} ${vw.toFixed(2)} ${vh.toFixed(2)}`);
    wrap.current?.querySelectorAll<HTMLElement>("[data-wx]").forEach((el) => {
      el.style.transform = `translate3d(${((Number(el.dataset.wx) - vx) * c.k).toFixed(2)}px,${((Number(el.dataset.wy) - vy) * c.k).toFixed(2)}px,0)`;
    });
  }, []);

  const toScreen = (q: V3): [number, number] => {
    const r = wrap.current!.getBoundingClientRect(), { w, h } = size.current, d = drift.current;
    const k = cam.current.k * (1 + (d.k - 1) * d.w), cx = cam.current.x + (d.x * d.w) / cam.current.k, cy = cam.current.y + (d.y * d.w) / cam.current.k;
    const [wx, wy] = P(...q);
    return [r.left + (wx - (cx - w / k / 2)) * k, r.top + (wy - (cy - h / k / 2)) * k];
  };
  /* a passport line is written: show the record leaving the server and landing in the passport */
  const flyChip = (text: string) => {
    if (!wrap.current || !passRef.current) return;
    const [x0, y0] = toScreen([SERVER[0], SERVER[1], 7]);
    const card = passRef.current.querySelector("section");
    if (!card) return;
    const pr = card.getBoundingClientRect();
    const list = card.querySelector("ol");
    /* the new line is already in the list (it fades in as the record lands): aim at it */
    const line = list?.lastElementChild?.getBoundingClientRect();
    const y1 = line ? Math.max(pr.top + 80, Math.min(line.top + 16, pr.bottom - 30)) : pr.top + 90;
    setChip({ id: ++counter.current, text, x0, y0, x1: pr.left + pr.width / 2, y1 });
    later(1500, () => setChip(null));
  };

  const place = useCallback((who: "agv" | "tow", x: number, y: number) => {
    const o = P(0, 0), q = P(x, y), tr = `translate(${(q[0] - o[0]).toFixed(2)} ${(q[1] - o[1]).toFixed(2)})`;
    if (who === "tow") { towRef.current?.setAttribute("transform", tr); return; }
    agvXY.current = [x, y];
    /* the cart is drawn twice, behind and in front of the server, and shown in whichever is right */
    agvA.current?.setAttribute("transform", tr); agvB.current?.setAttribute("transform", tr);
    if (agvA.current) agvA.current.style.display = y < 38 ? "" : "none";
    if (agvB.current) agvB.current.style.display = y < 38 ? "none" : "";
  }, []);

  const fit = useCallback((span: number) => Math.min(size.current.w / span, size.current.h / (span * 0.62)), []);
  const target = useCallback((v: View): Cam => {
    const { w, h } = size.current;
    if (v === "free") return { ...cam.current };
    if (v === "all") return { x: VIEW.w / 2, y: VIEW.h / 2 + 6, k: Math.min(w / VIEW.w, h / VIEW.h) };
    const c = v === "offline" ? { c: [50, 53] as [number, number], span: 560 } : station(v);
    const [x, y] = P(c.c[0], c.c[1], 5);
    const k = fit(c.span);
    /* sit the station a little right of and below centre, clear of the station card */
    return { x: x - (w / k) * 0.05, y: y - (h / k) * 0.045, k };
  }, [fit]);

  const flyTo = useCallback((v: View, slow = false) => {
    const from = { ...cam.current }, to = target(v);
    const far = Math.hypot(to.x - from.x, to.y - from.y) * to.k;
    tween.current = { from, to, t0: -1, dur: still.current ? 0 : slow ? 4200 : Math.min(2600, 1500 + far * 0.3) };
  }, [target]);

  const flyCam = useCallback((to: Cam, dur: number) => {
    tween.current = { from: { ...cam.current }, to, t0: -1, dur: still.current ? 0 : dur };
  }, []);

  const drive = useCallback((who: "agv" | "tow", pts: [number, number][], dur: number, follow: boolean, done?: () => void) => {
    trips.current.push({ who, pts, t0: -1, dur: still.current ? 1 : dur, follow, done });
  }, []);

  const storyView: View = mode === "walk" ? L.walk[step].station ?? "all"
    : mode === "scenario" && scen
      ? scen.key === "batch" ? (stage === 3 ? "dispatch" : "all")
        : scen.key === "cool" ? (stage === 4 ? "store" : "all")
        : scen.key === "soon" ? "build"
        : scen.key === "claim" ? (stage === 0 ? "dispatch" : "all")
        : scen.key === "expired" ? "mix" : "offline"
      : "all";
  const view: View = look ?? storyView;
  const viewRef = useRef<View>(view);

  /* one loop runs everything that moves by itself: drives, the camera following a drive, camera moves */
  useEffect(() => {
    still.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let id = 0, last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      let chase: [number, number] | null = null, moved = false;
      const finished: Trip[] = [];
      trips.current = trips.current.filter((tr) => {
        if (tr.t0 < 0) tr.t0 = now;
        const k = Math.min(1, (now - tr.t0) / tr.dur);
        const [x, y] = along(tr.pts, glide(k));
        place(tr.who, x, y);
        if (tr.follow) chase = [x, y];
        if (k >= 1) { finished.push(tr); return false; }
        return true;
      });
      const c = cam.current;
      if (chase && viewRef.current !== "free") {
        tween.current = null;
        const [fx, fy] = P(chase[0], chase[1], 3), fk = fit(640);
        const a = 1 - Math.exp(-dt * 3.4), b = 1 - Math.exp(-dt * 1.7);
        cam.current = { x: c.x + (fx - c.x) * a, y: c.y + (fy - c.y) * a, k: c.k * Math.pow(fk / c.k, b) };
        moved = true;
      } else if (tween.current) {
        const tw = tween.current;
        if (tw.t0 < 0) tw.t0 = now;
        const k = tw.dur ? Math.min(1, (now - tw.t0) / tw.dur) : 1, e = ease(k);
        /* long moves pull back a little in the middle, so the eye keeps its bearings */
        const far = Math.hypot(tw.to.x - tw.from.x, tw.to.y - tw.from.y) * Math.min(tw.from.k, tw.to.k);
        const dip = Math.min(0.3, far / 2600) * Math.sin(Math.PI * e);
        cam.current = { x: tw.from.x + (tw.to.x - tw.from.x) * e, y: tw.from.y + (tw.to.y - tw.from.y) * e, k: tw.from.k * Math.pow(tw.to.k / tw.from.k, e) * (1 - dip) };
        if (k >= 1) tween.current = null;
        moved = true;
      }
      /* idle drift: a few pixels and a percent of zoom, very slow, only when the camera is at rest */
      const d = drift.current, ts = now / 1000;
      const rest = !moved && !dragging.current && viewRef.current !== "free" && !still.current;
      d.w += ((rest ? 1 : 0) - d.w) * (1 - Math.exp(-dt * (rest ? 0.7 : 3)));
      d.x = 9 * Math.sin(ts * 0.19) + 4 * Math.sin(ts * 0.31 + 1);
      d.y = 5 * Math.sin(ts * 0.16 + 2);
      d.k = 1 + 0.02 * Math.sin(ts * 0.12);
      apply();
      if (svg.current) tickScene(svg.current, now);
      finished.forEach((tr) => tr.done?.());
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [apply, fit, place]);

  /* fit to the card, and open with a slow pull back from the dock to the whole plant */
  const opened = useRef(false);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const w = el.clientWidth, h = el.clientHeight;
      if (opened.current && Math.abs(w - size.current.w) < 1 && Math.abs(h - size.current.h) < 1) return;
      size.current = { w, h };
      if (!opened.current) {
        opened.current = true;
        const all = target("all"), [x, y] = P(30, 22, 4);
        cam.current = { x, y, k: all.k * 2.4 };
        place("agv", agvXY.current[0], agvXY.current[1]);
        apply(); flyTo("all", true);
        return;
      }
      if (viewRef.current === "free" || cine.current) { apply(); return; }
      /* the card changed size: aim any move in progress at the new framing instead of jumping */
      if (tween.current) tween.current.to = target(viewRef.current);
      else { cam.current = target(viewRef.current); apply(); }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [apply, flyTo, place, target]);

  useEffect(() => {
    viewRef.current = view;
    if (!size.current.w || !opened.current || view === "free" || cine.current) return;
    flyTo(view);
  }, [view, flyTo]);

  /* tags are positioned by the camera, so place them again after every render */
  useLayoutEffect(() => { apply(); });

  /* drag to move around, scroll to zoom (mouse only, so touch still scrolls the page) */
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    let drag: { x: number; y: number; moved: boolean } | null = null;
    /* hand the visitor exactly what they see: fold the drift into the camera, then stop it */
    const bake = () => {
      const d = drift.current, c = cam.current;
      c.x += (d.x * d.w) / c.k; c.y += (d.y * d.w) / c.k; c.k *= 1 + (d.k - 1) * d.w; d.w = 0;
    };
    const clampCam = () => {
      const all = target("all"), c = cam.current;
      c.k = Math.max(all.k * 0.8, Math.min(all.k * 7, c.k));
      c.x = Math.max(0, Math.min(VIEW.w, c.x)); c.y = Math.max(0, Math.min(VIEW.h, c.y));
    };
    const down = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.button !== 0 || (e.target as HTMLElement).closest("button,a,figure")) return;
      drag = { x: e.clientX, y: e.clientY, moved: false };
    };
    const move = (e: PointerEvent) => {
      if (!drag) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) < 5) return;
      if (!drag.moved) { drag.moved = true; bake(); tween.current = null; dragging.current = true; el.setPointerCapture(e.pointerId); el.dataset.drag = "1"; setLook("free"); }
      cam.current.x -= dx / cam.current.k; cam.current.y -= dy / cam.current.k;
      drag.x = e.clientX; drag.y = e.clientY;
      clampCam(); apply();
    };
    const up = () => { dragging.current = false; if (drag?.moved) { delete el.dataset.drag; window.setTimeout(() => { suppress.current = false; }, 0); suppress.current = true; } drag = null; };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      bake();
      const r = el.getBoundingClientRect(), c = cam.current;
      const mx = e.clientX - r.left - r.width / 2, my = e.clientY - r.top - r.height / 2;
      const k0 = c.k;
      c.k *= Math.exp(-e.deltaY * 0.0016);
      clampCam();
      c.x += mx / k0 - mx / c.k; c.y += my / k0 - my / c.k;
      tween.current = null; clampCam(); apply();
      setLook("free");
    };
    el.addEventListener("pointerdown", down); el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up); el.addEventListener("pointercancel", up);
    el.addEventListener("wheel", wheel, { passive: false });
    return () => {
      el.removeEventListener("pointerdown", down); el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up); el.removeEventListener("pointercancel", up); el.removeEventListener("wheel", wheel);
    };
  }, [apply, target]);
  const suppress = useRef(false);                  // a drag just ended: ignore the click it produces

  /* ----- acting on the floor ----- */
  const fire = (kind: string) => setSim((x) => ({ ...x, fx: { kind, n: ++counter.current } }));
  const finish = (f: (x: Sim) => Sim) => { setSim(f); setDone(true); setBusy(false); };
  const hop = (kind: Carry, from: V3, to: V3): Mover[] => [{ id: ++counter.current, kind, from, to }];
  const deck = (st: number): V3 => [STATIONS[st].node[0], STATIONS[st].node[1], 1];
  const mid = (p: V3): V3 => [p[0] + 2.7, p[1] + 2.7, p[2]];
  const flat = (p: V3, dz = 0): V3 => [p[0], p[1], p[2] + dz];
  const parkAgv = (st: number) => { trips.current = []; agvAt.current = st; place("agv", STATIONS[st].node[0], STATIONS[st].node[1]); };

  /* play a list of beats one after another, each with its caption */
  const say = (text: string, ms: number) => { const id = ++counter.current; setCap({ id, text, i: 0, n: 1, ms }); later(ms, () => setCap((c) => (c?.id === id ? null : c))); };
  const play = (beats: Beat[], end: () => void) => {
    setBusy(true);
    let at = 0;
    beats.forEach((b, i) => {
      later(at, () => { setCap({ id: ++counter.current, text: b.text, i, n: beats.length, ms: b.ms }); b.run?.(); });
      at += b.ms;
    });
    later(at, () => { setCap(null); setCard(null); setSaving(false); setSim((x) => ({ ...x, spot: null })); if (viewRef.current !== "free") flyTo(viewRef.current); end(); });
  };
  const put = (f: Partial<Sim>) => setSim((x) => ({ ...x, ...f }));
  /* the record leaves the station for the server: pull the camera back far enough to watch it arrive */
  const save = (st: StationId) => {
    setSim((x) => ({ ...x, spot: null, save: { from: SAVE_FROM[st], n: ++counter.current } }));
    setSaving(true);
    const a = P(station(st).c[0], station(st).c[1], 4), b = P(SERVER[0], SERVER[1], 5), { w, h } = size.current;
    const k = Math.min(w / (Math.abs(a[0] - b[0]) + 470), h / (Math.abs(a[1] - b[1]) + 370), target(st).k);
    flyCam({ x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2 + 10, k }, 1500);
  };

  /* lift something onto the cart, drive it down the aisle with the camera following, set it down */
  const carry = (kind: Carry, from: V3, src: number, dst: number, to: V3, pre: (x: Sim) => Sim, post: (x: Sim) => Sim, onLeave?: () => number) => {
    cine.current = true; setBusy(true);
    const load = () => {
      setSim((x) => ({ ...pre(x), movers: hop(kind, from, deck(src)) }));
      later(HOP + 250, () => {
        setSim((x) => ({ ...x, movers: [], agv: kind }));
        const pts = lane(src, dst);
        const dur = Math.max(3400, Math.min(5400, 1800 + pathLen(pts) * 72));
        const wait = onLeave?.() ?? 0;
        drive("agv", pts, dur, true, () => {
          agvAt.current = dst;
          cine.current = false; flyTo(viewRef.current);
          later(Math.max(700, wait - dur), () => {
            setSim((x) => ({ ...x, agv: null, movers: hop(kind, deck(dst), to) }));
            later(HOP, () => { setSim((x) => ({ ...post(x), movers: [] })); later(500, () => setBusy(false)); });
          });
        });
      });
    };
    if (agvAt.current !== src) drive("agv", lane(agvAt.current, src), 2000, false, load); else load();
  };

  const advance = () => {
    const pn = line === "pneumatic";
    const n0 = step + 1;
    /* the pneumatic line has no band station, so from building on it runs one step behind the solid line */
    const n = pn && n0 >= 3 ? n0 + 1 : n0;
    setLens(null); setTick(null); setDone(false); setLook(null); setCard(null);
    if (L.travel[n0]) say(L.travel[n0], n === 1 || n === 3 ? 3200 : 6500);
    if (pn && n === 4) {
      /* only the tread batch travels: the green tyre is built where it stands */
      setBusy(true); cine.current = true;
      setSim((x) => ({ ...x, batch: "flight", tow: true }));
      place("tow", AT.batchMixer[0] + 2, AT.batchMixer[1] + 2);
      drive("tow", [[AT.batchMixer[0] + 2, AT.batchMixer[1] + 2], [59.6, 35], [100, 35], [AT.batchBuild[0] + 2, AT.batchBuild[1] + 2]], 5600, true,
        () => { setSim((x) => ({ ...x, batch: "build", tow: false })); cine.current = false; flyTo(viewRef.current); later(600, () => setBusy(false)); });
      setStep(n0); return;
    }
    const fl = (x: Sim): Sim => ({ ...x, tyre: { ...x.tyre, at: "flight" } });
    const at = (stage: Sim["tyre"]["stage"], where: Sim["tyre"]["at"]) => (x: Sim): Sim => ({ ...x, tyre: { stage, at: where } });
    if (n === 1 || n === 3) { setBusy(true); later(2600, () => setBusy(false)); }
    if (n === 2) carry("lot", mid(AT.lotDock), 0, 1, mid(AT.lotMixer), (x) => ({ ...x, lot: "flight" }), (x) => ({ ...x, lot: "mixer" }));
    if (n === 4) carry("band", AT.bench, 2, 3, flat(AT.drum, -1), fl, at("band", "drum"), () => {
      /* the cushion batch is wheeled over from the mixer at the same time */
      setSim((x) => ({ ...x, batch: "flight", tow: true }));
      place("tow", AT.batchMixer[0] + 2, AT.batchMixer[1] + 2);
      drive("tow", [[AT.batchMixer[0] + 2, AT.batchMixer[1] + 2], [59.6, 35], [100, 35], [AT.batchBuild[0] + 2, AT.batchBuild[1] + 2]], 5600, false,
        () => setSim((x) => ({ ...x, batch: "build", tow: false })));
      return 5600;
    });
    if (n === 5) carry("green", flat(AT.drum, -1), 3, 4, AT.press, fl, at("green", "press"));
    if (n === 6) { setBusy(true); cine.current = true; setSim((x) => ({ ...x, pressClosed: false })); later(2200, () => carry("cured", AT.press, 4, 5, AT.scale, fl, at("cured", "scale"))); }
    if (n === 7) carry("cured", AT.scale, 5, 6, flat(AT.rack, -2), fl, at("cured", "rack"));
    if (n === 8) carry("cured", flat(AT.rack, -2), 6, 7, AT.stage, fl, at("cured", "stage"));
    setStep(n0);
  };

  const actP = () => {
    const end = (f: Partial<Sim>) => () => finish((x) => ({ ...x, ...f }));
    switch (step) {
      case 1: play([
        B("The storekeeper scans the supplier's own label.", 3000, () => { fire("receive"); put({ spot: [12.7, 19.7, 4.6] }); setLens("walk-1"); }),
        B("Tyode reads the lot number and the expiry date from it.", 3800, () => setCard({ at: [12.7, 19.7, 5.4], title: "Read from the label", rows: [["Material", "Natural rubber"], ["Lot", "NR-8841"], ["Expiry", "14 Mar 2027"]] })),
        B("The record is saved on the plant's own server.", 3000, () => { setCard(null); save("receive"); }),
        B("The first line of the record is written.", 2200, () => put({ entries: 1 })),
      ], end({})); break;
      case 2: play([
        B("The lot is scanned again as it goes into the mixer.", 3000, () => { fire("mix"); put({ spot: [37.7, 22.7, 4.6] }); }),
        B("Tyode checks it is the right material, and still in date.", 3800, () => setCard({ at: [37.7, 22.7, 5.4], title: "Checked at the scan", rows: [["Lot", "NR-8841"], ["In date", "Yes"], ["Right for this recipe", "Yes"]] })),
        B("The rubber goes in, and the tread compound is mixed.", 4200, () => { setCard(null); fire("mixing"); setSim((x) => ({ ...x, spot: null, movers: hop("bale", [38.4, 21.4, 2.3], [41, 12, 4.5]) })); later(HOP, () => put({ movers: [] })); }),
        B("The new batch gets its own printed tag: C-1042.", 3800, () => { fire("idle"); put({ batch: "mixer", spot: [59.6, 22, 3.6] }); setLens("p-mix"); }),
        B("The batch is linked to the three lots it was made from.", 3200, () => save("mix")),
      ], end({ entries: 2 })); break;
      case 3: play([
        B("K. Perera taps a staff card at the sign-in point for BM-01.", 3200, () => { put({ spot: [113.2, 21.9, 4.6] }); setCard({ at: [113.2, 21.4, 10.4], title: "Signed in", rows: [["Builder", "K. Perera"], ["Card", "1042"], ["Machine", "BM-01"]] }); }),
        B("First stage: inner liner and body ply, then the beads and sidewalls. Second stage: belts and tread.", 5600, () => {
          setCard(null); fire("wind"); setLens("p-build");
          setSim((x) => ({ ...x, spot: null, layers: 1, tyre: { stage: "green", at: "drum" } }));
          later(1500, () => put({ layers: 2 })); later(3000, () => put({ layers: 3 }));
        }),
        B("The auto-stitch rolls the tread down. Tyode reads that cycle from the machine, never from the builder.", 3800, () => fire("build")),
        B("It looks like a real build, at least 15 minutes after the last one, with a builder signed in. It counts.", 4000, () => setCard({ at: [101, 15, 10.4], title: "Build checked", rows: [["Since last build", "17 min"], ["Builder", "K. Perera, 1042"], ["Count", "Verified"]] })),
        B(`Only now does the tyre get an ID. The label printer prints ${L.hero}.`, 3600, () => { setCard(null); fire("idle"); put({ label: true }); setLens("p-label"); }),
        B("The stitch, the count, the batches and the label are saved.", 3000, () => save("build")),
      ], end({ entries: 3 })); break;
      case 4: play([
        B("The press operator scans the label while loading the bladder press.", 3400, () => { fire("cure"); setCard({ at: [102.5, 56, 12.6], title: "Linked by the scan", rows: [["Press", "P-03"], ["Mould", "M-07"]] }); }),
        B("The lid closes and the bladder inflates, pressing the tyre into the mould from inside.", 3400, () => { setCard(null); put({ pressClosed: true }); }),
        B("The cure recorder logs the temperature all the way through.", 5000, () => {
          setLens("p-cure");
          ["09:07", "09:09", "09:11", "09:13", "09:15", "09:17", "09:18"].forEach((c, i) => later(600 + i * 560, () => setTick(`Wed ${c}`)));
        }),
        B("It peaked at 149 °C, under the 155 °C limit set for this line. The cure is marked unusual.", 4400, () => setCard({ at: [108.1, 56.3, 6.5], title: "Cure checked", tone: "warn", rows: [["Peak", "149 °C"], ["Limit", "155 °C"], ["Cure", "Unusual"]] })),
        B("The cure is added to the passport.", 3000, () => { setCard(null); save("cure"); }),
      ], end({ tyre: { stage: "cured", at: "press" }, entries: 4 })); break;
      case 5: play([
        B("The inspector scans the label. The tyre turns on the stand under the lamp.", 3000, () => { fire("inspect"); put({ spot: [67.5, 62.5, 4.4] }); }),
        B("The weight comes straight from the scale: 8.62 kg.", 2800, () => { put({ checks: 1, spot: null }); setLens("p-inspect"); }),
        B("Outer diameter and section width come from the gauges.", 2800, () => put({ checks: 2 })),
        B("The visual checklist set for line PL-1 is ticked.", 2800, () => put({ checks: 3 })),
        B("All within spec: PASS. The unusual cure is shown to the inspector too.", 3600, () => save("inspect")),
      ], end({ entries: 5 })); break;
      case 6: play([
        B("Within spec, so it is released to the next stage set for this line: storage.", 3200, () => fire("store")),
        B("One scan of the tyre, one of the rack: rack B, level 2.", 3200, () => setLens("p-store")),
        B("A tyre outside spec would have been held for an engineer instead.", 3600),
        B("From now on, anyone can find this tyre.", 3000, () => save("store")),
      ], end({ entries: 6 })); break;
      case 7: play([
        B("At the gate, the tyre is scanned against the order.", 3000, () => { fire("dispatch"); put({ spot: [21, 68, 4.2] }); }),
        B("Tyode checks the order, and that the tyre is not on hold.", 3600, () => setCard({ at: [21, 68, 3.2], title: "Checked at the gate", rows: [["Order", "DO-5182"], ["On hold", "No"]] })),
        B("It is loaded with the rest of the order.", 3000, () => {
          setCard(null);
          setSim((x) => ({ ...x, spot: null, tyre: { stage: "cured", at: "flight" }, movers: hop("cured", AT.stage, AT.truck) }));
          later(HOP, () => put({ movers: [], tyre: { stage: "cured", at: "truck" } }));
        }),
        B("The delivery note is produced from the scans.", 3600, () => { setLens("p-dispatch"); save("dispatch"); }),
      ], end({ entries: 7 })); break;
    }
  };

  const act = () => {
    setLook(null);
    if (line === "pneumatic") { actP(); return; }
    const end = (f: Partial<Sim>) => () => finish((x) => ({ ...x, ...f }));
    switch (step) {
      case 1: play([
        B("The storekeeper scans the supplier's own label.", 3000, () => { fire("receive"); put({ spot: [12.7, 19.7, 4.6] }); setLens("walk-1"); }),
        B("Tyode reads the lot number and the expiry date from it.", 3800, () => setCard({ at: [12.7, 19.7, 5.4], title: "Read from the label", rows: [["Material", "Natural rubber"], ["Lot", "NR-8841"], ["Expiry", "14 Mar 2027"]] })),
        B("The record is saved on the plant's own server.", 3000, () => { setCard(null); save("receive"); }),
        B("The first line of the record is written.", 2200, () => put({ entries: 1 })),
      ], end({})); break;
      case 2: play([
        B("The lot is scanned again as it goes into the mixer.", 3000, () => { fire("mix"); put({ spot: [37.7, 22.7, 4.6] }); }),
        B("Tyode checks it is the right material, and still in date.", 3800, () => setCard({ at: [37.7, 22.7, 5.4], title: "Checked at the scan", rows: [["Lot", "NR-8841"], ["In date", "Yes"], ["Right for this recipe", "Yes"]] })),
        B("The rubber goes in, and the batch is mixed.", 4200, () => { setCard(null); fire("mixing"); setSim((x) => ({ ...x, spot: null, movers: hop("bale", [38.4, 21.4, 2.3], [41, 12, 4.5]) })); later(HOP, () => put({ movers: [] })); }),
        B("The new batch gets its own printed tag: B-3112.", 3800, () => { fire("idle"); put({ batch: "mixer", spot: [59.6, 22, 3.6] }); setLens("walk-2"); }),
        B("The batch is linked to the three lots it was made from.", 3200, () => save("mix")),
      ], end({ entries: 2 })); break;
      case 3: play([
        B("A blank steel band sits under the marker.", 2600),
        B("A code is marked on a face the rubber never covers.", 4600, () => { fire("laser"); setLens("walk-3"); }),
        B("That code is this tyre's ID for life: ST-0457.", 3200, () => { fire("idle"); put({ tyre: { stage: "band", at: "bench" } }); }),
        B("Its passport is opened on the server.", 3000, () => save("band")),
      ], end({ entries: 3 })); break;
      case 4: play([
        B("A fixed scanner reads the band. The builder scans nothing.", 3200, () => fire("build")),
        B("The base layer is wound on, from batch B-3107.", 3200, () => { fire("wind"); put({ layers: 1, tyre: { stage: "green", at: "drum" } }); setLens("walk-4"); }),
        B("Then the cushion layer, from batch B-3112.", 3200, () => put({ layers: 2 })),
        B("Then the tread layer, from batch B-3118.", 3200, () => put({ layers: 3 })),
        B("Each layer, the machine, the builder and the shift are saved.", 3200, () => { fire("idle"); save("build"); }),
      ], end({ entries: 4 })); break;
      case 5: play([
        B("The band is scanned as the tyre goes into the press.", 3400, () => { fire("cure"); setCard({ at: [102.5, 56, 16.8], title: "Linked by the scan", rows: [["Press", "P-02"], ["Mould", "M-217"]] }); }),
        B("The press closes and the cure begins.", 3000, () => { setCard(null); put({ pressClosed: true }); }),
        B("A clip-on recorder logs the temperature the whole time.", 5200, () => {
          setLens("walk-5");
          ["09:40", "10:05", "10:30", "10:55", "11:20", "11:40", "11:55"].forEach((c, i) => later(600 + i * 560, () => setTick(`Mon ${c}`)));
        }),
        B("It only reads. Nothing is connected to the press controls.", 3600, () => setCard({ at: [108.1, 56.3, 6.5], title: "Cure recorder", rows: [["Reads", "Temperature, open, close"], ["Controls", "Nothing"]] })),
        B("The cure is added to the passport.", 3000, () => { setCard(null); save("cure"); }),
      ], end({ tyre: { stage: "cured", at: "press" }, entries: 5 })); break;
      case 6: play([
        B("The inspector scans the band.", 2800, () => { fire("inspect"); put({ spot: [67.5, 62.5, 4.4] }); }),
        B("The weight comes straight from the scale.", 2800, () => { put({ checks: 1, spot: null }); setLens("walk-6"); }),
        B("The dimensions come from the gauges.", 2800, () => put({ checks: 2 })),
        B("The ultrasound trace is captured and kept with the tyre.", 3200, () => put({ checks: 3 })),
        B("Everything is within spec. The inspector confirms: passed.", 3200, () => save("inspect")),
      ], end({ entries: 6 })); break;
      case 7: play([
        B("One scan of the tyre, one of the rack.", 3000, () => fire("store")),
        B("Its place is recorded: rack B, level 2, bay 4.", 3600, () => setLens("walk-7")),
        B("From now on, anyone can find this tyre.", 3000, () => save("store")),
      ], end({ entries: 7 })); break;
      case 8: play([
        B("At the gate, the tyre is scanned against the order.", 3000, () => { fire("dispatch"); put({ spot: [21, 68, 4.2] }); }),
        B("Tyode checks the order, and that the tyre is not on hold.", 3600, () => setCard({ at: [21, 68, 3.2], title: "Checked at the gate", rows: [["Order", "EX-4471"], ["On hold", "No"]] })),
        B("It is loaded with the rest of the order.", 3000, () => {
          setCard(null);
          setSim((x) => ({ ...x, spot: null, tyre: { stage: "cured", at: "flight" }, movers: hop("cured", AT.stage, AT.truck) }));
          later(HOP, () => put({ movers: [], tyre: { stage: "cured", at: "truck" } }));
        }),
        B("The delivery note is produced from the scans.", 3600, () => { setLens("walk-8"); save("dispatch"); }),
      ], end({ entries: 8 })); break;
    }
  };

  const B = (text: string, ms: number, run?: () => void): Beat => ({ text, ms, run });
  /* the problem, then the idea, before following one tyre */
  const runIntro = () => {
    setIntro(true); setLook(null); setShowKit(false);
    play([
      B(L.intro[0], 5600, () => setKit(1)),
      B(L.intro[1], 5800, () => setKit(2)),
      B(L.intro[2], 4800, () => setKit(3)),
      B(L.intro[3], 5000, () => setNet(true)),
      B(L.intro[4], 5400, () => { setHotPass(true); flyChip("Tyre passport"); }),
      B(L.intro[5], 2800, () => { setKit(0); setNet(false); setHotPass(false); }),
    ], () => { setIntro(false); advance(); });
  };
  const skipIntro = () => { reset(); setKit(0); setNet(false); setHotPass(false); setIntro(false); advance(); };

  const reset = () => { clearTimers(); cine.current = false; setBusy(false); setLens(null); setTick(null); setLook(null); setCap(null); setCard(null); setSaving(false); setChip(null); setDet(0); };
  const openMenu = () => { reset(); parkAgv(7); setAuto(false); setSim(laterOf(line)); setMode("menu"); setScen(null); setStage(0); };
  const openScenario = (sc: Scenario) => {
    reset(); parkAgv(7);
    const LT = laterOf(line);
    setSim(sc.key === "claim" ? { ...LT, tyre: { stage: "cured", at: "stage" } } : sc.key === "expired" ? { ...LT, expired: true }
      : sc.key === "cool" || sc.key === "soon" ? { ...LT, tyre: { stage: "cured", at: "rack" }, entries: 6 } : LT);
    setScen(sc); setStage(0); setMode("scenario");
  };
  const runScenario = () => {
    if (!scen) return;
    setLook(null);
    const lock = (ms: number) => { setBusy(true); later(ms, () => setBusy(false)); };
    if (scen.key === "batch") {
      if (stage === 0) { say("Tyode follows batch B-3112 forward, into every tyre it went into.", 5200); setSim((x) => ({ ...x, mark: "found" })); lock(4600); }
      if (stage === 1) { say("One step puts all of them on hold, wherever they are.", 3600); setSim((x) => ({ ...x, mark: "held" })); lock(2400); }
      if (stage === 2) { say("Someone tries to load a held tyre anyway.", 5200); lock(4800); later(2600, () => { fire("block"); setLens("hold"); }); }
    }
    if (scen.key === "cool") {
      if (stage === 0) { say("The rule \"Cure too cool\" fired at 09:52. Tyode lists every tyre cured in P-03 below 155 °C.", 5600); setSim((x) => ({ ...x, mark: "found" })); lock(5200); }
      if (stage === 1) {
        lock(11000); setDet(1); say("The Detective runs its fixed playbook: it collects the affected tyres and their records.", 2800);
        later(2800, () => { setDet(2); say("The AI model reads the evidence, and may make up to 8 more read-only lookups.", 2800); });
        later(5600, () => { setDet(3); say("The code checks that every record the draft mentions exists. All 14 do.", 2800); });
        later(8400, () => { setDet(4); say("A draft report is ready for an engineer to approve or dismiss.", 3200); });
      }
      if (stage === 2) { setDet(5); say("P. Silva approves. All 8 tyres are ON HOLD. The Detective never places holds itself.", 4800); setSim((x) => ({ ...x, mark: "held" })); lock(2600); }
      if (stage === 3) { setDet(0); say("GT-2611-0440 passed inspection and is scanned into storage.", 5200); lock(5200); later(2400, () => { fire("blockStore"); setLens("p-hold"); }); }
    }
    if (scen.key === "soon") {
      say("Six minutes after the last tyre, the stitcher runs again.", 4400); lock(4200);
      later(1400, () => fire("soon"));
      later(2200, () => setCard({ at: [101, 15, 10.4], title: "Build checked", tone: "warn", rows: [["Since last build", "6 min"], ["Minimum", "15 min"], ["Count", "Flagged, not counted"]] }));
    }
    if (scen.key === "claim") {
      say("The returned tyre is scanned.", 2600); fire("claim"); lock(7600);
      later(2600, () => { say("Its history is walked back, station by station, to the raw material.", 5200); setSim((x) => ({ ...x, back: true })); });
    }
    if (scen.key === "expired") { say("The old pallet is scanned at the mixer.", 4200); fire("expired"); later(1600, () => setLens("expired")); lock(3400); }
    if (scen.key === "offline") {
      if (stage === 0) { say("The network goes down. Scanning carries on.", 4200); setSim((x) => ({ ...x, wifi: "down" })); later(1200, () => fire("offline")); lock(3600); }
      else { say("The saved scans are sent the moment it is back.", 4200); setSim((x) => ({ ...x, wifi: "sync", save: { from: SAVE_FROM.store, n: ++counter.current } })); lock(3200); }
    }
    const next = stage + 1;
    if (scen.key === "claim") later(2600, () => setStage(next)); else if (scen.key === "batch" && stage === 2) { setStage(next); } else setStage(next);
    if (next === scen.steps.length) setTried((t) => ({ ...t, [scen.key]: true }));
  };
  const restartAs = (l: LineKind) => { reset(); setAuto(false); setIntro(false); setKit(0); setNet(false); setHotPass(false); parkAgv(0); setSim(startOf(l)); setMode("walk"); setStep(0); setDone(false); setScen(null); setStage(0); setTried({}); };
  const restart = () => restartAs(line);
  const switchLine = (l: LineKind) => {
    if (l === line) return;
    setLine(l); restartAs(l);
    try { const u = new URL(window.location.href); if (l === "solid") u.searchParams.set("line", "solid"); else u.searchParams.delete("line"); window.history.replaceState(null, "", u); } catch { /* ignore */ }
  };
  /* ?line=solid opens the solid line */
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("line") === "solid") { const id = window.setTimeout(() => switchLine("solid"), 0); return () => window.clearTimeout(id); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const last = L.walk.length - 1;
  const scenFinished = !!scen && stage === scen.steps.length;
  const primary = () => {
    if (busy) return;
    if (mode === "walk") {
      if (step === last) openMenu();
      else if (step === 0) runIntro();
      else if (done) advance();
      else act();
    } else if (mode === "scenario") {
      if (scenFinished) openMenu(); else runScenario();
    }
  };
  const primaryRef = useRef(primary);
  useEffect(() => { primaryRef.current = primary; });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowRight" || e.altKey || e.ctrlKey || e.metaKey) return;
      const t = e.target as HTMLElement | null;
      if (t && /INPUT|TEXTAREA|SELECT/.test(t.tagName)) return;
      e.preventDefault(); primaryRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const seen = useRef(0);
  useEffect(() => {
    if (sim.entries > seen.current && mode === "walk" && !sim.later) flyChip(L.entries[sim.entries - 1].title);
    seen.current = sim.entries;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sim.entries]);

  /* hands-free: waits long enough to read, then presses the button for you */
  useEffect(() => {
    if (!auto || busy || mode !== "walk") return;
    if (step === last) { const off = window.setTimeout(() => setAuto(false), 0); return () => window.clearTimeout(off); }
    const id = window.setTimeout(() => primaryRef.current(), step === 0 ? 600 : done ? 3600 : 2800);
    return () => window.clearTimeout(id);
  }, [auto, busy, mode, step, done, last]);

  const pick = useCallback((id: StationId) => { if (!suppress.current) setLook((v) => (v === id ? null : id)); }, []);

  /* ----- what the scene shows ----- */
  const focus: StationId | null = view === "all" || view === "offline" || view === "free" ? null : view;
  const routeDone = line === "pneumatic"
    ? (sim.later || mode !== "walk" || step === last ? 10 : [0, 1, 2, 4, 7, 8, 9, 10][step])
    : (sim.later ? 10 : mode === "walk" ? (step === last ? 10 : step <= 4 ? step : step + 2) : 10);
  const overlay = sim.mark !== "none" || sim.back;
  const walk = L.walk[step];
  const clock = tick ?? (mode === "walk" ? walk.clock : mode === "scenario" && scen ? scen.clock : "Wed 08:45");
  const infoOf = (id: StationId) => {
    const b = station(id), o = L.info[id], muted = L.muted.includes(id), i = L.stations.indexOf(id);
    const note = "Used on solid tyre lines only. Pneumatic tyres get a printed label at building instead. ";
    return {
      id, name: L.stationName[id] ?? b.name, n: i + 1,
      tag: muted ? L.mutedNote[id]! : `Station ${i + 1} of ${L.stations.length}`,
      records: o?.records ?? (muted ? note + b.records : b.records), kit: o?.kit ?? b.kit, callouts: o?.callouts ?? b.callouts,
    };
  };
  const info = focus ? infoOf(focus) : null;

  const pins: Pin[] = [];
  const kitShown = kit === 3 || showKit;
  if (kit === 1 || kit === 2) L.stations.forEach((id, i) => pins.push({
    key: `paper-${id}`, at: TAG_AT(id), kind: "paper",
    text: L.today[id]!, n: kit === 2 ? "?" : undefined, tone: kit === 2 ? "warn" : undefined, delay: kit === 1 ? i * 220 : 0,
  }));
  if (kitShown) L.stations.forEach((id, i) => pins.push({
    key: `kit-${id}`, at: TAG_AT(id), kind: "kit", text: L.kit[id]!, delay: showKit ? i * 60 : i * 160,
  }));
  if ((kitShown || kit === 0) && (view === "all" || view === "free") && !overlay) L.muted.forEach((id) => pins.push({ key: `m-${id}`, at: station(id).pill, kind: "callout", text: L.mutedNote[id]! }));
  if ((view === "all" || view === "free") && !overlay) {
    if (!kit && !showKit) L.stations.forEach((id, i) => pins.push({ key: `p-${id}`, at: station(id).pill, kind: "pill", text: L.stationName[id] ?? station(id).name, n: i + 1, pick: id }));
    pins.push({ key: "server", at: [SERVER[0], SERVER[1], 10.4], kind: "callout", text: "Tyode server, on site" });
  }
  if (info && !saving) info.callouts.forEach((c, i) => {
    const linked = info.id === "build" && i >= 1 && !sim.later && sim.tyre.at === "drum" && sim.layers >= i;
    if (info.id === "build" && i === 2 && sim.batch !== "build") return;
    pins.push(linked
      ? { key: `l-${i}`, at: c.at, kind: "count", tone: "ok", text: `${L.layers.names[i]} ${L.layers.batches[i]}` }
      : { key: `c-${info.id}-${i}`, at: c.at, kind: "callout", text: c.text });
  });
  if (focus === "inspect" && mode === "walk" && step === L.inspectStep) {
    L.checks.slice(0, sim.checks).forEach(([at, text], i) => pins.push({ key: `chk-${i}`, at, kind: "count", tone: "ok", text: `${text} ✓` }));
  }

  if (saving) pins.push({ key: `saved-${sim.save?.n}`, at: [SERVER[0], SERVER[1], 10.4], kind: "count", tone: "ok", text: "Saved on site ✓", delay: 2300 });
  if (card) pins.push({ key: `card-${card.title}`, at: card.at, kind: "card", text: card.title, rows: card.rows, warn: card.tone === "warn" });

  /* the thing being followed */
  if (!card && !overlay && mode !== "menu" && !(mode === "scenario" && scen && scen.key !== "claim")) {
    const t = sim.tyre;
    if (line === "pneumatic" && t.at === "drum" && !sim.label) {
      if (sim.layers > 0) pins.push({ key: "hero", at: [101, 15, 10.2], kind: "hero", text: "Green tyre" });
    } else if (t.stage === "blank") {
      if (sim.batch === "mixer") pins.push({ key: "hero", at: [AT.batchMixer[0] + 2, AT.batchMixer[1] + 2, 5.4], kind: "hero", text: L.mixBatch });
      else if (sim.lot !== "flight" && step >= 1 && step <= 2) {
        const p = sim.lot === "dock" ? AT.lotDock : AT.lotMixer;
        pins.push({ key: "hero", at: [p[0] + 2.7, p[1] + 2.7, 4.8], kind: "hero", text: sim.entries >= 1 ? "Lot NR-8841" : "Rubber pallet" });
      }
    } else if (t.at !== "flight") {
      const at: Record<string, V3> = {
        bench: [72.5, 14.4, 5.2], drum: [101, 15, 10.2], press: [102.5, 56, 16.6], scale: [67.5, 62.5, 3.2],
        rack: [AT.rack[0] + 1.6, AT.rack[1], AT.rack[2] + 3.2], stage: [21, 68, 3], truck: [20.5, 58, 6.8],
      };
      if (!(focus === "inspect" && step === L.inspectStep && sim.checks > 0 && !done))
        pins.push({ key: "hero", at: at[t.at], kind: "hero", text: L.hero, sub: mode === "scenario" ? "Returned" : undefined });
    }
  }

  /* scenario overlays */
  if (sim.mark !== "none" && view === "all") {
    L.affected.forEach((a, i) => pins.push({
      key: `a-${a.where}`, at: a.at, kind: "count", n: a.ids.length, delay: sim.mark === "held" ? 0 : 1300 + i * 380, tone: sim.mark === "held" ? "bad" : "warn",
      text: a.where === "delivered" ? "delivered" : sim.mark === "held" ? "held" : a.where === "truck" ? "on the truck" : a.where === "press" ? "in presses" : a.where === "build" ? "being built" : a.where === "inspect" ? "at inspection" : a.where === "rackA" ? "rack A" : "rack B",
    }));
    pins.push({ key: "src", at: L.markSource.at, kind: "hero", text: L.markSource.text });
  }
  if (scen?.key === "batch" && stage === 3) pins.push({ key: "blk", at: [20.5, 58, 6.8], kind: "count", tone: "bad", text: `${L.hero} is on hold`, sub: "Cannot ship" });
  if (scen?.key === "cool" && stage === 4) pins.push({ key: "blk", at: [AT.rack[0] + 1.6, AT.rack[1], AT.rack[2] + 3.2], kind: "count", tone: "bad", text: "GT-2611-0440 is on hold", sub: "Storage scan refused" });
  if (sim.back && view === "all") {
    L.entries.forEach((e, i) => pins.push({ key: `f-${e.n}`, at: station(e.station).pill, kind: "fact", n: e.n, text: e.pin, delay: 400 + (L.entries.length - 1 - i) * 520 }));
  }
  if (sim.expired) pins.push(stage === 0
    ? { key: "exp", at: [37.7, 22.7, 4.8], kind: "hero", text: "Lot NR-8790" }
    : { key: "exp2", at: [37.7, 22.7, 4.8], kind: "count", tone: "bad", text: "Stopped: lot NR-8790", sub: "Expired 2 Nov" });
  if (scen?.key === "offline") {
    if (sim.wifi === "down") {
      pins.push({ key: "wifi", at: [64.2, 38, 10.2], kind: "count", tone: "bad", text: "Wi-Fi down" });
      pins.push({ key: "q", at: [rackSlot("B", 1, 4)[0] + 1, 64, 13.6], kind: "count", tone: "warn", n: 3, text: "scans saved on the scanner" });
    } else if (sim.wifi === "sync") {
      pins.push({ key: "wifi2", at: [64.2, 38, 10.2], kind: "count", tone: "ok", text: "Back online" });
      pins.push({ key: "q2", at: [rackSlot("B", 1, 4)[0] + 1, 64, 13.6], kind: "count", tone: "ok", n: 3, text: "scans sent to the server" });
    } else pins.push({ key: "wifi0", at: [64.2, 38, 10.2], kind: "callout", text: "Wi-Fi and server" });
  }

  const result = mode === "walk" ? (done ? walk.result : undefined) : scen && stage > 0 ? scen.steps[stage - 1].result : undefined;
  const caught = mode === "scenario" && scen && (scen.key === "expired" || scen.key === "soon" || (scen.key === "batch" && stage === 3) || (scen.key === "cool" && stage === 4));
  const action = mode === "walk" ? (step === 0 || step === last || !done ? walk.action : "Next station")
    : scen ? (scenFinished ? "Try another" : scen.steps[stage].action) : "";

  return (
    <div className={s.page}>
      <header className={s.top}>
        <Link href="/" className={s.brand} aria-label="Back to tyode.com"><TyodeLogo className={s.logo} /></Link>
        <div className={s.titles}>
          <h1>Tyre Passport</h1>
          <p>{L.subtitle}</p>
        </div>
        <div className={s.topMeta}>
          <div className={s.lineSwitch} role="group" aria-label="Line type, set in configuration">
            {(["pneumatic", "solid"] as const).map((k) => (
              <button key={k} type="button" aria-pressed={line === k} className={line === k ? s.lineOn : ""} onClick={() => switchLine(k)}>
                {k === "pneumatic" ? "Pneumatic line" : "Solid line"}
              </button>
            ))}
          </div>
          <span className={s.chip}>Concept demo · sample data</span>
          <Link href="/demo" className={s.chipLink}>Dashboard demo</Link>
        </div>
      </header>

      <div className={s.stage}>
        <div className={s.sceneCard}>
          <div className={s.sceneWrap} ref={wrap}>
            <svg ref={svg} className={s.scene} viewBox={`0 0 ${VIEW.w} ${VIEW.h}`} preserveAspectRatio="xMidYMid meet" role="img"
              aria-label={line === "pneumatic" ? "Plant floor drawing of line PL-1: receiving, mixing, building, curing presses, inspection, storage racks and the dispatch gate" : "Plant floor drawing: receiving, mixing, band marking, building, curing presses, inspection, storage racks and the dispatch gate"}>
              <Scene focus={focus} lot={sim.lot} batch={sim.batch} tyre={sim.tyre} movers={sim.movers} fx={sim.fx} pressClosed={sim.pressClosed} layers={sim.layers} spot={sim.spot} save={sim.save} agv={sim.agv} tow={sim.tow} net={net || showKit} agvA={agvA} agvB={agvB} towRef={towRef}
                line={line} label={sim.label} routeFrom={L.routeFrom} muted={L.muted} affIds={L.affIds} affInspect={L.affInspect} affPress={L.affPress} arcFrom={L.arcFrom} arcTo={L.arcTo} netFrom={L.netFrom}
                routeDone={routeDone} later={sim.later} mark={sim.mark} arcs={view === "all"} back={sim.back} expired={sim.expired} wifi={sim.wifi} onPick={pick} />
            </svg>
            <div className={s.pins}>
              {pins.map((p) => {
                const [wx, wy] = P(...p.at);
                const body = p.rows ? (
                  <>
                    <b>{p.text}</b>
                    <dl>{p.rows.map(([k, v], i) => <div key={k} style={{ animationDelay: `${500 + i * 650}ms` }}><dt>{k}</dt><dd>{v}</dd><em>{p.warn && i === p.rows!.length - 1 ? "!" : "✓"}</em></div>)}</dl>
                  </>
                ) : (
                  <>
                    {p.kind === "paper" && <svg className={s.pinIcon} viewBox="0 0 14 16" aria-hidden="true"><path d="M2 1h7l3 3v11H2z" /><path d="M4.5 7h5M4.5 9.5h5M4.5 12h3" /></svg>}
                    {p.kind === "kit" && <svg className={s.pinIcon} viewBox="0 0 16 16" aria-hidden="true"><path d="M2 4V2h2M12 2h2v2M14 12v2h-2M4 14H2v-2" /><path d="M5 5v6M7 5v6M9.5 5v6M11 5v6" /></svg>}
                    {p.n !== undefined && <i>{p.n}</i>}
                    <span>{p.text}{p.sub && <small>{p.sub}</small>}</span>
                  </>
                );
                return (
                  <div key={p.key} className={s.pin} data-wx={wx.toFixed(1)} data-wy={wy.toFixed(1)}>
                    {p.pick
                      ? <button type="button" className={`${s.pinBody} ${s["pin_" + p.kind]}`} onClick={() => pick(p.pick!)} aria-label={`Look at ${p.text}`}>{body}</button>
                      : <div className={`${s.pinBody} ${s["pin_" + p.kind]} ${p.tone ? s["tone_" + p.tone] : ""} ${p.warn ? s.cardWarn : ""}`} style={p.delay ? { animationDelay: `${p.delay}ms` } : undefined}>{body}</div>}
                  </div>
                );
              })}
            </div>

            <div className={s.hudLeft}>
              {info && look === info.id ? (
                <div className={s.info} key={info.id}>
                  <span>{info.tag}</span>
                  <b>{info.name}</b>
                  <p><em>Recorded</em>{info.records}</p>
                  <p><em>Installed</em>{info.kit}</p>
                </div>
              ) : info ? <div className={s.where} key={info.id}><i>{info.n || "·"}</i>{info.name}</div>
                : !overlay && view !== "offline" && <div className={s.hint}>Drag to move · scroll to zoom · select a station for details</div>}
            </div>
            <div className={s.hudRight}>
              <span className={s.clock}>{clock}</span>
              {view !== "all" && <button type="button" className={s.zoomOut} onClick={() => setLook(storyView === "all" ? null : "all")}>Whole plant</button>}
              {look && look !== storyView && <button type="button" className={s.zoomOut} onClick={() => setLook(null)}>Back to the story</button>}
              {!intro && <button type="button" className={`${s.zoomOut} ${showKit ? s.kitOn : ""}`} aria-pressed={showKit} onClick={() => setShowKit((v) => !v)}>
                {showKit ? "Hide what Tyode installs" : "What Tyode installs"}
              </button>}
            </div>
            {lens && !look && !det && <Lens k={lens} />}
            {det > 0 && view === "all" && (
              <div className={s.det} key="det">
                <span>Root-Cause Detective · Extra</span>
                <b>Investigation report A-207</b>
                <ol>
                  {["Fixed playbook: the affected tyres and their records", "AI analysis, up to 8 read-only lookups", "Every record checked: all 14 exist", "Draft report for an engineer"].map((x, i) => (
                    <li key={x} className={det > i + 1 || det >= 4 ? s.detDone : det === i + 1 ? s.detNow : ""}><i>{det > i + 1 || det >= 4 ? "✓" : i + 1}</i>{x}</li>
                  ))}
                </ol>
                {det >= 4 && (
                  <div className={s.detBody}>
                    <p><em>Likely cause</em>Low steam supply pressure to P-03 <small>Confidence: medium</small></p>
                    <p><em>Evidence</em>P-03 steam pressure fell at 09:02. Its 8 cures peaked at 147 to 149 °C, while P-01, P-02 and P-04 cured the same batches at 160 °C.</p>
                    <p><em>Ruled out</em>Compound batches, mould M-07, the operator.</p>
                    <p className={det === 5 ? s.detOk : s.detWait}>{det === 5 ? "Approved by P. Silva · hold placed on 8 tyres" : "Waiting for an engineer: approve or dismiss"}</p>
                  </div>
                )}
              </div>
            )}
            {cap && (
              <div className={s.caption} key={cap.id} role="status">
                {cap.n > 1 && (
                  <div className={s.capBar}>
                    {Array.from({ length: cap.n }, (_, i) => (
                      <i key={i} className={i < cap.i ? s.capDone : ""}>{i === cap.i && <b style={{ animationDuration: `${cap.ms}ms` }} />}</i>
                    ))}
                  </div>
                )}
                <p>{cap.text}</p>
              </div>
            )}
          </div>

          <nav className={s.stops} aria-label="Stations">
            {L.stations.map((id, i) => (
              <button key={id} type="button" onClick={() => pick(id)} aria-pressed={focus === id}
                className={`${focus === id ? s.stopOn : ""} ${sim.entries >= i + 1 ? s.stopDone : ""}`}>
                <i>{sim.entries >= i + 1 ? "✓" : i + 1}</i><span>{line === "pneumatic" ? L.stationName[id] : station(id).short}</span>
              </button>
            ))}
          </nav>
        </div>

        <aside className={s.side}>
          <section className={s.guide}>
            {mode === "walk" && (
              <>
                <div className={s.progress} aria-label={`Step ${Math.min(step, L.stations.length)} of ${L.stations.length}`}>
                  {L.stations.map((id, i) => <i key={id} className={i + 1 < step || (i + 1 === step && done) ? s.pDone : i + 1 === step ? s.pNow : ""} />)}
                </div>
                <span className={s.kicker}>{intro ? "Before we start" : step === 0 ? `Walkthrough · ${L.name}` : step === last ? "The finished passport" : `Step ${step} of ${L.stations.length} · ${L.stationName[walk.station!] ?? station(walk.station!).name}`}</span>
                <h2>{intro ? "Why each tyre needs a passport" : walk.title}</h2>
                <p>{intro ? L.introNote : walk.body}</p>
              </>
            )}
            {mode === "menu" && (
              <>
                <span className={s.kicker}>Use the passport</span>
                <h2>Pick a problem</h2>
                <p>Each one is a real day on the floor. See how it is answered when every tyre has a passport.</p>
                <div className={s.menu}>
                  {L.scenarios.map((sc) => (
                    <button key={sc.key} type="button" onClick={() => openScenario(sc)} className={tried[sc.key] ? s.tried : ""}>
                      <b>{sc.title}</b>
                      <span>{tried[sc.key] ? "Done · run it again" : sc.body}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
            {mode === "scenario" && scen && (
              <>
                <span className={s.kicker}>Use the passport</span>
                <h2>{scen.title}</h2>
                <p>{scen.body}</p>
              </>
            )}

            {result && (
              <div className={`${s.result} ${caught ? s.caught : ""}`} key={`${mode}-${step}-${stage}`}>
                <i aria-hidden="true">{caught ? "!" : "✓"}</i><span>{result}</span>
              </div>
            )}
            {mode === "scenario" && ((scen?.key === "batch" && stage >= 1 && stage < 3) || (scen?.key === "cool" && stage >= 1 && stage < 4)) && (
              <ul className={`${s.found} ${sim.mark === "held" ? s.foundHeld : ""}`}>
                {L.affected.map((a) => (
                  <li key={a.where}><b>{a.ids.length}</b><div><span>{a.label}</span><em>{a.ids.join(", ")}</em></div></li>
                ))}
                <li className={s.foundTotal}><b>{L.affectedTotal}</b><div><span>{sim.mark === "held" ? "tyres on hold" : "tyres to decide on"}</span></div></li>
              </ul>
            )}

            {mode !== "menu" && (
              <div className={s.buttons}>
                <button type="button" className={s.primary} onClick={primary} disabled={busy}>{action}</button>
                {mode === "walk" && step === 0 && !intro && !auto && <button type="button" className={s.link} onClick={() => setAuto(true)}>Play it for me</button>}
                {mode === "walk" && step === 0 && !intro && <button type="button" className={s.link} onClick={openMenu}>Skip to using the passport</button>}
                {intro && <button type="button" className={s.link} onClick={skipIntro}>Skip the intro</button>}
                {mode === "scenario" && !scenFinished && <button type="button" className={s.link} onClick={openMenu}>Back to the list</button>}
                {mode === "walk" && step > 0 && step < last && <button type="button" className={s.link} onClick={() => setAuto((a) => !a)}>{auto ? "Pause" : "Play it for me"}</button>}
                {mode === "walk" && step > 0 && !auto && <span className={s.keyHint}>or press →</span>}
              </div>
            )}
            {mode === "menu" && (
              <div className={s.buttons}>
                <button type="button" className={s.link} onClick={restart}>Follow the tyre again</button>
              </div>
            )}
          </section>

          <div ref={passRef} className={s.passWrap}><PassportCard sim={sim} hot={sim.back || hotPass} L={L} /></div>
        </aside>
      </div>

      {chip && (
        <div className={s.chip} key={chip.id} aria-hidden="true"
          style={{ "--x0": `${chip.x0}px`, "--y0": `${chip.y0}px`, "--x1": `${chip.x1}px`, "--y1": `${chip.y1}px` } as React.CSSProperties}>
          <i>✓</i>{chip.text}
        </div>
      )}

      <footer className={s.foot}>
        <span>Concept demo with sample data. Tyode only reads from machines and never changes their settings.</span>
        <Link href="/">Back to tyode.com</Link>
      </footer>
    </div>
  );
}
