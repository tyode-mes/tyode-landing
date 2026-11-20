"use client";

/* Green tyre counting: a guided concept demo with sample data.
   A technical drawing of the building area. The count comes only from the building machine's
   auto-stitch signal, checked against a 15 minute minimum gap and the operator's badge. Nothing runs
   on its own: the visitor steps through one tyre, then tries each way of cheating the count. */

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import TyodeLogo from "@/components/brand/TyodeLogo";
import s from "./CountingDemo.module.css";

/* ---------- drawing primitives (isometric, technical-illustration style) ---------- */

type V3 = [number, number, number];
const S = 7, C = 0.866, OX = 363, OY = 120;
const FW = 92, FD = 58;
const P = (x: number, y: number, z = 0): [number, number] => [OX + (x - y) * C * S, OY + (x + y) * 0.5 * S - z * S];
const pts = (...v: V3[]) => v.map(([x, y, z]) => P(x, y, z).map((n) => n.toFixed(1)).join(",")).join(" ");
const LINE = { stroke: "rgb(28 30 34 / .55)", strokeWidth: 0.7, strokeLinejoin: "round" as const };

type Mat = { top: string; left: string; right: string };
const WHITE: Mat = { top: "#ffffff", left: "#f0f1f3", right: "#e1e3e7" };
const STEEL: Mat = { top: "#e6e8ec", left: "#d6d9de", right: "#c4c8ce" };
const DARK: Mat = { top: "#50535a", left: "#3d4046", right: "#303237" };
const RUBBER = "#33353a";

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

/* circle in the plane x = const */
function xCircle(x: number, cy: number, cz: number, r: number, n = 36) {
  return Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return P(x, cy + r * Math.cos(a), cz + r * Math.sin(a));
  });
}

/* cylinder lying along the x axis (drums, rolls, shafts) */
function XCyl({ x0, x1, cy, cz, r, side, face, hole }: { x0: number; x1: number; cy: number; cz: number; r: number; side: string; face: string; hole?: number }) {
  const back = xCircle(x0, cy, cz, r), front = xCircle(x1, cy, cz, r);
  const ring = hole ? toPath(xCircle(x1, cy, cz, hole).reverse()) : "";
  return (
    <g {...LINE}>
      <path d={toPath(hull([...back, ...front]))} fill={side} />
      <path d={toPath(front) + ring} fill={face} fillRule="evenodd" />
    </g>
  );
}

/* upright green tyre hanging in the plane x = const */
function Ring({ x, cy, cz, r = 3.1, inner = 1.85, t = 1.2, opacity = 1, tone = RUBBER }: {
  x: number; cy: number; cz: number; r?: number; inner?: number; t?: number; opacity?: number; tone?: string;
}) {
  const back = xCircle(x, cy, cz, r), front = xCircle(x + t, cy, cz, r);
  return (
    <g opacity={opacity} stroke="rgb(0 0 0 / .45)" strokeWidth={0.6}>
      <path d={toPath(hull([...back, ...front]))} fill="#26282c" />
      <path d={toPath(front) + toPath(xCircle(x + t, cy, cz, inner).reverse())} fill={tone} fillRule="evenodd" />
      <path d={toPath(xCircle(x + t, cy, cz, (r + inner) / 2))} fill="none" stroke="rgb(255 255 255 / .08)" />
    </g>
  );
}

/* vertical cylinder (moulds, rams) */
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

/* green tyre lying flat in a mould */
function FlatTyre({ cx, cy, z, r = 3 }: { cx: number; cy: number; z: number; r?: number }) {
  const [x0, y0] = P(cx, cy, z), [, y1] = P(cx, cy, z + 1);
  const rx = r * S * 1.2247, ry = r * S * 0.7071;
  return (
    <g stroke="rgb(0 0 0 / .45)" strokeWidth={0.6}>
      <path d={`M${x0 - rx},${y0} A${rx},${ry} 0 0 0 ${x0 + rx},${y0} L${x0 + rx},${y1} A${rx},${ry} 0 0 1 ${x0 - rx},${y1} Z`} fill="#26282c" />
      <ellipse cx={x0} cy={y1} rx={rx} ry={ry} fill={RUBBER} />
      <ellipse cx={x0} cy={y1} rx={rx * 0.58} ry={ry * 0.58} fill="#1c1d20" />
    </g>
  );
}

/* readout tag, anchored at its bottom centre */
function Tag({ x, y, lines, tone = "plain" }: { x: number; y: number; lines: string[]; tone?: "plain" | "ok" | "warn" | "bad" | "focus" }) {
  const w = Math.max(...lines.map((l, i) => l.length * (i === 0 ? 6.1 : 5.6))) + 18;
  const h = 9 + lines.length * 13;
  return (
    <g className={`${s.tag} ${s["tag_" + tone]}`}>
      <line x1={x} y1={y} x2={x} y2={y - 10} />
      <rect x={x - w / 2} y={y - 10 - h} width={w} height={h} rx="5" />
      {lines.map((l, i) => (
        <text key={i} x={x - w / 2 + 9} y={y - 10 - h + 16 + i * 13} className={i === 0 ? s.tagB : s.tagS}>{l}</text>
      ))}
    </g>
  );
}

/* ---------- plant layout ---------- */

const BM = { "BM-01": { x: 5, y: 9 }, "BM-02": { x: 5, y: 34 } } as const;
const CART = { x: 41, y: 25 };
const PRESSES = [{ x: 75, y: 3 }, { x: 75, y: 17 }, { x: 75, y: 31 }, { x: 75, y: 45 }];
const MIN_GAP = 15;

const drumPos = (): V3 => [BM["BM-01"].x + 7.2, BM["BM-01"].y + 6, 6];
const cartSlot = (i: number): V3 => [CART.x + 1.6 + i * 1.75, CART.y + 2.5, 5.3];

/* ---------- demo state ---------- */

type Tyre = { serial: string; builtAt: number };
type LogKind = "ok" | "warn" | "bad" | "info";
type Fx = { kind: string; t0: number };
type Move = { serial: string; from: V3; to: V3; t0: number; dur: number };
type State = {
  badge: boolean; clock: number; seq: number; last: number | null; online: boolean;
  drum: "empty" | "built" | "labelled"; label: string | null;
  counted: Tyre[]; onCart: string[]; flagged: number; unattributed: number; labels: number; alerts: number;
  log: { id: number; t: number; kind: LogKind; text: string }[];
  fx: Fx | null; move: Move | null;
};
const fresh = (): State => ({
  badge: false, clock: 0, seq: 0, last: null, online: true, drum: "empty", label: null,
  counted: [], onCart: [], flagged: 0, unattributed: 0, labels: 0, alerts: 0, log: [], fx: null, move: null,
});

const clock = (m: number) => {
  const t = 6 * 60 + m;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
};
const serialOf = (n: number) => `GT-2611-${String(n).padStart(4, "0")}`;
/* time stamps for effects, kept outside the component so render stays pure */
const stamp = () => performance.now();
const fxOf = (kind: string): Fx => ({ kind, t0: stamp() });

type Focus = "none" | "bm" | "cart";
const WALK: { title: string; body: string; action: string; result?: string; focus: Focus }[] = [
  {
    focus: "none", title: "Follow one green tyre",
    body: "This is a building area on line PL-1. Step through how one green tyre is counted at the building machine, then try to cheat the count yourself.",
    action: "Start",
  },
  {
    focus: "bm", title: "The operator signs in",
    body: "At the start of the shift the operator taps their badge at building machine BM-01. Every count from this machine is now linked to badge 1042, K. Perera.",
    action: "Tap badge", result: "Signed in. BM-01 links its counts to K. Perera, badge 1042.",
  },
  {
    focus: "bm", title: "The tyre is built",
    body: "The operator builds the green tyre on the drum as usual. Nothing is counted yet: the count waits for the auto-stitch.",
    action: "Build the tyre", result: "The green tyre is on the drum. BM-01 still reads 0.",
  },
  {
    focus: "bm", title: "The auto-stitch is the count",
    body: "The machine stitches the layers together automatically. Tyode reads that stitch from the machine's PLC signal, or from the stitch signal or button if there is no PLC. It only reads, it never changes the machine.",
    action: "Run the auto-stitch", result: `Stitch at 06:21. A badge is logged in and there was no stitch in the last ${MIN_GAP} minutes, so it counts. BM-01 now reads 1.`,
  },
  {
    focus: "bm", title: "Its label prints",
    body: "The moment the stitch is counted, a label with the tyre's own number prints at the machine. Labels never print any other way.",
    action: "Apply the label", result: `${serialOf(1)} is on the tyre. That number is its ID for the rest of its passport.`,
  },
  {
    focus: "cart", title: "It goes on to curing",
    body: "The green tyre goes onto the cart as it does today. The only new steps for the operator are the badge tap and the label.",
    action: "Move to the cart", result: `${serialOf(1)} is on the cart. It is scanned again at the press, and its passport carries on.`,
  },
  {
    focus: "none", title: "Checked all shift",
    body: "Every count has a stitch signal, a time and a badge behind it. Each counter sends a heartbeat every minute, and every flag is logged for the supervisor.",
    action: "Now try to cheat it",
  },
];

type Scenario = { key: string; title: string; body: string; focus: Focus; steps: { action: string; result: string }[] };
const SCENARIOS: Scenario[] = [
  {
    key: "again", focus: "bm", title: "Stitch again straight away",
    body: "A builder runs the stitcher again a few minutes later, without building a new tyre, to push the count up.",
    steps: [{ action: "Run the stitcher again", result: `The stitch came 4 minutes after the last one on BM-01. A tyre can't be built that fast, and the stitcher can't usefully run without one. Flagged, not counted.` }],
  },
  {
    key: "nobadge", focus: "bm", title: "Stitch with no one signed in",
    body: "A tyre is built and stitched before anyone taps a badge at the machine.",
    steps: [
      { action: "Sign out and build a tyre", result: "No badge is logged in at BM-01. A tyre is on the drum." },
      { action: "Run the auto-stitch", result: "The stitch is real, but no badge is logged in. It is unattributed: not given to anyone until a supervisor approves it." },
    ],
  },
  {
    key: "manual", focus: "bm", title: "Type in a higher count",
    body: "A builder tries to add tyres to their total on the machine screen.",
    steps: [{ action: "Try to edit the count", result: "There is nowhere to enter a count. Operators cannot type or change it. The number comes only from stitch signals." }],
  },
  {
    key: "label", focus: "bm", title: "Print a spare label",
    body: "Someone wants a spare label to put on a tyre that was never counted.",
    steps: [{ action: "Request a label", result: "Refused. A label only prints for a counted stitch, so there is never a spare one." }],
  },
  {
    key: "unplug", focus: "bm", title: "Unplug the counter",
    body: "Someone unplugs the counter at BM-01, hoping nobody notices.",
    steps: [
      { action: "Unplug the counter", result: "The counter stops sending its heartbeat." },
      { action: "Wait 2 minutes", result: "No heartbeat for 2 minutes, so an alert goes to the supervisor. A counter can't be quietly unplugged." },
    ],
  },
];

/* ---------- the floor drawing ---------- */

function Floor({ st, now, focus }: { st: State; now: number; focus: Focus }) {
  const age = st.fx ? now - st.fx.t0 : 1e9;
  const on = (k: string | string[], from = 0, to = 2600) => !!st.fx && (Array.isArray(k) ? k.includes(st.fx.kind) : st.fx.kind === k) && age >= from && age < to;
  const stitching = on(["stitch", "again", "nbstitch"], 0, 1700);
  const spinning = stitching || on(["build", "nbbuild"], 0, 1400);
  const signal = on(["stitch", "again", "nbstitch"], 700, 2200);
  const moving = st.move && now - st.move.t0 < st.move.dur ? st.move : null;
  const dim = (f: Focus) => (focus === "none" || focus === f ? 1 : 0.38);
  const showDrumTyre = st.drum !== "empty";

  const building = (id: keyof typeof BM, active: boolean) => {
    const { x: bx, y: by } = BM[id];
    const ang = spinning && active ? (now / 80) % (Math.PI * 2) : 0.4;
    const [dcx, dcy] = P(bx + 12.5, by + 6, 6);
    const reach = active && stitching ? Math.min(1, age / 350) * (age > 1350 ? Math.max(0, 1 - (age - 1350) / 350) : 1) : 0;
    const ry = by + 11.2 - reach * 1.5;
    const led = active ? (st.online ? { top: "#9fe3bd", left: "#1f9d5a", right: "#178048" } : { top: "#ff9a9d", left: "#d92d33", right: "#b8262b" }) : { top: "#9fe3bd", left: "#1f9d5a", right: "#178048" };
    const [cx1, cy1] = P(bx + 2.4, by + 10.6, 7.2), [hx, hy] = P(bx + 3.5, by + 5.6, 9);
    return (
      <g key={id}>
        <polygon points={pts([bx - 1, by - 7, 0], [bx + 23, by - 7, 0], [bx + 23, by + 17, 0], [bx - 1, by + 17, 0])} fill="rgb(0 0 0 / .035)" />
        {/* servicer with material rolls */}
        <Box x={bx + 6} y={by - 5.5} w={10} d={4.5} h={8.5} />
        <XCyl x0={bx + 6.8} x1={bx + 15.2} cy={by - 0.6} cz={6.6} r={1.1} side="#4a4d54" face="#5d6068" />
        <XCyl x0={bx + 6.8} x1={bx + 15.2} cy={by - 0.6} cz={3.6} r={1.1} side="#4a4d54" face="#5d6068" />
        {/* base, headstock, drum, tailstock */}
        <Box x={bx} y={by} w={20} d={12} h={0.5} m={STEEL} />
        <Box x={bx + 1} y={by + 2} z={0.5} w={5} d={8} h={10} />
        <Box x={bx + 2} y={by + 3} z={10.5} w={1.2} d={1.2} h={1.2} m={spinning && active ? { top: "#ffd27a", left: "#f5a524", right: "#d98b14" } : STEEL} />
        <XCyl x0={bx + 6} x1={bx + 12.5} cy={by + 6} cz={6} r={3.1} side="#8b9098" face="#a7acb4" />
        {active && showDrumTyre && <XCyl x0={bx + 6.5} x1={bx + 12} cy={by + 6} cz={6} r={3.6} hole={3.1} side="#26282c" face={RUBBER} />}
        {active && st.drum === "labelled" && !moving && (
          <polygon className={s.labelOut} points={pts([bx + 12.02, by + 3.3, 7.6], [bx + 12.02, by + 4.4, 7.6], [bx + 12.02, by + 4.4, 6.9], [bx + 12.02, by + 3.3, 6.9])} fill="#fff" {...LINE} />
        )}
        {active && spinning && (
          <g stroke="rgb(255 255 255 / .55)" strokeWidth="1">
            {[0, 1, 2].map((k) => {
              const a = ang + (k * Math.PI * 2) / 3;
              const [ex, ey] = P(bx + 12.5, by + 6 + 2.4 * Math.cos(a), 6 + 2.4 * Math.sin(a));
              return <line key={k} x1={dcx} y1={dcy} x2={ex} y2={ey} />;
            })}
          </g>
        )}
        <XCyl x0={bx + 12.5} x1={bx + 13.6} cy={by + 6} cz={6} r={0.6} side={STEEL.right} face={STEEL.top} />
        <Box x={bx + 13.6} y={by + 4.2} z={0.5} w={2} d={3.6} h={7.6} />
        {/* the auto-stitcher: rollers that press in against the tyre */}
        <Box x={bx + 8.2} y={by + 12.2} z={0.5} w={2.4} d={1.6} h={4.4} m={STEEL} />
        <Box x={bx + 8.6} y={ry - 0.2} z={4.9} w={1.6} d={by + 12.4 - ry} h={0.6} m={DARK} />
        <XCyl x0={bx + 8.4} x1={bx + 10.4} cy={ry} cz={5.2} r={0.55} side="#3d4046" face="#5d6068" />
        {/* the counter: an edge device reading the stitch signal, with its heartbeat light */}
        <Box x={bx + 1.6} y={by + 10.2} z={6.2} w={1.6} d={0.7} h={1.3} m={DARK} />
        <Box x={bx + 2.05} y={by + 10.82} z={6.75} w={0.5} d={0.12} h={0.4} m={led} />
        {active && st.online && <circle key={`beat-${Math.floor(now / 1000)}`} className={s.beat} cx={cx1} cy={cy1} r="3" />}
        {active && signal && <line className={s.beamOn} x1={hx} y1={hy} x2={cx1} y2={cy1} stroke="#1f9d5a" strokeDasharray="2 2" />}
        {/* builder platform, HMI with badge reader, label printer */}
        <Box x={bx + 4.5} y={by + 12.4} w={3.4} d={3.6} h={0.35} m={STEEL} />
        <Box x={bx + 16} y={by + 12.6} w={0.6} d={0.6} h={8} m={STEEL} />
        <Box x={bx + 14.8} y={by + 12.7} z={8} w={3} d={0.5} h={2.4} m={{ top: "#50535a", left: active && st.badge ? "#1d3b5c" : "#2e3035", right: "#303237" }} />
        <Box x={bx + 16.7} y={by + 12.6} z={5.4} w={0.8} d={0.4} h={1.1} m={active && st.badge ? { top: "#cfe8da", left: "#1f9d5a", right: "#178048" } : WHITE} />
        <Box x={bx + 19} y={by + 12.6} w={2.4} d={2.2} h={4} />
        {active && on(["stitch", "nbstitch"], 1500, 4200) && (
          <polygon className={s.labelOut} points={pts([bx + 19.4, by + 14.82, 3.3], [bx + 21, by + 14.82, 3.3], [bx + 21, by + 14.82, 2.2], [bx + 19.4, by + 14.82, 2.2])} fill="#fff" {...LINE} />
        )}
      </g>
    );
  };

  const cart = () => {
    const { x, y } = CART;
    const list = st.onCart.filter((x2) => x2 !== moving?.serial);
    return (
      <g key="cart">
        <polygon points={pts([x - 1, y - 1, 0], [x + 14, y - 1, 0], [x + 14, y + 6, 0], [x - 1, y + 6, 0])} fill="rgb(0 0 0 / .035)" />
        {[[x + 0.3, y + 0.3], [x + 12.3, y + 0.3], [x + 0.3, y + 4.3], [x + 12.3, y + 4.3]].map(([a, b], i) => (
          <Box key={i} x={a} y={b} w={0.5} d={0.5} h={0.8} m={DARK} />
        ))}
        <Box x={x} y={y} z={0.8} w={13} d={5} h={0.4} m={STEEL} />
        <Box x={x} y={y + 2.2} z={1.2} w={0.5} d={0.6} h={8.4} m={STEEL} />
        <XCyl x0={x} x1={x + 13} cy={y + 2.5} cz={9.3} r={0.25} side={STEEL.right} face={STEEL.top} />
        {list.map((serial, i) => {
          const [cx, cy, cz] = cartSlot(i);
          return (
            <g key={serial}>
              <line x1={P(cx + 0.6, cy, 9.3)[0]} y1={P(cx + 0.6, cy, 9.3)[1]} x2={P(cx + 0.6, cy, cz + 3.1)[0]} y2={P(cx + 0.6, cy, cz + 3.1)[1]} stroke="#555" strokeWidth="1" />
              <Ring x={cx} cy={cy} cz={cz} />
            </g>
          );
        })}
        <Box x={x + 12.5} y={y + 2.2} z={1.2} w={0.5} d={0.6} h={8.4} m={STEEL} />
      </g>
    );
  };

  const press = (i: number) => {
    const { x, y } = PRESSES[i];
    const [mx, my] = [x + 5.5, y + 4.5];
    return (
      <g key={i}>
        <polygon points={pts([x - 1, y - 1, 0], [x + 14, y - 1, 0], [x + 14, y + 10, 0], [x - 1, y + 10, 0])} fill="rgb(0 0 0 / .035)" />
        <Box x={x} y={y} w={11} d={9} h={3.2} />
        <Box x={x + 0.4} y={y + 0.4} z={3.2} w={1} d={1} h={10} m={STEEL} />
        <Box x={x + 9.6} y={y + 0.4} z={3.2} w={1} d={1} h={10} m={STEEL} />
        <VCyl cx={mx} cy={my} z={3.2} r={3.4} h={1.4} top="#b9bec5" side="#a3a8b0" />
        <FlatTyre cx={mx} cy={my} z={4.6} />
        <VCyl cx={mx} cy={my} z={8.6} r={3.4} h={1.6} top="#c9cdd3" side="#a3a8b0" />
        <Box x={x + 0.4} y={y + 7.6} z={3.2} w={1} d={1} h={10} m={STEEL} />
        <Box x={x + 9.6} y={y + 7.6} z={3.2} w={1} d={1} h={10} m={STEEL} />
        <Box x={x} y={y} z={13.2} w={11} d={9} h={2} />
        <VCyl cx={mx} cy={my} z={15.2} r={1.4} h={1.8} top="#d6d9de" side="#b8bcc3" />
      </g>
    );
  };

  let mover: React.ReactNode = null;
  if (moving) {
    const k = Math.min(1, (now - moving.t0) / moving.dur);
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    const p = moving.from.map((v, i) => v + (moving.to[i] - v) * e) as V3;
    p[2] += Math.sin(Math.PI * e) * 3;
    mover = <Ring x={p[0]} cy={p[1]} cz={p[2]} />;
  }

  /* readouts */
  const counted = st.counted.length;
  const tone = on(["again"], 700, 4200) || on(["nbstitch"], 700, 4200) || on("unplug", 0, 9e9) ? "warn"
    : on(["manual", "refuse", "alarm"], 0, 9e9) ? "bad" : focus === "bm" ? "focus" : "plain";
  const lines = on("manual", 0, 9e9) ? ["BM-01 · count is read-only", "Comes only from stitch signals", "Counter online"]
    : on("refuse", 0, 9e9) ? ["BM-01 · label refused", "No counted stitch to label", "Counter online"]
    : on("again", 700, 9e9) ? ["BM-01 · stitch too soon", `${st.last !== null ? st.clock - st.last : 4} min after the last · flagged`, `Count ${counted}`]
    : on("nbstitch", 700, 9e9) ? ["BM-01 · no badge logged in", "Unattributed · needs approval", `Count ${counted}`]
    : on("alarm", 0, 9e9) ? ["BM-01 · counter offline", "No heartbeat for 2 min", "Alert sent to supervisor"]
    : on("unplug", 0, 9e9) ? ["BM-01 · counter offline", "No heartbeat", `Count ${counted}`]
    : [`BM-01 · ${st.badge ? "K. Perera · 1042" : "no one signed in"}`, `Count ${counted}${on("stitch", 1500, 4200) ? ` · label ${st.label}` : ""}`, st.online ? "Counter online · heartbeat" : "Counter offline"];

  const [l1x, l1y] = P(BM["BM-01"].x + 3.5, BM["BM-01"].y + 4, 10.6);
  const [l2x, l2y] = P(BM["BM-02"].x + 3.5, BM["BM-02"].y + 4, 11);
  const [lcx, lcy] = P(CART.x + 6.5, CART.y + 2.5, 10.5);
  const [lpx, lpy] = P(PRESSES[1].x + 5.5, PRESSES[1].y + 4.5, 17.4);

  return (
    <svg className={s.scene} viewBox="0 48 930 618" role="img" aria-label="Plant floor drawing: two tyre building machines with auto-stitchers and counters, a green tyre cart and curing presses">
      <defs>
        <pattern id="grid" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="matrix(0.866 0.5 -0.866 0.5 0 0)">
          <path d="M12 0H0V12" fill="none" stroke="rgb(28 30 34 / .05)" strokeWidth="0.6" />
        </pattern>
      </defs>
      <polygon points={pts([0, FD, 0], [FW, FD, 0], [FW, FD, -1.2], [0, FD, -1.2])} fill="#d7d9dd" {...LINE} />
      <polygon points={pts([FW, 0, 0], [FW, FD, 0], [FW, FD, -1.2], [FW, 0, -1.2])} fill="#c7cad0" {...LINE} />
      <polygon points={pts([0, 0, 0], [FW, 0, 0], [FW, FD, 0], [0, FD, 0])} fill="#eceef1" {...LINE} />
      <polygon points={pts([0, 0, 0], [FW, 0, 0], [FW, FD, 0], [0, FD, 0])} fill="url(#grid)" />
      {[32.5, 35.5, 62.5, 65.5].map((x) => (
        <polygon key={x} points={pts([x, 0.5, 0], [x + 0.3, 0.5, 0], [x + 0.3, FD - 0.5, 0], [x, FD - 0.5, 0])} fill="#e0b43c" opacity=".85" />
      ))}

      <g opacity={dim("bm")} className={s.fade}>{building("BM-01", true)}</g>
      <g opacity={focus === "none" ? 1 : 0.38} className={s.fade}>{building("BM-02", false)}</g>
      <g opacity={dim("cart")} className={s.fade}>{cart()}</g>
      <g opacity={focus === "none" ? 0.85 : 0.3} className={s.fade}>{[0, 1, 2, 3].map(press)}</g>
      {mover}

      <Tag x={l1x} y={l1y} lines={lines} tone={tone as "plain"} />
      <Tag x={l2x} y={l2y} lines={["BM-02", "Idle in this demo"]} />
      <Tag x={lcx} y={lcy} tone={focus === "cart" ? "focus" : "plain"} lines={["Green tyre cart", `${st.onCart.length} waiting`]} />
      <Tag x={lpx} y={lpy} lines={["Curing presses", "Scanned in at loading"]} />
    </svg>
  );
}

/* ---------- page ---------- */

export default function CountingDemo({ embedded = false }: { embedded?: boolean }) {
  const [st, setSt] = useState<State>(fresh);
  const [now, setNow] = useState(0);
  const [mode, setMode] = useState<"walk" | "menu" | "scenario">("walk");
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [scen, setScen] = useState<Scenario | null>(null);
  const [scenStep, setScenStep] = useState(0);
  const [scenDone, setScenDone] = useState<Record<string, boolean>>({});
  const timers = useRef<number[]>([]);
  const busy = !!(st.move && now - st.move.t0 < st.move.dur) || !!(st.fx && now - st.fx.t0 < 1500);

  /* animation frames only while something is moving (the heartbeat light keeps a slow tick going) */
  useEffect(() => {
    let raf = 0, last = 0;
    const loop = (t: number) => {
      const active = (st.fx && t - st.fx.t0 < 4400) || (st.move && t - st.move.t0 < st.move.dur + 100);
      if (active || t - last > 500) { setNow(t); last = t; }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [st.fx, st.move]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const log = (x: State, kind: LogKind, text: string): State =>
    ({ ...x, log: [{ id: x.log.length + 1, t: x.clock, kind, text }, ...x.log] });

  /* a valid stitch: counted, and a label prints */
  const countStitch = (x: State, at: number): State => {
    const serial = serialOf(x.seq + 1);
    const n: State = { ...x, clock: at, last: at, seq: x.seq + 1, label: serial, labels: x.labels + 1, fx: fxOf("stitch"),
      counted: [...x.counted, { serial, builtAt: at }] };
    return log(n, "ok", `Stitch on BM-01, badge 1042. At least ${MIN_GAP} min since the last one. Counted, label ${serial} printed.`);
  };

  const setupState = (): State => {
    let x = fresh();
    x = log({ ...x, badge: true, clock: 6 }, "info", "Badge 1042 (K. Perera) signed in at BM-01.");
    x = { ...countStitch(x, 21), fx: null, drum: "empty", onCart: [serialOf(1)] };
    return log(x, "info", `${serialOf(1)} moved to the green tyre cart.`);
  };

  const runWalk = () => {
    if (step === 0 || step === WALK.length - 1) {
      if (step === WALK.length - 1) { setMode("menu"); return; }
      setStep(1); setDone(false); return;
    }
    setDone(true);
    setSt((x) => {
      switch (step) {
        case 1: return log({ ...x, badge: true, clock: 6, fx: fxOf("badge") }, "info", "Badge 1042 (K. Perera) signed in at BM-01.");
        case 2: return log({ ...x, drum: "built", clock: 14, fx: fxOf("build") }, "info", "Green tyre built on the BM-01 drum. Not counted yet.");
        case 3: return countStitch(x, 21);
        case 4: return { ...x, drum: "labelled", fx: fxOf("labelOn") };
        case 5: {
          const n: State = { ...x, clock: 22, drum: "empty", onCart: [...x.onCart, serialOf(1)], move: { serial: serialOf(1), from: drumPos(), to: cartSlot(x.onCart.length), t0: stamp(), dur: 1300 } };
          return log(n, "info", `${serialOf(1)} placed on the green tyre cart.`);
        }
      }
      return x;
    });
  };

  const runScenario = () => {
    if (!scen) return;
    const k = scen.key, i = scenStep;
    setSt((x) => {
      switch (k) {
        case "again": {
          const at = (x.last ?? 21) + 4;
          return log({ ...x, clock: at, flagged: x.flagged + 1, fx: fxOf("again") }, "warn", `Stitch on BM-01 only 4 min after the last one. Flagged against badge 1042, not counted.`);
        }
        case "nobadge":
          if (i === 0) return log({ ...x, badge: false, drum: "built", clock: Math.max(x.clock, (x.last ?? 21) + 10), fx: fxOf("nbbuild") }, "info", "Badge 1042 signed out at BM-01. A tyre is built on the drum.");
          return log({ ...x, clock: Math.max(x.clock + 8, (x.last ?? 21) + MIN_GAP + 2), unattributed: x.unattributed + 1, labels: x.labels + 1, seq: x.seq + 1,
            label: serialOf(x.seq + 1), drum: "empty", fx: fxOf("nbstitch") }, "warn", `Stitch on BM-01 with no badge logged in. Unattributed, label ${serialOf(x.seq + 1)} printed, waiting for supervisor approval.`);
        case "manual": return log({ ...x, clock: x.clock + 1, flagged: x.flagged + 1, fx: fxOf("manual") }, "bad", "Attempt to change the count at BM-01. The count is read-only. Logged.");
        case "label": return log({ ...x, clock: x.clock + 1, fx: fxOf("refuse") }, "bad", "Label requested at BM-01 with no counted stitch. Refused. Logged.");
        case "unplug":
          if (i === 0) return log({ ...x, online: false, clock: x.clock + 1, fx: fxOf("unplug") }, "warn", "BM-01 counter stopped sending its heartbeat.");
          return log({ ...x, clock: x.clock + 2, alerts: x.alerts + 1, fx: fxOf("alarm") }, "bad", "No heartbeat from the BM-01 counter for 2 minutes. Alert sent to the shift supervisor.");
      }
      return x;
    });
    if (i + 1 < scen.steps.length) {
      setScenStep(i + 1);
      setScenDone((d) => ({ ...d, [`${k}-${i}`]: true }));
    } else {
      setScenDone((d) => ({ ...d, [`${k}-${i}`]: true, [k]: true }));
    }
  };

  /* leave every scenario with the machine back to normal: badge in, counter plugged in */
  const tidy = (x: State): State => {
    let n = x;
    if (!n.online) n = log({ ...n, online: true, fx: null }, "info", "BM-01 counter plugged back in. Heartbeat restored.");
    if (!n.badge) n = log({ ...n, badge: true, fx: null }, "info", "Badge 1042 signed in again at BM-01.");
    return { ...n, drum: "empty" };
  };
  const openScenario = (sc: Scenario) => {
    setSt((x) => tidy(x.counted.length ? x : setupState()));
    setScen(sc); setScenStep(0); setMode("scenario");
    setScenDone((d) => { const n = { ...d }; Object.keys(n).filter((q) => q.startsWith(sc.key)).forEach((q) => delete n[q]); return n; });
  };
  const backToMenu = () => { setSt((x) => tidy({ ...x, fx: null })); setMode("menu"); };

  const restart = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t)); timers.current = [];
    setSt(fresh()); setMode("walk"); setStep(0); setDone(false); setScen(null); setScenDone({});
  }, []);

  const focus: Focus = mode === "walk" ? WALK[step].focus : mode === "scenario" && scen ? scen.focus : "none";
  const walkStep = WALK[step];
  const lastScenResult = scen ? (scenDone[`${scen.key}-${scen.steps.length - 1}`] ? scen.steps[scen.steps.length - 1].result
    : scenStep > 0 ? scen.steps[scenStep - 1].result : null) : null;
  const scenFinished = scen ? !!scenDone[scen.key] : false;
  const flags = st.log.filter((e) => e.kind === "warn" || e.kind === "bad");

  return (
    <div className={embedded ? `${s.page} ${s.embedded}` : s.page}>
      {!embedded && <header className={s.top}>
        <Link href="/" className={s.brand} aria-label="Back to tyode.com"><TyodeLogo className={s.logo} /></Link>
        <div className={s.topMeta}>
          <span className={s.pill}>Concept demo · sample data</span>
          <span className={s.clock}>Shift A · {clock(st.clock)}</span>
        </div>
      </header>}

      {!embedded && <section className={s.intro}>
        <h1>Automatic green tyre counting</h1>
        <p>Counted from the building machine&apos;s auto-stitch, linked to the operator&apos;s badge. Operators cannot type or change the count.</p>
      </section>}

      <div className={s.layout}>
        <div className={s.sceneCard}>
          <Floor st={st} now={now} focus={focus} />
          <div className={s.counts}>
            <div><b>{st.counted.length}</b><span>Counted (verified)</span></div>
            <div className={st.flagged ? s.cAmber : ""}><b>{st.flagged}</b><span>Flagged attempts</span></div>
            <div className={st.unattributed ? s.cAmber : ""}><b>{st.unattributed}</b><span>Unattributed</span></div>
            <div><b>{st.labels}</b><span>Labels printed</span></div>
            <div className={st.online ? "" : s.cRed}><b>{st.online ? "1/1" : "0/1"}</b><span>Counter online</span></div>
          </div>
        </div>

        <aside className={s.panel}>
          {mode === "walk" && (
            <>
              <div className={s.progress} aria-label={`Step ${step} of ${WALK.length - 1}`}>
                {WALK.slice(1).map((_, i) => <i key={i} className={i + 1 < step || (i + 1 === step && done) ? s.pDone : i + 1 === step ? s.pNow : ""} />)}
              </div>
              <span className={s.kicker}>{step === 0 ? "Walkthrough" : `Step ${step} of ${WALK.length - 1}`}</span>
              <h2>{walkStep.title}</h2>
              <p>{walkStep.body}</p>
              {step === 4 && done && (
                <div className={s.labelCard} aria-label="Printed label">
                  <span>Green tyre · line PL-1</span>
                  <b>{serialOf(1)}</b>
                  <svg viewBox="0 0 120 22" aria-hidden="true">{Array.from({ length: 34 }, (_, i) => <rect key={i} x={i * 3.5} width={(i * 7) % 3 === 0 ? 2.2 : 1} height="22" />)}</svg>
                  <em>BM-01 · badge 1042 · 06:21</em>
                </div>
              )}
              {done && walkStep.result && <div className={s.result}><i aria-hidden="true">✓</i>{walkStep.result}</div>}
              <div className={s.buttons}>
                {!done || step === 0 || step === WALK.length - 1 ? (
                  <button type="button" className={s.primary} onClick={runWalk} disabled={busy}>{walkStep.action}</button>
                ) : (
                  <button type="button" className={s.primary} disabled={busy} onClick={() => { setStep(step + 1); setDone(false); }}>Next</button>
                )}
                {step === 0 && (
                  <button type="button" className={s.link} onClick={() => { setSt(setupState()); setMode("menu"); }}>Skip to the cheats</button>
                )}
              </div>
            </>
          )}

          {mode === "menu" && (
            <>
              <span className={s.kicker}>Try to cheat the count</span>
              <h2>Pick a way to cheat</h2>
              <p>Each one acts out something that could happen on the floor. See how it is caught.</p>
              <div className={s.menu}>
                {SCENARIOS.map((sc) => (
                  <button key={sc.key} type="button" onClick={() => openScenario(sc)} className={scenDone[sc.key] ? s.tried : ""}>
                    <b>{sc.title}</b>
                    <span>{scenDone[sc.key] ? "Tried · caught" : sc.body}</span>
                  </button>
                ))}
              </div>
              <div className={s.buttons}>
                <button type="button" className={s.link} onClick={restart}>Restart the walkthrough</button>
              </div>
            </>
          )}

          {mode === "scenario" && scen && (
            <>
              <span className={s.kicker}>Try to cheat the count</span>
              <h2>{scen.title}</h2>
              <p>{scen.body}</p>
              {lastScenResult && (
                <div className={`${s.result} ${scenFinished ? s.caught : ""}`}>
                  <i aria-hidden="true">{scenFinished ? "!" : "✓"}</i>{lastScenResult}
                </div>
              )}
              <div className={s.buttons}>
                {!scenFinished && (
                  <button type="button" className={s.primary} onClick={runScenario} disabled={busy}>{scen.steps[scenStep].action}</button>
                )}
                <button type="button" className={scenFinished ? s.primary : s.link} disabled={busy} onClick={backToMenu}>
                  {scenFinished ? "Try another" : "Back to the list"}
                </button>
              </div>
            </>
          )}
        </aside>
      </div>

      <div className={s.lower}>
        <div className={s.card}>
          <h3>Shift record</h3>
          {st.log.length === 0 ? <p className={s.small}>Events appear here as you step through the demo.</p> : (
            <ol className={s.log}>
              {st.log.map((e) => (
                <li key={e.id} className={s[e.kind]}>
                  <time>{clock(e.t)}</time><span>{e.text}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
        <div className={s.card}>
          <h3>Flags for the supervisor</h3>
          {flags.length === 0 ? <p className={s.small}>None yet. Anything that doesn&apos;t match a real, attributed stitch shows up here.</p> : (
            <ul className={s.missing}>
              {flags.map((e) => <li key={e.id}><b>{clock(e.t)}</b><span>{e.text}</span></li>)}
            </ul>
          )}
          <h3 className={s.gap}>How it is installed</h3>
          <ul className={s.notes}>
            <li>Tyode reads the machine&apos;s auto-stitch: the PLC signal, or the stitch signal or button. Read only.</li>
            <li>A badge reader and a label printer at each building machine.</li>
            <li>Each counter sends a heartbeat every minute. Scrap is recorded separately.</li>
            <li>Runs alongside the current count until the plant approves the switch.</li>
          </ul>
        </div>
      </div>

      {!embedded && <footer className={s.foot}>
        Concept demo with sample data. <Link href="/">Back to tyode.com</Link>
      </footer>}
    </div>
  );
}
