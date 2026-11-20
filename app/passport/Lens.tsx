/* Tyre Passport demo: the close-up panel. When a scan happens on the floor, this shows what is
   actually being read or made at that moment, as a small animated drawing. Sample data. */

import s from "./PassportDemo.module.css";

const d = (ms: number): React.CSSProperties => ({ animationDelay: `${ms}ms` });

function Tick({ x, y, at = 0, bad = false }: { x: number; y: number; at?: number; bad?: boolean }) {
  return (
    <g className={s.lzPop} style={d(at)}>
      <circle cx={x} cy={y} r="7" fill={bad ? "#d92d33" : "#1f9d5a"} />
      {bad ? <path d={`M${x - 3},${y - 3}l6,6m0,-6l-6,6`} stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        : <path d={`M${x - 3.4},${y + 0.2}l2.4,2.4l4.4,-5`} stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />}
    </g>
  );
}

function Label({ lot, exp, bad = false }: { lot: string; exp: string; bad?: boolean }) {
  return (
    <>
      <rect x="38" y="10" width="164" height="104" rx="6" className={s.lzPaper} />
      <text x="50" y="30" className={s.lzSmall}>NATURAL RUBBER · SUPPLIER LABEL</text>
      <text x="50" y="48" className={s.lzBig}>LOT {lot}</text>
      <text x="50" y="62" className={s.lzSmall} style={bad ? { fill: "#d92d33" } : undefined}>EXPIRY {exp}</text>
      <g fill="#0c0c0d">
        {Array.from({ length: 34 }, (_, i) => <rect key={i} x={50 + i * 4.1} y="70" width={(i * 7) % 3 === 0 ? 2.6 : 1.2} height="32" />)}
      </g>
      <rect x="42" y="68" width="156" height="2.4" className={bad ? s.lzScanBad : s.lzScan} />
      {bad ? (
        <g className={s.lzStamp} style={d(2300)}>
          <rect x="100" y="73" width="96" height="26" rx="4" fill="#fff" stroke="#d92d33" strokeWidth="2.4" />
          <text x="148" y="91" textAnchor="middle" className={s.lzBig} style={{ fill: "#d92d33" }}>EXPIRED</text>
        </g>
      ) : <Tick x={186} y={28} at={2400} />}
    </>
  );
}

const ART: Record<string, { caption: string; art: React.ReactNode }> = {
  "walk-1": { caption: "One scan reads the supplier's own label. Nothing is typed.", art: <Label lot="NR-8841" exp="14 MAR 2027" /> },

  "walk-2": {
    caption: "Three material lots go in. One tagged batch comes out, linked to all three.",
    art: (
      <>
        {[["NR-8841", "Natural rubber", 12], ["CB-2207", "Carbon black", 50], ["SU-0934", "Sulphur", 88]].map(([id, name, y], i) => (
          <g key={id} className={s.lzPop} style={d(300 + i * 500)}>
            <rect x="10" y={y} width="88" height="26" rx="6" className={s.lzPaper} />
            <text x="18" y={Number(y) + 11} className={s.lzSmall}>{name}</text>
            <text x="18" y={Number(y) + 21} className={s.lzMid}>{id}</text>
          </g>
        ))}
        {[25, 63, 101].map((y, i) => <path key={y} d={`M98,${y} C124,${y} 124,63 150,63`} pathLength={1} className={s.lzDraw} style={d(1900 + i * 350)} />)}
        <g className={s.lzPop} style={d(3200)}>
          <rect x="150" y="44" width="80" height="38" rx="7" fill="#0c0c0d" />
          <text x="160" y="59" className={s.lzSmall} style={{ fill: "rgb(255 255 255 / .7)" }}>Cushion batch</text>
          <text x="160" y="74" className={s.lzBig} style={{ fill: "#fff" }}>B-3112</text>
        </g>
        <Tick x={228} y={44} at={3900} />
      </>
    ),
  },

  "walk-3": {
    caption: "The code is marked into the steel, on a face the rubber never covers.",
    art: (
      <>
        <defs><linearGradient id="lzSteel" x1="0" x2="1"><stop offset="0" stopColor="#c4c8ce" /><stop offset=".5" stopColor="#e9ebee" /><stop offset="1" stopColor="#b9bec5" /></linearGradient></defs>
        <rect x="20" y="8" width="200" height="108" rx="8" fill="url(#lzSteel)" stroke="rgb(28 30 34 / .4)" />
        <g>
          {Array.from({ length: 144 }, (_, i) => {
            const x = i % 12, y = Math.floor(i / 12);
            const on = x === 0 || y === 11 || (y === 0 && x % 2 === 0) || (x === 11 && y % 2 === 1) || (x > 0 && x < 11 && y > 0 && y < 11 && ((x * 7 + y * 13 + x * y * 3) % 5 < 2));
            return on ? <rect key={i} x={84 + x * 6} y={18 + y * 6} width="6.1" height="6.1" fill="#16171a" className={s.lzCell} style={d(300 + y * 290 + x * 22)} /> : null;
          })}
        </g>
        <circle r="3.4" className={s.lzLaser} />
        <text x="120" y="108" textAnchor="middle" className={`${s.lzMid} ${s.lzPop}`} style={d(4300)}>ST-0457</text>
      </>
    ),
  },

  "walk-4": {
    caption: "Each layer is wound on in turn, and each keeps the number of its batch.",
    art: (
      <>
        <circle cx="66" cy="62" r="46" fill="none" stroke="#3a3c42" strokeWidth="12" className={s.lzPop} style={d(6700)} />
        <circle cx="66" cy="62" r="34.5" fill="none" stroke="#5a5e66" strokeWidth="11" className={s.lzPop} style={d(3500)} />
        <circle cx="66" cy="62" r="24" fill="none" stroke="#7b8088" strokeWidth="10" className={s.lzPop} style={d(400)} />
        <circle cx="66" cy="62" r="16.5" fill="none" stroke="#c9cdd3" strokeWidth="5" />
        <circle cx="66" cy="62" r="16.5" fill="none" stroke="rgb(28 30 34 / .5)" strokeWidth=".7" />
        {[["Tread", "B-3118", 22, 6700, 100], ["Cushion", "B-3112", 50, 3500, 96], ["Base", "B-3107", 78, 400, 88]].map(([name, id, y, at, x0]) => (
          <g key={id} className={s.lzPop} style={d(Number(at) + 500)}>
            <path d={`M${x0},${Number(y) + 4}H136`} stroke="rgb(28 30 34 / .45)" strokeWidth=".8" />
            <text x="140" y={Number(y) + 2} className={s.lzSmall}>{name} layer</text>
            <text x="140" y={Number(y) + 14} className={s.lzMid}>{id}</text>
          </g>
        ))}
        <g>
          <path d="M83,62H136" stroke="rgb(28 30 34 / .45)" strokeWidth=".8" transform="translate(0 46)" opacity="0" />
          <text x="140" y="108" className={s.lzSmall}>Steel band</text>
          <text x="140" y="119" className={s.lzMid}>ST-0457</text>
        </g>
      </>
    ),
  },

  "walk-5": {
    caption: "The recorder logs the whole cure. It only reads the press, it never controls it.",
    art: (
      <>
        <path d="M30,12V100H226" fill="none" stroke="rgb(28 30 34 / .45)" strokeWidth=".8" />
        <rect x="62" y="20" width="132" height="12" fill="rgb(31 157 90 / .16)" />
        <text x="196" y="17" textAnchor="end" className={s.lzSmall}>Usual range for this size</text>
        <text x="26" y="29" textAnchor="end" className={s.lzSmall}>150°</text>
        <text x="26" y="100" textAnchor="end" className={s.lzSmall}>20°</text>
        <path d="M30,98 C40,70 50,30 70,27 S150,25 190,26 C202,27 208,60 222,92" fill="none" pathLength={1} className={s.lzCurve} />
        <g className={s.lzPop} style={d(2600)}><circle cx="120" cy="25.5" r="3" fill="#0c0c0d" /><text x="120" y="46" textAnchor="middle" className={s.lzMid}>Peak 151 °C</text></g>
        <text x="30" y="113" className={s.lzSmall}>09:15</text>
        <text x="222" y="113" textAnchor="end" className={`${s.lzSmall} ${s.lzPop}`} style={d(4300)}>11:55 · 2 h 40 min</text>
        <text x="126" y="72" textAnchor="middle" className={`${s.lzMid} ${s.lzPop}`} style={d(5000)}>Press P-02 · mould M-217</text>
      </>
    ),
  },

  "walk-6": {
    caption: "Readings come straight from the plant's own instruments, each checked against the spec.",
    art: (
      <>
        <rect x="10" y="14" width="96" height="70" rx="6" fill="#101c16" />
        <path d="M16,70 H26 L30,24 L34,70 H52 L55,56 L58,70 H76 L79,40 L82,70 H100" fill="none" stroke="#34d07f" strokeWidth="1.5" pathLength={1} className={s.lzTrace} />
        <text x="58" y="98" textAnchor="middle" className={s.lzSmall}>Ultrasound trace, saved</text>
        {[["Weight", "38.6 kg", 18], ["Diameter", "533 mm", 46], ["Width", "178 mm", 74]].map(([k, v, y], i) => (
          <g key={k} className={s.lzPop} style={d([300, 3000, 3700][i])}>
            <rect x="118" y={y} width="112" height="24" rx="6" className={s.lzPaper} />
            <text x="126" y={Number(y) + 15} className={s.lzSmall}>{k}</text>
            <text x="206" y={Number(y) + 16} textAnchor="end" className={s.lzMid}>{v}</text>
            <Tick x={220} y={Number(y) + 12} at={[900, 3600, 4300][i]} />
          </g>
        ))}
        <text x="174" y="113" textAnchor="middle" className={`${s.lzMid} ${s.lzPop}`} style={d(9000)}>Inspector confirms: passed</text>
      </>
    ),
  },

  "walk-7": {
    caption: "Scan the tyre, scan the rack. Its place is known from then on.",
    art: (
      <>
        <text x="20" y="18" className={s.lzSmall}>Rack B</text>
        {[0, 1].map((row) => [0, 1, 2, 3, 4, 5].map((col) => {
          const here = row === 0 && col === 3, full = (row === 0 && col < 2) || (row === 1 && col !== 2);
          return (
            <g key={`${row}${col}`}>
              <rect x={20 + col * 34} y={26 + row * 38} width="30" height="32" rx="5" className={s.lzPaper} />
              {full && <circle cx={35 + col * 34} cy={42 + row * 38} r="10" fill="none" stroke="#33353a" strokeWidth="7" />}
              {here && <g className={s.lzPop} style={d(1200)}><rect x={20 + col * 34} y={26 + row * 38} width="30" height="32" rx="5" fill="none" stroke="#1f9d5a" strokeWidth="2.4" /><circle cx={35 + col * 34} cy={42 + row * 38} r="10" fill="none" stroke="#0c0c0d" strokeWidth="7" /></g>}
            </g>
          );
        }))}
        <text x="20" y="116" className={`${s.lzMid} ${s.lzPop}`} style={d(1900)}>ST-0457 · level 2 · bay 4</text>
        <Tick x={220} y={111} at={2500} />
      </>
    ),
  },

  "walk-8": {
    caption: "The delivery note writes itself from the scans. A held tyre could not pass.",
    art: (
      <>
        <rect x="50" y="6" width="140" height="112" rx="5" className={s.lzPaper} />
        <text x="60" y="22" className={s.lzMid}>Delivery note DN-2291</text>
        <text x="60" y="33" className={s.lzSmall}>Order EX-4471 · Rotterdam</text>
        {["ST-0445", "ST-0446", "ST-0452", "ST-0458", "ST-0464", "ST-0457"].map((id, i) => (
          <g key={id} className={s.lzPop} style={d(300 + i * 380)}>
            <path d={`M60,${40 + i * 12.5}H180`} stroke="rgb(28 30 34 / .12)" />
            <text x="60" y={50 + i * 12.5} className={i === 5 ? s.lzMid : s.lzSmall}>{id}</text>
            <path d={`M170,${46 + i * 12.5}l2.4,2.4l4.4,-5`} stroke="#1f9d5a" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          </g>
        ))}
      </>
    ),
  },

  /* ---------- the pneumatic line ---------- */
  "p-mix": {
    caption: "Three material lots go in. One tagged batch comes out, linked to all three.",
    art: (
      <>
        {[["NR-8841", "Natural rubber", 12], ["CB-2207", "Carbon black", 50], ["SU-0934", "Sulphur", 88]].map(([id, name, y], i) => (
          <g key={id} className={s.lzPop} style={d(300 + i * 500)}>
            <rect x="10" y={y} width="88" height="26" rx="6" className={s.lzPaper} />
            <text x="18" y={Number(y) + 11} className={s.lzSmall}>{name}</text>
            <text x="18" y={Number(y) + 21} className={s.lzMid}>{id}</text>
          </g>
        ))}
        {[25, 63, 101].map((y, i) => <path key={y} d={`M98,${y} C124,${y} 124,63 150,63`} pathLength={1} className={s.lzDraw} style={d(1900 + i * 350)} />)}
        <g className={s.lzPop} style={d(3200)}>
          <rect x="150" y="44" width="80" height="38" rx="7" fill="#0c0c0d" />
          <text x="160" y="59" className={s.lzSmall} style={{ fill: "rgb(255 255 255 / .7)" }}>Tread batch</text>
          <text x="160" y="74" className={s.lzBig} style={{ fill: "#fff" }}>C-1042</text>
        </g>
        <Tick x={228} y={44} at={3900} />
      </>
    ),
  },  "p-dispatch": {
    caption: "The delivery note writes itself from the scans. A held tyre could not pass.",
    art: (
      <>
        <rect x="50" y="6" width="140" height="112" rx="5" className={s.lzPaper} />
        <text x="60" y="22" className={s.lzMid}>Delivery note DN-2297</text>
        <text x="60" y="33" className={s.lzSmall}>Order DO-5182</text>
        {["GT-2611-0402", "GT-2611-0405", "GT-2611-0411", "GT-2611-0418", "GT-2611-0423", "GT-2611-0427"].map((id, i) => (
          <g key={id} className={s.lzPop} style={d(300 + i * 380)}>
            <path d={`M60,${40 + i * 12.5}H180`} stroke="rgb(28 30 34 / .12)" />
            <text x="60" y={50 + i * 12.5} className={i === 5 ? s.lzMid : s.lzSmall}>{id}</text>
            <path d={`M170,${46 + i * 12.5}l2.4,2.4l4.4,-5`} stroke="#1f9d5a" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          </g>
        ))}
      </>
    ),
  },  "p-build": {
    caption: "Two stages on the drum. Every component's batch is recorded against the tyre.",
    art: (
      <>
        <circle cx="66" cy="62" r="46" fill="none" stroke="#3a3c42" strokeWidth="12" className={s.lzPop} style={d(3200)} />
        <circle cx="66" cy="62" r="34.5" fill="none" stroke="#5a5e66" strokeWidth="11" className={s.lzPop} style={d(1700)} />
        <circle cx="66" cy="62" r="24" fill="none" stroke="#7b8088" strokeWidth="10" className={s.lzPop} style={d(250)} />
        <circle cx="66" cy="62" r="16.5" fill="#dfe2e6" stroke="rgb(28 30 34 / .5)" strokeWidth=".7" />
        <text x="66" y="65" textAnchor="middle" className={s.lzSmall}>Drum</text>
        {[["Belts and tread", "C-1042", 22, 3200, 100], ["Beads and sidewalls", "C-1044", 50, 1700, 96], ["Liner and ply", "C-1039", 78, 250, 88]].map(([name, id, y, at, x0]) => (
          <g key={id} className={s.lzPop} style={d(Number(at) + 400)}>
            <path d={`M${x0},${Number(y) + 4}H136`} stroke="rgb(28 30 34 / .45)" strokeWidth=".8" />
            <text x="140" y={Number(y) + 2} className={s.lzSmall}>{name}</text>
            <text x="140" y={Number(y) + 14} className={s.lzMid}>{id}</text>
          </g>
        ))}
      </>
    ),
  },
  "p-label": {
    caption: "The label prints only for a counted stitch. Its number is the tyre's ID from now on.",
    art: (
      <>
        <rect x="38" y="12" width="164" height="100" rx="6" className={s.lzPaper} />
        <text x="50" y="30" className={s.lzSmall}>GREEN TYRE · LINE PL-1 · 185/65 R15</text>
        <text x="50" y="50" className={`${s.lzBig} ${s.lzPop}`} style={d(300)}>GT-2611-0427</text>
        <g fill="#0c0c0d" className={s.lzPop} style={d(700)}>
          {Array.from({ length: 34 }, (_, i) => <rect key={i} x={50 + i * 4.1} y="58" width={(i * 7) % 3 === 0 ? 2.6 : 1.2} height="30" />)}
        </g>
        <text x="50" y="102" className={`${s.lzSmall} ${s.lzPop}`} style={d(1100)}>BM-01 · K. Perera · badge 1042 · 08:12</text>
        <Tick x={188} y={28} at={1500} />
      </>
    ),
  },
  "p-cure": {
    caption: "The recorder logs the whole cure and only reads the press. This one stayed under the limit.",
    art: (
      <>
        <path d="M30,12V100H226" fill="none" stroke="rgb(28 30 34 / .45)" strokeWidth=".8" />
        <path d="M30,24H226" stroke="#d92d33" strokeWidth="1.1" strokeDasharray="4 3" />
        <text x="226" y="20" textAnchor="end" className={s.lzSmall} style={{ fill: "#d92d33" }}>Limit 155 °C</text>
        <text x="26" y="27" textAnchor="end" className={s.lzSmall}>155°</text>
        <text x="26" y="100" textAnchor="end" className={s.lzSmall}>20°</text>
        <path d="M30,98 C40,72 50,40 70,36 S150,34 190,35 C202,36 208,62 222,92" fill="none" pathLength={1} className={s.lzCurve} style={{ stroke: "#c96a0a" }} />
        <g className={s.lzPop} style={d(2600)}><circle cx="120" cy="34.5" r="3" fill="#c96a0a" /><text x="120" y="54" textAnchor="middle" className={s.lzMid} style={{ fill: "#c96a0a" }}>Peak 149 °C · unusual</text></g>
        <text x="30" y="113" className={s.lzSmall}>09:05</text>
        <text x="222" y="113" textAnchor="end" className={`${s.lzSmall} ${s.lzPop}`} style={d(4300)}>09:18 · 13 min</text>
        <text x="126" y="80" textAnchor="middle" className={`${s.lzMid} ${s.lzPop}`} style={d(4600)}>Press P-03 · mould M-07</text>
      </>
    ),
  },
  "p-inspect": {
    caption: "Readings come straight from the scale and gauges. The checklist is set for the line.",
    art: (
      <>
        {[["Weight", "8.62 kg", 10], ["Outer diameter", "621 mm", 36], ["Section width", "187 mm", 62]].map(([k, v, y], i) => (
          <g key={k} className={s.lzPop} style={d([200, 2900, 3300][i])}>
            <rect x="10" y={y} width="148" height="22" rx="6" className={s.lzPaper} />
            <text x="18" y={Number(y) + 14} className={s.lzSmall}>{k}</text>
            <text x="134" y={Number(y) + 15} textAnchor="end" className={s.lzMid}>{v}</text>
            <Tick x={148} y={Number(y) + 11} at={[600, 3200, 3600][i]} />
          </g>
        ))}
        <g className={s.lzPop} style={d(5800)}>
          <rect x="166" y="10" width="64" height="74" rx="6" className={s.lzPaper} />
          <text x="174" y="25" className={s.lzSmall}>Checklist</text>
          {[0, 1, 2, 3].map((i) => <path key={i} d={`M176,${36 + i * 12}l2.4,2.4l4.4,-5`} stroke="#1f9d5a" strokeWidth="1.6" fill="none" strokeLinecap="round" />)}
          {["Bead", "Sidewall", "Tread", "Liner"].map((x, i) => <text key={x} x="188" y={39 + i * 12} className={s.lzSmall}>{x}</text>)}
        </g>
        <rect x="10" y="94" width="220" height="22" rx="6" fill="#fff1dc" className={s.lzPop} style={d(800)} />
        <text x="18" y="108" className={`${s.lzSmall} ${s.lzPop}`} style={{ ...d(800), fill: "#8a4b00" }}>Unusual cure in P-03 shown to the inspector</text>
        <text x="222" y="109" textAnchor="end" className={`${s.lzMid} ${s.lzPop}`} style={{ ...d(8600), fill: "#1f9d5a" }}>PASS</text>
      </>
    ),
  },
  "p-store": {
    caption: "Released to the next stage set for this line. Its place is known from now on.",
    art: (
      <>
        <text x="20" y="18" className={s.lzSmall}>Storage WH-1 · rack B</text>
        {[0, 1].map((row) => [0, 1, 2, 3, 4, 5].map((col) => {
          const here = row === 0 && col === 3, full = (row === 0 && col < 2) || (row === 1 && col !== 2);
          return (
            <g key={`${row}${col}`}>
              <rect x={20 + col * 34} y={26 + row * 38} width="30" height="32" rx="5" className={s.lzPaper} />
              {full && <circle cx={35 + col * 34} cy={42 + row * 38} r="10" fill="none" stroke="#33353a" strokeWidth="7" />}
              {here && <g className={s.lzPop} style={d(900)}><rect x={20 + col * 34} y={26 + row * 38} width="30" height="32" rx="5" fill="none" stroke="#1f9d5a" strokeWidth="2.4" /><circle cx={35 + col * 34} cy={42 + row * 38} r="10" fill="none" stroke="#0c0c0d" strokeWidth="7" /></g>}
            </g>
          );
        }))}
        <text x="20" y="116" className={`${s.lzMid} ${s.lzPop}`} style={d(1600)}>GT-2611-0427 · rack B, level 2</text>
        <Tick x={220} y={111} at={2200} />
      </>
    ),
  },
  "p-hold": {
    caption: "A hold follows the tyre. Every scanner on the line knows about it.",
    art: (
      <>
        <rect x="38" y="16" width="164" height="92" rx="6" className={s.lzPaper} />
        <text x="50" y="36" className={s.lzSmall}>STORAGE SCAN · WH-1</text>
        <text x="50" y="58" className={s.lzBig}>GT-2611-0440</text>
        <text x="50" y="72" className={s.lzSmall}>Hold: report A-207, cure too cool</text>
        <g className={s.lzStamp} style={d(1500)}>
          <rect x="92" y="78" width="104" height="24" rx="4" fill="#fff" stroke="#d92d33" strokeWidth="2.4" />
          <text x="144" y="95" textAnchor="middle" className={s.lzBig} style={{ fill: "#d92d33" }}>ON HOLD</text>
        </g>
        <Tick x={186} y={34} at={1200} bad />
      </>
    ),
  },

  expired: { caption: "The scanner knows the expiry date of every lot it has ever read.", art: <Label lot="NR-8790" exp="02 NOV 2026" bad /> },

  hold: {
    caption: "A hold follows the tyre. Every scanner in the plant knows about it.",
    art: (
      <>
        <rect x="38" y="16" width="164" height="92" rx="6" className={s.lzPaper} />
        <text x="50" y="36" className={s.lzSmall}>GATE SCAN · ORDER EX-4471</text>
        <text x="50" y="58" className={s.lzBig}>ST-0457</text>
        <text x="50" y="72" className={s.lzSmall}>Cushion layer: batch B-3112</text>
        <g className={s.lzStamp} style={d(1500)}>
          <rect x="92" y="78" width="104" height="24" rx="4" fill="#fff" stroke="#d92d33" strokeWidth="2.4" />
          <text x="144" y="95" textAnchor="middle" className={s.lzBig} style={{ fill: "#d92d33" }}>ON HOLD</text>
        </g>
        <Tick x={186} y={34} at={1200} bad />
      </>
    ),
  },
};

export default function Lens({ k }: { k: string }) {
  const lens = ART[k];
  if (!lens) return null;
  return (
    <figure className={s.lens} key={k}>
      <span>Close-up</span>
      <svg viewBox="0 0 240 124" aria-hidden="true">{lens.art}</svg>
      <figcaption>{lens.caption}</figcaption>
    </figure>
  );
}
