"use client";

/* Shift report: produced automatically from the counts, flags and holds. */

import { ALERTS, BUILDERS, DATE, MACHINES, NOW, STITCHES, TYRES, byHour, counts, hhmm } from "../data";
import { heldList, useDemo } from "../store";
import { Card, PageHead } from "../ui";
import PrintButton from "./PrintButton";
import s from "../demo.module.css";

export default function Report() {
  const { st } = useDemo();
  const c = counts();
  const hours = byHour();
  const stage = (k: string) => TYRES.filter((t) => t.stage === k).length;
  return (
    <>
      <PageHead title="Shift report" sub={`Line PL-1, Shift A, ${DATE}, 06:00 to ${hhmm(NOW)} (shift still running). Produced automatically, ready for the production meeting.`}>
        <PrintButton />
      </PageHead>

      <div className={s.gridTwo}>
        <Card title="Green tyre count">
          <div className={s.facts}>
            <div><span>Stitch signals</span><b>{c.signals}</b></div>
            <div><span>Counted (verified)</span><b>{c.counted}</b></div>
            <div><span>Flagged, not counted</span><b>{c.flagged}</b></div>
            <div><span>Credited to first builder signed in</span><b>{c.late}</b></div>
            <div><span>Counts typed by hand</span><b>0</b></div>
            <div><span>Counters online</span><b>{MACHINES.length}/{MACHINES.length}</b></div>
          </div>
        </Card>
        <Card title="Traceability">
          <div className={s.facts}>
            <div><span>Waiting to cure</span><b>{stage("built")}</b></div>
            <div><span>Curing</span><b>{stage("curing")}</b></div>
            <div><span>Waiting for inspection</span><b>{stage("inspection")}</b></div>
            <div><span>Released to storage</span><b>{stage("released")}</b></div>
            <div><span>On hold</span><b className={s.red}>{heldList(st).length}</b></div>
            <div><span>Alerts raised</span><b>{ALERTS.length}</b></div>
          </div>
        </Card>
      </div>

      <div className={s.gridTwo}>
        <Card title="By builder">
          <table className={s.table}>
            <thead><tr><th>Builder</th><th>Machine</th><th>Counted</th><th>Flagged</th></tr></thead>
            <tbody>
              {BUILDERS.map((b) => { const k = counts(b.machine); return (
                <tr key={b.badge}><td>{b.name}<small>Badge {b.badge}</small></td><td>{b.machine}</td><td>{k.counted}</td><td>{k.flagged}</td></tr>
              ); })}
            </tbody>
          </table>
        </Card>
        <Card title="By hour">
          <table className={s.table}>
            <thead><tr><th>Hour</th><th>Counted</th><th>Flagged</th></tr></thead>
            <tbody>{hours.map((h) => <tr key={h.hour}><td>{h.hour}</td><td>{h.counted}</td><td>{h.flagged}</td></tr>)}</tbody>
          </table>
        </Card>
      </div>

      <Card title="Flags this shift">
        <table className={s.table}>
          <thead><tr><th>Time</th><th>Machine</th><th>Type</th><th>Reason</th></tr></thead>
          <tbody>
            {STITCHES.filter((x) => x.kind === "flagged" || x.late).map((x) => (
              <tr key={x.id}><td>{hhmm(x.at)}</td><td>{x.machine}</td><td>{x.kind === "flagged" ? "Too soon" : "Credited late"}</td><td>{x.reason}</td></tr>
            ))}
          </tbody>
        </table>
        <p className={s.muted}>Scrap is recorded separately and is not part of the count.</p>
      </Card>
    </>
  );
}
