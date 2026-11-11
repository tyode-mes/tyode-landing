/* Simulated data for the Tyode counting demo: one morning shift in a green tyre building and
   curing area. Deterministic, so every visitor sees the same plant. All records are sample data. */

export const NOW = 10 * 60 + 42; // 10:42, minutes since midnight
export const SHIFT_START = 6 * 60;
export const WINDOW = 20; // a counted tyre must reach a press within 20 minutes

export const hhmm = (m: number) => `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(Math.round(m) % 60).padStart(2, "0")}`;

export type Builder = { badge: string; name: string; machine: string };
export type Machine = { id: string; size: string; cycle: number; status: "running" | "idle" | "alert" };
export type Press = { id: string; status: "curing" | "loading" | "idle" };
export type TyreStatus = "loaded" | "waiting" | "missing" | "found";
export type Tyre = {
  serial: string; machine: string; badge: string; size: string; builtAt: number;
  status: TyreStatus; press?: string; loadedAt?: number; cart?: string; note?: string;
};
export type Flag = {
  id: string; at: number; kind: "empty-cycle" | "sensor-no-cycle" | "duplicate-scan" | "label-request";
  where: string; badge?: string; serial?: string; text: string;
};

export const MACHINES: Machine[] = [
  { id: "BM-01", size: "185/65 R15", cycle: 4.6, status: "running" },
  { id: "BM-02", size: "185/65 R15", cycle: 4.9, status: "running" },
  { id: "BM-03", size: "195/55 R16", cycle: 5.2, status: "running" },
  { id: "BM-04", size: "195/55 R16", cycle: 5.0, status: "alert" },
  { id: "BM-05", size: "205/60 R16", cycle: 5.6, status: "running" },
  { id: "BM-06", size: "205/60 R16", cycle: 5.4, status: "idle" },
];

export const BUILDERS: Builder[] = [
  { badge: "1042", name: "N. Perera", machine: "BM-01" },
  { badge: "1187", name: "S. Fernando", machine: "BM-02" },
  { badge: "1093", name: "R. Silva", machine: "BM-03" },
  { badge: "1215", name: "A. Bandara", machine: "BM-04" },
  { badge: "1068", name: "M. Jayasinghe", machine: "BM-05" },
  { badge: "1130", name: "D. Wickramasinghe", machine: "BM-06" },
];
export const builderFor = (machine: string) => BUILDERS.find((b) => b.machine === machine)!;
export const builderByBadge = (badge: string) => BUILDERS.find((b) => b.badge === badge)!;

export const PRESSES: Press[] = Array.from({ length: 12 }, (_, i) => ({
  id: `P-${String(i + 1).padStart(2, "0")}`,
  status: i === 6 ? "loading" : i === 11 ? "idle" : "curing",
}));

/* seeded random */
let seed = 26111;
const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };

function generate() {
  seed = 26111;
  const tyres: Tyre[] = [];
  let n = 0;
  for (const m of MACHINES) {
    let t = SHIFT_START + 6 + rnd() * 4;
    const stopAt = m.id === "BM-06" ? 10 * 60 + 5 : NOW; // BM-06 stopped for a size change
    while (t < stopAt) {
      tyres.push({ serial: "", machine: m.id, badge: builderFor(m.id).badge, size: m.size, builtAt: t, status: "waiting" });
      t += m.cycle * (0.88 + rnd() * 0.24);
    }
  }
  tyres.sort((a, b) => a.builtAt - b.builtAt);
  tyres.forEach((t) => { t.serial = `GT-2611-${String(++n).padStart(4, "0")}`; });

  /* press loading: rest 6 to 18 minutes on a cart, presses taken in turn */
  let pi = 0;
  for (const t of tyres) {
    const load = t.builtAt + 6 + rnd() * 12;
    t.cart = `Cart ${"AABBCC"[MACHINES.findIndex((m) => m.id === t.machine)]}`;
    if (load < NOW - 1) {
      t.status = "loaded";
      t.loadedAt = load;
      t.press = PRESSES[pi++ % 11].id; // P-12 is idle
    }
  }

  /* two tyres counted but never loaded, one found later */
  const pick = (machine: string, near: number) =>
    tyres.filter((t) => t.machine === machine).reduce((a, b) => (Math.abs(b.builtAt - near) < Math.abs(a.builtAt - near) ? b : a));
  const m1 = pick("BM-03", 8 * 60 + 14);
  Object.assign(m1, { status: "missing", press: undefined, loadedAt: undefined });
  const m2 = pick("BM-05", 9 * 60 + 51);
  Object.assign(m2, { status: "missing", press: undefined, loadedAt: undefined });
  const f1 = pick("BM-01", 7 * 60 + 40);
  Object.assign(f1, { status: "found", note: "Found on Cart A, behind the bead stock rack, at 08:16, then loaded into P-04 at 08:22.", press: "P-04", loadedAt: 8 * 60 + 22 });

  return tyres;
}

export const TYRES: Tyre[] = generate();

export const FLAGS: Flag[] = [
  { id: "F-118", at: 7 * 60 + 12, kind: "sensor-no-cycle", where: "BM-02", badge: "1187",
    text: "Unload sensor triggered with no build cycle. Not counted. Camera clip kept." },
  { id: "F-121", at: 9 * 60 + 5, kind: "duplicate-scan", where: "P-07",
    serial: TYRES.find((t) => t.press === "P-07" && (t.loadedAt ?? 0) < 9 * 60)?.serial,
    text: "Label scanned a second time at press loading. Rejected, already loaded." },
  { id: "F-124", at: 10 * 60 + 31, kind: "empty-cycle", where: "BM-04", badge: "1215",
    text: "Build cycle completed but no tyre seen at the unload point. Not counted." },
];

export const flagLabel: Record<Flag["kind"], string> = {
  "empty-cycle": "Cycle with no tyre",
  "sensor-no-cycle": "Sensor with no cycle",
  "duplicate-scan": "Duplicate press scan",
  "label-request": "Label request refused",
};

/* totals */
export function totals(list = TYRES) {
  const built = list.length;
  const loaded = list.filter((t) => t.status === "loaded" || t.status === "found").length;
  const missing = list.filter((t) => t.status === "missing").length;
  const waiting = list.filter((t) => t.status === "waiting").length;
  return { built, loaded, missing, waiting };
}

export function byHour() {
  const rows: { hour: string; built: number; loaded: number }[] = [];
  for (let h = 6; h <= 10; h++) {
    rows.push({
      hour: `${String(h).padStart(2, "0")}:00`,
      built: TYRES.filter((t) => Math.floor(t.builtAt / 60) === h).length,
      loaded: TYRES.filter((t) => t.loadedAt !== undefined && Math.floor(t.loadedAt / 60) === h).length,
    });
  }
  return rows;
}

export type Event = { at: number; kind: "ok" | "warn" | "bad" | "info"; text: string; href?: string };
export function events(): Event[] {
  const ev: Event[] = [];
  const recent = TYRES.filter((t) => t.builtAt > NOW - 16).slice(-5);
  recent.forEach((t) => ev.push({ at: t.builtAt, kind: "ok", text: `${t.serial} built on ${t.machine}, counted and labelled.`, href: `/demo/tyres?serial=${t.serial}` }));
  TYRES.filter((t) => (t.loadedAt ?? 0) > NOW - 10).slice(-4).forEach((t) =>
    ev.push({ at: t.loadedAt!, kind: "ok", text: `${t.serial} scanned into ${t.press}. Matches its build on ${t.machine}.`, href: `/demo/tyres?serial=${t.serial}` }));
  FLAGS.forEach((f) => ev.push({ at: f.at, kind: "warn", text: `${f.where}: ${flagLabel[f.kind].toLowerCase()}. ${f.text}`, href: "/demo/alerts" }));
  TYRES.filter((t) => t.status === "missing").forEach((t) =>
    ev.push({ at: t.builtAt + WINDOW, kind: "bad", text: `${t.serial} not loaded within ${WINDOW} minutes of its build on ${t.machine}. Listed as missing.`, href: "/demo/missing" }));
  return ev.sort((a, b) => b.at - a.at);
}

export const DEVICES = [
  ...MACHINES.map((m) => ({ id: `SIG-${m.id.slice(3)}`, type: "Cycle signal reader", where: m.id, mode: "Read only", status: m.id === "BM-06" ? "Idle" : "Online" })),
  ...MACHINES.map((m) => ({ id: `UNL-${m.id.slice(3)}`, type: "Unload sensor and camera", where: m.id, mode: "Sensor + 8 s clip", status: m.id === "BM-06" ? "Idle" : "Online" })),
  ...MACHINES.map((m) => ({ id: `LBL-${m.id.slice(3)}`, type: "Label printer", where: m.id, mode: "Prints on confirmed build only", status: m.id === "BM-06" ? "Idle" : "Online" })),
  ...PRESSES.map((p) => ({ id: `SCN-${p.id.slice(2)}`, type: "Press loading scanner", where: p.id, mode: "One scan per label", status: p.id === "P-12" ? "Idle" : "Online" })),
  { id: "SRV-01", type: "Local server", where: "Server room", mode: "Data stays in the plant", status: "Online" },
];
