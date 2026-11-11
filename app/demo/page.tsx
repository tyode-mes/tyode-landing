import Link from "next/link";
import { BUILDERS, FLAGS, MACHINES, NOW, PRESSES, TYRES, WINDOW, builderFor, byHour, events, hhmm, totals } from "./data";
import { Card, Kpi, PageHead } from "./ui";
import s from "./demo.module.css";

export default function Overview() {
  const t = totals();
  const missing = TYRES.filter((x) => x.status === "missing");
  const hours = byHour();
  const max = Math.max(...hours.map((h) => Math.max(h.built, h.loaded)));
  const ev = events().slice(0, 6);
  const perMachine = MACHINES.map((m) => ({ ...m, built: TYRES.filter((x) => x.machine === m.id).length }));
  const waitingByCart = ["Cart A", "Cart B", "Cart C"].map((c) => ({ c, n: TYRES.filter((x) => x.status === "waiting" && x.cart === c).length }));

  return (
    <>
      <PageHead title="Green tyre count" sub={`Shift A so far, 06:00 to ${hhmm(NOW)}. Every number comes from the machines and the press scanners, not from anyone typing it in.`}>
        <span className={s.chip}>Shift A · 11 Nov 2026</span>
      </PageHead>

      <div className={s.kpis}>
        <Kpi label="Built (verified)" value={t.built} sub="Machine and sensor agreed" />
        <Kpi label="Received at press" value={t.loaded} sub="Scanned at press loading" />
        <Kpi label="Waiting on carts" value={t.waiting} sub={`Within ${WINDOW} minutes of build`} />
        <Kpi label="Missing" value={t.missing} filled sub="Counted, never reached a press" href="/demo/missing" />
        <Kpi label="Flagged attempts" value={FLAGS.length} tone="amber" sub="Stopped, not counted" href="/demo/alerts" />
      </div>

      <p className={s.balance}>
        {t.built} built = {t.loaded} loaded + {t.waiting} waiting + {t.missing} missing. Every counted tyre is accounted for.
      </p>

      <div className={s.gridMain}>
        <Card className={s.flush}>
          <div className={s.flushHead}>
            <h2 className={s.chartTitle}>By builder</h2>
            <Link className={s.cardLink} href="/demo/builders">All builders</Link>
          </div>
          <table className={`${s.table} ${s.tableBig}`}>
            <thead><tr><th>Builder</th><th>Machine</th><th>Built</th><th>Received</th><th>On cart</th><th>Missing</th></tr></thead>
            <tbody>
              {BUILDERS.map((b) => {
                const mine = TYRES.filter((x) => x.badge === b.badge);
                const miss = mine.filter((x) => x.status === "missing").length;
                return (
                  <tr key={b.badge}>
                    <td><b>{b.name}</b><small>Badge {b.badge}</small></td>
                    <td>{b.machine}</td>
                    <td>{mine.length}</td>
                    <td>{mine.filter((x) => x.status === "loaded" || x.status === "found").length}</td>
                    <td>{mine.filter((x) => x.status === "waiting").length}</td>
                    <td>{miss ? <span className={s.gap}>−{miss}</span> : <span className={s.zero}>0</span>}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className={s.chartBox}>
            <h2 className={s.chartTitle}>Built vs received per hour</h2>
            <div className={s.bars} role="img" aria-label="Tyres built and received at a press, per hour">
              {hours.map((h) => (
                <div key={h.hour} className={s.barCol}>
                  <div className={s.barPair}>
                    <i style={{ height: `${(h.built / max) * 100}%` }} className={s.bBuilt} title={`${h.built} built`} />
                    <i style={{ height: `${(h.loaded / max) * 100}%` }} className={s.bLoaded} title={`${h.loaded} received`} />
                  </div>
                  <span>{h.hour}</span>
                  <em>{h.built} / {h.loaded}</em>
                </div>
              ))}
            </div>
            <div className={s.legend}>
              <span><i className={s.bBuilt} />Built</span>
              <span><i className={s.bLoaded} />Received at press</span>
              <span>The 10:00 hour is still running.</span>
            </div>
          </div>
        </Card>

        <section className={s.missPanel} aria-labelledby="miss-h">
          <h2 id="miss-h">Missing serials ({missing.length})</h2>
          <div className={s.missList}>
            {missing.map((m) => (
              <Link key={m.serial} href="/demo/missing" className={s.missItem}>
                <b>{m.serial}</b>
                <span>{builderFor(m.machine).name} · {m.machine}</span>
                <em>Built {hhmm(m.builtAt)} · not at any press</em>
              </Link>
            ))}
            <Link href="/demo/alerts" className={`${s.missItem} ${s.missFlag}`}>
              <b>{FLAGS.length} flagged attempts</b>
              <span>Cycles or scans that didn&apos;t match a real tyre</span>
              <em>None of them were counted</em>
            </Link>
          </div>
          <Link href="/demo/report" className={s.blackBtn}>Open shift report</Link>
        </section>
      </div>

      <div className={s.gridMain}>
        <Card title="Floor" action={<Link className={s.cardLink} href="/demo/walkthrough">How the count works</Link>}>
          <svg className={s.plan} viewBox="0 0 780 360" role="img" aria-label="Floor plan: six building machines, three green tyre carts, twelve curing presses">
            <rect x="10" y="10" width="300" height="340" rx="14" className={s.zone} />
            <text x="26" y="34" className={s.zoneT}>Building hall</text>
            {perMachine.map((m, i) => {
              const x = 26 + (i % 2) * 140, y = 50 + Math.floor(i / 2) * 98;
              return (
                <Link key={m.id} href={`/demo/builders#${m.id}`}>
                  <g className={s.mach}>
                    <rect x={x} y={y} width="128" height="84" rx="10" className={m.status === "alert" ? s.machAlert : ""} />
                    <circle cx={x + 16} cy={y + 18} r="4.5" className={s["st_" + m.status]} />
                    <text x={x + 28} y={y + 22} className={s.machId}>{m.id}</text>
                    <text x={x + 14} y={y + 50} className={s.machBig}>{m.built}</text>
                    <text x={x + 14} y={y + 70} className={s.machSub}>{m.status === "idle" ? "Stopped · size change" : m.size}</text>
                  </g>
                </Link>
              );
            })}

            <rect x="326" y="10" width="128" height="340" rx="14" className={s.zone} />
            <text x="342" y="34" className={s.zoneT}>Carts</text>
            {waitingByCart.map((c, i) => (
              <g key={c.c} className={s.cart}>
                <rect x="340" y={50 + i * 98} width="100" height="84" rx="10" />
                <text x="352" y={72 + i * 98} className={s.machId}>{c.c}</text>
                <text x="352" y={100 + i * 98} className={s.machBig}>{c.n}</text>
                <text x="352" y={120 + i * 98} className={s.machSub}>waiting</text>
              </g>
            ))}

            <rect x="470" y="10" width="300" height="340" rx="14" className={s.zone} />
            <text x="486" y="34" className={s.zoneT}>Curing hall</text>
            {PRESSES.map((p, i) => {
              const x = 486 + (i % 4) * 70, y = 50 + Math.floor(i / 4) * 98;
              const n = TYRES.filter((x2) => x2.press === p.id).length;
              return (
                <g key={p.id} className={s.press}>
                  <circle cx={x + 30} cy={y + 34} r="26" className={s["pr_" + p.status]} />
                  <circle cx={x + 30} cy={y + 34} r="12" className={s.prHole} />
                  <text x={x + 30} y={y + 78} textAnchor="middle" className={s.machId}>{p.id}</text>
                  <text x={x + 30} y={y + 92} textAnchor="middle" className={s.machSub}>{p.status === "idle" ? "idle" : `${n} loaded`}</text>
                </g>
              );
            })}
            <path d="M310 180 H326" className={s.flow} />
            <path d="M454 180 H470" className={s.flow} />
          </svg>
          <div className={s.legend}>
            <span><i className={s.st_running} />Running</span>
            <span><i className={s.st_alert} />Flagged in the last 15 min</span>
            <span><i className={s.st_idle} />Idle</span>
          </div>
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
