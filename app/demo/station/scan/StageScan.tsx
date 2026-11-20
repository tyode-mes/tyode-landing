"use client";

/* Screen 01: the operator's stage scan tablet. The press operator scans the label while loading,
   which records the press, mould and cure cycle. A held tyre is blocked at the scan. */

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PEOPLE, TYRES, tyre } from "../../data";
import { holdOf, useDemo } from "../../store";
import { PageHead, Pill } from "../../ui";
import { tr } from "../i18n";
import Tablet from "../Tablet";
import s from "../../demo.module.css";

type StationId = "cure" | "store";
/* labels to try at each station: tyres that are really at that stage in the sample data */
const waiting = TYRES.filter((x) => x.stage === "built");
const released = TYRES.filter((x) => x.stage === "released" && !x.coolCure && x.batches.tread !== "C-1042");
const STATIONS: Record<StationId, { name: string; at: string; next: string[] }> = {
  cure: { name: "Curing · Press P-03 · mould M-07", at: "curing", next: [...waiting.filter((x) => x.batches.tread !== "C-1042").slice(-2).map((x) => x.serial), ...waiting.filter((x) => x.batches.tread === "C-1042").map((x) => x.serial)] },
  store: { name: "Storage · WH-1 (next stage)", at: "storage", next: [released[released.length - 1].serial, "GT-2611-0427", "GT-2611-0433"] },
};

export default function StageScan() {
  const tryLabel = useSearchParams().get("try")?.toUpperCase();
  const { st, set } = useDemo();
  const t = tr(st.lang);
  const [station, setStation] = useState<StationId>(tryLabel ? "store" : "cure");
  const [q, setQ] = useState(tryLabel ?? "");
  const [last, setLast] = useState<{ serial: string; ok: boolean; text: string } | null>(null);
  const S = STATIONS[station];
  const steps = [t("building"), t("curing"), t("inspection"), t("nextStage")];
  const nowIdx = station === "cure" ? 1 : 3;
  const clock = () => new Date(2026, 10, 11, 10, 42 + st.scans.length).toTimeString().slice(0, 5);

  const scan = (raw: string) => {
    const serial = raw.trim().toUpperCase();
    if (!serial) return;
    const ty = tyre(serial);
    if (!ty) { setLast({ serial, ok: false, text: t("notFound") }); return; }
    const hold = holdOf(serial, st);
    if (hold) {
      setLast({ serial, ok: false, text: `${t("onHold")} ${t("supAlerted")}` });
      set((x) => ({ ...x, scans: [{ serial, at: clock(), stage: station, result: "blocked" as const }, ...x.scans].slice(0, 12), supervisorAlerts: [...x.supervisorAlerts, serial] }));
      setQ("");
      return;
    }
    if (st.scans.some((x) => x.serial === serial && x.stage === station && x.result === "ok")) {
      setLast({ serial, ok: false, text: "Already scanned at this stage. Each label is scanned once per stage." }); setQ(""); return;
    }
    if (station === "cure" && ty.stage !== "built") { setLast({ serial, ok: false, text: "This tyre has already been cured. Wrong stage." }); setQ(""); return; }
    if (station === "store" && ty.stage !== "released") { setLast({ serial, ok: false, text: "This tyre hasn't passed inspection yet. Wrong stage." }); setQ(""); return; }
    setLast({ serial, ok: true, text: station === "cure" ? `${t("loadedInto")} 3` : t("stored") });
    set((x) => ({ ...x, scans: [{ serial, at: clock(), stage: station, result: "ok" as const }, ...x.scans].slice(0, 12) }));
    setQ("");
  };
  const undo = () => {
    const i = st.scans.findIndex((x) => x.result === "ok");
    if (i < 0) return;
    set((x) => ({ ...x, scans: x.scans.map((y, j) => (j === i ? { ...y, result: "undone" as const } : y)) }));
    setLast(null);
  };

  return (
    <>
      <PageHead title="Stage scan" sub="Screen 01: the operator tablet at each stage. One scan of the label records the stage, and for curing the press, mould and cure cycle. A held tyre is blocked here.">
        <div className={s.seg}>
          {(["cure", "store"] as const).map((k) => <button key={k} type="button" className={station === k ? s.segOn : ""} aria-pressed={station === k} onClick={() => { setStation(k); setLast(null); setQ(""); }}>{k === "cure" ? "Curing" : "Next stage"}</button>)}
        </div>
      </PageHead>

      <Tablet
        head={<><b>{t("stageScan")}</b><span>{S.name}</span><span>{t("operator")}: {station === "cure" ? `${PEOPLE.pressOp.name} · 2207` : "J. Fonseka · 3310"}</span><em>{st.lang}</em></>}
        foot={<>Switch the language with EN | SI in the top bar. {st.supervisorAlerts.length > 0 && <>Supervisor alerts sent in this demo: {st.supervisorAlerts.length}. </>}<Link href="/demo/alerts">Back to alerts</Link></>}>
        <ol className={s.tabSteps}>
          {steps.map((k, i) => <li key={k} className={i < nowIdx ? s.tsDone : i === nowIdx ? s.tsNow : ""}><i>{i < nowIdx ? "✓" : i + 1}</i>{k}</li>)}
        </ol>

        <form className={s.scanBox} onSubmit={(e) => { e.preventDefault(); scan(q); }}>
          <label htmlFor="lbl">{t("scanLabel")}</label>
          <div><input id="lbl" value={q} onChange={(e) => setQ(e.target.value)} placeholder="GT-2611-…" autoComplete="off" /><button type="submit">{t("scan")}</button></div>
          <span className={s.tryRow}>Try: {S.next.map((x) => <button key={x} type="button" onClick={() => scan(x)}>{x}{holdOf(x, st) ? " (held)" : ""}</button>)}</span>
        </form>

        {last && (
          <div className={last.ok ? s.scanOk : s.scanBad} role="status">
            <i>{last.ok ? "✓" : "!"}</i>
            <div><b>{last.ok ? last.text : last.text === t("notFound") ? last.text : t("blocked")}</b><span>{last.serial}{last.ok ? "" : last.text === t("notFound") ? "" : ` · ${last.text}`}</span></div>
          </div>
        )}

        <div className={s.recent}>
          <div className={s.recentHead}><b>{t("recent")}</b><button type="button" onClick={undo} disabled={!st.scans.some((x) => x.result === "ok")}>{t("undo")}</button></div>
          {st.scans.length === 0 ? <p className={s.muted}>No scans yet in this demo.</p> : (
            <ul>
              {st.scans.map((x, i) => (
                <li key={i}><time>{x.at}</time><b>{x.serial}</b><span>{x.stage === "cure" ? "P-03" : "WH-1"}</span>
                  {x.result === "ok" ? <Pill tone="green">OK</Pill> : x.result === "blocked" ? <Pill tone="red">{t("blocked")}</Pill> : <Pill tone="grey">Undone</Pill>}</li>
              ))}
            </ul>
          )}
        </div>
      </Tablet>
    </>
  );
}
