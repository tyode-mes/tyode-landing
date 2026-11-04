import type { CSSProperties } from "react";
import { LOGO } from "./TyodeLogo";
import styles from "./TyodeMark.module.css";

/**
 * The hero logo, exactly as the logo artwork: the letters, the tyre, and the construction
 * layer on top of them (a thin translucent grey, so it reads darker on the paper and lighter
 * where it crosses the ink). Every guide below is measured from the artwork, in logo units.
 *
 * Intro (plays once): the guides draw themselves in, an inspection line sweeps across, each
 * letter appears as it passes and the tyre spins into place. A parent can hold it with
 * `animation-play-state: paused` until it is ready to be seen. Reduced motion: final state.
 */

const [TX, TY] = LOGO.tyreCentre;

// ---- construction, measured from the artwork ----
const D = { x: 315.35, y: 66.65 }; // centre of the d's bowl
const HUB = { x: 228.75, y: 68.4 }; // centre of the tyre's hub
const SPOKE_END = { x: 347.05, y: 31.85 }; // where the d's upper spoke meets its circle
const LEFT = -14.75; // the long guides run from here...
const RIGHT = 480.25; // ...to here
const TOP = -33.75; // stem guides run from here...
const BOTTOM = 143.25; // ...to here

/** strength: 1 = a normal guide; the baseline is heavier, centre lines lighter */
const H_LINES = [
  { y: 0.97, s: 1, d: 0 }, // ascender
  { y: 23.05, s: 1, d: 0.07 }, // x-height
  { y: 45.41, s: 1, d: 0.14 }, // mid-line
  { y: 111.58, s: 1.6, d: 0.21 }, // baseline
];
const V_LINES = [
  { x: 336.93, s: 1, d: 0.26 }, // left of the d's stem
  { x: 363.65, s: 1, d: 0.32 }, // right of the d's stem
];

// arcs: centre, radius, start / end angle in degrees (clockwise from 3 o'clock, y down)
const arc = (cx: number, cy: number, r: number, a0: number, a1: number) => {
  const p = (a: number) => [cx + r * Math.cos((a * Math.PI) / 180), cy + r * Math.sin((a * Math.PI) / 180)];
  const [x0, y0] = p(a0);
  const [x1, y1] = p(a1);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
};
const D_ARC = arc(D.x, D.y, 47.1, -113.3, 92); // round the bowl of the d, from the x-height to below the baseline
const TYRE_ARC = arc(229.55, 69.35, 61.6, 34.5, 98.6); // under the tyre

// ---- intro timing ----
// When the inspection line passes x (logo units), in seconds
const SCAN_START = 0.55;
const SCAN_DUR = 1.25;
const SCAN_FROM = LEFT;
const SCAN_TO = RIGHT;
const passes = (x: number) => SCAN_START + ((x - SCAN_FROM) / (SCAN_TO - SCAN_FROM)) * SCAN_DUR;

const v = (s: number, d: number) => ({ "--s": s, "--d": `${d.toFixed(2)}s` }) as CSSProperties;

type Props = {
  pad: number;
  className?: string;
  /** after the intro, fade the guides out (they come back while hovered) */
  settle?: boolean;
};

export default function TyodeMark({ pad, className, settle }: Props) {
  const vb = `${-pad} ${-pad} ${LOGO.width + pad * 2} ${LOGO.height + pad * 2}`;
  return (
    <svg className={`${styles.mark} ${settle ? styles.settle : ""} ${className ?? ""}`} viewBox={vb} aria-hidden="true" overflow="visible">
      {/* ---- the logo ---- */}
      <g className={styles.ink}>
        <path className={styles.letter} style={v(1, passes(37))} d={LOGO.parts.t} />
        <path className={styles.letter} style={v(1, passes(128))} d={LOGO.parts.y} />
        <path className={styles.letter} style={v(1, passes(D.x))} d={LOGO.parts.d} />
        <path className={styles.letter} style={v(1, passes(414))} d={LOGO.parts.e} />
        <path
          className={styles.tyre}
          style={{ ...v(1, passes(TX) - 0.15), transformOrigin: `${TX}px ${TY}px` }}
          d={LOGO.parts.tyre}
        />
      </g>

      {/* ---- construction, on top ---- */}
      <g className={styles.guides}>
        {H_LINES.map((l) => (
          <line key={l.y} className={styles.hLine} style={v(l.s, l.d)} x1={LEFT} y1={l.y} x2={RIGHT} y2={l.y} />
        ))}
        {V_LINES.map((l) => (
          <line key={l.x} className={styles.vLine} style={v(l.s, l.d)} x1={l.x} y1={TOP} x2={l.x} y2={BOTTOM} />
        ))}
        {/* centre lines through the d and the e, and the tick between t and y */}
        <line className={`${styles.hLine} ${styles.dotted}`} style={v(0.8, 0.3)} x1={268.75} y1={66.7} x2={477.25} y2={66.7} />
        <line className={`${styles.vLine} ${styles.dotted}`} style={v(0.8, 0.38)} x1={D.x} y1={19.55} x2={D.x} y2={117.25} />
        <line className={`${styles.vLine} ${styles.dotted}`} style={v(0.8, 0.44)} x1={414.65} y1={14.75} x2={414.65} y2={117.25} />
        <line className={styles.vLine} style={v(1, 0.2)} x1={89.15} y1={55.75} x2={89.15} y2={117.25} />
        {/* the diagonal: down to the bowl of the d, then on into its centre */}
        <path className={styles.arc} style={v(1, 0.5)} d={`M213.25 -14.95L279.25 34.25L${D.x} ${D.y}`} pathLength={1} />
        {/* spokes from the d's centre: down to the end of the tyre's arc, up to the d's circle */}
        <line className={styles.ray} style={{ ...v(0.9, 0.75), transformOrigin: `${D.x}px ${D.y}px` }} x1={D.x} y1={D.y} x2={279.75} y2={104.75} />
        <line className={styles.ray} style={{ ...v(0.9, 0.8), transformOrigin: `${D.x}px ${D.y}px` }} x1={D.x} y1={D.y} x2={SPOKE_END.x} y2={SPOKE_END.y} />
        {/* the y's crotch, carried down into its stem */}
        <path className={styles.arc} style={v(1, 0.6)} d="M117.75 103.25L131.25 76.25L144.05 102.75" pathLength={1} />
        {/* arcs */}
        <path className={styles.arc} style={v(0.8, 0.45)} d={D_ARC} pathLength={1} />
        <path className={styles.arc} style={v(0.8, 0.55)} d={TYRE_ARC} pathLength={1} />
        {/* the tyre's axis, through the hub */}
        <line className={styles.ray} style={{ ...v(0.8, 0.7), transformOrigin: "241.25px 44.75px" }} x1={241.25} y1={44.75} x2={218.75} y2={88.75} />
        {/* centre points: grey on the paper, pale where they sit on the ink */}
        <circle className={styles.dot} style={v(1, 0.9)} cx={D.x} cy={D.y} r={1.6} />
        <circle className={`${styles.dot} ${styles.pale}`} style={v(1, 0.95)} cx={HUB.x} cy={HUB.y} r={1.4} />
        <circle className={`${styles.dot} ${styles.pale}`} style={v(1, 1)} cx={SPOKE_END.x} cy={SPOKE_END.y} r={1.3} />
      </g>

      {/* ---- inspection line ---- */}
      <g
        className={styles.scan}
        style={{ "--from": `${SCAN_FROM}px`, "--to": `${SCAN_TO}px`, "--d": `${SCAN_START}s`, "--dur": `${SCAN_DUR}s` } as CSSProperties}
      >
        <line x1={0} y1={TOP - 4} x2={0} y2={BOTTOM + 4} />
        <rect x={-2.2} y={TOP - 8.4} width={4.4} height={4.4} />
        <rect x={-2.2} y={BOTTOM + 4} width={4.4} height={4.4} />
      </g>
    </svg>
  );
}
