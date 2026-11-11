"use client";

/* Green tyre counting: a guided concept demo with sample data.
   A technical drawing of the floor (tyre building machines, a green tyre cart, curing presses).
   Nothing runs on its own: the visitor steps through one tyre's journey, then tries each way of
   cheating the count and sees how it is caught. */

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
const PRESSES = { "P-01": { x: 75, y: 3 }, "P-02": { x: 75, y: 17 }, "P-03": { x: 75, y: 31 }, "P-04": { x: 75, y: 45 } } as const;
type PressId = keyof typeof PRESSES;

const drumPos = (): V3 => [BM["BM-01"].x + 7.2, BM["BM-01"].y + 6, 6];
const cartSlot = (i: number): V3 => [CART.x + 1.6 + i * 1.75, CART.y + 2.5, 5.3];
const mouldPos = (p: PressId): V3 => [PRESSES[p].x + 5.5, PRESSES[p].y + 4.5, 4.6];

/* ---------- demo state ---------- */

type Where = "drum" | "cart" | "press" | "gone" | "missing";
type Tyre = { serial: string; builtAt: number; at: Where; press?: PressId; loadedAt?: number };
type LogKind = "ok" | "warn" | "bad" | "info";
type Fx = { kind: string; t0: number };
type Move = { serial: string; from: V3; to: V3; t0: number; dur: number; fade?: boolean };
type State = {
  badge: boolean; clock: number; seq: number; tyres: Tyre[]; flags: number;
  log: { id: number; t: number; kind: LogKind; text: string }[];
  fx: Fx | null; move: Move | null; drumTyre: boolean;
};
const fresh = (): State => ({ badge: false, clock: 0, seq: 0, tyres: [], flags: 0, log: [], fx: null, move: null, drumTyre: false });

const clock = (m: number) => {
  const t = 6 * 60 + m;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
};

type Focus = "none" | "bm" | "cart" | "press";
const WALK: { title: string; body: string; action: string; result?: string; focus: Focus }[] = [
  {
    focus: "none", title: "Follow one green tyre",
    body: "This is a building area, a green tyre cart and four curing presses. Step through how one tyre is counted, then try to cheat the count yourself.",
    action: "Start",
  },
  {
    focus: "bm", title: "The builder signs in",
    body: "At the start of the shift the tyre builder taps their badge at machine BM-01. Every tyre built on this machine is now credited to badge 1042.",
    action: "Tap badge", result: "Signed in. BM-01 is crediting its tyres to badge 1042.",
  },
  {
    focus: "bm", title: "A tyre is built",
    body: "A tyre is only counted when two separate signals agree: the machine reports the build cycle is complete, and the sensor at the unload point sees a real tyre come off the drum.",
    action: "Complete the build", result: "Both signals agree, so the tyre is counted. BM-01 now reads 1.",
  },
  {
    focus: "bm", title: "Its label prints by itself",
    body: "The moment a tyre is counted, a label with its own number prints at the machine. Labels are never printed any other way.",
    action: "Apply the label", result: "GT-0001 is on the tyre. That number follows it to the press.",
  },
  {
    focus: "cart", title: "It waits on the cart",
    body: "The green tyre goes onto the cart as it does today. The only new steps for the builder are the badge tap and the label.",
    action: "Move to the cart", result: "GT-0001 is on the cart, waiting to be cured.",
  },
  {
    focus: "press", title: "It is scanned into a press",
    body: "The press operator scans the label while loading. This is a second, separate count, taken by different people at a different station.",
    action: "Load into press P-02", result: "Built 1, loaded 1. The two counts match.",
  },
  {
    focus: "none", title: "The check runs all shift",
    body: "Built and loaded are compared continuously, per builder, machine and shift. If a counted tyre is never loaded, it is listed by its number.",
    action: "Now try to cheat it",
  },
];

type Scenario = { key: string; title: string; body: string; focus: Focus; steps: { action: string; result: string }[] };
const SCENARIOS: Scenario[] = [
  {
    key: "empty", focus: "bm", title: "Run the machine with no tyre",
    body: "A builder cycles the machine without building a tyre, to raise their count.",
    steps: [{ action: "Run an empty cycle", result: "The machine reported a cycle, but the unload sensor saw no tyre. Nothing was counted, and the attempt is flagged against badge 1042." }],
  },
  {
    key: "sensor", focus: "bm", title: "Block the sensor by hand",
    body: "Someone breaks the sensor beam by hand to fake a tyre coming off the drum.",
    steps: [{ action: "Break the beam", result: "The sensor was triggered, but the machine had not completed a cycle. Nothing was counted, and the attempt is flagged." }],
  },
  {
    key: "label", focus: "bm", title: "Print a spare label",
    body: "Someone wants a spare label to stick on a tyre that was never counted.",
    steps: [{ action: "Request a label", result: "Refused. Labels only print for a counted tyre, so there is never a spare label to use." }],
  },
  {
    key: "manual", focus: "bm", title: "Type in a higher count",
    body: "A builder tries to add tyres to their total on the machine screen.",
    steps: [{ action: "Try to edit the count", result: "There is nowhere to enter a count. The number on screen comes only from the machine and the sensor." }],
  },
  {
    key: "dup", focus: "press", title: "Scan the same tyre twice",
    body: "A tyre that is already in a press is scanned again, to make the press count look higher.",
    steps: [{ action: "Scan GT-0001 again", result: "GT-0001 was already loaded into P-02 at 06:12. Each label can only be loaded once, so this scan is rejected and flagged." }],
  },
  {
    key: "missing", focus: "cart", title: "A tyre goes missing",
    body: "A tyre is built and counted, then taken off the cart, and never reaches a press.",
    steps: [
      { action: "Build a tyre, then take it away", result: "The new tyre was counted at BM-01 and labelled, then taken off the cart before it reached a press." },
      { action: "Move the clock on 20 minutes", result: "It was not loaded within 20 minutes, so it is now listed as missing, with its number, the builder, the machine and the time it was built." },
    ],
  },
];

/* ---------- the floor drawing ---------- */

function Floor({ st, now, focus }: { st: State; now: number; focus: Focus }) {
  const fxOn = (k: string, from = 0, to = 2600) => st.fx && st.fx.kind === k && now - st.fx.t0 >= from && now - st.fx.t0 < to;
  const fxIn = (k: string[]) => !!st.fx && k.includes(st.fx.kind) && now - st.fx.t0 < 4200;
  const spinning = fxOn("build", 0, 1300) || fxOn("empty", 0, 1300);
  const beamOk = fxOn("build", 1100, 2600);
  const beamBad = fxOn("sensor", 0, 2600);
  const cycleLamp = spinning;
  const moving = st.move && now - st.move.t0 < st.move.dur ? st.move : null;
  const onCart = st.tyres.filter((t) => t.at === "cart" && t.serial !== moving?.serial);
  const inPress = (p: PressId) => st.tyres.some((t) => t.at === "press" && t.press === p && t.serial !== moving?.serial);
  const counted = st.tyres.length - (fxOn("build", 0, 1100) ? 1 : 0);
  const dim = (f: Focus) => (focus === "none" || focus === f ? 1 : 0.38);

  const building = (id: keyof typeof BM, active: boolean) => {
    const { x: bx, y: by } = BM[id];
    const ang = spinning && active ? (now / 90) % (Math.PI * 2) : 0.4;
    const [dcx, dcy] = P(bx + 12.5, by + 6, 6);
    const showTyre = active && st.drumTyre;
    const b1 = P(bx + 17.8, by + 2.6, 3), b2 = P(bx + 17.8, by + 9.4, 3);
    return (
      <g key={id}>
        <polygon points={pts([bx - 1, by - 7, 0], [bx + 23, by - 7, 0], [bx + 23, by + 17, 0], [bx - 1, by + 17, 0])} fill="rgb(0 0 0 / .035)" />
        {/* servicer with material rolls */}
        <Box x={bx + 6} y={by - 5.5} w={10} d={4.5} h={8.5} />
        <XCyl x0={bx + 6.8} x1={bx + 15.2} cy={by - 0.6} cz={6.6} r={1.1} side="#4a4d54" face="#5d6068" />
        <XCyl x0={bx + 6.8} x1={bx + 15.2} cy={by - 0.6} cz={3.6} r={1.1} side="#4a4d54" face="#5d6068" />
        <line x1={P(bx + 10, by - 0.2, 7.4)[0]} y1={P(bx + 10, by - 0.2, 7.4)[1]} x2={P(bx + 10, by + 3, 8.8)[0]} y2={P(bx + 10, by + 3, 8.8)[1]} stroke="#3d4046" strokeWidth="2" />
        {/* base, headstock, drum, tailstock */}
        <Box x={bx} y={by} w={20} d={12} h={0.5} m={STEEL} />
        <Box x={bx + 1} y={by + 2} z={0.5} w={5} d={8} h={10} />
        <Box x={bx + 2} y={by + 3} z={10.5} w={1.2} d={1.2} h={1.2} m={cycleLamp && active ? { top: "#ffd27a", left: "#f5a524", right: "#d98b14" } : STEEL} />
        <XCyl x0={bx + 6} x1={bx + 12.5} cy={by + 6} cz={6} r={3.1} side="#8b9098" face="#a7acb4" />
        {showTyre && <XCyl x0={bx + 6.5} x1={bx + 12} cy={by + 6} cz={6} r={3.6} hole={3.1} side="#26282c" face={RUBBER} />}
        {active && (spinning || showTyre) && (
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
        {/* unload sensor: light curtain across the exit */}
        <Box x={bx + 17.5} y={by + 2} z={0.5} w={0.6} d={0.6} h={6} m={STEEL} />
        <line x1={b1[0]} y1={b1[1]} x2={b2[0]} y2={b2[1]}
          className={active && (beamOk || beamBad) ? s.beamOn : s.beamOff}
          stroke={active && beamBad ? "#d92d33" : active && beamOk ? "#1f9d5a" : "rgb(28 30 34 / .3)"} />
        <Box x={bx + 17.5} y={by + 9.4} z={0.5} w={0.6} d={0.6} h={6} m={STEEL} />
        {/* builder platform, HMI with badge reader, label printer */}
        <Box x={bx + 4.5} y={by + 12.4} w={10} d={3.6} h={0.35} m={STEEL} />
        <Box x={bx + 16} y={by + 12.6} w={0.6} d={0.6} h={8} m={STEEL} />
        <Box x={bx + 14.8} y={by + 12.7} z={8} w={3} d={0.5} h={2.4} m={{ top: "#50535a", left: active && st.badge ? "#1d3b5c" : "#2e3035", right: "#303237" }} />
        <Box x={bx + 16.7} y={by + 12.6} z={5.4} w={0.8} d={0.4} h={1.1} m={active && st.badge ? { top: "#cfe8da", left: "#1f9d5a", right: "#178048" } : WHITE} />
        <Box x={bx + 19} y={by + 12.6} w={2.4} d={2.2} h={4} />
        {active && fxOn("build", 1300, 4000) && (
          <polygon className={s.labelOut} points={pts([bx + 19.4, by + 14.82, 3.3], [bx + 21, by + 14.82, 3.3], [bx + 21, by + 14.82, 2.2], [bx + 19.4, by + 14.82, 2.2])} fill="#fff" {...LINE} />
        )}
      </g>
    );
  };

  const cart = () => {
    const { x, y } = CART;
    return (
      <g key="cart">
        <polygon points={pts([x - 1, y - 1, 0], [x + 14, y - 1, 0], [x + 14, y + 6, 0], [x - 1, y + 6, 0])} fill="rgb(0 0 0 / .035)" />
        {[[x + 0.3, y + 0.3], [x + 12.3, y + 0.3], [x + 0.3, y + 4.3], [x + 12.3, y + 4.3]].map(([a, b], i) => (
          <Box key={i} x={a} y={b} w={0.5} d={0.5} h={0.8} m={DARK} />
        ))}
        <Box x={x} y={y} z={0.8} w={13} d={5} h={0.4} m={STEEL} />
        <Box x={x} y={y + 2.2} z={1.2} w={0.5} d={0.6} h={8.4} m={STEEL} />
        <XCyl x0={x} x1={x + 13} cy={y + 2.5} cz={9.3} r={0.25} side={STEEL.right} face={STEEL.top} />
        {onCart.map((t, i) => {
          const [cx, cy, cz] = cartSlot(i);
          return (
            <g key={t.serial}>
              <line x1={P(cx + 0.6, cy, 9.3)[0]} y1={P(cx + 0.6, cy, 9.3)[1]} x2={P(cx + 0.6, cy, cz + 3.1)[0]} y2={P(cx + 0.6, cy, cz + 3.1)[1]} stroke="#555" strokeWidth="1" />
              <Ring x={cx} cy={cy} cz={cz} />
            </g>
          );
        })}
        <Box x={x + 12.5} y={y + 2.2} z={1.2} w={0.5} d={0.6} h={8.4} m={STEEL} />
      </g>
    );
  };

  const press = (id: PressId) => {
    const { x, y } = PRESSES[id];
    const dup = id === "P-02" && fxOn("dup", 0, 4200);
    const scan = id === "P-02" && fxOn("scan", 0, 1800);
    const [mx, my, mz] = mouldPos(id);
    return (
      <g key={id}>
        <polygon points={pts([x - 5, y - 1, 0], [x + 14, y - 1, 0], [x + 14, y + 10, 0], [x - 5, y + 10, 0])} fill="rgb(0 0 0 / .035)" />
        <Box x={x} y={y} w={11} d={9} h={3.2} />
        <Box x={x + 0.4} y={y + 0.4} z={3.2} w={1} d={1} h={10} m={STEEL} />
        <Box x={x + 9.6} y={y + 0.4} z={3.2} w={1} d={1} h={10} m={STEEL} />
        <VCyl cx={mx} cy={my} z={3.2} r={3.4} h={1.4} top="#b9bec5" side="#a3a8b0" />
        {inPress(id) && <FlatTyre cx={mx} cy={my} z={mz} />}
        <VCyl cx={mx} cy={my} z={8.6} r={3.4} h={1.6} top="#c9cdd3" side="#a3a8b0" />
        <Box x={x + 0.4} y={y + 7.6} z={3.2} w={1} d={1} h={10} m={STEEL} />
        <Box x={x + 9.6} y={y + 7.6} z={3.2} w={1} d={1} h={10} m={STEEL} />
        <Box x={x} y={y} z={13.2} w={11} d={9} h={2} />
        <VCyl cx={mx} cy={my} z={15.2} r={1.4} h={1.8} top="#d6d9de" side="#b8bcc3" />
        <Box x={x + 11.3} y={y + 1} w={2.2} d={3.5} h={8} />
        <Box x={x + 11.9} y={y + 1.6} z={8} w={0.8} d={0.8} h={0.8} m={dup ? { top: "#ff9a9d", left: "#d92d33", right: "#b8262b" } : { top: "#9fe3bd", left: "#1f9d5a", right: "#178048" }} />
        {/* label scanner at the loading point */}
        <Box x={x - 4} y={y + 7} w={0.5} d={0.5} h={6.5} m={STEEL} />
        <Box x={x - 4.4} y={y + 6.6} z={6.5} w={1.3} d={1.3} h={1} m={DARK} />
        {(scan || dup) && (
          <polygon className={s.beamOn} points={pts([x - 3.8, y + 7.2, 6.6], [mx - 3, my + 1.5, mz + 0.6], [mx - 1, my + 3, mz + 0.6])}
            fill={dup ? "rgb(217 45 51 / .35)" : "rgb(31 157 90 / .35)"} stroke="none" />
        )}
      </g>
    );
  };

  /* tyre in motion */
  let mover: React.ReactNode = null;
  if (moving) {
    const k = Math.min(1, (now - moving.t0) / moving.dur);
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    const p = moving.from.map((v, i) => v + (moving.to[i] - v) * e) as V3;
    p[2] += Math.sin(Math.PI * e) * 3;
    mover = <Ring x={p[0]} cy={p[1]} cz={p[2]} opacity={moving.fade ? 1 - e * 0.9 : 1} />;
  }

  /* readouts */
  const bmTone = fxIn(["empty", "sensor"]) ? "warn" : fxIn(["label", "manual"]) ? "bad" : focus === "bm" ? "focus" : "plain";
  const bmLines = fxIn(["manual"]) ? ["BM-01 · count is read-only", "Taken from machine and sensor"]
    : fxIn(["label"]) ? ["BM-01 · label refused", "No counted tyre to label"]
    : fxIn(["empty"]) && now - st.fx!.t0 > 1300 ? ["BM-01 · cycle, no tyre", "Not counted · flagged"]
    : fxIn(["sensor"]) ? ["BM-01 · sensor, no cycle", "Not counted · flagged"]
    : [`BM-01 · ${st.badge ? "badge 1042" : "no one signed in"}`, `Count ${Math.max(0, counted)}${fxOn("build", 1300, 4000) ? ` · label ${st.tyres[st.tyres.length - 1]?.serial}` : ""}`];
  const missingTyre = st.tyres.find((t) => t.at === "missing");
  const loaded = (p: PressId) => st.tyres.filter((t) => t.press === p && t.at === "press").length;

  const [l1x, l1y] = P(BM["BM-01"].x + 3.5, BM["BM-01"].y + 4, 12.8);
  const [l2x, l2y] = P(BM["BM-02"].x + 3.5, BM["BM-02"].y + 4, 11);
  const [lcx, lcy] = P(CART.x + 6.5, CART.y + 2.5, 10.5);
  const [lpx, lpy] = P(PRESSES["P-02"].x + 5.5, PRESSES["P-02"].y + 4.5, 17.4);

  return (
    <svg className={s.scene} viewBox="0 48 930 618" role="img" aria-label="Plant floor drawing: two tyre building machines, a green tyre cart and four curing presses">
      <defs>
        <pattern id="grid" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="matrix(0.866 0.5 -0.866 0.5 0 0)">
          <path d="M12 0H0V12" fill="none" stroke="rgb(28 30 34 / .05)" strokeWidth="0.6" />
        </pattern>
      </defs>
      {/* floor slab */}
      <polygon points={pts([0, FD, 0], [FW, FD, 0], [FW, FD, -1.2], [0, FD, -1.2])} fill="#d7d9dd" {...LINE} />
      <polygon points={pts([FW, 0, 0], [FW, FD, 0], [FW, FD, -1.2], [FW, 0, -1.2])} fill="#c7cad0" {...LINE} />
      <polygon points={pts([0, 0, 0], [FW, 0, 0], [FW, FD, 0], [0, FD, 0])} fill="#eceef1" {...LINE} />
      <polygon points={pts([0, 0, 0], [FW, 0, 0], [FW, FD, 0], [0, FD, 0])} fill="url(#grid)" />
      {/* walkway markings */}
      {[32.5, 35.5, 62.5, 65.5].map((x) => (
        <polygon key={x} points={pts([x, 0.5, 0], [x + 0.3, 0.5, 0], [x + 0.3, FD - 0.5, 0], [x, FD - 0.5, 0])} fill="#e0b43c" opacity=".85" />
      ))}

      <g opacity={dim("bm")} className={s.fade}>{building("BM-01", true)}</g>
      <g opacity={focus === "none" ? 1 : 0.38} className={s.fade}>{building("BM-02", false)}</g>
      <g opacity={dim("cart")} className={s.fade}>{cart()}</g>
      {(Object.keys(PRESSES) as PressId[]).map((id) => (
        <g key={id} opacity={id === "P-02" ? dim("press") : focus === "none" ? 1 : 0.38} className={s.fade}>{press(id)}</g>
      ))}
      {mover}

      <Tag x={l1x} y={l1y} lines={bmLines} tone={bmTone as "plain"} />
      <Tag x={l2x} y={l2y} lines={["BM-02", "Idle in this demo"]} />
      <Tag x={lcx} y={lcy} tone={missingTyre && fxIn(["missing"]) ? "warn" : focus === "cart" ? "focus" : "plain"}
        lines={missingTyre && fxIn(["missing"]) ? [`${missingTyre.serial} missing`, `Built ${clock(missingTyre.builtAt)} · never loaded`] : ["Green tyre cart", `${onCart.length} waiting`]} />
      <Tag x={lpx} y={lpy} tone={fxIn(["dup"]) ? "bad" : focus === "press" ? "focus" : "plain"}
        lines={fxIn(["dup"]) ? ["P-02 · scan rejected", "GT-0001 already loaded"] : [`P-02 · ${loaded("P-02")} loaded`, st.tyres.find((t) => t.press === "P-02")?.serial ?? "Waiting"]} />
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
  const busy = !!(st.move && now - st.move.t0 < st.move.dur) || !!(st.fx && now - st.fx.t0 < 1400);

  /* animation frames only while something is moving */
  useEffect(() => {
    const active = (st.fx && performance.now() - st.fx.t0 < 4400) || (st.move && performance.now() - st.move.t0 < st.move.dur + 100);
    if (!active) return;
    let raf = 0;
    const loop = () => { setNow(performance.now()); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    const stop = window.setTimeout(() => { cancelAnimationFrame(raf); setNow(performance.now()); }, 4500);
    return () => { cancelAnimationFrame(raf); window.clearTimeout(stop); };
  }, [st.fx, st.move]);

  const later = (ms: number, fn: () => void) => { timers.current.push(window.setTimeout(fn, ms)); };
  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const log = (x: State, kind: LogKind, text: string): State =>
    ({ ...x, log: [{ id: x.log.length + 1, t: x.clock, kind, text }, ...x.log] });
  const fx = (kind: string): Fx => ({ kind, t0: performance.now() });

  const build = (x: State, at: number): State => {
    const serial = `GT-${String(x.seq + 1).padStart(4, "0")}`;
    let n: State = { ...x, clock: Math.max(x.clock, at), seq: x.seq + 1, drumTyre: true, fx: fx("build"),
      tyres: [...x.tyres, { serial, builtAt: Math.max(x.clock, at), at: "drum" }] };
    n = log(n, "ok", `${serial} built on BM-01, badge 1042. Cycle and sensor agree, counted and labelled.`);
    return n;
  };
  const moveTo = (x: State, serial: string, from: V3, to: V3, where: Where, extra: Partial<Tyre> = {}, fade = false): State => ({
    ...x, drumTyre: where === "cart" || where === "gone" ? false : x.drumTyre,
    move: { serial, from, to, t0: performance.now(), dur: 1300, fade },
    tyres: x.tyres.map((t) => (t.serial === serial ? { ...t, at: where, ...extra } : t)),
  });

  /* complete setup so the cheats can be tried straight away */
  const setupState = (): State => {
    let x = fresh();
    x = { ...x, badge: true };
    x = log(x, "info", "Badge 1042 signed in at BM-01.");
    x = build(x, 8);
    x = { ...x, drumTyre: false, fx: null, clock: 12 };
    x = { ...x, tyres: x.tyres.map((t) => ({ ...t, at: "press" as Where, press: "P-02" as PressId, loadedAt: 12 })) };
    x = log(x, "ok", "GT-0001 scanned into P-02. Matches its build on BM-01.");
    return x;
  };

  const runWalk = () => {
    if (step === 0 || step === WALK.length - 1) {
      if (step === WALK.length - 1) { setMode("menu"); return; }
      setStep(1); setDone(false); return;
    }
    setDone(true);
    setSt((x) => {
      switch (step) {
        case 1: return log({ ...x, badge: true, fx: fx("badge") }, "info", "Badge 1042 signed in at BM-01.");
        case 2: return build(x, 8);
        case 3: return { ...x, fx: fx("labelOn") };
        case 4: return log(moveTo({ ...x, clock: 9 }, "GT-0001", drumPos(), cartSlot(0), "cart"), "info", "GT-0001 placed on the green tyre cart.");
        case 5: {
          let n = moveTo({ ...x, clock: 12 }, "GT-0001", cartSlot(0), mouldPos("P-02"), "press", { press: "P-02", loadedAt: 12 });
          n = log(n, "ok", "GT-0001 scanned into P-02. Matches its build on BM-01.");
          later(1300, () => setSt((y) => ({ ...y, fx: fx("scan") })));
          return n;
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
        case "empty": return log({ ...x, clock: Math.max(x.clock, 15), flags: x.flags + 1, fx: fx("empty") }, "warn", "BM-01 cycled with no tyre at the sensor. Not counted, flagged against badge 1042.");
        case "sensor": return log({ ...x, clock: Math.max(x.clock, 16), flags: x.flags + 1, fx: fx("sensor") }, "warn", "BM-01 sensor triggered without a machine cycle. Not counted, flagged.");
        case "label": return log({ ...x, clock: Math.max(x.clock, 17), flags: x.flags + 1, fx: fx("label") }, "bad", "Label requested at BM-01 with no counted tyre. Refused.");
        case "manual": return log({ ...x, clock: Math.max(x.clock, 18), flags: x.flags + 1, fx: fx("manual") }, "bad", "Attempt to change the count at BM-01. The count is read-only.");
        case "dup": return log({ ...x, clock: Math.max(x.clock, 19), flags: x.flags + 1, fx: fx("dup") }, "bad", "GT-0001 scanned again at P-02. Already loaded at 06:12, rejected.");
        case "missing":
          if (i === 0) {
            const n = build(x, 20);
            const serial = n.tyres[n.tyres.length - 1].serial;
            later(1500, () => setSt((y) => log(moveTo(y, serial, drumPos(), cartSlot(0), "cart"), "info", `${serial} placed on the cart.`)));
            later(3100, () => setSt((y) => log(moveTo(y, serial, cartSlot(0), [CART.x + 4, CART.y + 22, 2], "gone", {}, true), "info", `${serial} taken off the cart.`)));
            return n;
          }
          return log({
            ...x, clock: Math.max(x.clock + 20, 40), flags: x.flags, fx: fx("missing"),
            tyres: x.tyres.map((t) => (t.at === "gone" ? { ...t, at: "missing" as Where } : t)),
          }, "warn", `${x.tyres.find((t) => t.at === "gone")?.serial ?? "A tyre"} not loaded within 20 minutes. Listed as missing: BM-01, badge 1042, built ${clock(x.tyres.find((t) => t.at === "gone")?.builtAt ?? 20)}.`);
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

  const openScenario = (sc: Scenario) => {
    if (!st.tyres.some((t) => t.at === "press")) setSt(setupState());
    if (sc.key === "missing" && scenDone.missing) {
      setSt((x) => ({ ...x, tyres: x.tyres.filter((t) => t.at !== "missing" && t.at !== "gone") }));
    }
    setScen(sc); setScenStep(0); setMode("scenario");
    setScenDone((d) => { const n = { ...d }; Object.keys(n).filter((q) => q.startsWith(sc.key)).forEach((q) => delete n[q]); return n; });
  };

  const restart = useCallback(() => {
    timers.current.forEach((t) => window.clearTimeout(t)); timers.current = [];
    setSt(fresh()); setMode("walk"); setStep(0); setDone(false); setScen(null); setScenDone({});
  }, []);

  const focus: Focus = mode === "walk" ? WALK[step].focus : mode === "scenario" && scen ? scen.focus : "none";
  const built = st.tyres.length;
  const loadedN = st.tyres.filter((t) => t.at === "press").length;
  const missing = st.tyres.filter((t) => t.at === "missing");
  const waiting = built - loadedN - missing.length;
  const walkStep = WALK[step];
  const lastScenResult = scen ? (scenDone[`${scen.key}-${scen.steps.length - 1}`] ? scen.steps[scen.steps.length - 1].result
    : scenStep > 0 ? scen.steps[scenStep - 1].result : null) : null;
  const scenFinished = scen ? !!scenDone[scen.key] : false;

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
        <p>Counted from the machine, labelled at the build, checked again at the press. No count is ever entered by hand.</p>
      </section>}

      <div className={s.layout}>
        <div className={s.sceneCard}>
          <Floor st={st} now={now} focus={focus} />
          <div className={s.counts}>
            <div><b>{built}</b><span>Built and counted</span></div>
            <div><b>{loadedN}</b><span>Loaded into presses</span></div>
            <div><b>{waiting}</b><span>Not yet loaded</span></div>
            <div className={missing.length ? s.cRed : ""}><b>{missing.length}</b><span>Missing</span></div>
            <div className={st.flags ? s.cAmber : ""}><b>{st.flags}</b><span>Attempts flagged</span></div>
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
              {step === 3 && done && (
                <div className={s.labelCard} aria-label="Printed label">
                  <span>Green tyre</span>
                  <b>GT-0001</b>
                  <svg viewBox="0 0 120 22" aria-hidden="true">{Array.from({ length: 34 }, (_, i) => <rect key={i} x={i * 3.5} width={(i * 7) % 3 === 0 ? 2.2 : 1} height="22" />)}</svg>
                  <em>BM-01 · badge 1042 · 06:08</em>
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
              <p>Each one acts out something that could go wrong on the floor. See how it is caught.</p>
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
                <button type="button" className={scenFinished ? s.primary : s.link} disabled={busy} onClick={() => setMode("menu")}>
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
          <h3>Missing tyres</h3>
          {missing.length === 0 ? <p className={s.small}>None. Every counted tyre has been loaded or is still within its 20 minutes.</p> : (
            <ul className={s.missing}>
              {missing.map((t) => (
                <li key={t.serial}><b>{t.serial}</b><span>Built on BM-01 by badge 1042 at {clock(t.builtAt)}. Not loaded into any press.</span></li>
              ))}
            </ul>
          )}
          <h3 className={s.gap}>How it is installed</h3>
          <ul className={s.notes}>
            <li>The machine&apos;s cycle signal is read only. Nothing changes machine settings.</li>
            <li>A sensor or camera at the unload point confirms each tyre.</li>
            <li>Labels print at the machine. Scanners sit at press loading.</li>
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
