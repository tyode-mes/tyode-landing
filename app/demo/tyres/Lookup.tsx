"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FLAGS, TYRES, WINDOW, builderFor, hhmm } from "../data";
import { Card, PageHead, Pill } from "../ui";
import s from "../demo.module.css";

const tone = { loaded: "green", found: "green", waiting: "blue", missing: "red" } as const;
const word = { loaded: "Loaded", found: "Found and loaded", waiting: "On a cart", missing: "Missing" } as const;

export default function Lookup() {
  const serial = useSearchParams().get("serial")?.toUpperCase() ?? "";
  const t = serial ? TYRES.find((x) => x.serial === serial) : undefined;

  if (serial && !t) {
    return (
      <>
        <PageHead title="Tyre lookup" />
        <Card><p className={s.body}>No tyre with the label <b>{serial}</b> was built this shift. Labels this shift run from GT-2611-0001 to {TYRES[TYRES.length - 1].serial}.</p></Card>
      </>
    );
  }

  if (t) {
    const b = builderFor(t.machine);
    const dup = FLAGS.find((f) => f.serial === t.serial);
    return (
      <>
        <PageHead title={t.serial} sub={`${t.size} green tyre · Shift A`}>
          <Link className={s.btnGhost} href="/demo/tyres">All tyres</Link>
        </PageHead>
        <div className={s.gridTwo}>
          <Card title="Record">
            <div className={s.facts}>
              <div><span>Status</span><b><Pill tone={tone[t.status]}>{word[t.status]}</Pill></b></div>
              <div><span>Built on</span><b>{t.machine}</b></div>
              <div><span>Builder</span><b>{b.name} · badge {b.badge}</b></div>
              <div><span>Built at</span><b>{hhmm(t.builtAt)}</b></div>
              <div><span>Cart</span><b>{t.cart}</b></div>
              <div><span>Press</span><b>{t.press ?? "Not yet"}</b></div>
              <div><span>Loaded at</span><b>{t.loadedAt ? hhmm(t.loadedAt) : "—"}</b></div>
              <div><span>Time on cart</span><b>{t.loadedAt ? `${Math.round(t.loadedAt - t.builtAt)} min` : "—"}</b></div>
            </div>
          </Card>
          <Card title="What happened">
            <ol className={s.timeline}>
              <li className={s.tlOk}><time>{hhmm(t.builtAt)}</time><span>Build cycle complete on {t.machine}, read from the machine signal.</span></li>
              <li className={s.tlOk}><time>{hhmm(t.builtAt)}</time><span>Tyre seen leaving the drum at the unload point. Counted for badge {b.badge}.</span></li>
              <li className={s.tlOk}><time>{hhmm(t.builtAt)}</time><span>Label {t.serial} printed at {t.machine}.</span></li>
              {t.status === "found" && <li className={s.tlBad}><time>{hhmm(t.builtAt + WINDOW)}</time><span>Not loaded within {WINDOW} minutes. Listed as missing.</span></li>}
              {t.status === "found" && <li className={s.tlOk}><time>{hhmm(t.loadedAt! - 6)}</time><span>{t.note?.split(", then")[0]}.</span></li>}
              {t.loadedAt && <li className={s.tlOk}><time>{hhmm(t.loadedAt)}</time><span>Scanned into {t.press} at press loading. Matches its build.</span></li>}
              {dup && <li className={s.tlBad}><time>{hhmm(dup.at)}</time><span>Scanned again at {dup.where}. Rejected as a duplicate.</span></li>}
              {t.status === "waiting" && <li className={s.tlWait}><time>until {hhmm(t.builtAt + WINDOW)}</time><span>Waiting on {t.cart}. Expected at a press within {WINDOW} minutes of its build.</span></li>}
              {t.status === "missing" && <li className={s.tlBad}><time>{hhmm(t.builtAt + WINDOW)}</time><span>No press scan within {WINDOW} minutes. Listed as missing.</span></li>}
            </ol>
          </Card>
        </div>
      </>
    );
  }

  const recent = [...TYRES].reverse().slice(0, 40);
  return (
    <>
      <PageHead title="Tyre lookup" sub={`Every tyre built this shift, newest first. Search by its label in the bar above, or open one below. ${TYRES.length} tyres so far.`} />
      <Card>
        <table className={s.table}>
          <thead><tr><th>Label</th><th>Size</th><th>Machine</th><th>Built</th><th>Press</th><th>Status</th></tr></thead>
          <tbody>
            {recent.map((x) => (
              <tr key={x.serial}>
                <td><Link href={`/demo/tyres?serial=${x.serial}`}>{x.serial}</Link></td>
                <td>{x.size}</td>
                <td>{x.machine}</td>
                <td>{hhmm(x.builtAt)}</td>
                <td>{x.press ?? "—"}</td>
                <td><Pill tone={tone[x.status]}>{word[x.status]}</Pill></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
