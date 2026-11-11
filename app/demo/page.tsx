import Link from "next/link";
import { BUILDERS, FLAGS, MACHINES, NOW, PRESSES, TYRES, WINDOW, builderFor, byHour, events, hhmm, totals } from "./data";
import { Card, Kpi, PageHead, Pill } from "./ui";
import s from "./demo.module.css";

export default function Overview() {
  const t = totals();
  const missing = TYRES.filter((x) => x.status === "missing");
  const hours = byHour();
  const max = Math.max(...hours.map((h) => Math.max(h.built, h.loaded)));
  const ev = events().slice(0, 5);
  const perMachine = MACHINES.map((m) => ({ ...m, built: TYRES.filter((x) => x.machine === m.id).length }));
  const waitingByCart = ["Cart A", "Cart B", "Cart C"].map((c) => ({ c, n: TYRES.filter((x) => x.status === "waiting" && x.cart === c).length }));

  return (
    <>
      <PageHead title="Overview" sub={`Shift A so far, 06:00 to ${hhmm(NOW)}. Every number below comes from the machines and the press scanners, not from anyone typing it in.`} />

      <div className={s.kpis}>
        <Kpi label="Built and counted" value={t.built} sub="Machine and sensor agreed" />
        <Kpi label="Loaded into presses" value={t.loaded} sub="Scanned at press loading" />
        <Kpi label="Waiting on carts" value={t.waiting} sub={`Within ${WINDOW} minutes of build`} />
        <Kpi label="Missing" value={t.missing} tone="red" sub="Counted, never loaded" href="/demo/missing" />
        <Kpi label="Flagged attempts" value={FLAGS.length} tone="amber" sub="Not counted" href="/demo/alerts" />
      </div>
      <p className={s.balance}>
        {t.built} built = {t.loaded} loaded + {t.waiting} waiting + {t.missing} missing. Every counted tyre is accounted for.
      </p>

      <div className={s.gridMain}>
        <Card title="Floor" action={<Link className={s.cardLink} href="/demo/walkthrough">How the count works</Link>}>
          <svg className={s.plan} viewBox="0 0 780 360" role="img" aria-label="Floor plan: six building machines, three green tyre carts, twelve curing presses">
            <defs>
              <linearGradient id="gBuild" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f4f8ff" /><stop offset="1" stopColor="#e6eeff" /></linearGradient>
              <linearGradient id="gCart" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#f8f8fa" /><stop offset="1" stopColor="#eeeff2" /></linearGradient>
              <linearGradient id="gCure" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fffaf3" /><stop offset="1" stopColor="#fdecd8" /></linearGradient>
              <radialGradient id="gPress" cx=".35" cy=".3" r=".8"><stop offset="0" stopColor="#4a5468" /><stop offset="1" stopColor="#1c222d" /></radialGradient>
              <linearGradient id="gRing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#3b82f6" /><stop offset="1" stopColor="#7c3aed" /></linearGradient>
              <linearGradient id="gCard" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffffff" /><stop offset="1" stopColor="#f7f8fa" /></linearGradient>
            </defs>
            <rect x="10" y="10" width="300" height="340" rx="14" className={s.zBuild} />
            <text x="26" y="34" className={`${s.zoneT} ${s.zBuildT}`}>Building hall</text>
            {perMachine.map((m, i) => {
              const x = 26 + (i % 2) * 140, y = 50 + Math.floor(i / 2) * 98;
              return (
                <Link key={m.id} href={`/demo/builders#${m.id}`}>
                  <g className={s.mach}>
                    <rect x={x} y={y} width="128" height="84" rx="10" className={m.status === "alert" ? s.machAlert : ""} />
                    <circle cx={x + 16} cy={y + 18} r="4.5" className={s["st_" + m.status]} />
                    <text x={x + 28} y={y + 22} className={s.machId}>{m.id}</text>
                    <text x={x + 14} y={y + 46} className={s.machBig}>{m.built}</text>
                    <text x={x + 14} y={y + 66} className={s.machSub}>{m.status === "idle" ? "Stopped · size change" : m.size}</text>
                  </g>
                </Link>
              );
            })}

            <rect x="326" y="10" width="128" height="340" rx="14" className={s.zCart} />
            <text x="342" y="34" className={s.zoneT}>Carts</text>
            {waitingByCart.map((c, i) => (
              <g key={c.c} className={s.cart}>
                <rect x="340" y={50 + i * 98} width="100" height="84" rx="9" />
                <text x="352" y={72 + i * 98} className={s.machId}>{c.c}</text>
                <text x="352" y={96 + i * 98} className={s.machBig}>{c.n}</text>
                <text x="352" y={116 + i * 98} className={s.machSub}>waiting</text>
              </g>
            ))}

            <rect x="470" y="10" width="300" height="340" rx="14" className={s.zCure} />
            <text x="486" y="34" className={`${s.zoneT} ${s.zCureT}`}>Curing hall</text>
            {PRESSES.map((p, i) => {
              const x = 486 + (i % 4) * 70, y = 50 + Math.floor(i / 4) * 98;
              const n = TYRES.filter((x2) => x2.press === p.id).length;
              return (
                <g key={p.id} className={s.press}>
                  <circle cx={x + 30} cy={y + 34} r="26" className={s["pr_" + p.status]} />
                  <circle cx={x + 30} cy={y + 34} r="13" className={s.prHole} />
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

        <Card title="Needs attention" className={s.attention}>
          <p className={s.muted}>Tyres that were counted but never reached a press, and attempts that were stopped.</p>
          <div className={s.attnList}>
            {missing.map((m) => (
              <Link key={m.serial} href="/demo/missing" className={s.attnItem}>
                <span className={`${s.dotBig} ${s.dRed}`} aria-hidden="true" />
                <div>
                  <b>{m.serial} is missing</b>
                  <span>Built on {m.machine} by {builderFor(m.machine).name} at {hhmm(m.builtAt)}. Not loaded into any press.</span>
                </div>
                <em aria-hidden="true">›</em>
              </Link>
            ))}
            <Link href="/demo/alerts" className={s.attnItem}>
              <span className={`${s.dotBig} ${s.dAmber}`} aria-hidden="true" />
              <div>
                <b>{FLAGS.length} attempts flagged</b>
                <span>Cycles or scans that did not match a real tyre. None of them were counted.</span>
              </div>
              <em aria-hidden="true">›</em>
            </Link>
          </div>
        </Card>
      </div>

      <div className={s.gridThree}>
        <Card title="Built and loaded, by hour">
          <div className={s.bars} role="img" aria-label="Tyres built and loaded per hour">
            {hours.map((h) => (
              <div key={h.hour} className={s.barCol}>
                <div className={s.barPair}>
                  <i style={{ height: `${(h.built / max) * 100}%` }} className={s.bBuilt} title={`${h.built} built`} />
                  <i style={{ height: `${(h.loaded / max) * 100}%` }} className={s.bLoaded} title={`${h.loaded} loaded`} />
                </div>
                <span>{h.hour}</span>
                <em>{h.built} / {h.loaded}</em>
              </div>
            ))}
          </div>
          <div className={s.legend}>
            <span><i className={s.bBuilt} />Built</span>
            <span><i className={s.bLoaded} />Loaded</span>
            <span>The 10:00 hour is still running.</span>
          </div>
        </Card>
        <Card title="By builder" action={<Link className={s.cardLink} href="/demo/builders">All builders</Link>}>
          <table className={s.table}>
            <thead><tr><th>Builder</th><th>Built</th><th>Loaded</th><th>Missing</th></tr></thead>
            <tbody>
              {BUILDERS.map((b) => {
                const mine = TYRES.filter((x) => x.badge === b.badge);
                const miss = mine.filter((x) => x.status === "missing").length;
                return (
                  <tr key={b.badge}>
                    <td>{b.name}<small>{b.machine} · badge {b.badge}</small></td>
                    <td>{mine.length}</td>
                    <td>{mine.filter((x) => x.status === "loaded" || x.status === "found").length}</td>
                    <td className={miss ? s.red : ""}>{miss}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
