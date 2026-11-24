"use client";

/* Overview: the demo's home screen, from the Figma prototype. One look at the line: counts, alerts,
   holds and devices, the tyres at each pilot stage, what needs attention and the latest activity.
   Every number comes from the same sample data and demo state as the other screens, so approving a
   report elsewhere changes it here too. */

import Link from "next/link";
import { COOL, DEVICES, LINE, NOW, PEOPLE, TYRES, counts, events, hhmm } from "./data";
import { heldList, openAlerts, useDemo } from "./store";
import { PageHead, Pill } from "./ui";
import s from "./demo.module.css";

const greeting = (m: number) => (m < 12 * 60 ? "Good morning" : m < 17 * 60 ? "Good afternoon" : "Good evening");

export default function Overview() {
  const { st } = useDemo();
  const c = counts();
  const counted = c.counted;
  const uncounted = c.flagged;
  const open = openAlerts(st);
  const high = open.filter((a) => a.severity === "high");
  const held = heldList(st);
  const online = DEVICES.filter((d) => d.status === "Online").length;

  /* tyres at each pilot stage; a held tyre is counted under Holds, not in the flow */
  const isHeld = new Set(held.map((t) => t.serial));
  const at = (stage: string) => TYRES.filter((t) => t.stage === stage && !isHeld.has(t.serial)).length;
  const stages = [
    { label: "Building", n: counted, sub: "counted this shift", href: "/demo/count" },
    { label: "Waiting to cure", n: at("built"), sub: "tyres", href: "/demo/holds" },
    { label: "Curing", n: at("curing"), sub: "in presses", href: "/demo/holds" },
    { label: "Waiting for inspection", n: at("inspection"), sub: "tyres", href: "/demo/station/inspect" },
    { label: "Released to storage", n: at("released"), sub: "passed inspection", href: "/demo/report" },
  ];

  /* what a person has to act on, most urgent first */
  const todo: { tone: "red" | "amber" | "grey"; tag: string; title: string; sub: string; href: string }[] = [];
  if (st.report === "draft")
    todo.push({ tone: "red", tag: "High", title: "P-03 ran below cure temperature", sub: `Investigation report ready to review · ${COOL.length} tyres affected`, href: "/demo/alerts" });
  if (c.flagged)
    todo.push({ tone: "amber", tag: "Review", title: `${c.flagged} build cycle${c.flagged > 1 ? "s" : ""} not counted`, sub: "Shorter than the minimum build time · supervisor to approve or reject", href: "/demo/count#flags" });
  /* holds: one row per tyre held at inspection, one row per hold placed on a group of tyres */
  held.filter((t) => t.stage === "held").forEach((t) =>
    todo.push({ tone: "grey", tag: "Hold", title: `${t.serial} on hold`, sub: "Weight above spec · waiting for an engineer", href: `/demo/tyres?serial=${t.serial}` }));
  const coolHeld = held.filter((t) => t.stage !== "held" && st.report === "approved" && COOL.includes(t)).length;
  if (coolHeld)
    todo.push({ tone: "grey", tag: "Hold", title: `${coolHeld} tyres on hold from investigation A-207`, sub: "Cured below 155 °C in P-03 · waiting for an engineer to release or scrap", href: "/demo/holds" });
  const batchHeld = held.filter((t) => t.stage !== "held" && !(st.report === "approved" && COOL.includes(t))).length;
  if (batchHeld)
    todo.push({ tone: "grey", tag: "Hold", title: `${batchHeld} tyres on hold from batch C-1042`, sub: "Held from the batch search · waiting for an engineer", href: "/demo/holds" });

  const feed = events().slice(0, 5);

  return (
    <>
      <PageHead title={`${greeting(NOW)}, ${PEOPLE.engineer.name}`}
        sub={`Line ${LINE.id}, Shift A so far (06:00 to ${hhmm(NOW)}). What is happening on the line and what needs your attention.`}>
        <span className={s.chip}>{LINE.label}</span>
      </PageHead>

      <div className={s.ovKpis}>
        <Link href="/demo/count" className={s.ovKpi}>
          <span>Tyres counted</span><b>{counted}</b>
          <em>{uncounted ? `${uncounted} cycle${uncounted > 1 ? "s" : ""} not counted, waiting for review` : "Every cycle accounted for"}</em>
        </Link>
        <Link href="/demo/alerts" className={`${s.ovKpi} ${open.length ? s.ovAmber : ""}`}>
          <span>Open alerts</span><b>{open.length}</b>
          <em>{high.length ? `${high.length} high: investigation report ready` : open.length ? "None high" : "Nothing open"}</em>
        </Link>
        <Link href="/demo/holds" className={s.ovKpi}>
          <span>Tyres on hold</span><b>{held.length}</b>
          <em>{held.length ? "Waiting for an engineer" : "None held"}</em>
        </Link>
        <Link href="/demo/devices" className={`${s.ovKpi} ${online === DEVICES.length ? s.ovGreen : ""}`}>
          <span>Devices online</span><b>{online}/{DEVICES.length}</b>
          <em>All counters sending a heartbeat</em>
        </Link>
      </div>

      <section className={s.card}>
        <div className={s.cardHead}>
          <h2>Line by stage</h2>
          <span className={s.muted}>Pilot stages: green tyre to inspection</span>
        </div>
        <ol className={s.ovStages}>
          {stages.map((x) => (
            <li key={x.label}>
              <Link href={x.href}><span>{x.label}</span><b>{x.n}</b><em>{x.sub}</em></Link>
            </li>
          ))}
        </ol>
      </section>

      <div className={s.ovGrid}>
        <section className={`${s.card} ${todo.length ? s.ovAttn : ""}`}>
          <div className={s.cardHead}><h2>Needs attention</h2></div>
          {todo.length ? (
            <ul className={s.ovTodo}>
              {todo.map((x) => (
                <li key={x.title}>
                  <Pill tone={x.tone}>{x.tag}</Pill>
                  <div><b>{x.title}</b><span>{x.sub}</span></div>
                  <Link href={x.href} aria-label={`Open: ${x.title}`}>Open</Link>
                </li>
              ))}
            </ul>
          ) : <p className={s.muted}>Nothing needs you right now.</p>}
        </section>

        <section className={s.card}>
          <div className={s.cardHead}><h2>Quick actions</h2></div>
          <div className={s.ovActions}>
            <Link href="/demo/ask" className={s.ovAsk}>Ask Tyode about a tyre, batch or press…</Link>
            <Link href="/demo/tyres">Look up a tyre</Link>
            <Link href="/demo/holds">Search a batch and hold</Link>
            <Link href="/demo/report">Open shift report</Link>
          </div>
        </section>
      </div>

      <section className={s.card}>
        <div className={s.cardHead}><h2>Latest activity</h2></div>
        <ul className={s.feed}>
          {feed.map((e, i) => (
            <li key={i}>
              <time>{hhmm(e.at)}</time>
              {e.href ? <Link href={e.href}>{e.text}</Link> : <span>{e.text}</span>}
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
