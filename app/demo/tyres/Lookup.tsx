"use client";

/* Tyre lookup, and screen 03: the tyre passport. */

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CURE_MIN, LINE, PEOPLE, SPEC, STITCHES, TOL, TYRES, builderByBadge, hhmm, type Stage, type Tyre } from "../data";
import { holdOf, useDemo } from "../store";
import { Card, PageHead, Pill } from "../ui";
import s from "../demo.module.css";

const WORD: Record<Stage, string> = { built: "Waiting to cure", curing: "Curing", inspection: "Waiting for inspection", released: "Released to storage", held: "Held" };

function CureCurve({ t }: { t: Tyre }) {
  const W = 520, H = 150, x0 = 36, y0 = 12, w = W - x0 - 8, h = H - y0 - 24;
  const lo = 20, hi = 175, Y = (c: number) => y0 + h - ((c - lo) / (hi - lo)) * h, X = (m: number) => x0 + (m / 13) * w;
  const peak = t.peak ?? 160;
  const pts: [number, number][] = [];
  for (let m = 0; m <= 13; m += 0.25) {
    const c = m < 2.5 ? 30 + (peak - 30) * (1 - Math.pow(1 - m / 2.5, 2.4)) : m > 12 ? peak - (peak - 60) * ((m - 12) / 1) : peak + Math.sin(m * 2.1) * 0.7;
    pts.push([X(m), Y(c)]);
  }
  const cool = peak < CURE_MIN;
  return (
    <svg className={s.cure} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Cure temperature, peak ${peak} °C against a minimum of ${CURE_MIN} °C`}>
      {[40, 100, 160].map((c) => <g key={c}><line x1={x0} x2={W - 8} y1={Y(c)} y2={Y(c)} className={s.cureGrid} /><text x={x0 - 6} y={Y(c) + 3} textAnchor="end">{c}°</text></g>)}
      <line x1={x0} x2={W - 8} y1={Y(CURE_MIN)} y2={Y(CURE_MIN)} className={s.cureSpec} />
      <text x={W - 10} y={Y(CURE_MIN) - 5} textAnchor="end" className={s.cureSpecT}>Minimum {CURE_MIN} °C</text>
      <polyline points={pts.map((p) => p.join(",")).join(" ")} className={cool ? s.cureLineBad : s.cureLine} />
      <text x={X(7)} y={Y(peak) + (cool ? 16 : -8)} textAnchor="middle" className={cool ? s.cureBadT : s.cureT}>Peak {peak} °C</text>
      <text x={x0} y={H - 4}>{hhmm(t.cureStart!)}</text>
      <text x={W - 8} y={H - 4} textAnchor="end">{hhmm(t.cureEnd!)} · 13 min</text>
    </svg>
  );
}

function Passport({ t }: { t: Tyre }) {
  const { st } = useDemo();
  const b = t.badge ? builderByBadge(t.badge) : undefined;
  const stitch = STITCHES.find((x) => x.serial === t.serial)!;
  const hold = holdOf(t.serial, st);
  const spec = SPEC[t.size as keyof typeof SPEC];
  const cool = (t.peak ?? 200) < CURE_MIN;
  const unattributed = stitch.kind === "unattributed" && !st.approvedUnattributed;
  const steps = [
    { k: "Building", done: true, at: hhmm(t.builtAt) },
    { k: "Curing", done: !!t.cureEnd && t.stage !== "curing", now: t.stage === "curing", at: t.cureStart ? `${hhmm(t.cureStart)}–${hhmm(t.cureEnd!)}` : "—" },
    { k: "Inspection", done: !!t.inspectedAt, now: t.stage === "inspection", at: t.inspectedAt ? hhmm(t.inspectedAt) : "—", bad: t.result === "fail" },
    { k: hold ? "On hold" : "Next stage", done: t.stage === "released" && !hold, bad: !!hold, at: hold ? "Engineer review" : t.stage === "released" ? "Storage" : "—" },
  ];
  const r = (v: number | undefined, target: number, tol: number, pct = false) => {
    if (v === undefined) return { ok: true, range: "" };
    const lo = pct ? target * (1 - tol) : target - tol, hi = pct ? target * (1 + tol) : target + tol;
    return { ok: v >= lo && v <= hi, range: pct ? `${lo.toFixed(2)}–${hi.toFixed(2)}` : `${lo}–${hi}` };
  };
  const rw = r(t.weight, spec.weight, TOL.weight, true), ro = r(t.od, spec.od, TOL.od), rs = r(t.width, spec.width, TOL.width);

  return (
    <>
      <PageHead title={t.serial} sub={`${t.size} · ${LINE.label} · tyre passport`}>
        {hold ? <Pill tone="red">ON HOLD</Pill> : <Pill tone={t.stage === "released" ? "green" : "blue"}>{WORD[t.stage]}</Pill>}
        <button type="button" className={s.btnGhost} onClick={() => window.print()}>Export PDF</button>
      </PageHead>

      <ol className={s.stageLine} aria-label="Stages">
        {steps.map((x) => (
          <li key={x.k} className={x.bad ? s.slBad : x.done ? s.slDone : x.now ? s.slNow : ""}>
            <i>{x.bad ? "!" : x.done ? "✓" : ""}</i><b>{x.k}</b><span>{x.at}</span>
          </li>
        ))}
      </ol>

      {hold && <div className={s.holdBanner}><b>On hold.</b> {hold} If it is scanned at the next stage it will be blocked and the supervisor alerted.</div>}

      <div className={s.gridTwo}>
        <Card title="Building">
          <div className={s.facts}>
            <div><span>Machine</span><b>{t.machine}</b></div>
            <div><span>Builder</span><b>{b ? `${b.name} · badge ${b.badge}` : unattributed ? "Unattributed, waiting for approval" : "D. Wickramasinghe (approved)"}</b></div>
            <div><span>Stitched</span><b>{hhmm(t.builtAt)} · signal {stitch.id}</b></div>
            <div><span>Count</span><b className={unattributed ? s.amberT : s.greenT}>{unattributed ? "Pending approval" : "Verified ✓"}</b></div>
          </div>
          <h3 className={s.subH}>Compound batches</h3>
          <div className={s.batchRow}>
            {([["Tread", t.batches.tread], ["Sidewall", t.batches.sidewall], ["Inner liner", t.batches.liner]] as const).map(([k, v]) => (
              <Link key={k} href={`/demo/holds?batch=${v}`} className={`${s.batchChip} ${v === "C-1042" ? s.batchSuspect : ""}`}>
                <span>{k}</span><b>{v}</b>{v === "C-1042" && <em>Suspect</em>}
              </Link>
            ))}
          </div>
        </Card>

        <Card title="Curing">
          {t.cureStart ? (
            <>
              <div className={s.facts}>
                <div><span>Press and mould</span><b>{t.press} · {t.mould}</b></div>
                <div><span>Loaded by</span><b>{PEOPLE.pressOp.name} · scanned at loading</b></div>
              </div>
              <CureCurve t={t} />
              {cool && <p className={s.warnLine}>Unusual cure: below {CURE_MIN} °C. See alert A-207.</p>}
            </>
          ) : <p className={s.muted}>Not cured yet. It will be linked to a press and mould when it is scanned at loading.</p>}
        </Card>

        <Card title="Inspection">
          {t.inspectedAt ? (
            <>
              <table className={s.table}>
                <thead><tr><th>Check</th><th>Reading</th><th>Spec</th><th /></tr></thead>
                <tbody>
                  <tr><td>Weight</td><td>{t.weight?.toFixed(2)} kg</td><td>{rw.range} kg</td><td className={rw.ok ? s.greenT : s.red}>{rw.ok ? "✓" : "✕"}</td></tr>
                  <tr><td>Outer diameter</td><td>{t.od} mm</td><td>{ro.range} mm</td><td className={ro.ok ? s.greenT : s.red}>{ro.ok ? "✓" : "✕"}</td></tr>
                  <tr><td>Section width</td><td>{t.width} mm</td><td>{rs.range} mm</td><td className={rs.ok ? s.greenT : s.red}>{rs.ok ? "✓" : "✕"}</td></tr>
                  <tr><td>Visual checklist</td><td>4 of 4 OK</td><td>Set in plant configuration</td><td className={s.greenT}>✓</td></tr>
                </tbody>
              </table>
              <p className={s.muted}>Inspected at {hhmm(t.inspectedAt)} by {PEOPLE.inspector.name}. Result: <b className={t.result === "pass" ? s.greenT : s.red}>{t.result === "pass" ? "PASS" : "FAIL"}</b></p>
            </>
          ) : <p className={s.muted}>Not inspected yet.</p>}
        </Card>

        <Card title="Holds and next stages">
          <ol className={s.timeline}>
            {hold ? <li className={s.tlBad}><time>now</time><span>{hold}</span></li>
              : t.stage === "released" ? <li className={s.tlOk}><time>{hhmm(t.inspectedAt! + 9)}</time><span>Released to storage, the next stage set for line PL-1.</span></li>
              : <li className={s.tlWait}><time>next</time><span>{WORD[t.stage]}.</span></li>}
            <li className={s.tlNext}><time>Product</time><span>Storage and dispatch scans are added per line through configuration.</span></li>
          </ol>
        </Card>
      </div>
    </>
  );
}

export default function Lookup() {
  const serial = useSearchParams().get("serial")?.toUpperCase() ?? "";
  const { st } = useDemo();
  const t = serial ? TYRES.find((x) => x.serial === serial) : undefined;

  if (serial && !t) {
    return (
      <>
        <PageHead title="Tyre lookup" />
        <Card><p className={s.body}>No tyre with the label <b>{serial}</b> was built this shift. Labels this shift run from {TYRES[0].serial} to {TYRES[TYRES.length - 1].serial}.</p></Card>
      </>
    );
  }
  if (t) return <Passport t={t} />;

  const recent = [...TYRES].reverse();
  return (
    <>
      <PageHead title="Tyre lookup" sub={`Every green tyre counted this shift, newest first. Open one to see its passport, or search a label above. ${TYRES.length} tyres so far.`}>
        <Link className={s.btn} href="/demo/tyres?serial=GT-2611-0427">Open GT-2611-0427</Link>
      </PageHead>
      <Card>
        <table className={s.table}>
          <thead><tr><th>Label</th><th>Size</th><th>Machine</th><th>Built</th><th>Press</th><th>Stage</th></tr></thead>
          <tbody>
            {recent.map((x) => {
              const h = holdOf(x.serial, st);
              return (
                <tr key={x.serial}>
                  <td><Link href={`/demo/tyres?serial=${x.serial}`}>{x.serial}</Link></td>
                  <td>{x.size}</td>
                  <td>{x.machine}</td>
                  <td>{hhmm(x.builtAt)}</td>
                  <td>{x.press ?? "—"}</td>
                  <td>{h ? <Pill tone="red">ON HOLD</Pill> : <Pill tone={x.stage === "released" ? "green" : "grey"}>{WORD[x.stage]}</Pill>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>
    </>
  );
}
