"use client";

/* Screen 04: batch search and hold. Find every tyre a compound batch went into, wherever it is now,
   and hold the ones you choose in one step. Also lists every tyre on hold. */

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { TYRES, hhmm, type Stage } from "../data";
import { heldList, holdOf, useDemo } from "../store";
import { Card, PageHead, Pill } from "../ui";
import s from "../demo.module.css";

const STAGE: Record<Stage, string> = { built: "Waiting to cure", curing: "Curing", inspection: "Waiting for inspection", released: "Released to storage", held: "Held" };
const ORDER: Stage[] = ["built", "curing", "inspection", "released"];

export default function Holds() {
  const router = useRouter();
  const batch = (useSearchParams().get("batch") ?? "C-1042").toUpperCase();
  const { st, set } = useDemo();
  const [q, setQ] = useState(batch);
  const found = TYRES.filter((t) => Object.values(t.batches).includes(batch));
  const layer = (t: (typeof TYRES)[number]) => (Object.entries(t.batches).find(([, v]) => v === batch)?.[0] ?? "");
  const [pick, setPick] = useState<Record<string, boolean>>({});
  const chosen = found.filter((t) => pick[t.serial] ?? true);
  const free = chosen.filter((t) => !holdOf(t.serial, st));
  const suspect = batch === "C-1042";
  const held = heldList(st);

  return (
    <>
      <PageHead title="Holds" sub="Search a compound batch to see every tyre it went into, at whatever stage it is now. Hold the ones you choose in one step. A held tyre is blocked when it is scanned at the next stage." />

      <Card>
        <form className={s.batchSearch} onSubmit={(e) => { e.preventDefault(); router.push(`/demo/holds?batch=${q.trim().toUpperCase()}`); }}>
          <label htmlFor="batch">Compound batch</label>
          <input id="batch" value={q} onChange={(e) => setQ(e.target.value)} />
          <button type="submit" className={s.btn}>Search</button>
          <span className={s.muted}>Try C-1042, C-1044 or C-1039.</span>
        </form>
        {suspect && (
          <div className={s.suspect}>
            <Pill tone="red">Suspect</Pill>
            <div><b>C-1042 · tread compound</b><span>Mixed 10 Nov at 22:40. The lab marked it suspect at 10:15 today: hardness above spec.</span></div>
          </div>
        )}
      </Card>

      {found.length === 0 ? <Card><p className={s.body}>No tyre built this shift contains batch <b>{batch}</b>.</p></Card> : (
        <>
          <div className={s.stageBoxes}>
            {ORDER.map((k) => {
              const n = found.filter((t) => t.stage === k || (k === "released" && t.stage === "held")).length;
              return <div key={k} className={n ? "" : s.stageEmpty}><span>{STAGE[k]}</span><b>{n}</b></div>;
            })}
          </div>

          <Card className={s.flush}>
            <div className={s.flushHead}>
              <h2 className={s.chartTitle}>{found.length} tyres contain {batch}</h2>
              <button type="button" className={s.btn} disabled={!free.length} onClick={() => set((x) => ({ ...x, batchHold: [...new Set([...x.batchHold, ...free.map((t) => t.serial)])] }))}>
                {free.length ? `Place hold on ${free.length} tyre${free.length > 1 ? "s" : ""}` : "All selected tyres are on hold"}
              </button>
            </div>
            <table className={`${s.table} ${s.tableBig}`}>
              <thead><tr>
                <th><input type="checkbox" aria-label="Select all" checked={chosen.length === found.length} onChange={(e) => setPick(Object.fromEntries(found.map((t) => [t.serial, e.target.checked])))} /></th>
                <th>Tyre</th><th>Layer</th><th>Built</th><th>Stage</th><th>Press</th><th>Status</th>
              </tr></thead>
              <tbody>
                {found.map((t) => {
                  const h = holdOf(t.serial, st);
                  return (
                    <tr key={t.serial}>
                      <td><input type="checkbox" aria-label={`Select ${t.serial}`} checked={pick[t.serial] ?? true} onChange={(e) => setPick((p) => ({ ...p, [t.serial]: e.target.checked }))} /></td>
                      <td><Link href={`/demo/tyres?serial=${t.serial}`}>{t.serial}</Link></td>
                      <td style={{ textTransform: "capitalize" }}>{layer(t) === "liner" ? "Inner liner" : layer(t)}</td>
                      <td>{hhmm(t.builtAt)} · {t.machine}</td>
                      <td>{STAGE[t.stage]}</td>
                      <td>{t.press ?? "—"}</td>
                      <td>{h ? <Pill tone="red">ON HOLD</Pill> : <Pill tone="grey">Not held</Pill>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        </>
      )}

      <Card title={`On hold now (${held.length})`}>
        <table className={s.table}>
          <thead><tr><th>Tyre</th><th>Stage when held</th><th>Why</th></tr></thead>
          <tbody>
            {held.map((t) => (
              <tr key={t.serial}>
                <td><Link href={`/demo/tyres?serial=${t.serial}`}>{t.serial}</Link></td>
                <td>{STAGE[t.stage === "held" ? "inspection" : t.stage]}</td>
                <td>{holdOf(t.serial, st)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className={s.muted}>Only an engineer can release a held tyre. Every hold and release is logged.
          {st.batchHold.length > 0 && <> <button type="button" className={s.linkBtn} onClick={() => set((x) => ({ ...x, batchHold: [] }))}>Reset the batch hold demo</button></>}
        </p>
      </Card>
    </>
  );
}
