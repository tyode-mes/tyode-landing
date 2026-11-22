"use client";

/* Screen 07: green tyre count. The count comes only from each building machine's auto-stitch signal. */

import Link from "next/link";
import { BUILDERS, DATE, HEARTBEAT_LIMIT, MACHINES, MIN_GAP, NOW, STITCHES, builderFor, byHour, counts, events, hhmm } from "../data";
import { useDemo } from "../store";
import { Card, Kpi, PageHead, Pill } from "../ui";
import s from "../demo.module.css";

export default function GreenTyreCount() {
  const { st, set } = useDemo();
  const c = counts();
  const approved = st.approvedUnattributed;
  const counted = c.counted + (approved ? 1 : 0), unatt = approved ? 0 : c.unattributed;
  const hours = byHour();
  const max = Math.max(...hours.map((h) => h.counted + h.flagged));
  const flags = STITCHES.filter((x) => x.kind !== "counted").sort((a, b) => b.at - a.at);
  const ev = events().slice(0, 6);

  return (
    <>
      <PageHead title="Green tyre count"
        sub={`Shift A so far, 06:00 to ${hhmm(NOW)}. Each count comes from a building machine's auto-stitch signal and is linked to the operator's badge. Operators cannot type or change it.`}>
        <span className={s.chip}>Line PL-1 · {DATE.slice(4)}</span>
      </PageHead>

      <div className={`${s.kpis} ${s.kpis4}`}>
        <Kpi label="Counted (verified)" value={counted} sub="Valid stitch, badge logged in" />
        <Kpi label="Flagged attempts" value={c.flagged} tone="amber" sub={`Under the ${MIN_GAP} min gap, not counted`} href="#flags" />
        <Kpi label="Unattributed" value={unatt} tone={unatt ? "amber" : undefined} sub={unatt ? "No badge, needs approval" : "None waiting"} href="#flags" />
        <Kpi label="Counters online" value={`${MACHINES.length}/${MACHINES.length}`} tone="green" sub={`Heartbeat every minute, alert after ${HEARTBEAT_LIMIT} min`} href="/demo/devices" />
      </div>

      <p className={s.balance}>
        {c.signals} stitch signals = {counted} counted + {c.flagged} flagged{unatt ? ` + ${unatt} unattributed` : ""}. Scrap is recorded separately and is not part of this count.
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
                const mine = k.counted + (b.machine === "BM-06" && approved ? 1 : 0);
                return (
                  <tr key={b.badge}>
                    <td><b>{b.name}</b><small>Badge {b.badge}</small></td>
                    <td>{b.machine}</td>
                    <td>{mine}</td>
                    <td>{k.flagged ? <span className={s.gapAmber}>{k.flagged}</span> : <span className={s.zero}>0</span>}</td>
                    <td>
                      {k.unattributed && !approved ? <Pill tone="amber">1 unattributed</Pill>
                        : k.flagged ? <Pill tone="amber">Flag to review</Pill> : <Pill tone="green">Counting</Pill>}
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
          <h2 id="flags-h">Flags and approvals ({flags.length})</h2>
          <div className={s.missList}>
            {flags.map((f) => {
              const b = builderFor(f.machine);
              const isU = f.kind === "unattributed";
              return (
                <div key={f.id} className={`${s.flagItem} ${isU && approved ? s.flagDone : ""}`}>
                  <div className={s.flagTop}>
                    <Pill tone={isU ? (approved ? "green" : "amber") : "amber"}>{isU ? (approved ? "Approved" : "No badge") : "Too soon"}</Pill>
                    <time>{hhmm(f.at)} · {f.machine}</time>
                  </div>
                  <span>{f.reason}</span>
                  {isU && !approved && (
                    <button type="button" className={s.btnSmall} onClick={() => set((x) => ({ ...x, approvedUnattributed: true }))}>
                      Approve for {b.name}
                    </button>
                  )}
                  {isU && approved && <em>Approved by the shift supervisor and credited to {b.name}. Logged.</em>}
                  {!isU && <em>Not counted. Logged against badge {f.badge}.</em>}
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
            <li><b>Auto-stitch signal</b><span>Tyode reads the machine&apos;s PLC signal, or the stitch signal or button if there is no PLC. Read only.</span></li>
            <li><b>Checks</b><span>At least {MIN_GAP} minutes since the last stitch on that machine, and a badge logged in.</span></li>
            <li><b>Counted and labelled</b><span>A valid stitch is counted and a GT- label prints for the green tyre. Anything else is flagged or held for approval.</span></li>
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
