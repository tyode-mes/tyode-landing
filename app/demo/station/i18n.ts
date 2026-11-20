/* Operator screen text in English and Sinhala. The Sinhala needs a check by a native speaker
   before it is shown to a client. Factory terms (curing, press) follow common floor usage. */

const T = {
  stageScan: ["Stage scan", "අදියර ස්කෑන්"],
  inspection: ["Inspection", "පරීක්ෂාව"],
  building: ["Building", "බිල්ඩින්"],
  curing: ["Curing", "කියුරින්"],
  nextStage: ["Next stage", "ඊළඟ අදියර"],
  storage: ["Storage", "ගබඩාව"],
  scanLabel: ["Scan label", "ලේබලය ස්කෑන් කරන්න"],
  scan: ["Scan", "ස්කෑන්"],
  undo: ["Undo last scan", "අවසන් ස්කෑන් එක අවලංගු කරන්න"],
  recent: ["Recent scans", "මෑත ස්කෑන්"],
  loadedInto: ["Loaded into Press", "පටවන ලදී, ප්‍රෙස්"],
  stored: ["Put away in storage", "ගබඩා කරන ලදී"],
  blocked: ["Blocked", "අවහිරයි"],
  onHold: ["This tyre is ON HOLD. Do not move it.", "මෙම ටයරය රඳවා තබා ඇත. ගෙන යන්න එපා."],
  supAlerted: ["The supervisor has been alerted.", "අධීක්ෂකට දැනුම් දුන්නා."],
  notFound: ["Label not found", "ලේබලය හමු නොවීය"],
  operator: ["Operator", "ක්‍රියාකරු"],
  inspector: ["Inspector", "පරීක්ෂක"],
  weight: ["Weight", "බර"],
  od: ["Outer diameter", "පිටත විෂ්කම්භය"],
  width: ["Section width", "සෙක්ෂන් පළල"],
  checklist: ["Visual checklist", "දෘශ්‍ය පරීක්ෂණ ලැයිස්තුව"],
  overall: ["Overall", "සමස්ත ප්‍රතිඵලය"],
  pass: ["PASS", "සමත්"],
  fail: ["FAIL", "අසමත්"],
  recordDefect: ["Record defect", "දෝෂයක් සටහන් කරන්න"],
  unusualCure: ["Unusual cure", "අසාමාන්‍ය කියුරින්"],
  confirm: ["Confirm result", "ප්‍රතිඵලය තහවුරු කරන්න"],
} as const;

export type Key = keyof typeof T;
export const tr = (lang: "EN" | "SI") => (k: Key) => T[k][lang === "EN" ? 0 : 1];
