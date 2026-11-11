"use client";

import { useState } from "react";
import Link from "next/link";
import { TYRES, WINDOW, builderFor, hhmm } from "../data";
import { Card, PageHead, Pill } from "../ui";
import s from "../demo.module.css";

type Resolution = { how: "found" | "scrap"; text: string };

export default function Missing() {
  const open = TYRES.filter((t) => t.status === "missing");
  const found = TYRES.filter((t) => t.status === "found");
  const [res, setRes] = useState<Record<string, Resolution>>({});

  return (
    <>
      <PageHead title="Missing tyres"
        sub={`A tyre is listed here when it was counted at a building machine but not scanned into a press within ${WINDOW} minutes. Each case names the tyre, the machine, the builder and the time.`} />

      <div className={s.cases}>
        {open.map((t) => {
          const b = builderFor(t.machine);
          const r = res[t.serial];
          return (
            <Card key={t.serial} className={r ? s.caseDone : s.caseOpen}>
              <div className={s.caseHead}>
                <div>
                  <Pill tone={r ? "green" : "red"}>{r ? (r.how === "found" ? "Found" : "Closed") : "Open"}</Pill>
                  <h2 className={s.caseId}>{t.serial}</h2>
                  <p className={s.muted}>{t.size} · built on {t.machine} by {b.name} (badge {b.badge}) at {hhmm(t.builtAt)}</p>
                </div>
                <Link className={s.cardLink} href={`/demo/tyres?serial=${t.serial}`}>Full record</Link>
              </div>
              <ol className={s.timeline}>
                <li className={s.tlOk}><time>{hhmm(t.builtAt)}</time><span>Build cycle complete on {t.machine} and tyre seen at the unload point. Counted.</span></li>
                <li className={s.tlOk}><time>{hhmm(t.builtAt)}</time><span>Label {t.serial} printed at {t.machine}. Unload clip saved.</span></li>
                <li className={s.tlBad}><time>{hhmm(t.builtAt + WINDOW)}</time><span>No scan at any press within {WINDOW} minutes. Listed as missing.</span></li>
                {r && <li className={s.tlOk}><time>now</time><span>{r.text}</span></li>}
              </ol>
              <div className={s.where}>
                <div><span>Last seen</span><b>{t.machine} unload point</b></div>
                <div><span>Likely cart</span><b>{t.cart}</b></div>
                <div><span>Shift</span><b>A</b></div>
              </div>
              {!r && (
                <div className={s.actionsRow}>
                  <button type="button" className={s.btn} onClick={() => setRes((x) => ({ ...x, [t.serial]: { how: "found", text: `Found on ${t.cart} and sent for loading. The case closes when the press scan comes in.` } }))}>
                    Mark as found
                  </button>
                  <button type="button" className={s.btnGhost} onClick={() => setRes((x) => ({ ...x, [t.serial]: { how: "scrap", text: "Closed as scrapped by the shift supervisor, with a reason recorded against the tyre." } }))}>
                    Close as scrapped
                  </button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Card title="Resolved this shift">
        <table className={s.table}>
          <thead><tr><th>Tyre</th><th>Built</th><th>Machine</th><th>Outcome</th></tr></thead>
          <tbody>
            {found.map((t) => (
              <tr key={t.serial}>
                <td><Link href={`/demo/tyres?serial=${t.serial}`}>{t.serial}</Link></td>
                <td>{hhmm(t.builtAt)}</td>
                <td>{t.machine}</td>
                <td>{t.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
