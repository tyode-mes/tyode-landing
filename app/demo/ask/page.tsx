"use client";

/* Screen 06: Ask Tyode. Plain-language questions, answered only from Tyode's records, with the
   sources listed under each answer. When the records can't answer, it says so instead of guessing. */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { COOL, HERO, STITCHES, builderFor, counts, hhmm, tyre } from "../data";
import { holdOf, useDemo, type DemoState } from "../store";
import { PageHead, Pill } from "../ui";
import s from "../demo.module.css";

type Src = { label: string; href?: string };
type Answer = { text: string; sources: Src[]; unknown?: boolean };
type Msg = { id: number; q: string; a?: Answer };

const SUGGESTED = [
  "Which tyres were cured in P-03 below 155 °C today?",
  `Who built ${HERO}?`,
  `Which batches went into ${HERO}?`,
  "How many tyres did BM-04 count this shift?",
  `Is ${HERO} on hold?`,
  "What was our scrap rate last month?",
];

function answer(q: string, st: DemoState): Answer {
  const x = q.toLowerCase();
  const serial = q.toUpperCase().match(/GT-\d{4}-\d{4}/)?.[0] ?? (x.includes("0427") ? HERO : undefined);
  const machine = q.toUpperCase().match(/BM-0?(\d)/);
  if (x.includes("scrap")) return { unknown: true, sources: [], text: "I don't have enough data to answer that. Scrap is recorded outside Tyode, and these records start with this shift." };
  if ((x.includes("p-03") || x.includes("p03")) && (x.includes("155") || x.includes("cool") || x.includes("below") || x.includes("temperature"))) {
    return {
      text: `${COOL.length} tyres, cured in four cycles between 09:05 and 09:59: ${COOL.map((t) => t.serial.slice(-4)).join(", ")} (all GT-2611-). Their peaks were 147 °C to 149 °C against a minimum of 155 °C. Alert A-207 was raised at 09:52.`,
      sources: [{ label: "P-03 cure log 09:05–09:59" }, { label: "Alert A-207", href: "/demo/alerts" }, ...COOL.slice(0, 3).map((t) => ({ label: t.serial, href: `/demo/tyres?serial=${t.serial}` })), { label: `+${COOL.length - 3} cure records` }],
    };
  }
  if (machine && (x.includes("how many") || x.includes("count"))) {
    const id = `BM-0${machine[1]}`, c = counts(id), b = builderFor(id);
    if (!b) return { unknown: true, sources: [], text: `There is no machine ${id} on line PL-1.` };
    return {
      text: `${id} counted ${c.counted} tyres this shift, all by ${b.name} (badge ${b.badge}).${c.flagged ? ` ${c.flagged} more stitch${c.flagged > 1 ? "es were" : " was"} flagged for coming sooner than the minimum build time for the tyre size, and not counted.` : ""}${c.late ? ` ${c.late} of the counted stitches had no badge logged in, so ${c.late > 1 ? "they were" : "it was"} credited to the first builder who signed in that shift.` : ""}`,
      sources: [{ label: `${id} stitch log, Shift A` }, { label: `Badge log ${id}` }, { label: "Green tyre count", href: "/demo/count" }],
    };
  }
  if (serial) {
    const t = tyre(serial);
    if (!t) return { unknown: true, sources: [], text: `I can't find a tyre labelled ${serial} in Tyode's records.` };
    const src = [{ label: t.serial, href: `/demo/tyres?serial=${t.serial}` }];
    if (x.includes("batch") || x.includes("compound") || x.includes("material")) {
      return { text: `${t.serial} has tread from ${t.batches.tread}${t.batches.tread === "C-1042" ? " (marked suspect by the lab today)" : ""}, sidewall from ${t.batches.sidewall} and inner liner from ${t.batches.liner}.`, sources: [...src, { label: `Batch ${t.batches.tread}`, href: `/demo/holds?batch=${t.batches.tread}` }, { label: `Build record ${t.machine}` }] };
    }
    if (x.includes("hold") || x.includes("held") || x.includes("release")) {
      const h = holdOf(t.serial, st);
      return { text: h ? `Yes. ${h}` : `No. ${t.serial} is not on hold.${COOL.includes(t) ? " It is one of the 8 tyres in investigation report A-207, which an engineer has not approved yet." : ""}`, sources: [...src, { label: "Holds log", href: "/demo/holds" }, ...(COOL.includes(t) ? [{ label: "Report A-207", href: "/demo/alerts" }] : [])] };
    }
    const sx = STITCHES.find((y) => y.serial === t.serial)!;
    const b = t.badge ? builderFor(t.machine) : undefined;
    return { text: b ? `${b.name}, badge ${b.badge}, on ${t.machine}. It was stitched at ${hhmm(t.builtAt)} and counted from signal ${sx.id}.${sx.late ? " No badge was logged in at the stitch, so it was credited to the first builder who signed in that shift." : ""}` : `It was stitched on ${t.machine} at ${hhmm(t.builtAt)} and counted from signal ${sx.id}.`, sources: [...src, { label: `Stitch ${sx.id}` }, { label: `Badge log ${t.machine}` }] };
  }
  return { unknown: true, sources: [], text: "I couldn't find records that answer that, so I won't guess. Try asking about a tyre label, a building machine, a press or a compound batch." };
}

export default function Ask() {
  const { st } = useDemo();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [q, setQ] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const counter = useRef(0);
  useEffect(() => { end.current?.scrollIntoView({ behavior: "smooth", block: "end" }); }, [msgs]);

  const ask = (text: string) => {
    if (!text.trim()) return;
    const id = ++counter.current;
    setMsgs((m) => [...m, { id, q: text.trim() }]);
    setQ("");
    window.setTimeout(() => setMsgs((m) => m.map((x) => (x.id === id ? { ...x, a: answer(text, st) } : x))), 900);
  };

  return (
    <>
      <PageHead title="Ask Tyode" sub="Ask a question in plain language. Answers come only from Tyode's records, with the sources listed underneath. If the records don't have the answer, it says so.">
        <Pill tone="blue">Extra</Pill>
      </PageHead>
      <div className={s.chat}>
        <div className={s.chatLog} aria-live="polite">
          {msgs.length === 0 && (
            <div className={s.chatEmpty}>
              <b>Try one of these</b>
              <div className={s.suggest}>{SUGGESTED.map((x) => <button key={x} type="button" onClick={() => ask(x)}>{x}</button>)}</div>
            </div>
          )}
          {msgs.map((m) => (
            <div key={m.id} className={s.turn}>
              <p className={s.qBubble}>{m.q}</p>
              {!m.a ? <p className={s.aBubble}><span className={s.dots}><i /><i /><i /></span></p> : (
                <div className={`${s.aBubble} ${m.a.unknown ? s.aUnknown : ""}`}>
                  <p>{m.a.text}</p>
                  <div className={s.chips}>
                    {m.a.sources.length ? <span className={s.srcLbl}>Sources</span> : <span className={s.srcLbl}>No records matched</span>}
                    {m.a.sources.map((x) => x.href ? <Link key={x.label} href={x.href} className={s.srcChip}>{x.label}</Link> : <span key={x.label} className={s.srcChip}>{x.label}</span>)}
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={end} />
        </div>
        {msgs.length > 0 && <div className={s.suggestRow}>{SUGGESTED.filter((x) => !msgs.some((m) => m.q === x)).slice(0, 3).map((x) => <button key={x} type="button" onClick={() => ask(x)}>{x}</button>)}</div>}
        <form className={s.chatBar} onSubmit={(e) => { e.preventDefault(); ask(q); }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ask about a tyre, machine, press or batch" aria-label="Ask Tyode" />
          <button type="submit" className={s.btn} disabled={!q.trim()}>Ask</button>
        </form>
        <p className={s.fine}>In this demo the answers are prepared from the sample records. The AI model runs either on the plant&apos;s local server or through an approved cloud service, to be agreed with the plant.</p>
      </div>
    </>
  );
}
