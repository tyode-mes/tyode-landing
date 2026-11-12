/* Tyre Passport demo: the plant floor, drawn as an isometric technical illustration in the same
   style as the green tyre counting demo. Pure drawing: all state comes in as props. */

import { memo, type RefObject } from "react";
import s from "./PassportDemo.module.css";
import { AFFECTED, AT, BG, PRESS_X, PRESS_Y, RACK_Y, SERVER, STATIONS, mould, rackSlot, type StationId, type V3 } from "./story";

/* ---------- projection ---------- */

export const S = 6, C = 0.866, FW = 124, FD = 78;
export const OX = Math.round(FD * C * S) + 60, OY = 124;
export const VIEW = { w: Math.round((FW + FD) * C * S) + 120, h: OY + (FW + FD) * 0.5 * S + 44 };
export const P = (x: number, y: number, z = 0): [number, number] => [OX + (x - y) * C * S, OY + (x + y) * 0.5 * S - z * S];
const pts = (...v: V3[]) => v.map(([x, y, z]) => P(x, y, z).map((n) => n.toFixed(1)).join(",")).join(" ");
const LINE = { stroke: "rgb(28 30 34 / .55)", strokeWidth: 0.7, strokeLinejoin: "round" as const };

/* ---------- materials ---------- */

type Mat = { top: string; left: string; right: string };
const WHITE: Mat = { top: "#ffffff", left: "#f0f1f3", right: "#e1e3e7" };
const STEEL: Mat = { top: "#e6e8ec", left: "#d6d9de", right: "#c4c8ce" };
const DARK: Mat = { top: "#50535a", left: "#3d4046", right: "#303237" };
const BALE: Mat = { top: "#f3eee2", left: "#e6dfd0", right: "#d8d0be" };
const BAG: Mat = { top: "#9a9ea6", left: "#868a92", right: "#757981" };
const GREEN_LED: Mat = { top: "#9fe3bd", left: "#1f9d5a", right: "#178048" };
const RED_LED: Mat = { top: "#ff9a9d", left: "#d92d33", right: "#b8262b" };
const AMBER_LED: Mat = { top: "#ffd27a", left: "#f5a524", right: "#d98b14" };

export type Tone = "normal" | "green" | "warn" | "bad";
const TONE: Record<Tone, { f: string; s: string }> = {
  normal: { f: "#33353a", s: "#26282c" },
  green: { f: "#5a5e66", s: "#474a51" },
  warn: { f: "#e08a1e", s: "#b46c10" },
  bad: { f: "#d92d33", s: "#a52025" },
};

/* ---------- primitives ---------- */

function Box({ x, y, z = 0, w, d, h, m = WHITE }: { x: number; y: number; z?: number; w: number; d: number; h: number; m?: Mat }) {
  return (
    <g {...LINE}>
      <polygon points={pts([x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h])} fill={m.left} />
      <polygon points={pts([x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h])} fill={m.right} />
      <polygon points={pts([x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h])} fill={m.top} />
    </g>
  );
}

function hull(p: [number, number][]) {
  const a = [...p].sort((u, v) => u[0] - v[0] || u[1] - v[1]);
  const cross = (o: number[], u: number[], v: number[]) => (u[0] - o[0]) * (v[1] - o[1]) - (u[1] - o[1]) * (v[0] - o[0]);
  const lo: [number, number][] = [], up: [number, number][] = [];
  for (const q of a) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of [...a].reverse()) { while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
  return [...lo.slice(0, -1), ...up.slice(0, -1)];
}
const toPath = (p: [number, number][]) => p.map((q, i) => `${i ? "L" : "M"}${q[0].toFixed(1)},${q[1].toFixed(1)}`).join("") + "Z";
const xCircle = (x: number, cy: number, cz: number, r: number, n = 32) =>
  Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; return P(x, cy + r * Math.cos(a), cz + r * Math.sin(a)); });
const yCircle = (y: number, cx: number, cz: number, r: number, n = 32) =>
  Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; return P(cx + r * Math.cos(a), y, cz + r * Math.sin(a)); });

/* cylinder lying along x */
function XCyl({ x0, x1, cy, cz, r, side, face, hole }: { x0: number; x1: number; cy: number; cz: number; r: number; side: string; face: string; hole?: number }) {
  const back = xCircle(x0, cy, cz, r), front = xCircle(x1, cy, cz, r);
  return (
    <g {...LINE}>
      <path d={toPath(hull([...back, ...front]))} fill={side} />
      <path d={toPath(front) + (hole ? toPath(xCircle(x1, cy, cz, hole).reverse()) : "")} fill={face} fillRule="evenodd" />
    </g>
  );
}
/* cylinder lying along y */
function YCyl({ y0, y1, cx, cz, r, side, face }: { y0: number; y1: number; cx: number; cz: number; r: number; side: string; face: string }) {
  return (
    <g {...LINE}>
      <path d={toPath(hull([...yCircle(y0, cx, cz, r), ...yCircle(y1, cx, cz, r)]))} fill={side} />
      <path d={toPath(yCircle(y1, cx, cz, r))} fill={face} />
    </g>
  );
}
/* upright cylinder */
function VCyl({ cx, cy, z, r, h, top, side }: { cx: number; cy: number; z: number; r: number; h: number; top: string; side: string }) {
  const [x0, y0] = P(cx, cy, z), [, y1] = P(cx, cy, z + h);
  const rx = r * S * 1.2247, ry = r * S * 0.7071;
  return (
    <g {...LINE}>
      <path d={`M${x0 - rx},${y0} A${rx},${ry} 0 0 0 ${x0 + rx},${y0} L${x0 + rx},${y1} A${rx},${ry} 0 0 1 ${x0 - rx},${y1} Z`} fill={side} />
      <ellipse cx={x0} cy={y1} rx={rx} ry={ry} fill={top} />
    </g>
  );
}
const lface = (x0: number, x1: number, y: number, z0: number, z1: number) => pts([x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]);

/* solid tyre lying flat, steel band in the middle */
export function Flat({ p, tone = "normal", r = 2.9, h = 1.8 }: { p: V3; tone?: Tone; r?: number; h?: number }) {
  const [x0, y0] = P(p[0], p[1], p[2]); const y1 = y0 - h * S;
  const rx = r * S * 1.2247, ry = r * S * 0.7071, c = TONE[tone];
  return (
    <g stroke="rgb(0 0 0 / .45)" strokeWidth={0.6}>
      <path d={`M${x0 - rx},${y0} A${rx},${ry} 0 0 0 ${x0 + rx},${y0} L${x0 + rx},${y1} A${rx},${ry} 0 0 1 ${x0 - rx},${y1} Z`} fill={c.s} />
      <ellipse cx={x0} cy={y1} rx={rx} ry={ry} fill={c.f} />
      {tone !== "green" && <ellipse cx={x0} cy={y1} rx={rx * 0.8} ry={ry * 0.8} fill="none" stroke="rgb(255 255 255 / .14)" />}
      <ellipse cx={x0} cy={y1} rx={rx * 0.55} ry={ry * 0.55} fill="#c9cdd3" />
      <ellipse cx={x0} cy={y1} rx={rx * 0.43} ry={ry * 0.43} fill="#1c1d20" />
    </g>
  );
}
/* bare steel band lying flat */
function Tube({ p, marked = false, r = 1.6, h = 1.5 }: { p: V3; marked?: boolean; r?: number; h?: number }) {
  const [x0, y0] = P(p[0], p[1], p[2]); const y1 = y0 - h * S;
  const rx = r * S * 1.2247, ry = r * S * 0.7071;
  return (
    <g {...LINE}>
      <path d={`M${x0 - rx},${y0} A${rx},${ry} 0 0 0 ${x0 + rx},${y0} L${x0 + rx},${y1} A${rx},${ry} 0 0 1 ${x0 - rx},${y1} Z`} fill="#b9bec5" />
      <ellipse cx={x0} cy={y1} rx={rx} ry={ry} fill="#dfe2e6" />
      <ellipse cx={x0} cy={y1} rx={rx * 0.78} ry={ry * 0.78} fill="#6c7078" />
      {marked && <rect x={x0 - 2.6} y={y0 - h * S * 0.5 + ry - 3.4} width="5.2" height="5.2" fill="#0c0c0d" stroke="none" />}
    </g>
  );
}
/* solid tyre standing upright in the plane x = const */
function Up({ p, tone = "normal", r = 2.7, t = 2 }: { p: V3; tone?: Tone; r?: number; t?: number }) {
  const [x, cy, cz] = p, c = TONE[tone];
  const front = xCircle(x + t, cy, cz, r);
  return (
    <g stroke="rgb(0 0 0 / .45)" strokeWidth={0.6}>
      <path d={toPath(hull([...xCircle(x, cy, cz, r), ...front]))} fill={c.s} />
      <path d={toPath(front)} fill={c.f} />
      <path d={toPath(xCircle(x + t, cy, cz, r * 0.8))} fill="none" stroke="rgb(255 255 255 / .12)" />
      <path d={toPath(xCircle(x + t, cy, cz, r * 0.55))} fill="#c9cdd3" />
      <path d={toPath(xCircle(x + t, cy, cz, r * 0.43))} fill="#1c1d20" />
    </g>
  );
}

function Pad({ x, y, w, d, id, onPick }: { x: number; y: number; w: number; d: number; id?: StationId; onPick?: (id: StationId) => void }) {
  return <polygon points={pts([x, y, 0], [x + w, y, 0], [x + w, y + d, 0], [x, y + d, 0])} fill="rgb(0 0 0 / .035)"
    className={id ? s.pad : undefined} onClick={id && onPick ? () => onPick(id) : undefined} />;
}

function Pawn({ x, y, i = 0 }: { x: number; y: number; i?: number }) {
  const [hx, hy] = P(x, y, 3.75);
  const r = 0.62 * S;
  return (
    <g data-fx="sway" data-ph={(i * 1.37).toFixed(2)}>
      <VCyl cx={x} cy={y} z={0} r={0.55} h={1.3} top="#3d4046" side="#303237" />
      <VCyl cx={x} cy={y} z={1.3} r={0.74} h={1.6} top="#ffd27a" side="#f5a524" />
      <circle cx={hx} cy={hy} r={r} fill="#e3c9ae" {...LINE} />
      <path d={`M${hx - r - 0.6},${hy - 0.4} A${r + 0.6},${r + 0.6} 0 0 1 ${hx + r + 0.6},${hy - 0.4} Z`} fill="#ffffff" {...LINE} />
    </g>
  );
}

function Walker({ route, ph, speed = 2.1, carry = false }: { route: [number, number, number, number]; ph: number; speed?: number; carry?: boolean }) {
  const [hx, hy] = P(0, 0, 3.7);
  const r = 0.6 * S;
  return (
    <g data-fx="walker" data-route={route.join(" ")} data-ph={ph} data-speed={speed}>
      <ellipse cx={P(0, 0)[0]} cy={P(0, 0)[1] + 1} rx={8} ry={4.6} fill="rgb(0 0 0 / .13)" />
      {[1, -1].map((side) => (
        <g key={side} data-leg={side}>
          <VCyl cx={0} cy={0} z={0} r={0.27} h={1.35} top="#3d4046" side="#2a2c30" />
        </g>
      ))}
      <g data-body="">
        <VCyl cx={0} cy={0} z={1.2} r={0.72} h={1.65} top="#ffd27a" side="#f5a524" />
        {carry && <Box x={0.25} y={0.25} z={1.9} w={1.1} d={0.9} h={0.18} m={WHITE} />}
        <circle cx={hx} cy={hy} r={r} fill="#e3c9ae" {...LINE} />
        <path d={`M${hx - r - 0.6},${hy - 0.4} A${r + 0.6},${r + 0.6} 0 0 1 ${hx + r + 0.6},${hy - 0.4} Z`} fill="#ffffff" {...LINE} />
      </g>
    </g>
  );
}

function Pallet({ x, y, z = 0, kind, label = false, tone }: { x: number; y: number; z?: number; kind: "bale" | "bag" | "drum"; label?: boolean; tone?: "bad" }) {
  const cells: [number, number][] = [[0, 0], [1, 0], [0, 1], [1, 1]];
  return (
    <g>
      <Box x={x} y={y} z={z} w={5.4} d={5.4} h={0.5} m={STEEL} />
      {kind === "drum"
        ? cells.map(([i, j]) => <VCyl key={`${i}${j}`} cx={x + 1.4 + i * 2.6} cy={y + 1.4 + j * 2.6} z={z + 0.5} r={1.05} h={3.2} top="#e6e8ec" side="#c9cdd3" />)
        : (kind === "bale" ? [0, 1] : [0, 1, 2]).map((k) => cells.map(([i, j]) => (
          <Box key={`${k}${i}${j}`} x={x + 0.2 + i * 2.55} y={y + 0.2 + j * 2.55} z={z + 0.5 + k * (kind === "bale" ? 1.75 : 1.15)} w={2.45} d={2.45} h={kind === "bale" ? 1.7 : 1.1} m={kind === "bale" ? BALE : BAG} />
        )))}
      {label && <polygon points={lface(x + 3.1, x + 4.9, y + 5.21, z + 1.1, z + 2.2)} fill={tone === "bad" ? "#fbd5d7" : "#fff"} {...LINE} />}
    </g>
  );
}

function Trolley({ x, y, fresh = false }: { x: number; y: number; fresh?: boolean }) {
  return (
    <g>
      <Box x={x} y={y} z={0.6} w={4} d={4} h={0.4} m={STEEL} />
      {[0, 1, 2].map((k) => (
        <g key={k} {...(fresh ? { "data-fx": "drop", "data-d": k * 320, transform: "translate(0 -16)", opacity: 0 } : {})}>
          <Box x={x + 0.3} y={y + 0.3} z={1 + k * 0.6} w={3.4} d={3.4} h={0.55} m={DARK} />
        </g>
      ))}
      <g {...(fresh ? { "data-fx": "drop", "data-d": 1100, transform: "translate(0 -16)", opacity: 0 } : {})}>
        <polygon points={lface(x + 2.2, x + 3.5, y + 3.71, 1.5, 2.5)} fill="#fff" {...LINE} />
      </g>
      <Box x={x + 0.1} y={y + 1.8} z={1} w={0.35} d={0.35} h={3.6} m={STEEL} />
    </g>
  );
}

/* a scan: the beam, then a ring where it lands */
function Beam({ from, to, tone = "ok", wide = 0.9 }: { from: V3; to: V3; tone?: "ok" | "bad"; wide?: number }) {
  const [px, py] = P(...to);
  const c = tone === "bad" ? "217 45 51" : "31 157 90";
  return (
    <g>
      <polygon className={s.beam} points={pts(from, [to[0], to[1] - wide, to[2]], [to[0], to[1] + wide, to[2]])} fill={`rgb(${c} / .4)`} />
      {[800, 1080].map((d, i) => (
        <g key={d} data-fx="ping" data-d={d} data-x={px.toFixed(2)} data-y={py.toFixed(2)} opacity="0">
          <ellipse rx={13} ry={7.5} fill="none" stroke={`rgb(${c})`} strokeWidth={i ? 1.4 : 2} vectorEffect="non-scaling-stroke" />
        </g>
      ))}
    </g>
  );
}

/* marks that turn with a shaft or drum: drawn in the plane x = const, then spun */
function Spin({ x, cy, cz, r, v }: { x: number; cy: number; cz: number; r: number; v: number }) {
  const [px, py] = P(x, cy, cz);
  return (
    <g transform={`matrix(${(-C * S).toFixed(3)} ${(0.5 * S).toFixed(3)} 0 ${-S} ${px.toFixed(1)} ${py.toFixed(1)})`}>
      <g data-fx="spin" data-v={v} stroke="rgb(255 255 255 / .6)" strokeWidth="1.1">
        {[0, 60, 120].map((a) => {
          const c = Math.cos((a * Math.PI) / 180) * r, q = Math.sin((a * Math.PI) / 180) * r;
          return <line key={a} x1={-c} y1={-q} x2={c} y2={q} vectorEffect="non-scaling-stroke" />;
        })}
      </g>
    </g>
  );
}

/* the tyre on the build drum. Drawn as discs in the drum's own plane so it can grow smoothly
   as each layer is wound on (the page changes --k, CSS eases between sizes). */
const LAYER_R = [1.7, 2.2, 2.7, 3.1];
function Wound({ layers, tone }: { layers: number; tone: Tone }) {
  const c = TONE[tone], k = LAYER_R[layers] / 3.1;
  const plane = (x: number) => { const [px, py] = P(x, 15, 6); return `matrix(${(-C * S).toFixed(3)} ${(0.5 * S).toFixed(3)} 0 ${-S} ${px.toFixed(1)} ${py.toFixed(1)})`; };
  const grow = { opacity: layers ? 1 : 0, transition: "opacity .5s" };
  return (
    <g>
      {[99.5, 100, 100.5, 101, 101.5, 102, 102.5].map((x, i) => (
        <g key={x} transform={plane(x)}>
          <circle r={3.1} data-fx="ease" data-prop="scale" data-to={k.toFixed(4)} data-dur="2600" style={grow} fill={i === 6 ? c.f : c.s} stroke="rgb(0 0 0 / .45)" strokeWidth={i === 0 || i === 6 ? 0.6 : 0} vectorEffect="non-scaling-stroke" />
        </g>
      ))}
      <g transform={plane(102.5)}>
        {[1, 2].map((i) => <circle key={i} r={LAYER_R[i]} fill="none" stroke="rgb(0 0 0 / .4)" strokeWidth="0.6" vectorEffect="non-scaling-stroke" className={s.seam} style={{ opacity: layers > i ? 1 : 0 }} />)}
        <circle r={1.7} fill="#e6e8ec" stroke="rgb(28 30 34 / .55)" strokeWidth="0.7" vectorEffect="non-scaling-stroke" />
      </g>
    </g>
  );
}

function Steam({ at, n = 3, big = false }: { at: V3; n?: number; big?: boolean }) {
  const [px, py] = P(...at);
  return (
    <g>
      {Array.from({ length: n }, (_, i) => (
        <g key={i} data-fx="steam" data-x={(px + (i - (n - 1) / 2) * 9).toFixed(2)} data-y={py.toFixed(2)} data-ph={(i * 0.9 + at[0] * 0.13).toFixed(2)} opacity="0">
          <circle r={big ? 7 : 5} className={s.puff} />
        </g>
      ))}
    </g>
  );
}

/* the thing being carried between stations */
export type Carry = "lot" | "batch" | "band" | "green" | "cured" | "bale";
function Item({ kind, at }: { kind: Carry; at: V3 }) {
  if (kind === "lot") return <Pallet x={at[0] - 2.7} y={at[1] - 2.7} z={at[2]} kind="bale" label />;
  if (kind === "batch") return <Trolley x={at[0] - 2} y={at[1] - 2} />;
  if (kind === "band") return <Tube p={at} marked />;
  if (kind === "bale") return <Box x={at[0] - 1.2} y={at[1] - 1.2} z={at[2]} w={2.45} d={2.45} h={1.7} m={BALE} />;
  return <Flat p={at} tone={kind === "green" ? "green" : "normal"} />;
}

/* the cart that carries things along the aisle. Drawn at the floor origin and moved by the page. */
function Agv({ cargo }: { cargo: Carry | null }) {
  const big = cargo === "lot";
  const h = big ? 2.9 : 2.3;
  return (
    <>
      <ellipse cx={P(0, 0)[0]} cy={P(0, 0)[1] + 2} rx={h * 9} ry={h * 5.2} fill="rgb(0 0 0 / .1)" />
      <Box x={-h + 0.3} y={-h + 0.3} z={0.2} w={h * 2 - 0.6} d={h * 2 - 0.6} h={0.45} m={DARK} />
      <Box x={-h} y={-h} z={0.65} w={h * 2} d={h * 2} h={0.35} m={STEEL} />
      {cargo && <Item kind={cargo} at={[0, 0, 1]} />}
    </>
  );
}

/* ---------- scene ---------- */

export type TyreAt = "bench" | "drum" | "press" | "scale" | "rack" | "stage" | "truck" | "flight";
export type Mover = { id: number; kind: Carry; from: V3; to: V3 };
export type SceneProps = {
  focus: StationId | null;
  lot: "dock" | "mixer" | "flight";
  batch: "none" | "mixer" | "build" | "flight";
  tyre: { stage: "blank" | "band" | "green" | "cured"; at: TyreAt };
  movers: Mover[];
  fx: { kind: string; n: number } | null;
  pressClosed: boolean;
  layers: number;
  spot: V3 | null;
  save: { from: V3; n: number } | null;
  agv: Carry | null;
  tow: boolean;
  net: boolean;
  agvA: RefObject<SVGGElement | null>;
  agvB: RefObject<SVGGElement | null>;
  towRef: RefObject<SVGGElement | null>;
  routeDone: number;
  later: boolean;
  mark: "none" | "found" | "held";
  arcs: boolean;
  back: boolean;
  expired: boolean;
  wifi: "ok" | "down" | "sync";
  onPick: (id: StationId) => void;
};

/* the route a tyre takes, along the aisle */
export const ROUTE: [number, number][] = [[17, 33], [48, 33], [74, 33], [102, 33], [122, 33], [122, 42.5], [104, 42.5], [70, 42.5], [43, 42.5], [15, 42.5]];
const routePts = (n = ROUTE.length) => ROUTE.slice(0, n).map(([x, y]) => P(x, y).map((v) => v.toFixed(1)).join(",")).join(" ");

function Scene({ agvA, agvB, towRef, ...p }: SceneProps) {
  const fx = (k: string) => p.fx?.kind === k;
  const hero = (at: TyreAt) => p.tyre.at === at;
  const heroTone: Tone = p.mark === "found" ? "warn" : p.mark === "held" ? "bad" : p.tyre.stage === "green" ? "green" : "normal";
  const bgTone = (affected: boolean): Tone => (!affected || p.mark === "none" ? "normal" : p.mark === "found" ? "warn" : "bad");
  const dim = (id: StationId) => (p.focus && p.focus !== id ? 0.42 : 1);
  const wrap = (id: StationId, node: React.ReactNode) => <g key={id} opacity={dim(id)} className={s.fade}>{node}</g>;
  const rackTyres = (rack: "A" | "B", level: 0 | 1) => BG.filter((t) => t.where === (rack === "A" ? "rackA" : "rackB") && t.pos![2] === rackSlot(rack, level, 0)[2]);

  const receiving = (
    <>
      <Pad x={5} y={5} w={24} d={24} id="receive" onPick={p.onPick} />
      <Pallet x={7} y={7} kind="bale" />
      <Pallet x={14} y={7} kind="bag" />
      <Pallet x={21} y={7} kind="drum" />
      {p.lot === "dock" && <Pallet x={AT.lotDock[0]} y={AT.lotDock[1]} kind="bale" label />}
      <Box x={19} y={18} w={3} d={2.2} h={3.4} />
      <Box x={19.4} y={18.4} z={3.4} w={2.2} d={1.4} h={0.25} m={DARK} />
      <Pawn x={17.5} y={22.5} i={1} />
      {fx("receive") && <Beam key={p.fx!.n} from={[17.1, 22.4, 2.9]} to={[14.4, 22.5, 1.6]} wide={0.7} />}
    </>
  );

  const mixing = (
    <>
      <Pad x={34} y={5} w={29} d={24} id="mix" onPick={p.onPick} />
      <Box x={38} y={10.5} w={6} d={3} h={4} m={STEEL} />
      <Box x={38.6} y={11} z={4} w={4.6} d={2} h={0.5} m={DARK} />
      <g data-fx="shake" data-on={fx("mixing") ? 1 : 0}>
        <Box x={44} y={8} w={8} d={8} h={13} />
        <Box x={45.5} y={9.5} z={13} w={5} d={5} h={3} m={STEEL} />
      </g>
      <Steam at={[48, 12, 17]} n={2} />
      <Box x={53} y={9} w={2.5} d={4} h={8} />
      <Box x={53.8} y={9.8} z={8} w={0.8} d={0.8} h={0.7} m={GREEN_LED} />
      <Box x={57.5} y={13.5} w={2.2} d={2.2} h={3.4} />
      <Box x={57.7} y={13.7} z={3.4} w={1.8} d={1.8} h={0.9} m={DARK} />
      {p.lot === "mixer" && !p.expired && <Pallet x={AT.lotMixer[0]} y={AT.lotMixer[1]} kind="bale" label />}
      {p.expired && <Pallet x={AT.lotMixer[0]} y={AT.lotMixer[1]} kind="bale" label tone="bad" />}
      <Pawn x={42.4} y={23.6} i={2} />
      <Box x={45.6} y={19} w={1.2} d={5} h={6} />
      <XCyl x0={46.8} x1={55.4} cy={20.6} cz={4.4} r={1.1} side="#c4c8ce" face="#e6e8ec" />
      <XCyl x0={46.8} x1={55.4} cy={22.7} cz={4.4} r={1.1} side="#c4c8ce" face="#e6e8ec" />
      <XCyl x0={48.2} x1={54} cy={22.7} cz={4.4} r={1.28} side="#33353a" face="#26282c" />
      <Box x={55.4} y={19} w={1.2} d={5} h={6} />
      {p.batch === "mixer" && <Trolley x={AT.batchMixer[0]} y={AT.batchMixer[1]} fresh={!p.later} />}
      <polygon points={lface(57.9, 59.3, 15.51, 3.6, 4.1)} fill="#34d07f" />
      {fx("mix") && <Beam key={p.fx!.n} from={[42.1, 23.7, 2.9]} to={[39.6, 25.5, 1.6]} wide={0.7} />}
      {fx("expired") && <Beam key={p.fx!.n} from={[42.1, 23.7, 2.9]} to={[39.6, 25.5, 1.6]} tone="bad" wide={0.7} />}
    </>
  );

  const benchBand = p.tyre.stage === "blank" || hero("bench");
  const band = (
    <>
      <Pad x={65} y={7} w={18} d={20} id="band" onPick={p.onPick} />
      <Box x={68} y={11} w={10} d={4.5} h={3.4} />
      <Box x={71.9} y={11.2} z={3.4} w={1.2} d={1.2} h={5} m={STEEL} />
      {benchBand && <Tube p={AT.bench} marked={p.tyre.stage !== "blank"} />}
      {fx("laser") && (
        <g key={`sp${p.fx!.n}`}>
          {[0, 1, 2, 3, 4].map((i) => (
            <g key={i} data-fx="spark" data-x={P(72.5, 14.6, 4.2)[0].toFixed(2)} data-y={P(72.5, 14.6, 4.2)[1].toFixed(2)} data-sx={(i - 2) * 9} data-sy={-10 - (i % 3) * 7} data-ph={(i * 0.13).toFixed(2)} opacity="0">
              <circle r="1.6" fill="#ffb02e" />
            </g>
          ))}
        </g>
      )}
      {fx("laser") && <line key={p.fx!.n} className={s.laser} x1={P(72.5, 13.4, 8)[0]} y1={P(72.5, 13.4, 8)[1]} x2={P(72.5, 14.6, 4.2)[0]} y2={P(72.5, 14.6, 4.2)[1]} />}
      <Box x={71.7} y={11.2} z={8} w={1.6} d={3.3} h={1.1} m={DARK} />
      <Box x={75.3} y={11.6} z={3.4} w={2} d={2} h={1.5} />
      <Box x={68} y={19} w={6.4} d={4} h={0.5} m={STEEL} />
      {[69.7, 72.7].map((x) => [0, 1, 2].map((k) => <Tube key={`${x}${k}`} p={[x, 21, 0.5 + k * 1.5]} />))}
      <Pawn x={77} y={19.5} i={3} />
    </>
  );

  const onDrum = hero("drum") || (p.later && p.tyre.at !== "drum");
  const nLayers = p.later ? 3 : hero("drum") ? p.layers : 0;
  const drumTone: Tone = p.later && p.mark !== "none" ? bgTone(true) : "green";
  const building = (
    <>
      <Pad x={89} y={5} w={30} d={24} id="build" onPick={p.onPick} />
      <Box x={98} y={7} w={8} d={3} h={8} />
      <XCyl x0={98.6} x1={105.4} cy={10.7} cz={7} r={0.7} side="#3d4046" face="#50535a" />
      <Box x={92} y={10} w={20} d={10} h={0.5} m={STEEL} />
      <Box x={93} y={12} z={0.5} w={5} d={6} h={10} />
      <XCyl x0={98} x1={104} cy={15} cz={6} r={1.25} side="#b9bec5" face="#dfe2e6" />
      {onDrum && <XCyl x0={99.5} x1={102.5} cy={15} cz={6} r={1.7} side="#c9cdd3" face="#e6e8ec" hole={1.25} />}
      {onDrum && (
        <>
          {(fx("wind") || p.later) && <line className={s.appear} x1={P(101, 10.7, 7.6)[0]} y1={P(101, 10.7, 7.6)[1]} x2={P(101, 13.2, 8.4)[0]} y2={P(101, 13.2, 8.4)[1]} stroke="#3d4046" strokeWidth="3" />}
          <Wound layers={nLayers} tone={drumTone} />
          {(fx("wind") || p.later) && <Spin key="s" x={102.52} cy={15} cz={6} r={1.5} v={p.later ? 150 : 400} />}
        </>
      )}
      <XCyl x0={102.5} x1={104} cy={15} cz={6} r={1.25} side="#b9bec5" face="#dfe2e6" />
      {onDrum && (fx("wind") || p.later) && <Spin key="n" x={104.02} cy={15} cz={6} r={1.1} v={p.later ? 150 : 400} />}
      <Box x={105} y={13.5} z={0.5} w={2} d={3} h={7} />
      <Box x={106.5} y={19} w={0.5} d={0.5} h={7} m={STEEL} />
      <Box x={106.1} y={18.6} z={7} w={1.3} d={1.3} h={1} m={DARK} />
      <Box x={110.2} y={19.6} w={0.6} d={0.6} h={6.6} m={STEEL} />
      <Box x={109} y={19.7} z={6.6} w={3} d={0.5} h={2.3} m={{ top: "#50535a", left: "#1d3b5c", right: "#303237" }} />
      <Trolley x={93} y={23} />
      {p.batch === "build" && <Trolley x={AT.batchBuild[0]} y={AT.batchBuild[1]} />}
      <Trolley x={103} y={23} />
      <Pawn x={110} y={24} i={4} />
      {fx("build") && <Beam key={p.fx!.n} from={[106.7, 19.2, 7.4]} to={[102.6, 15.6, 6]} wide={1.2} />}
    </>
  );

  const press = (i: number) => {
    const x = PRESS_X[i], y = PRESS_Y, m = mould(i);
    const heroHere = i === 1 && hero("press");
    const has = i !== 1 || heroHere || (p.later && !hero("press"));
    const closed = i !== 1 ? true : heroHere ? p.pressClosed : p.later;
    return (
      <g key={i}>
        <Box x={x} y={y} w={9} d={8} h={3} />
        <Box x={x + 0.4} y={y + 0.4} z={3} w={0.9} d={0.9} h={9.5} m={STEEL} />
        <Box x={x + 7.7} y={y + 0.4} z={3} w={0.9} d={0.9} h={9.5} m={STEEL} />
        <VCyl cx={m[0]} cy={m[1]} z={3} r={3.3} h={1.2} top="#b9bec5" side="#a3a8b0" />
        {has && <Flat p={m} tone={heroHere ? heroTone : i === 0 ? "normal" : bgTone(true)} />}
        <g data-fx="ease" data-prop="ty" data-to={closed ? 2.4 * S : 0} data-dur="2000">
          <VCyl cx={m[0]} cy={m[1]} z={9.8} r={0.9} h={4.6} top="#d6d9de" side="#b8bcc3" />
          <VCyl cx={m[0]} cy={m[1]} z={8.4} r={3.3} h={1.4} top="#c9cdd3" side="#a3a8b0" />
        </g>
        {closed && has && <ellipse className={s.heat} cx={P(m[0], m[1], 6)[0]} cy={P(m[0], m[1], 6)[1]} rx={3.3 * S * 1.2247} ry={3.3 * S * 0.7071} />}
        <Box x={x + 0.4} y={y + 6.7} z={3} w={0.9} d={0.9} h={9.5} m={STEEL} />
        <Box x={x + 7.7} y={y + 6.7} z={3} w={0.9} d={0.9} h={9.5} m={STEEL} />
        {closed && has && <Steam at={[m[0] + 2.5, m[1] + 2.5, 6.5]} n={3} big />}
        <Box x={x} y={y} z={12.5} w={9} d={8} h={2} />
        <VCyl cx={m[0]} cy={m[1]} z={14.5} r={1.3} h={1.3} top="#d6d9de" side="#b8bcc3" />
        <Box x={x + 9.3} y={y + 1} w={1.6} d={3} h={7} />
        <Box x={x + 9.7} y={y + 1.6} z={7} w={0.8} d={0.8} h={0.7} m={closed && has ? AMBER_LED : GREEN_LED} />
        <Box x={x + 9.5} y={y + 4.05} z={4.4} w={1.2} d={0.5} h={1.5} m={DARK} />
        <circle cx={P(x + 10.1, y + 4.56, 5.5)[0]} cy={P(x + 10.1, y + 4.56, 5.5)[1]} r="1.4" fill="#34d07f" />
        <Box x={x + 2} y={y + 9.8} w={0.5} d={0.5} h={6.5} m={STEEL} />
        <Box x={x + 1.6} y={y + 9.4} z={6.5} w={1.3} d={1.3} h={1} m={DARK} />
        {i === 1 && fx("cure") && <Beam key={p.fx!.n} from={[x + 2.2, y + 9.8, 6.8]} to={[m[0], m[1] + 1.6, 5.4]} wide={1.1} />}
      </g>
    );
  };
  const curing = (
    <>
      <Pad x={85} y={50} w={37} d={14} id="cure" onPick={p.onPick} />
      {[0, 1, 2].map(press)}
    </>
  );

  const wave = [0, 0.1, 0.9, 0.2, 0.05, 0.1, 0.05, 0.35, 0.1, 0.05, 0.05, 0.6, 0.15, 0.05].map((a, i) => P(65.4 + i * 0.18, 56.41, 4.05 + a * 1.2).map((v) => v.toFixed(1)).join(",")).join(" ");
  const inspection = (
    <>
      <Pad x={61} y={51} w={21} d={19} id="inspect" onPick={p.onPick} />
      <Box x={64} y={53} w={12} d={4.5} h={3.4} />
      <Box x={65} y={54} z={3.4} w={3.2} d={2.4} h={2.4} m={DARK} />
      <polygon points={lface(65.25, 67.95, 56.41, 3.85, 5.5)} fill="#101c16" />
      <polyline points={wave} fill="none" stroke="#34d07f" strokeWidth="0.9" pathLength={1} className={s.trace} />
      <Box x={70} y={54.6} z={3.4} w={2.6} d={0.5} h={0.3} m={STEEL} />
      <Box x={63} y={59} w={0.5} d={0.5} h={8} m={STEEL} />
      <Box x={62.6} y={58.6} z={8} w={1.3} d={1.3} h={1} m={DARK} />
      <Box x={64.5} y={59.5} w={6} d={6} h={0.6} m={STEEL} />
      {hero("scale") && <Flat p={AT.scale} tone={heroTone} />}
      <Box x={73} y={60} w={0.5} d={0.5} h={5} m={STEEL} />
      <Box x={72} y={60.1} z={5} w={2.6} d={0.4} h={1.9} m={{ top: "#50535a", left: "#1d3b5c", right: "#303237" }} />
      <Box x={64} y={66} w={0.4} d={0.4} h={3.4} m={STEEL} />
      <Box x={63.4} y={66.1} z={3.4} w={1.6} d={0.4} h={1} m={DARK} />
      <Box x={75} y={63} w={5} d={5} h={0.5} m={STEEL} />
      <Flat p={[77.5, 65.5, 0.5]} tone={bgTone(true)} />
      <Pawn x={70.6} y={68} i={5} />
      {fx("inspect") && <Beam key={p.fx!.n} from={[70.4, 67.8, 2.9]} to={[68.6, 64.4, 1.6]} wide={0.7} />}
    </>
  );

  const offline = p.wifi !== "ok";
  const rack = (id: "A" | "B") => {
    const y = RACK_Y[id];
    return (
      <g key={id}>
        <Box x={32} y={y} w={0.5} d={0.5} h={14} m={STEEL} />
        <Box x={53.5} y={y} w={0.5} d={0.5} h={14} m={STEEL} />
        <Box x={32} y={y} z={0.6} w={22} d={4} h={0.4} m={STEEL} />
        {rackTyres(id, 0).map((t) => <Up key={t.id} p={t.pos!} tone={bgTone(t.affected)} />)}
        <Box x={32} y={y} z={7.2} w={22} d={4} h={0.4} m={STEEL} />
        {rackTyres(id, 1).map((t) => <Up key={t.id} p={t.pos!} tone={bgTone(t.affected)} />)}
        {id === "B" && offline && <Up p={rackSlot("B", 1, 2)} />}
        {id === "B" && hero("rack") && <Up p={AT.rack} tone={heroTone} />}
        {id === "B" && offline && [4, 5].map((i) => <Up key={i} p={rackSlot("B", 1, i)} />)}
        <Box x={32} y={y + 3.5} w={0.5} d={0.5} h={14} m={STEEL} />
        <Box x={53.5} y={y + 3.5} w={0.5} d={0.5} h={14} m={STEEL} />
      </g>
    );
  };
  const storage = (
    <>
      <Pad x={30} y={49} w={26} d={19} id="store" onPick={p.onPick} />
      {rack("A")}
      <Pawn x={44} y={58.6} i={6} />
      {rack("B")}
      {fx("store") && <Beam key={p.fx!.n} from={[44, 58.9, 2.9]} to={[AT.rack[0] + 2, AT.rack[1], AT.rack[2]]} wide={1} />}
      {fx("offline") && <Beam key={p.fx!.n} from={[44, 58.9, 2.9]} to={[rackSlot("B", 1, 4)[0] + 2, 64, 10.3]} wide={1} />}
    </>
  );

  const truckTyres = BG.filter((t) => t.where === "truck");
  const dispatch = (
    <>
      <Pad x={3} y={50} w={24} d={22} id="dispatch" onPick={p.onPick} />
      <Box x={5} y={54.6} z={0.9} w={19.4} d={6.8} h={0.9} m={DARK} />
      <Box x={4} y={54.2} z={1.2} w={5} d={7.6} h={6.6} />
      <polygon points={lface(4.7, 8.3, 61.81, 4.6, 7)} fill="#aab2bb" {...LINE} />
      <Box x={9.3} y={54} z={1.8} w={15.4} d={8} h={0.6} m={STEEL} />
      {truckTyres.map((t) => <Flat key={t.id} p={t.pos!} tone={bgTone(t.affected)} />)}
      {hero("truck") && <Flat p={AT.truck} tone={heroTone} />}
      <YCyl y0={61.3} y1={62.3} cx={6.6} cz={1.1} r={1.15} side="#26282c" face="#33353a" />
      <YCyl y0={61.3} y1={62.3} cx={21} cz={1.1} r={1.15} side="#26282c" face="#33353a" />
      <Box x={13.2} y={65.2} w={0.5} d={0.5} h={6.5} m={STEEL} />
      <Box x={12.8} y={64.8} z={6.5} w={1.3} d={1.3} h={1} m={DARK} />
      <Box x={18.5} y={65.5} w={5} d={5} h={0.5} m={STEEL} />
      {hero("stage") && <Flat p={AT.stage} tone={heroTone} />}
      <Pawn x={15.6} y={69} i={7} />
      {fx("dispatch") && <Beam key={p.fx!.n} from={[15.8, 68.8, 2.9]} to={[19, 69.2, 1.6]} wide={0.7} />}
      {fx("block") && <Beam key={p.fx!.n} from={[13.5, 65.4, 7]} to={[20.5, 61.6, 5.4]} tone="bad" wide={1.2} />}
      {fx("claim") && <Beam key={p.fx!.n} from={[15.8, 68.8, 2.9]} to={[19, 69.2, 1.6]} wide={0.7} />}
    </>
  );

  const server = (
    <g>
      <Box x={60} y={36.6} w={3} d={3} h={6} />
      <Box x={60.5} y={37.1} z={6} w={0.8} d={0.8} h={0.5} m={p.wifi === "down" ? RED_LED : GREEN_LED} />
      <Box x={64} y={37.8} w={0.4} d={0.4} h={9} m={STEEL} />
      <Box x={63.4} y={37.2} z={9} w={1.6} d={1.6} h={0.5} m={p.wifi === "down" ? RED_LED : WHITE} />
      {p.wifi !== "down" && [0, 1].map((i) => (
        <g key={i} data-fx="ring" data-per="2600" data-ph={i * 1300} data-x={P(64.2, 38, 9.6)[0].toFixed(2)} data-y={P(64.2, 38, 9.6)[1].toFixed(2)} opacity="0">
          <ellipse rx={26} ry={15} className={s.wifiLine} vectorEffect="non-scaling-stroke" />
        </g>
      ))}
    </g>
  );

  const [sx, sy] = P(SERVER[0], SERVER[1], 5);

  const [ax, ay] = P(59.5, 22, 3);
  return (
    <>
      <defs>
        <pattern id="pgrid" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="matrix(0.866 0.5 -0.866 0.5 0 0)">
          <path d="M12 0H0V12" fill="none" stroke="rgb(28 30 34 / .05)" strokeWidth="0.6" />
        </pattern>
      </defs>
      <polygon points={pts([0, FD, 0], [FW, FD, 0], [FW, FD, -1.4], [0, FD, -1.4])} fill="#d7d9dd" {...LINE} />
      <polygon points={pts([FW, 0, 0], [FW, FD, 0], [FW, FD, -1.4], [FW, 0, -1.4])} fill="#c7cad0" {...LINE} />
      <polygon points={pts([0, 0, 0], [FW, 0, 0], [FW, FD, 0], [0, FD, 0])} fill="#eceef1" {...LINE} />
      <polygon points={pts([0, 0, 0], [FW, 0, 0], [FW, FD, 0], [0, FD, 0])} fill="url(#pgrid)" />
      {/* aisle edges */}
      {[30.2, 45.6].map((y) => (
        <polygon key={y} points={pts([1, y, 0], [FW - 1, y, 0], [FW - 1, y + 0.3, 0], [1, y + 0.3, 0])} fill="#e0b43c" opacity=".85" />
      ))}
      {/* the route */}
      <polyline points={routePts()} className={s.route} />
      {p.routeDone > 0 && <polyline points={routePts(p.routeDone)} className={s.routeDone} />}
      {p.back && <polyline key="back" points={routePts()} className={s.routeBack} pathLength={1} />}
      {STATIONS.map((st, i) => {
        const [nx, ny] = P(st.node[0], st.node[1]);
        const idx = i < 4 ? i + 1 : i + 3;
        return <ellipse key={st.id} cx={nx} cy={ny} rx={3.8} ry={2.2} className={p.routeDone >= idx || p.back ? s.nodeDone : s.node} />;
      })}

      {p.spot && <ellipse key={p.spot.join()} cx={P(p.spot[0], p.spot[1])[0]} cy={P(p.spot[0], p.spot[1])[1]} rx={p.spot[2] * S * 1.2247} ry={p.spot[2] * S * 0.7071} className={s.spot} />}

      {wrap("receive", receiving)}
      {wrap("mix", mixing)}
      {wrap("band", band)}
      {wrap("build", building)}
      <g ref={towRef} style={{ display: p.tow ? undefined : "none" }}>
        <Trolley x={-2} y={-2} />
        <Pawn x={-3.4} y={1.6} i={9} />
      </g>
      <g ref={agvA}><Agv cargo={p.agv} /></g>
      <Walker route={[7, 38, 55, 38]} ph={0} carry />
      <g opacity={p.focus ? 0.6 : 1} className={s.fade}>{server}</g>
      <Walker route={[118, 38.4, 69, 38.4]} ph={9} speed={1.8} />
      <g data-fx="packets">{[0, 1, 2, 3].map((i) => <circle key={i} r="3" className={s.packet} opacity="0" />)}</g>
      <g ref={agvB}><Agv cargo={p.agv} /></g>
      {wrap("dispatch", dispatch)}
      {wrap("store", storage)}
      {wrap("inspect", inspection)}
      {wrap("cure", curing)}

      {p.movers.map((m) => {
        const a = P(...m.from), b = P(...m.to), fa = P(m.from[0], m.from[1]), fb = P(m.to[0], m.to[1]);
        const lift = -Math.max(26, Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.28);
        return (
          <g key={m.id}>
            <g data-fx="move" data-dx={(fb[0] - fa[0]).toFixed(2)} data-dy={(fb[1] - fa[1]).toFixed(2)} data-shadow="" data-dur="1150">
              <ellipse cx={fa[0]} cy={fa[1] + 1} rx={20} ry={11.5} fill="rgb(0 0 0 / .14)" />
            </g>
            <g data-fx="move" data-dx={(b[0] - a[0]).toFixed(2)} data-dy={(b[1] - a[1]).toFixed(2)} data-lift={lift.toFixed(1)} data-dur="1150">
              <Item kind={m.kind} at={m.from} />
            </g>
          </g>
        );
      })}

      {/* a record travelling to the on-site server */}
      {p.save && (() => {
        const [fxp, fyp] = P(...p.save.from);
        return (
          <g key={p.save.n}>
            <line x1={fxp} y1={fyp} x2={sx} y2={sy} pathLength={1} className={s.dataLine} />
            <g data-fx="pulse" data-dx={(sx - fxp).toFixed(2)} data-dy={(sy - fyp).toFixed(2)} opacity="0">
              <circle r="5" cx={fxp} cy={fyp} className={s.pulseDot} />
            </g>
            <g data-fx="ping" data-d="2150" data-x={sx.toFixed(2)} data-y={sy.toFixed(2)} opacity="0">
              <ellipse rx={16} ry={9} fill="none" stroke="#1f9d5a" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            </g>
          </g>
        );
      })()}

      {p.net && SOURCES.map((q, i) => {
        const [ax, ay] = P(...q), [bx, by] = P(SERVER[0], SERVER[1], 5);
        const mx = (ax + bx) / 2, my = (ay + by) / 2 - Math.hypot(bx - ax, by - ay) * 0.18;
        return (
          <g key={i}>
            <path d={`M${ax},${ay} Q${mx},${my} ${bx},${by}`} pathLength={1} className={s.netDraw} style={{ animationDelay: `${i * 110}ms` }} />
            <path d={`M${ax},${ay} Q${mx},${my} ${bx},${by}`} className={s.netFlow} style={{ animationDelay: `${900 + i * 110}ms` }} />
          </g>
        );
      })}

      {p.arcs && p.mark !== "none" && AFFECTED.map((a, i) => {
        const [bx, by] = P(...a.at);
        const mx = (ax + bx) / 2, my = (ay + by) / 2 - Math.hypot(bx - ax, by - ay) * 0.22;
        return <path key={a.where} d={`M${ax},${ay} Q${mx},${my} ${bx},${by}`} pathLength={1}
          className={`${s.arc} ${p.mark === "held" ? s.arcHeld : ""}`} style={{ animationDelay: `${i * 90}ms` }} />;
      })}
    </>
  );
}

export default memo(Scene);

/* ---------- motion ----------
   Everything in the drawing that moves by itself is moved here, once a frame, by the same loop
   that moves the camera. Browser CSS animations run on their own clock, and against a moving
   camera that shows up as shaking, so the drawing uses none for movement. */

const born = new WeakMap<Element, number>();
const tweens = new WeakMap<Element, { from: number; to: number; t0: number; cur: number }>();
const rigs = new WeakMap<Element, { legs: [SVGGElement, number][]; body: SVGGElement | null }>();
const io = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const out = (t: number) => 1 - (1 - t) * (1 - t);
const back = (t: number) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);
const c01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
const SOURCES: V3[] = [[14, 22, 2], [39, 25, 2], [72.5, 13.4, 5], [102, 15, 6], [102.5, 56, 6], [67.5, 62.5, 2], [44.5, 64, 10], [19.5, 60, 4]];
const f2 = (n: number) => n.toFixed(2);

export function tickScene(root: Element, now: number) {
  const t = now / 1000, [ox, oy] = P(0, 0);
  const off = (x: number, y: number, z = 0) => { const q = P(x, y, z); return `translate(${f2(q[0] - ox)} ${f2(q[1] - oy)})`; };
  const saving = !!root.querySelector('[data-fx="pulse"]');
  root.querySelectorAll<SVGElement>("[data-fx]").forEach((el) => {
    const d = el.dataset, n = (k: string, v = 0) => (d[k] === undefined ? v : Number(d[k]));
    let b = born.get(el);
    if (b === undefined) { b = now; born.set(el, b); }
    const age = now - b;
    switch (d.fx) {
      case "spin": el.setAttribute("transform", `rotate(${f2((t * n("v")) % 360)})`); break;
      case "sway": {
        const ph = n("ph");
        el.setAttribute("transform", off(0.1 * Math.sin(t * 0.55 + ph), -0.1 * Math.sin(t * 0.55 + ph), 0.05 * (1 + Math.sin(t * 1.7 + ph * 2))));
        break;
      }
      case "steam": {
        const p = ((t + n("ph")) % 2.7) / 2.7, a = p < 0.18 ? (p / 0.18) * 0.85 : 0.85 * (1 - (p - 0.18) / 0.82);
        el.setAttribute("transform", `translate(${d.x} ${f2(n("y") - 46 * p)}) scale(${(0.5 + 1.4 * p).toFixed(3)})`);
        el.setAttribute("opacity", a.toFixed(3));
        break;
      }
      case "ring": {
        const p = ((now + n("ph")) % n("per")) / n("per");
        el.setAttribute("transform", `translate(${d.x} ${d.y}) scale(${(0.15 + 1.35 * p).toFixed(3)})`);
        el.setAttribute("opacity", (0.8 * (1 - p)).toFixed(3));
        break;
      }
      case "ping": {
        const p = c01((age - n("d")) / 1300);
        el.setAttribute("transform", `translate(${d.x} ${d.y}) scale(${(0.3 + 2.1 * out(p)).toFixed(3)})`);
        el.setAttribute("opacity", age < n("d") ? "0" : (1 - p).toFixed(3));
        break;
      }
      case "move": {
        const p = c01(age / n("dur", 1150)), e = io(p);
        if (d.shadow !== undefined) {
          el.setAttribute("transform", `translate(${f2(n("dx") * e)} ${f2(n("dy") * e)})`);
          el.setAttribute("opacity", (1 - 0.55 * Math.sin(Math.PI * p)).toFixed(3));
        } else {
          el.setAttribute("transform", `translate(${f2(n("dx") * e)} ${f2(n("dy") * e + n("lift") * Math.sin(Math.PI * p))})`);
        }
        break;
      }
      case "pulse": {
        const p = c01((age - 350) / 1900), e = io(p);
        el.setAttribute("transform", `translate(${f2(n("dx") * e)} ${f2(n("dy") * e)})`);
        el.setAttribute("opacity", age < 350 ? "0" : (p < 0.12 ? p / 0.12 : p > 0.88 ? (1 - p) / 0.12 : 1).toFixed(3));
        break;
      }
      case "drop": {
        const p = c01((age - n("d")) / 700);
        el.setAttribute("transform", `translate(0 ${f2(-16 * (1 - back(p)))})`);
        el.setAttribute("opacity", c01(p * 3).toFixed(3));
        break;
      }
      case "spark": {
        const p = ((t + n("ph")) % 0.6) / 0.6;
        el.setAttribute("transform", `translate(${f2(n("x") + n("sx") * p)} ${f2(n("y") + n("sy") * p)})`);
        el.setAttribute("opacity", (1 - p).toFixed(3));
        break;
      }
      case "shake":
        if (d.on === "1") el.setAttribute("transform", `translate(${f2(0.9 * Math.sin(t * 41))} ${f2(0.6 * Math.cos(t * 53))})`);
        else el.removeAttribute("transform");
        break;
      case "ease": {
        const to = n("to");
        let s0 = tweens.get(el);
        if (!s0) { s0 = { from: to, to, t0: now, cur: to }; tweens.set(el, s0); }
        else if (s0.to !== to) { s0.from = s0.cur; s0.to = to; s0.t0 = now; }
        s0.cur = s0.from + (s0.to - s0.from) * io(c01((now - s0.t0) / n("dur", 1000)));
        el.setAttribute("transform", d.prop === "scale" ? `scale(${s0.cur.toFixed(4)})` : `translate(0 ${f2(s0.cur)})`);
        break;
      }
      case "walker": {
        const [x0, y0, x1, y1] = (d.route ?? "").split(" ").map(Number);
        const len = Math.hypot(x1 - x0, y1 - y0), v = n("speed", 2), walk = len / v, rest = [2.2, 3.4];
        const cycle = 2 * walk + rest[0] + rest[1], tt = (t + n("ph")) % cycle;
        let k = 0, dir = 1, moving = false;
        if (tt < walk) { k = tt / walk; moving = true; }
        else if (tt < walk + rest[0]) { k = 1; }
        else if (tt < 2 * walk + rest[0]) { k = 1 - (tt - walk - rest[0]) / walk; dir = -1; moving = true; }
        else { k = 0; dir = -1; }
        /* ease in and out of each walk so they start and stop like people do */
        const kk = moving ? (dir > 0 ? k : 1 - k) : 0, soft = kk < 0.06 ? kk / 0.06 : kk > 0.94 ? (1 - kk) / 0.06 : 1;
        const x = x0 + (x1 - x0) * k, y = y0 + (y1 - y0) * k;
        const fx = ((x1 - x0) / len) * (dir > 0 ? 1 : -1), fy = ((y1 - y0) / len) * (dir > 0 ? 1 : -1);
        const phase = (k * len) * (Math.PI / 0.72);
        el.setAttribute("transform", off(x, y));
        let rig = rigs.get(el);
        if (!rig) {
          rig = { legs: [...el.querySelectorAll<SVGGElement>("[data-leg]")].map((g) => [g, Number(g.dataset.leg)] as [SVGGElement, number]), body: el.querySelector<SVGGElement>("[data-body]") };
          rigs.set(el, rig);
        }
        const amp = moving ? soft : 0;
        rig.legs.forEach(([g, side]) => {
          const swing = 0.36 * Math.sin(phase) * side * amp, liftz = Math.max(0, Math.cos(phase) * side) * 0.16 * amp;
          g.setAttribute("transform", off(-fy * 0.3 * side + fx * swing, fx * 0.3 * side + fy * swing, liftz));
        });
        const bob = moving ? 0.1 * Math.abs(Math.sin(phase)) * amp : 0.04 * (1 + Math.sin(t * 1.7));
        rig.body?.setAttribute("transform", off(fx * 0.06 * amp, fy * 0.06 * amp, bob));
        break;
      }
      case "packets": {
        const [sx, sy] = P(SERVER[0], SERVER[1], 5);
        [...el.children].forEach((c, i) => {
          const L = 3.4, q = t + i * 0.85, cyc = Math.floor(q / L), p = (q % L) / L, e = io(p);
          const [ax, ay] = P(...SOURCES[(cyc * 3 + i * 5) % SOURCES.length]);
          c.setAttribute("cx", f2(ax + (sx - ax) * e));
          c.setAttribute("cy", f2(ay + (sy - ay) * e - Math.sin(Math.PI * p) * 14));
          c.setAttribute("opacity", saving ? "0" : (0.55 * Math.sin(Math.PI * p)).toFixed(3));
        });
        break;
      }
    }
  });
}
