import { FLAGS, MACHINES, NOW, PRESSES, TYRES, byHour, builderFor, hhmm, totals } from "../data";
import { Card, PageHead } from "../ui";
import PrintButton from "./PrintButton";
import s from "../demo.module.css";

export default function Report() {
  const t = totals();
  const hours = byHour();
  return (
    <>
      <PageHead title="Shift report" sub={`Shift A, 06:00 to ${hhmm(NOW)} (shift still running). Ready for the production meeting and for checking orders.`}>
        <PrintButton />
      </PageHead>

      <div className={s.gridTwo}>
        <Card title="Summary">
          <div className={s.facts}>
            <div><span>Built and counted</span><b>{t.built}</b></div>
            <div><span>Loaded into presses</span><b>{t.loaded}</b></div>
            <div><span>Waiting on carts</span><b>{t.waiting}</b></div>
            <div><span>Missing, open</span><b className={s.red}>{t.missing}</b></div>
            <div><span>Found and loaded</span><b>{TYRES.filter((x) => x.status === "found").length}</b></div>
            <div><span>Flagged attempts</span><b>{FLAGS.length}</b></div>
            <div><span>Manual count entries</span><b>0</b></div>
            <div><span>Accounted for</span><b>{t.built - t.missing} of {t.built}</b></div>
          </div>
        </Card>
        <Card title="By hour">
          <table className={s.table}>
            <thead><tr><th>Hour</th><th>Built</th><th>Loaded</th><th>Difference</th></tr></thead>
            <tbody>
              {hours.map((h) => (
                <tr key={h.hour}><td>{h.hour}</td><td>{h.built}</td><td>{h.loaded}</td><td>{h.built - h.loaded > 0 ? `+${h.built - h.loaded}` : h.built - h.loaded}</td></tr>
              ))}
            </tbody>
          </table>
          <p className={s.muted}>A positive difference is normal: tyres rest on a cart before curing.</p>
        </Card>
      </div>

      <Card title="By machine">
        <table className={s.table}>
          <thead><tr><th>Machine</th><th>Size</th><th>Builder</th><th>Built</th><th>Loaded</th><th>Waiting</th><th>Missing</th><th>Flags</th></tr></thead>
          <tbody>
            {MACHINES.map((m) => {
              const mine = TYRES.filter((x) => x.machine === m.id);
              return (
                <tr key={m.id}>
                  <td>{m.id}</td><td>{m.size}</td><td>{builderFor(m.id).name}</td><td>{mine.length}</td>
                  <td>{mine.filter((x) => x.status === "loaded" || x.status === "found").length}</td>
                  <td>{mine.filter((x) => x.status === "waiting").length}</td>
                  <td className={mine.some((x) => x.status === "missing") ? s.red : ""}>{mine.filter((x) => x.status === "missing").length}</td>
                  <td>{FLAGS.filter((f) => f.where === m.id).length}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      <Card title="By press">
        <div className={s.pressGrid}>
          {PRESSES.map((p) => (
            <div key={p.id}><span>{p.id}</span><b>{TYRES.filter((x) => x.press === p.id).length}</b></div>
          ))}
        </div>
      </Card>
    </>
  );
}
