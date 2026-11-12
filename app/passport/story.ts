/* Tyre Passport demo: the story, the sample records and where everything stands on the floor.
   All records are sample data. Floor positions are in floor units (see scene.tsx). */

export type V3 = [number, number, number];
export type StationId = "receive" | "mix" | "band" | "build" | "cure" | "inspect" | "store" | "dispatch";

export const HERO = "ST-0457";
export const SIZE = "21 × 7 × 15 press-on";

/* ---------- stations ---------- */

export type Station = {
  id: StationId; n: number; name: string; short: string;
  o: [number, number];          // floor origin of the station
  c: [number, number];          // camera centre on the floor
  span: number;                 // drawing width the camera shows when zoomed in
  pill: V3;                     // where its name tag sits
  node: [number, number];       // its stop on the route line
  records: string; kit: string;
  callouts: { at: V3; text: string }[];
};

export const STATIONS: Station[] = [
  {
    id: "receive", n: 1, name: "Receiving", short: "Receive", o: [6, 6], c: [17, 17], span: 422, pill: [15, 11, 9], node: [17, 33],
    records: "Supplier, lot number and expiry date of every material, from one scan of the supplier's label.",
    kit: "A handheld 2D scanner and a tablet.",
    callouts: [{ at: [17.5, 22.5, 4.4], text: "Handheld scanner" }, { at: [20.5, 19, 5.2], text: "Tablet" }, { at: [9, 9, 4.2], text: "Materials in stock" }],
  },
  {
    id: "mix", n: 2, name: "Mixing", short: "Mix", o: [36, 6], c: [48, 17], span: 474, pill: [48, 12, 18], node: [48, 33],
    records: "Which material lots went into each compound batch. Expired or wrong material is stopped at the scan.",
    kit: "A handheld scanner and a label printer for batch tags.",
    callouts: [{ at: [48, 12, 16.4], text: "Mixer" }, { at: [51, 22, 6.2], text: "Mill" }, { at: [58.6, 14.6, 4.5], text: "Batch tag printer" }],
  },
  {
    id: "band", n: 3, name: "Band ID", short: "Band ID", o: [66, 8], c: [73, 16], span: 384, pill: [73, 12, 12], node: [74, 33],
    records: "A permanent code on the steel band, on a face the rubber never covers. It is the tyre's ID for life.",
    kit: "A laser marker, or a printer with heat-resistant labels. The method is confirmed in a trial through the press.",
    callouts: [{ at: [72.5, 12.4, 9.3], text: "Laser marker" }, { at: [70.5, 20.5, 5.2], text: "Unmarked bands" }],
  },
  {
    id: "build", n: 4, name: "Building", short: "Build", o: [90, 6], c: [102, 17], span: 499, pill: [101, 10, 14], node: [102, 33],
    records: "The band, the batch in each layer, the machine, the builder and the shift. The band is read automatically.",
    kit: "A fixed scanner at the build machine.",
    callouts: [{ at: [106.7, 19.2, 7.6], text: "Fixed scanner" }, { at: [95, 25, 3.4], text: "Base" }, { at: [100, 25, 3.4], text: "Cushion" }, { at: [105, 25, 3.4], text: "Tread" }],
  },
  {
    id: "cure", n: 5, name: "Curing", short: "Cure", o: [86, 48], c: [104, 57], span: 525, pill: [103, 54, 17], node: [104, 42.5],
    records: "The press and mould for each tyre, and the temperature of the whole cure. Read only, never connected to press controls.",
    kit: "A fixed scanner at loading and a clip-on temperature recorder on each press.",
    callouts: [{ at: [108.1, 56.3, 6.3], text: "Cure recorder, read only" }, { at: [100.2, 62.2, 7.4], text: "Loading scanner" }],
  },
  {
    id: "inspect", n: 6, name: "Inspection", short: "Inspect", o: [62, 50], c: [70, 60], span: 422, pill: [70, 55, 10], node: [70, 42.5],
    records: "Weight, dimensions and the ultrasound trace, taken straight from the plant's own instruments and checked against the spec.",
    kit: "A tablet, a link to the scale and gauges, and a capture device on the ultrasound screen.",
    callouts: [{ at: [66.5, 56.5, 6.2], text: "Ultrasound, existing" }, { at: [64.2, 66.3, 4.6], text: "Scale" }, { at: [73.3, 60.3, 7.2], text: "Tablet" }],
  },
  {
    id: "store", n: 7, name: "Storage", short: "Store", o: [30, 48], c: [43, 60], span: 499, pill: [43, 53, 16], node: [43, 42.5],
    records: "The rack and level of every tyre, so any tyre can be found, and held, where it stands.",
    kit: "A handheld scanner.",
    callouts: [{ at: [33, 53, 14.4], text: "Rack A" }, { at: [33, 64, 14.4], text: "Rack B" }],
  },
  {
    id: "dispatch", n: 8, name: "Dispatch", short: "Dispatch", o: [4, 48], c: [15, 61], span: 499, pill: [13, 58, 12], node: [15, 42.5],
    records: "The customer order each tyre left on. A tyre on hold is stopped at this scan. The delivery note comes from the scans.",
    kit: "A handheld scanner and the office printer.",
    callouts: [{ at: [13.5, 65.5, 7.7], text: "Gate scanner" }, { at: [6.5, 58, 8.2], text: "Order EX-4471" }],
  },
];
export const station = (id: StationId) => STATIONS.find((s) => s.id === id)!;

export const SERVER: V3 = [61.5, 38, 7];

/* ---------- where things stand ---------- */

export const PRESS_X = [87, 98, 109];
export const PRESS_Y = 52;
export const mould = (i: number): V3 => [PRESS_X[i] + 4.5, PRESS_Y + 4, 4.2];
export const RACK_Y = { A: 51, B: 62 } as const;
export const rackSlot = (rack: "A" | "B", level: 0 | 1, i: number): V3 => [33.2 + i * 3.4, RACK_Y[rack] + 2, (level ? 7.6 : 1) + 2.7];
export const truckSlot = (stack: number, level: number): V3 => [12.5 + stack * 4, 58, 2.4 + level * 1.8];

export const AT = {
  lotDock: [10, 17, 0] as V3,
  lotMixer: [35, 20, 0] as V3,
  batchMixer: [57.6, 20, 0] as V3,
  batchBuild: [98, 23, 0] as V3,
  bench: [72.5, 13.4, 3.4] as V3,
  drum: [101, 15, 6] as V3,
  press: mould(1),
  scale: [67.5, 62.5, 0.6] as V3,
  rack: rackSlot("B", 1, 3),
  stage: [21, 68, 0.5] as V3,
  truck: truckSlot(2, 1),
};

/* ---------- the rest of the plant: sample tyres already on the floor ---------- */

export type Where = "build" | "press" | "inspect" | "rackA" | "rackB" | "truck" | "delivered";
export type BgTyre = { id: string; affected: boolean; where: Where; pos?: V3 };

/* affected = contains cushion batch B-3112 */
export const BG: BgTyre[] = [
  // rack A
  { id: "ST-0431", affected: false, where: "rackA", pos: rackSlot("A", 0, 0) },
  { id: "ST-0432", affected: false, where: "rackA", pos: rackSlot("A", 0, 1) },
  { id: "ST-0436", affected: false, where: "rackA", pos: rackSlot("A", 0, 2) },
  { id: "ST-0438", affected: false, where: "rackA", pos: rackSlot("A", 0, 4) },
  { id: "ST-0441", affected: false, where: "rackA", pos: rackSlot("A", 0, 5) },
  { id: "ST-0444", affected: false, where: "rackA", pos: rackSlot("A", 1, 0) },
  { id: "ST-0459", affected: true, where: "rackA", pos: rackSlot("A", 1, 1) },
  { id: "ST-0460", affected: true, where: "rackA", pos: rackSlot("A", 1, 2) },
  { id: "ST-0447", affected: false, where: "rackA", pos: rackSlot("A", 1, 4) },
  // rack B
  { id: "ST-0448", affected: false, where: "rackB", pos: rackSlot("B", 0, 0) },
  { id: "ST-0449", affected: false, where: "rackB", pos: rackSlot("B", 0, 1) },
  { id: "ST-0461", affected: true, where: "rackB", pos: rackSlot("B", 0, 3) },
  { id: "ST-0462", affected: true, where: "rackB", pos: rackSlot("B", 0, 4) },
  { id: "ST-0450", affected: false, where: "rackB", pos: rackSlot("B", 0, 5) },
  { id: "ST-0463", affected: true, where: "rackB", pos: rackSlot("B", 1, 0) },
  { id: "ST-0451", affected: false, where: "rackB", pos: rackSlot("B", 1, 1) },
  // on the truck, order EX-4471
  { id: "ST-0445", affected: false, where: "truck", pos: truckSlot(0, 0) },
  { id: "ST-0446", affected: false, where: "truck", pos: truckSlot(0, 1) },
  { id: "ST-0458", affected: true, where: "truck", pos: truckSlot(1, 0) },
  { id: "ST-0464", affected: true, where: "truck", pos: truckSlot(1, 1) },
  { id: "ST-0452", affected: false, where: "truck", pos: truckSlot(2, 0) },
];

/* what the batch search finds, by place. The followed tyre is one of them. */
export const AFFECTED: { where: Where; label: string; ids: string[]; at: V3 }[] = [
  { where: "build", label: "On the build machine", ids: ["ST-0471"], at: [101, 15, 10] },
  { where: "press", label: "In presses P-02 and P-03", ids: ["ST-0468", "ST-0469"], at: [108, 56, 15.5] },
  { where: "inspect", label: "Waiting at inspection", ids: ["ST-0465"], at: [77.5, 65.5, 3] },
  { where: "rackA", label: "In store, rack A", ids: ["ST-0459", "ST-0460"], at: [39, 53, 14] },
  { where: "rackB", label: "In store, rack B", ids: ["ST-0461", "ST-0462", "ST-0463"], at: [43, 64, 14] },
  { where: "truck", label: "On the truck at the gate, order EX-4471", ids: [HERO, "ST-0458", "ST-0464"], at: [17.5, 58, 7] },
  { where: "delivered", label: "Already delivered, order EX-4466, Dubai", ids: ["ST-0453", "ST-0454"], at: [-3, 70, 0] },
];
export const AFFECTED_TOTAL = AFFECTED.reduce((n, a) => n + a.ids.length, 0);
export const AFFECTED_IN_PLANT = AFFECTED_TOTAL - 2;

/* ---------- the passport of the followed tyre ---------- */

export type Entry = { n: number; station: StationId; when: string; title: string; facts: [string, string][]; extra?: "cure" | "inspect"; pin: string };

export const ENTRIES: Entry[] = [
  { n: 1, station: "receive", when: "Mon 06:10", title: "Material received", pin: "Rubber lot NR-8841, in date",
    facts: [["Natural rubber", "Lot NR-8841"], ["Expiry", "14 Mar 2027"], ["Received by", "Badge 3310"]] },
  { n: 2, station: "mix", when: "Mon 07:05", title: "Compound batch mixed", pin: "Batch B-3112 from 3 lots",
    facts: [["Batch", "B-3112, cushion compound"], ["Made from lots", "NR-8841, CB-2207, SU-0934"], ["Material check", "In date, correct recipe"]] },
  { n: 3, station: "band", when: "Mon 08:20", title: "Tyre ID created", pin: "ID marked on band SB-5521",
    facts: [["Tyre ID", HERO], ["Steel band lot", "SB-5521"], ["Size", SIZE]] },
  { n: 4, station: "build", when: "Mon 08:42", title: "Built", pin: "Built on SB-02, shift A",
    facts: [["Base layer", "Batch B-3107"], ["Cushion layer", "Batch B-3112"], ["Tread layer", "Batch B-3118"], ["Machine and shift", "SB-02, shift A, badge 2031"]] },
  { n: 5, station: "cure", when: "Mon 09:15", title: "Cured", pin: "Press P-02, mould M-217", extra: "cure",
    facts: [["Press and mould", "P-02, mould M-217"], ["Cure", "2 h 40 min, peak 151 °C"], ["Against normal", "Within the usual range"]] },
  { n: 6, station: "inspect", when: "Mon 12:30", title: "Inspected", pin: "Passed inspection", extra: "inspect",
    facts: [["Decision", "Passed, inspector badge 4102"]] },
  { n: 7, station: "store", when: "Mon 13:05", title: "Stored", pin: "Rack B, level 2",
    facts: [["Location", "Rack B, level 2, bay 4"]] },
  { n: 8, station: "dispatch", when: "Wed 08:30", title: "Shipped", pin: "Order EX-4471, Rotterdam",
    facts: [["Customer order", "EX-4471, Rotterdam"], ["Delivery note", "DN-2291"]] },
];

export const READINGS: [string, string, string][] = [
  ["Weight", "38.6 kg", "38.0 to 39.5"],
  ["Outer diameter", "533 mm", "531 to 536"],
  ["Width", "178 mm", "176 to 180"],
  ["Ultrasound", "No flaw found", "Trace saved"],
];

/* ---------- the walkthrough ---------- */

export type WalkStep = { station: StationId | null; title: string; body: string; action: string; result?: string; clock: string };

export const WALK: WalkStep[] = [
  { station: null, clock: "Mon 06:00", title: "Follow one solid tyre",
    body: "This is a solid tyre line, from the receiving dock to the dispatch gate. Follow one tyre through all eight stations and watch its passport fill in, one scan at a time. Then use the passport to solve real problems.",
    action: "Start" },
  { station: "receive", clock: "Mon 06:10", title: "Material arrives",
    body: "A pallet of natural rubber arrives at the dock. The storekeeper scans the supplier's label once. No form is filled in.",
    action: "Scan the pallet", result: "Lot NR-8841 is recorded with its supplier and its expiry date." },
  { station: "mix", clock: "Mon 07:05", title: "A compound batch is mixed",
    body: "The lot is scanned again as it goes into the mixer. Tyode checks it is the right material and in date, links it to the new batch, and prints a tag for the batch.",
    action: "Mix the batch", result: "Batch B-3112, the cushion compound, is tagged and linked to the three lots it was made from." },
  { station: "band", clock: "Mon 08:20", title: "The tyre gets its ID",
    body: "Every solid tyre is built on a steel band. Before building, the band is given a permanent code on a face the rubber never covers. That code is the tyre's ID for life.",
    action: "Mark the band", result: `${HERO} now exists, and its passport is open.` },
  { station: "build", clock: "Mon 08:42", title: "It is built, layer by layer",
    body: "A fixed scanner reads the band as it is mounted, so the builder scans nothing by hand. The tags of the three compounds at the machine are already scanned in, so each layer is linked to its batch.",
    action: "Mount the band and build", result: `${HERO} is linked to base B-3107, cushion B-3112 and tread B-3118, built on SB-02 in shift A.` },
  { station: "cure", clock: "Mon 09:15", title: "It is cured in a press",
    body: "The band is scanned at loading, which links the tyre to this press and mould. A small recorder clipped to the press logs the temperature of the whole cure. It only reads: nothing connects to the press controls.",
    action: "Scan it and close the press", result: "Press P-02, mould M-217. Cured for 2 h 40 min with a peak of 151 °C, a normal cure for this size." },
  { station: "inspect", clock: "Mon 12:30", title: "It is inspected",
    body: "The inspector scans the band and uses the same instruments as today. Weight, dimensions and the ultrasound trace are taken straight from the instruments and checked against the spec. The inspector still makes the decision.",
    action: "Scan and inspect", result: "Every reading is within spec. The inspector confirms: passed." },
  { station: "store", clock: "Mon 13:05", title: "It is put away",
    body: "One scan of the tyre and one of the rack. From now on, anyone can see where this tyre is.",
    action: "Scan it onto rack B", result: `${HERO} is on rack B, level 2.` },
  { station: "dispatch", clock: "Wed 08:30", title: "It is shipped",
    body: "At the gate each tyre is scanned against the customer order. A tyre on hold cannot pass this scan. The delivery note is produced from the scans.",
    action: "Scan and load it", result: `${HERO} left on order EX-4471 to Rotterdam. Delivery note DN-2291 lists it by ID.` },
  { station: null, clock: "Wed 08:45", title: "One tyre, one record",
    body: "Eight scans, and nothing typed by hand. Every tyre on the line now carries a history like this one. Here is what that makes possible.",
    action: "Use the passport" },
];

/* ---------- using the passport ---------- */

export type ScenarioKey = "batch" | "claim" | "expired" | "offline";
export type Scenario = { key: ScenarioKey; title: string; body: string; clock: string; steps: { action: string; result: string }[] };

export const SCENARIOS: Scenario[] = [
  { key: "batch", clock: "Wed 09:10", title: "A compound batch fails its test",
    body: "On Wednesday the lab finds cushion batch B-3112 out of specification. Which tyres is it in, and where are they now?",
    steps: [
      { action: "Search batch B-3112", result: `${AFFECTED_TOTAL} tyres contain B-3112. Each one is shown where it stands right now.` },
      { action: `Hold all ${AFFECTED_TOTAL}`, result: `All ${AFFECTED_TOTAL} are on hold in one step. The ${AFFECTED_IN_PLANT} still in the plant cannot move on, and the 2 delivered are listed with their order for a recall decision. Every other tyre carries on as normal.` },
      { action: "Try to ship one anyway", result: `Stopped. ${HERO} is on hold, so the gate scan refuses it and the supervisor is alerted.` },
    ] },
  { key: "claim", clock: "Months later", title: "A customer returns a tyre",
    body: `A customer in Rotterdam sends back ${HERO} with a complaint. What happened to this tyre?`,
    steps: [{ action: "Scan the returned tyre", result: "Its whole history on one page: materials, the batch in each layer, machine, press, mould, cure, inspection and shipment. The pilot target is under one minute." }] },
  { key: "expired", clock: "Wed 10:20", title: "Expired material at the mixer",
    body: "An old pallet of natural rubber, lot NR-8790, is brought to the mixer by mistake. It expired on 2 November.",
    steps: [{ action: "Scan it into the batch", result: "Stopped at the scan. The lot is past its expiry date, so the batch cannot be recorded with it, and the supervisor is alerted. The same check catches the wrong compound at the build machine." }] },
  { key: "offline", clock: "Wed 11:40", title: "The Wi-Fi drops",
    body: "The plant network goes down in the middle of a shift. Production cannot wait for it.",
    steps: [
      { action: "Drop the Wi-Fi and keep scanning", result: "Three tyres were put away while offline. Each scan was saved on the scanner itself, with its time." },
      { action: "Bring the Wi-Fi back", result: "The three saved scans went to the server and the records are complete. If the whole system is ever down, paper carries on and is entered afterwards." },
    ] },
];
