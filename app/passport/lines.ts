/* Tyre Passport demo: the two line types. Tyode is one product for both, and each line is set in
   configuration. Both show the whole product, from raw materials to dispatch. The pneumatic line is
   the default story (printed ID label at building, stitch counting); the solid line uses steel band
   IDs. */

import {
  AFFECTED, AFFECTED_TOTAL, BG, ENTRIES, HERO, READINGS, SCENARIOS, SIZE, WALK, rackSlot,
  type Entry, type Scenario, type StationId, type V3, type WalkStep,
} from "./story";

export type LineKind = "pneumatic" | "solid";
export type Affected = { where: string; label: string; ids: string[]; at: V3 };
export type StationText = { records: string; kit: string; callouts?: { at: V3; text: string }[] };

export type LineCfg = {
  kind: LineKind; name: string; short: string; subtitle: string;
  hero: string; heroDesc: string; idNote: string; firstId: number;
  stations: StationId[];
  stationName: Partial<Record<StationId, string>>;
  muted: StationId[];
  mutedNote: Partial<Record<StationId, string>>;
  walk: WalkStep[]; entries: Entry[]; readings: [string, string, string][]; scenarios: Scenario[];
  status: string[]; markStatus: string; markFact: { entry: number; match: string };
  today: Partial<Record<StationId, string>>; kit: Partial<Record<StationId, string>>;
  travel: Record<number, string>;
  info: Partial<Record<StationId, StationText>>;
  layers: { names: string[]; batches: string[] };
  inspectStep: number; checks: [V3, string][];
  affected: Affected[]; affectedTotal: number;
  affIds: string[] | null; affInspect: boolean; affPress: boolean;
  arcFrom: V3; arcTo: V3[]; markSource: { at: V3; text: string };
  routeFrom: number; netFrom: number[];
  cure: { peak: string; dur: string; cool: boolean };
  mixBatch: string;
  intro: string[]; introNote: string;
};

/* ---------- the pneumatic line ---------- */

const P_HERO = "GT-2611-0427";

const P_WALK: WalkStep[] = [
  { station: null, clock: "Mon 06:00", title: "Follow one pneumatic tyre",
    body: "This is line PL-1, a pneumatic tyre line. Follow one tyre from its raw materials to the dispatch gate, and watch its passport fill in, one scan at a time. Then use the passport on real problems.",
    action: "Start" },
  { station: "receive", clock: "Mon 06:10", title: "Raw material arrives",
    body: "A pallet of natural rubber is delivered. The storekeeper scans the supplier's own label, so nothing is typed.",
    action: "Scan the delivery", result: "Lot NR-8841 is recorded with its supplier and expiry date." },
  { station: "mix", clock: "Tue 14:05", title: "Mixed into a compound batch",
    body: "Each lot is scanned as it goes into the mixer. Tyode checks it is the right material and still in date, then links the new batch to the lots it was made from.",
    action: "Scan and mix", result: "Tread batch C-1042 is tagged and linked to its three lots." },
  { station: "build", clock: "Wed 08:12", title: "Built, counted and labelled",
    body: "The builder taps a staff card at the sign-in point and builds the green tyre on the tyre building machine, from liner, ply, beads, sidewalls, belts and tread. Tyode counts it from the machine itself and prints its ID label. Until now the tyre had no ID.",
    action: "Build the tyre", result: `${P_HERO} is counted for K. Perera and labelled. Its batches are linked to it.` },
  { station: "cure", clock: "Wed 09:05", title: "Scanned into the press",
    body: "The green tyre goes into a bladder press, which shapes and cures it from inside in about 13 minutes. The label is scanned at loading, so the press, mould and cure cycle are linked to it. Tyode only reads the press.",
    action: "Scan it and close the press", result: "Press P-03, mould M-07. The cure peaked at 149 °C, under the 155 °C limit, so it is marked unusual." },
  { station: "inspect", clock: "Wed 09:41", title: "Inspected against the spec",
    body: "The inspector scans the tyre. Weight, outer diameter and section width come straight from the plant's instruments and are checked against the spec, with a visual checklist set for this line.",
    action: "Scan and inspect", result: "All three readings are within spec and the checklist is complete: PASS. The unusual cure was shown to the inspector too." },
  { station: "store", clock: "Wed 09:50", title: "Released to storage",
    body: "A tyre within spec is released to the next stage set for this line, here storage. A tyre outside spec would be held for an engineer to review instead.",
    action: "Put it away", result: `${P_HERO} is in rack B, level 2. Anyone can find it from now on.` },
  { station: "dispatch", clock: "Fri 08:30", title: "Checked out at the gate",
    body: "Two days later the tyre is picked for a customer order. At the gate it is scanned against the order, and a tyre on hold cannot pass.",
    action: "Scan and load", result: "Loaded on order DO-5182. The delivery note was made from the scans." },
  { station: null, clock: "Fri 08:40", title: "One tyre, one record",
    body: "From raw material to the customer, in seven scans and one stitch signal, with nothing typed by hand. Each line chooses its stages in configuration.",
    action: "Use the passport" },
];

const P_ENTRIES: Entry[] = [
  { n: 1, station: "receive", when: "Mon 06:10", title: "Material received", pin: "Rubber lot NR-8841, in date",
    facts: [["Natural rubber", "Lot NR-8841"], ["Expiry", "14 Mar 2027"], ["Received by", "Badge 3310"]] },
  { n: 2, station: "mix", when: "Tue 14:05", title: "Compound batch mixed", pin: "Batch C-1042 from 3 lots",
    facts: [["Batch", "C-1042, tread compound"], ["Made from lots", "NR-8841, CB-2207, SU-0934"], ["Material check", "In date, correct recipe"]] },
  { n: 3, station: "build", when: "Wed 08:12", title: "Built, counted and labelled", pin: "BM-01, counted, labelled",
    facts: [["Machine", "BM-01, line PL-1"], ["Builder", "K. Perera, badge 1042"], ["Stitch", "08:12, count verified"], ["Batches", "Tread C-1042, sidewall C-1044, liner C-1039"]] },
  { n: 4, station: "cure", when: "Wed 09:05", title: "Cured", pin: "P-03, mould M-07", extra: "cure",
    facts: [["Press and mould", "P-03, mould M-07"], ["Cure", "13 min, peak 149 °C"], ["Against limit", "Below 155 °C: unusual"]] },
  { n: 5, station: "inspect", when: "Wed 09:41", title: "Inspected", pin: "Passed, unusual cure noted", extra: "inspect",
    facts: [["Decision", "PASS, N. Silva, badge 4102"]] },
  { n: 6, station: "store", when: "Wed 09:50", title: "Stored", pin: "Rack B, level 2",
    facts: [["Location", "Storage WH-1, rack B, level 2"], ["Released by", "Inspection PASS"]] },
  { n: 7, station: "dispatch", when: "Fri 08:30", title: "Shipped", pin: "Order DO-5182",
    facts: [["Customer order", "DO-5182"], ["Delivery note", "DN-2297"], ["Hold check", "Not on hold"]] },
];

const P_SCENARIOS: Scenario[] = [
  { key: "cool", clock: "Wed 09:52", title: "Press P-03 ran too cool",
    body: "The rule \"Cure too cool\" fires: P-03 has been below 155 °C for more than 10 minutes. Which tyres are affected, and what happens next?",
    steps: [
      { action: "Find the affected tyres", result: "8 tyres were cured in P-03 below 155 °C. Each one is shown where it is now." },
      { action: "Let the Detective investigate", result: "The Root-Cause Detective drafted a report: likely cause low steam pressure to P-03, confidence medium. All 14 records it cites were checked and exist." },
      { action: "Approve and place the hold", result: "P. Silva approved the report, so all 8 tyres are ON HOLD. The Detective drafts, a person decides, and both are logged." },
      { action: "Scan a held tyre at the next stage", result: "Blocked. GT-2611-0440 is on hold, so the storage scan refuses it and the supervisor is alerted." },
    ] },
  { key: "soon", clock: "Wed 10:35", title: "A stitch comes too soon",
    body: "The stitcher runs again six minutes after the last tyre, to push the count up.",
    steps: [{ action: "Run the stitcher again", result: "Flagged, not counted. A tyre can't be built in 6 minutes, and the minimum build time for this tyre size is 15 minutes. The flag goes to the supervisor." }] },
  { key: "claim", clock: "Months later", title: "A customer returns a tyre",
    body: `A customer sends back ${P_HERO} with a complaint. What happened to this tyre?`,
    steps: [{ action: "Scan the returned tyre", result: "Its whole history on one page: who built it and when, its compound batches, the press, mould and cure, its inspection readings, and the unusual cure flagged at the time." }] },
  SCENARIOS.find((x) => x.key === "offline")!,
];

const RACK_A = [39, 53, 14] as V3, RACK_B = [43, 64, 14] as V3, TABLE = [77.5, 65.5, 3] as V3;
const P_AFFECTED: Affected[] = [
  { where: "rackA", label: "In storage, rack A", ids: ["GT-2611-0426", "GT-2611-0429", "GT-2611-0431"], at: RACK_A },
  { where: "rackB", label: "In storage, rack B", ids: [P_HERO, "GT-2611-0433", "GT-2611-0436", "GT-2611-0438"], at: RACK_B },
  { where: "inspect", label: "Waiting for inspection", ids: ["GT-2611-0440"], at: TABLE },
];

export const PNEUMATIC: LineCfg = {
  kind: "pneumatic", name: "Line PL-1 · pneumatic", short: "Pneumatic line",
  subtitle: "Every pneumatic tyre, from raw material to customer, in one record.",
  hero: P_HERO, heroDesc: "Pneumatic tyre, 185/65 R15 · line PL-1", idNote: "Created when the label prints", firstId: 3,
  stations: ["receive", "mix", "build", "cure", "inspect", "store", "dispatch"],
  stationName: { receive: "Receiving", mix: "Mixing", build: "Building", cure: "Curing", inspect: "Inspection", store: "Storage", dispatch: "Dispatch" },
  muted: ["band"],
  mutedNote: { band: "Band ID · solid lines only" },
  walk: P_WALK, entries: P_ENTRIES,
  readings: [["Weight", "8.62 kg", "8.37 to 8.63"], ["Outer diameter", "621 mm", "618 to 624"], ["Section width", "187 mm", "182 to 188"], ["Visual checklist", "4 of 4", "Set for PL-1"]],
  scenarios: P_SCENARIOS,
  status: ["No tyre yet", "Material recorded", "Batch recorded", "Built and labelled", "Cured", "Passed", "In storage", "Shipped"],
  markStatus: "Cured below 155 °C", markFact: { entry: 4, match: "149" },
  today: {
    receive: "Delivery logbook", mix: "Batch sheet", build: "Green tyres tallied by hand", cure: "Press log",
    inspect: "Inspection form", store: "Stock card", dispatch: "Packing list",
  },
  kit: {
    receive: "Handheld scanner", mix: "Scanner + tag printer", build: "Stitch counter, sign-in point, label printer", cure: "Scan tablet + cure recorder",
    inspect: "Tablet + instrument link", store: "Handheld scanner", dispatch: "Gate scanner",
  },
  travel: {
    1: "First stop: the receiving dock.",
    2: "The pallet is taken to the mixing room.",
    3: "The tread batch is wheeled over to building machine BM-01.",
    4: "The green tyre goes to the presses.",
    5: "The press opens, and the cured tyre goes to inspection.",
    6: "It passed, so it is released to storage.",
    7: "Two days later it is picked for a customer order.",
  },
  info: {
    build: { records: "Who built it (staff card), the count from the machine (its PLC build sequence, or the auto-stitch cycle on machines without one), the minimum build time, and the component batches. A label prints only for a counted tyre.",
      kit: "A counter on the machine, a shared sign-in point and a label printer. Read only, nothing is wired to the machine controls.",
      callouts: [{ at: [106.7, 19.2, 7.6], text: "Stitch counter" }, { at: [91, 15, 11], text: "Component servicer" }, { at: [104.6, 15, 8.8], text: "Bead rings" }, { at: [113.2, 21.4, 9], text: "Sign-in point" }, { at: [111.8, 16.6, 7.4], text: "Label printer" }] },
    cure: { records: "The press, mould and cure cycle for each tyre, from the scan at loading, and the temperature against the line's limit. A pneumatic tyre cures in minutes, so there is no core cure estimate: that is for thick solid tyres.",
      kit: "A stage scan tablet at loading and a clip-on cure recorder.",
      callouts: [{ at: [108.1, 56.3, 6.3], text: "Cure recorder, read only" }, { at: [100.2, 62.2, 7.4], text: "Loading scanner" }, { at: [102.5, 56, 13.2], text: "Bladder press P-03 · M-07" }] },
    inspect: { records: "Weight, outer diameter and section width against the spec, and a visual checklist set for the line. Pass or fail.",
      kit: "An inspection tablet linked to the plant's scale and gauges.",
      callouts: [{ at: [64.2, 66.3, 4.6], text: "Scale" }, { at: [73.3, 60.3, 7.2], text: "Tablet" }, { at: [71.3, 54.8, 3.9], text: "Gauges" }, { at: [66.8, 54, 11.2], text: "Visual inspection stand" }] },
    dispatch: { records: "Each tyre scanned against the customer order at the gate. A tyre on hold cannot pass, and the delivery note is made from the scans.",
      kit: "A gate scanner.",
      callouts: [{ at: [13.5, 65.5, 7.7], text: "Gate scanner" }, { at: [6.5, 58, 8.2], text: "Order DO-5182" }] },
    store: { records: "The next stage set for this line. Here, the rack each tyre is stored in, so it can be found and held where it stands.",
      kit: "A handheld scanner." },
  },
  layers: { names: ["", "Liner and ply", "Beads and sidewalls", "Belts and tread"], batches: ["", "C-1039", "C-1044", "C-1042"] },
  inspectStep: 5,
  checks: [[[64.2, 66.3, 4.6], "8.62 kg"], [[71.3, 54.8, 3.9], "621 × 187 mm"], [[66.5, 55.5, 6.2], "Checklist 4 of 4"]],
  affected: P_AFFECTED, affectedTotal: 8,
  affIds: ["ST-0431", "ST-0432", "ST-0436", "ST-0448", "ST-0449", "ST-0463"], affInspect: true, affPress: false,
  arcFrom: [102.5, 56, 11], arcTo: [RACK_A, RACK_B, TABLE], markSource: { at: [102.5, 56, 13], text: "P-03 · 148 °C" },
  routeFrom: 0, netFrom: [0, 1, 3, 4, 5, 6, 7],
  cure: { peak: "Peak 149 °C", dur: "13 min", cool: true },
  mixBatch: "Batch C-1042",
  intro: [
    "Today, each stage keeps its own records: delivery logs, batch sheets, green tyres tallied by hand.",
    "So a count can be off, and tracing one tyre means searching every sheet by hand.",
    "Tyode counts each green tyre from the building machine itself, and puts a simple scanner at each stage.",
    "Every scan goes to one server, kept inside the plant.",
    "And each tyre gets one complete record, its passport.",
    "Let's follow one tyre on line PL-1.",
  ],
  introNote: "First, how a pneumatic line is recorded today, and what changes when Tyode is installed. Then we follow one tyre.",
};

/* ---------- the solid line (the full product, as before) ---------- */

export const SOLID: LineCfg = {
  kind: "solid", name: "Solid tyre line", short: "Solid line",
  subtitle: "Every solid tyre, from raw material to customer, in one record.",
  hero: HERO, heroDesc: `Solid tyre, ${SIZE}`, idNote: "Created when the band is marked", firstId: 3,
  stations: ["receive", "mix", "band", "build", "cure", "inspect", "store", "dispatch"],
  stationName: {}, muted: [], mutedNote: {},
  walk: WALK, entries: ENTRIES, readings: READINGS, scenarios: SCENARIOS,
  status: ["No tyre yet", "Material recorded", "Batch recorded", "ID created", "Built", "Cured", "Passed", "In store", "Shipped"],
  markStatus: "Contains B-3112", markFact: { entry: 4, match: "B-3112" },
  today: {
    receive: "Delivery logbook", mix: "Batch sheet", band: "Number written by hand", build: "Build sheet",
    cure: "Press log", inspect: "Inspection form", store: "Stock card", dispatch: "Packing list",
  },
  kit: {
    receive: "Handheld scanner", mix: "Scanner + tag printer", band: "Band marker", build: "Fixed scanner",
    cure: "Scanner + cure recorder", inspect: "Tablet + instrument link", store: "Handheld scanner", dispatch: "Gate scanner",
  },
  travel: {
    1: "First stop: the receiving dock.",
    2: "The pallet is taken to the mixing room.",
    3: "Next door, a tyre is about to get its identity.",
    4: "The marked band goes to the build machine, and the cushion batch is wheeled over from mixing.",
    5: "The freshly built tyre goes to the presses.",
    6: "The press opens, and the cured tyre goes to inspection.",
    7: "It passed, so it goes to the store.",
    8: "Two days later it is picked for a customer order.",
  },
  info: {},
  layers: { names: ["", "Base", "Cushion", "Tread"], batches: ["", "B-3107", "B-3112", "B-3118"] },
  inspectStep: 6,
  checks: [[[64.2, 66.3, 4.6], "38.6 kg"], [[71.3, 54.8, 3.9], "533 × 178 mm"], [[66.5, 55.5, 6.2], "No flaw found"]],
  affected: AFFECTED, affectedTotal: AFFECTED_TOTAL,
  affIds: null, affInspect: true, affPress: true,
  arcFrom: [59.5, 22, 3], arcTo: AFFECTED.map((a) => a.at), markSource: { at: [59.6, 22, 5.6], text: "Batch B-3112" },
  routeFrom: 0, netFrom: [0, 1, 2, 3, 4, 5, 6, 7],
  cure: { peak: "2 h 40 min", dur: "Usual range", cool: false },
  mixBatch: "Batch B-3112",
  intro: [
    "Today, every station keeps its own records: logbooks, sheets, numbers written by hand.",
    "So when a batch is bad or a customer complains, someone has to search them all by hand.",
    "Tyode puts a simple scanner at each station instead.",
    "Every scan goes to one server, kept inside the plant.",
    "And each tyre gets one complete record, its passport.",
    "Let's follow one tyre through the line.",
  ],
  introNote: "First, how records are kept on most lines today, and what changes when Tyode is installed. Then we follow one tyre.",
};

export const LINES: Record<LineKind, LineCfg> = { pneumatic: PNEUMATIC, solid: SOLID };

/* where the affected tyres sit, kept here so the scene and the page agree */
export const HELD_SLOT = rackSlot("B", 1, 3);
export const BG_IDS = BG.map((b) => b.id);
