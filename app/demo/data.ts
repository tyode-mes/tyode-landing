/* Sample data for the Tyode demo: line PL-1 (pneumatic), Shift A, Wed 11 Nov 2026.
   Deterministic, so every visitor sees the same plant. Everything here is sample data. */

export const DATE = "Wed 11 Nov 2026";
export const NOW = 10 * 60 + 42; // 10:42, minutes since midnight
export const SHIFT_START = 6 * 60;
export const SHIFT_END = 14 * 60;
export const MIN_GAP = 15; // minutes between two counted stitches on one machine
export const HEARTBEAT_LIMIT = 2; // minutes without a heartbeat before an alert
export const LINE = { id: "PL-1", kind: "pneumatic", size: "185/65 R15", label: "Line PL-1 · pneumatic" } as const;
export const HERO = "GT-2611-0427";

export const hhmm = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(Math.floor(m) % 60).padStart(2, "0")}`;

/* ---------- people and machines ---------- */

export type Builder = { badge: string; name: string; machine: string };
export const BUILDERS: Builder[] = [
  { badge: "1042", name: "K. Perera", machine: "BM-01" },
  { badge: "1187", name: "S. Fernando", machine: "BM-02" },
  { badge: "1093", name: "R. Jayawardena", machine: "BM-03" },
  { badge: "1215", name: "A. Bandara", machine: "BM-04" },
  { badge: "1068", name: "M. Jayasinghe", machine: "BM-05" },
  { badge: "1130", name: "D. Wickramasinghe", machine: "BM-06" },
];
export const builderFor = (machine: string) => BUILDERS.find((b) => b.machine === machine)!;
export const builderByBadge = (badge: string) => BUILDERS.find((b) => b.badge === badge);

export const PEOPLE = {
  inspector: { name: "N. Silva", badge: "4102", role: "Inspector" },
  engineer: { name: "P. Silva", role: "Process engineer" },
  pressOp: { name: "S. Kumara", badge: "2207", role: "Press operator" },
  supervisor: { name: "L. Gunasekara", role: "Shift supervisor" },
};

export type Machine = { id: string; size: string; signal: "PLC signal" | "Stitch button"; beat: number };
export const MACHINES: Machine[] = [
  { id: "BM-01", size: "185/65 R15", signal: "PLC signal", beat: 12 },
  { id: "BM-02", size: "185/65 R15", signal: "PLC signal", beat: 31 },
  { id: "BM-03", size: "185/65 R15", signal: "Stitch button", beat: 8 },
  { id: "BM-04", size: "185/65 R15", signal: "PLC signal", beat: 44 },
  { id: "BM-05", size: "195/65 R15", signal: "Stitch button", beat: 19 },
  { id: "BM-06", size: "195/65 R15", signal: "PLC signal", beat: 5 },
];
export const PRESSES = Array.from({ length: 12 }, (_, i) => ({ id: `P-${String(i + 1).padStart(2, "0")}`, mould: `M-${String(i * 2 + 1).padStart(2, "0")}` }));
PRESSES[2].mould = "M-07";

/* ---------- stitches: the only source of the count ---------- */

export type StitchKind = "counted" | "flagged" | "unattributed";
export type Stitch = { id: string; machine: string; at: number; kind: StitchKind; badge?: string; gap?: number; serial?: string; reason?: string };

let seed = 26111;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

/* ---------- tyres ---------- */

export type Stage = "built" | "curing" | "inspection" | "released" | "held";
export type Tyre = {
  serial: string; machine: string; badge?: string; size: string; builtAt: number;
  press?: string; mould?: string; cureStart?: number; cureEnd?: number; peak?: number;
  inspectedAt?: number; result?: "pass" | "fail"; weight?: number; od?: number; width?: number;
  stage: Stage; batches: { tread: string; sidewall: string; liner: string };
  coolCure?: boolean; note?: string;
};

export const SPEC = {
  "185/65 R15": { weight: 8.5, od: 621, width: 185 },
  "195/65 R15": { weight: 9.1, od: 634, width: 195 },
} as const;
export const TOL = { weight: 0.015, od: 3, width: 3 };
export const CURE_MIN = 155;

function generate() {
  seed = 26111;
  const stitches: Stitch[] = [];
  for (const m of MACHINES) {
    const badge = builderFor(m.id).badge;
    let t = SHIFT_START + 7 + rnd() * 6;
    while (t < NOW) {
      stitches.push({ id: "", machine: m.id, at: t, kind: "counted", badge });
      t += MIN_GAP + [1.0, 2.2, 1.6, 3.4, 4.6, 2.8][MACHINES.indexOf(m)] + rnd() * 3;
    }
  }
  /* BM-06: first stitch came before the builder tapped in */
  const first6 = stitches.find((x) => x.machine === "BM-06")!;
  Object.assign(first6, { kind: "unattributed", badge: undefined, reason: "No badge logged in at BM-06. Builder D. Wickramasinghe tapped in 4 minutes later." });
  /* two stitches that came too soon after the last one: flagged, not counted */
  const tooSoon = (machine: string, near: number, after: number, reason: string) => {
    const mine = stitches.filter((x) => x.machine === machine && x.kind === "counted");
    const prev = mine.reduce((a, b) => (Math.abs(b.at - near) < Math.abs(a.at - near) ? b : a));
    stitches.push({ id: "", machine, at: prev.at + after, kind: "flagged", badge: prev.badge, gap: after, reason });
  };
  tooSoon("BM-02", 7 * 60 + 44, 3.5, "Stitch 3 min 30 s after the last one. A tyre can't be built that fast, so it was not counted.");
  tooSoon("BM-04", 10 * 60 + 25, 6, "Stitch 6 min after the last one, under the 15 minute minimum. Not counted.");
  stitches.sort((a, b) => a.at - b.at);
  stitches.forEach((x, i) => { x.id = `ST-${String(5000 + i)}`; });

  /* every counted or unattributed stitch is a real tyre with a printed label */
  const built = stitches.filter((x) => x.kind !== "flagged");
  const heroAt = built.filter((x) => x.machine === "BM-01").reduce((a, b) => (Math.abs(b.at - (8 * 60 + 12)) < Math.abs(a.at - (8 * 60 + 12)) ? b : a));
  heroAt.at = 8 * 60 + 12;
  built.sort((a, b) => a.at - b.at);
  const base = 427 - built.indexOf(heroAt);
  const tyres: Tyre[] = built.map((x, i) => {
    const serial = `GT-2611-${String(base + i).padStart(4, "0")}`;
    x.serial = serial;
    const size = MACHINES.find((m) => m.id === x.machine)!.size;
    return { serial, machine: x.machine, badge: x.badge, size, builtAt: x.at, stage: "built", batches: { tread: "C-1036", sidewall: "C-1038", liner: "C-1035" } };
  });

  /* compound batches in use through the shift */
  for (const t of tyres) {
    const late = t.builtAt > 9 * 60 + 40;
    t.batches = {
      tread: t.machine === "BM-01" && t.builtAt >= 8 * 60 + 5 ? "C-1042" : late ? "C-1047" : "C-1040",
      sidewall: t.builtAt >= 7 * 60 + 30 ? "C-1044" : "C-1041",
      liner: t.builtAt >= 7 * 60 ? "C-1039" : "C-1037",
    };
  }
  /* batch C-1042 ran out after its eighth tyre */
  tyres.filter((t) => t.batches.tread === "C-1042").forEach((t, i) => { if (i >= 8) t.batches.tread = "C-1047"; });

  /* P-03 ran cool from 09:05 to 09:59: four cycles of two tyres, the hero among them */
  const hero = tyres.find((t) => t.serial === HERO)!;
  const pool = tyres.filter((t) => t !== hero && t.builtAt >= 8 * 60 + 5 && t.builtAt <= 9 * 60 + 25 && t.machine !== "BM-01");
  const coolSet = [hero, ...pool.filter((_, i) => i % 2 === 0).slice(0, 7)];
  coolSet.sort((a, b) => a.builtAt - b.builtAt);
  coolSet.forEach((t, i) => {
    const start = 9 * 60 + 5 + Math.floor(i / 2) * 14;
    Object.assign(t, { press: "P-03", mould: "M-07", cureStart: start, cureEnd: start + 13, peak: [149, 148, 147, 148][Math.floor(i / 2)], coolCure: true });
  });

  /* everything else cures normally in the other presses */
  const others = PRESSES.filter((p) => p.id !== "P-03" && p.id !== "P-12");
  let pi = 0;
  for (const t of tyres) {
    if (t.press) continue;
    const start = t.builtAt + 22 + rnd() * 18;
    if (start > NOW) continue;
    const p = others[pi++ % others.length];
    Object.assign(t, { press: p.id, mould: p.mould, cureStart: start, cureEnd: start + 13, peak: 160 + Math.round(rnd() * 3) });
  }

  /* inspection, then the next stage */
  for (const t of tyres) {
    if (!t.cureEnd) continue;
    t.stage = t.cureEnd > NOW ? "curing" : "inspection";
    const at = t.cureEnd + 8 + rnd() * 12;
    if (t.cureEnd > NOW || at > NOW) continue;
    const s = SPEC[t.size as keyof typeof SPEC];
    Object.assign(t, {
      inspectedAt: at, result: "pass",
      weight: +(s.weight * (1 + (rnd() - 0.5) * 0.018)).toFixed(2), od: s.od + Math.round((rnd() - 0.5) * 3), width: s.width + Math.round((rnd() - 0.5) * 3),
      stage: "released",
    });
  }
  Object.assign(hero, { weight: 8.62, od: 621, width: 187, inspectedAt: 9 * 60 + 41, result: "pass", stage: "released" });
  /* the newest tyres from batch C-1042 are still moving through the line */
  const c42 = tyres.filter((t) => t.batches.tread === "C-1042");
  const clear = { inspectedAt: undefined, result: undefined, weight: undefined, od: undefined, width: undefined };
  if (c42[5]) Object.assign(c42[5], clear, { cureStart: 10 * 60 + 33, cureEnd: 10 * 60 + 46, stage: "curing" });
  if (c42[6]) Object.assign(c42[6], clear, { cureStart: 10 * 60 + 17, cureEnd: 10 * 60 + 30, stage: "inspection" });
  if (c42[7]) Object.assign(c42[7], clear, { press: undefined, mould: undefined, cureStart: undefined, cureEnd: undefined, peak: undefined, stage: "built" });

  /* one tyre came out heavy: held for an engineer */
  const heavy = tyres.filter((t) => t.machine === "BM-03" && t.result === "pass")[5];
  Object.assign(heavy, { weight: 8.79, result: "fail", stage: "held", note: "Weight 8.79 kg, above 8.63 kg (8.50 kg ± 1.5%). Held for an engineer." });

  return { stitches, tyres };
}

const G = generate();
export const STITCHES = G.stitches;
export const TYRES = G.tyres;
export const tyre = (serial: string) => TYRES.find((t) => t.serial === serial);
export const COOL = TYRES.filter((t) => t.coolCure);
export const BATCH_C1042 = TYRES.filter((t) => t.batches.tread === "C-1042");

/* ---------- counting totals ---------- */

export function counts(machine?: string) {
  const list = machine ? STITCHES.filter((x) => x.machine === machine) : STITCHES;
  const counted = list.filter((x) => x.kind === "counted").length;
  const flagged = list.filter((x) => x.kind === "flagged").length;
  const unattributed = list.filter((x) => x.kind === "unattributed").length;
  return { signals: list.length, counted, flagged, unattributed };
}

export function byHour() {
  const rows: { hour: string; counted: number; flagged: number }[] = [];
  for (let h = 6; h <= 10; h++) {
    const inHour = STITCHES.filter((x) => Math.floor(x.at / 60) === h);
    rows.push({ hour: `${String(h).padStart(2, "0")}:00`, counted: inHour.filter((x) => x.kind !== "flagged").length, flagged: inHour.filter((x) => x.kind === "flagged").length });
  }
  return rows;
}

/* ---------- alerts ---------- */

export type Severity = "high" | "medium" | "low";
export type Alert = { id: string; at: number; severity: Severity; rule: string; title: string; where: string; text: string; report?: boolean; href?: string };

const flag = (machine: string) => STITCHES.find((x) => x.kind === "flagged" && x.machine === machine)!;
const unatt = STITCHES.find((x) => x.kind === "unattributed")!;
const heavyTyre = TYRES.find((t) => t.result === "fail")!;

export const ALERTS: Alert[] = [
  { id: "A-207", at: 9 * 60 + 52, severity: "high", rule: "Cure too cool", title: "P-03 ran below cure temperature", where: "P-03 · mould M-07",
    text: "148 °C against a spec of 155 °C, for more than 10 minutes, across four cure cycles from 09:05.", report: true },
  { id: "A-206", at: flag("BM-04").at, severity: "medium", rule: "Min stitch interval", title: "Stitch too soon on BM-04", where: "BM-04 · A. Bandara",
    text: flag("BM-04").reason!, href: "/demo/count#flags" },
  { id: "A-205", at: heavyTyre.inspectedAt!, severity: "medium", rule: "Weight out of spec", title: `${heavyTyre.serial} failed on weight`, where: `Inspection · ${heavyTyre.serial}`,
    text: heavyTyre.note!, href: `/demo/tyres?serial=${heavyTyre.serial}` },
  { id: "A-204", at: flag("BM-02").at, severity: "low", rule: "Min stitch interval", title: "Stitch too soon on BM-02", where: "BM-02 · S. Fernando",
    text: flag("BM-02").reason!, href: "/demo/count#flags" },
  { id: "A-203", at: 7 * 60 + 23, severity: "low", rule: "Counter heartbeat", title: "BM-05 counter went quiet", where: "BM-05 edge device",
    text: "No heartbeat for 2 min 40 s. It came back at 07:26 and sent the stitches it had stored. No count was lost." },
  { id: "A-202", at: unatt.at, severity: "medium", rule: "No badge at stitch", title: "Unattributed stitch on BM-06", where: "BM-06",
    text: unatt.reason! + " Needs supervisor approval before it is credited.", href: "/demo/count#flags" },
];

/* the investigation report the AI Root-Cause Detective drafted for A-207 */
export const REPORT = {
  alert: "A-207",
  drafted: 9 * 60 + 55,
  summary: "Press P-03 cured eight tyres below the 155 °C limit between 09:05 and 09:59. The low temperature lines up with a drop in P-03's steam supply pressure, which started at 09:02. The tyres' compound batches, the mould and the operator were the same as on presses that cured normally.",
  cause: "Low steam supply pressure to P-03",
  confidence: "Medium",
  why: "P-03's steam pressure fell from 14.8 to 12.9 bar at 09:02 and stayed low until 09:58. No other press on the same header dropped.",
  evidence: [
    "Cure records for all 8 tyres show a peak between 147 °C and 149 °C. P-03's normal peak this week is 160 °C to 162 °C.",
    "P-03 steam pressure log: 14.8 bar until 09:02, then 12.6 to 13.0 bar until 09:58.",
    "P-01, P-02 and P-04 cured tyres from the same compound batches at 160 °C to 162 °C in the same hour.",
    "Mould M-07 was not changed today. Its last change was on 6 Nov.",
  ],
  records: ["P-03 cure log 09:05–09:59", "P-03 steam pressure log", "Mould record M-07", ...["GT-2611-0427"], "Cure records of 7 other tyres", "P-01, P-02, P-04 cure logs 09:00–10:00", "Compound batches C-1039, C-1042, C-1044"],
  checked: 14,
  ruledOut: [
    "Compound batch: the same batches cured normally in P-01, P-02 and P-04.",
    "Mould M-07: no change, and its earlier cycles today were normal.",
    "Operator: the same press operator loaded P-02, which cured normally.",
  ],
  actions: [
    "Hold the 8 tyres until an engineer decides on them.",
    "Ask maintenance to check the steam supply valve on P-03.",
    "Keep P-03 under watch for the next three cycles.",
  ],
};

/* ---------- rules ---------- */

export type Rule = { id: string; name: string; when: string; limit: string; unit?: string; action: string; severity: Severity; stage: string; on: boolean };
export const RULES: Rule[] = [
  { id: "R-01", name: "Min stitch interval", when: "A stitch comes sooner than the minimum after the last one on the same machine", limit: "15", unit: "min", action: "Flag, don't count", severity: "medium", stage: "Building", on: true },
  { id: "R-02", name: "Counter heartbeat", when: "A counter sends no heartbeat for longer than the limit", limit: "2", unit: "min", action: "Alert supervisor", severity: "low", stage: "Building", on: true },
  { id: "R-03", name: "No badge at stitch", when: "A stitch happens with no badge logged in at the machine", limit: "—", action: "Unattributed, needs approval", severity: "medium", stage: "Building", on: true },
  { id: "R-04", name: "Cure too cool", when: "Press temperature stays below the limit for longer than 10 minutes", limit: "155", unit: "°C", action: "Alert engineer, start investigation", severity: "high", stage: "Curing", on: true },
  { id: "R-05", name: "Weight out of spec", when: "Inspection weight is outside the spec by more than the tolerance", limit: "1.5", unit: "%", action: "Fail and hold for engineer", severity: "medium", stage: "Inspection", on: true },
  { id: "R-06", name: "Expired material", when: "A material lot past its expiry date is scanned into a batch", limit: "—", action: "Block the scan, alert supervisor", severity: "high", stage: "Mixing", on: true },
];

/* ---------- devices ---------- */

export const DEVICES = [
  ...MACHINES.map((m) => ({ id: `CNT-${m.id.slice(3)}`, type: `Counter (${m.signal.toLowerCase()})`, where: m.id, mode: "Read only · heartbeat every minute", status: "Online", beat: `${m.beat} s ago` })),
  ...MACHINES.map((m) => ({ id: `BDG-${m.id.slice(3)}`, type: "Badge reader", where: m.id, mode: "Badge log-in", status: "Online", beat: "—" })),
  ...MACHINES.map((m) => ({ id: `LBL-${m.id.slice(3)}`, type: "Label printer", where: m.id, mode: "Prints only for a counted stitch", status: "Online", beat: "—" })),
  { id: "TAB-C1", type: "Stage scan tablet", where: "Curing, P-01 to P-06", mode: "Scan at press loading", status: "Online", beat: "—" },
  { id: "TAB-C2", type: "Stage scan tablet", where: "Curing, P-07 to P-12", mode: "Scan at press loading", status: "Online", beat: "—" },
  { id: "CUR-03", type: "Cure recorder", where: "P-03", mode: "Read only · temperature and pressure", status: "Online", beat: "—" },
  { id: "TAB-I1", type: "Inspection tablet", where: "Inspection", mode: "Linked to scale and gauges", status: "Online", beat: "—" },
  { id: "SRV-01", type: "Local server", where: "Plant server room", mode: "Production data stays in the plant", status: "Online", beat: "—" },
];

/* ---------- activity ---------- */

export type Event = { at: number; kind: "ok" | "warn" | "bad" | "info"; text: string; href?: string };
export function events(): Event[] {
  const ev: Event[] = [];
  STITCHES.filter((x) => x.at > NOW - 18 && x.kind === "counted").forEach((x) =>
    ev.push({ at: x.at, kind: "ok", text: `${x.serial} stitched on ${x.machine}. Counted and labelled.`, href: `/demo/tyres?serial=${x.serial}` }));
  ALERTS.forEach((a) => ev.push({ at: a.at, kind: a.severity === "high" ? "bad" : "warn", text: `${a.title}.`, href: "/demo/alerts" }));
  return ev.sort((a, b) => b.at - a.at);
}
