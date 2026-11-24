"use client";

/* Screen 07: green tyre count. The count comes only from each building machine's auto-stitch signal. */

import Link from "next/link";
import { BUILDERS, DATE, HEARTBEAT_LIMIT, MACHINES, MIN_BUILD, NOW, STITCHES, builderFor, byHour, counts, events, hhmm } from "../data";
import { Card, Kpi, PageHead, Pill } from "../ui";
import s from "../demo.module.css";

export default function GreenTyreCount() {
  const c = counts();
  const counted = c.counted;
  const hours = byHour();
  const max = Math.max(...hours.map((h) => h.counted + h.flagged));
  const flags = STITCHES.filter((x) => x.kind === "flagged" || x.late).sort((a, b) => b.at - a.at);
  const ev = events().slice(0, 6);

  return (
    <>
      <PageHead title="Green tyre count"
        sub={`Shift A so far, 06:00 to ${hhmm(NOW)}. Each count comes from a building machine's auto-stitch signal and is linked to the operator's badge. Operators cannot type or change it.`}>
        <span className={s.chip}>Line PL-1 · {DATE.slice(4)}</span>
      </PageHead>

      <div className={`${s.kpis} ${s.kpis4}`}>
        <Kpi label="Counted (verified)" value={counted} sub="Valid stitch, badge logged in" />
        <Kpi label="Flagged attempts" value={c.flagged} tone="amber" sub="Under the minimum build time, not counted" href="#flags" />
        <Kpi label="Credited late" value={c.late} sub={c.late ? "No badge at the stitch, so it went to the first builder signed in" : "None"} href="#flags" />
        <Kpi label="Counters online" value={`${MACHINES.length}/${MACHINES.length}`} tone="green" sub={`Heartbeat every minute, alert after ${HEARTBEAT_LIMIT} min`} href="/demo/devices" />
      </div>

      <p className={s.balance}>
        {c.signals} stitch signals = {counted} counted + {c.flagged} flagged. Scrap is recorded separately and is not part of this count.
      </p>

      <div className={s.gridMain}>
        <Card className={s.flush}>
          <div className={s.flushHead}>
            <h2 className={s.chartTitle}>By builder</h2>
            <Link className={s.cardLink} href="/demo/walkthrough">How the count works</Link>
          </div>
          <table className={`${s.table} ${s.tableBig}`}>
            <thead><tr><th>Builder</th><th>Machine</th><th>Counted</th><th>Flagged</th><th>Status</th></tr></thead>
            <tbody>
              {BUILDERS.map((b) => {
                const k = counts(b.machine);
                const mine = k.counted;
                return (
                  <tr key={b.badge}>
                    <td><b>{b.name}</b><small>Badge {b.badge}</small></td>
                    <td>{b.machine}</td>
                    <td>{mine}</td>
                    <td>{k.flagged ? <span className={s.gapAmber}>{k.flagged}</span> : <span className={s.zero}>0</span>}</td>
                    <td>
                      {k.flagged ? <Pill tone="amber">Flag to review</Pill>
                        : k.late ? <Pill tone="green">Counting · 1 credited late</Pill> : <Pill tone="green">Counting</Pill>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className={s.chartBox}>
            <h2 className={s.chartTitle}>Counts per hour</h2>
            <div className={s.bars} role="img" aria-label="Counted and flagged stitches per hour">
              {hours.map((h) => (
                <div key={h.hour} className={s.barCol}>
                  <div className={s.barStack}>
                    {h.flagged > 0 && <i style={{ height: `${(h.flagged / max) * 100}%` }} className={s.bFlag} title={`${h.flagged} flagged`} />}
                    <i style={{ height: `${(h.counted / max) * 100}%` }} className={s.bBuilt} title={`${h.counted} counted`} />
                  </div>
                  <span>{h.hour}</span>
                  <em>{h.counted}{h.flagged ? ` + ${h.flagged}` : ""}</em>
                </div>
              ))}
            </div>
            <div className={s.legend}>
              <span><i className={s.bBuilt} />Counted</span>
              <span><i className={s.bFlag} />Flagged</span>
              <span>The 10:00 hour is still running.</span>
            </div>
          </div>
        </Card>

        <section className={s.flagPanel} id="flags" aria-labelledby="flags-h">
          <h2 id="flags-h">Flags to review ({flags.length})</h2>
          <div className={s.missList}>
            {flags.map((f) => {
              const b = builderFor(f.machine);
              const isLate = !!f.late;
              return (
                <div key={f.id} className={`${s.flagItem} ${isLate ? s.flagDone : ""}`}>
                  <div className={s.flagTop}>
                    <Pill tone={isLate ? "green" : "amber"}>{isLate ? "Credited late" : "Too soon"}</Pill>
                    <time>{hhmm(f.at)} · {f.machine}</time>
                  </div>
                  <span>{f.reason}</span>
                  {isLate && <em>Counted and credited to {b.name}, the first builder signed in this shift. Logged.</em>}
                  {!isLate && <em>Not counted. The supervisor can approve it as a genuine fast build or reject it. Logged against badge {f.badge}.</em>}
                </div>
              );
            })}
          </div>
          <Link href="/demo/report" className={s.blackBtn}>Open shift report</Link>
        </section>
      </div>

      <div className={s.gridMain}>
        <Card title="How a stitch becomes a count">
          <ol className={s.howSteps}>
            <li><b>Badge log-in</b><span>The operator taps their badge at the building machine. Every count is linked to it.</span></li>
            <li><b>Auto-stitch signal</b><span>Tyode reads the machine&apos;s PLC signal, or the start, stitch and end signals from clip-on auxiliary contacts if there is no PLC. Read only.</span></li>
            <li><b>Checks</b><span>At least the minimum build time for the tyre size since the last stitch on that machine: {MIN_BUILD["185/65 R15"]} min for 185/65 R15, {MIN_BUILD["195/65 R15"]} min for 195/65 R15.</span></li>
            <li><b>Counted and labelled</b><span>A valid stitch is counted and a GT- label prints for the green tyre. A stitch that comes too soon is flagged for the supervisor. A stitch with no badge logged in goes to the first builder who signs in that shift.</span></li>
          </ol>
          <p className={s.muted}>Each counter sends a heartbeat every minute. If none arrives for {HEARTBEAT_LIMIT} minutes an alert is raised, so a counter can&apos;t be quietly unplugged. Together these make the count difficult to cheat.</p>
        </Card>

        <Card title="Latest activity">
          <ol className={s.feed}>
            {ev.map((e, i) => (
              <li key={i} className={s["f_" + e.kind]}>
                <time>{hhmm(e.at)}</time>
                {e.href ? <Link href={e.href}>{e.text}</Link> : <span>{e.text}</span>}
              </li>
            ))}
          </ol>
        </Card>
      </div>
    </>
  );
}
