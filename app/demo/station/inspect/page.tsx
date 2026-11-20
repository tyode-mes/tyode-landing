"use client";

/* Screen 02: the inspector's tablet. Weight, outer diameter and section width come from the plant's
   own instruments and are checked against the spec, with a visual checklist set in configuration. */

import { useEffect, useState } from "react";
import Link from "next/link";
import { CURE_MIN, PEOPLE, SPEC, TOL, TYRES, tyre } from "../../data";
import { useDemo } from "../../store";
import { PageHead } from "../../ui";
import { tr } from "../i18n";
import Tablet from "../Tablet";
import s from "../../demo.module.css";

const CHECKS = ["Bead area clean, no damage", "Sidewall: no bulges or cuts", "Tread: no blisters or bare spots", "Inner liner: no folds"];
const DEFECTS = ["Blister", "Bead damage", "Sidewall cut", "Foreign material", "Other"];

export default function Inspection() {
  const { st } = useDemo();
  const t = tr(st.lang);
  const options = ["GT-2611-0427", ...TYRES.filter((x) => x.result === "pass").slice(-3).map((x) => x.serial).filter((x) => x !== "GT-2611-0427")];
  const [serial, setSerial] = useState("GT-2611-0427");
  const ty = tyre(serial)!;
  const spec = SPEC[ty.size as keyof typeof SPEC];
  const [shown, setShown] = useState(0);
  const [checks, setChecks] = useState<boolean[]>([false, false, false, false]);
  const [defect, setDefect] = useState<string | null>(null);
  const [picking, setPicking] = useState(false);
  const [done, setDone] = useState(false);

  /* readings arrive from the instruments one after another */
  useEffect(() => {
    const ids = [1, 2, 3].map((k) => window.setTimeout(() => setShown(k), 450 * k));
    return () => ids.forEach((i) => window.clearTimeout(i));
  }, [serial]);
  const choose = (x: string) => { setSerial(x); setShown(0); setChecks([false, false, false, false]); setDefect(null); setDone(false); };

  const rows = [
    { k: t("weight"), v: ty.weight!, unit: "kg", lo: +(spec.weight * (1 - TOL.weight)).toFixed(2), hi: +(spec.weight * (1 + TOL.weight)).toFixed(2), dp: 2 },
    { k: t("od"), v: ty.od!, unit: "mm", lo: spec.od - TOL.od, hi: spec.od + TOL.od, dp: 0 },
    { k: t("width"), v: ty.width!, unit: "mm", lo: spec.width - TOL.width, hi: spec.width + TOL.width, dp: 0 },
  ];
  const inSpec = rows.every((r) => r.v >= r.lo && r.v <= r.hi);
  const allChecked = checks.every(Boolean);
  const result = defect || !inSpec ? "fail" : allChecked && shown === 3 ? "pass" : null;
  const cool = (ty.peak ?? 200) < CURE_MIN;

  return (
    <>
      <PageHead title="Inspection" sub="Screen 02: the inspector's tablet. Readings come straight from the scale and gauges. The checklist is set in plant configuration. A tyre within spec is released to the next stage. A tyre outside spec is held for an engineer.">
        <select className={s.select} value={serial} onChange={(e) => choose(e.target.value)} aria-label="Tyre being inspected">
          {options.map((x) => <option key={x}>{x}</option>)}
        </select>
      </PageHead>

      <Tablet
        head={<><b>{t("inspection")}</b><span>{serial} · {ty.size} · {ty.press} {ty.mould}</span><span>{t("inspector")}: {PEOPLE.inspector.name} · {PEOPLE.inspector.badge}</span><em>{st.lang}</em></>}
        foot={<>Sample readings. <Link href={`/demo/tyres?serial=${serial}`}>Open this tyre&apos;s passport</Link></>}>
        {cool && (
          <div className={s.tabWarn}>
            <b>{t("unusualCure")}</b>
            <span>Press {ty.press} cured this tyre at {ty.peak} °C, below {CURE_MIN} °C (alert A-207). Inspect it carefully. An engineer may hold it.</span>
          </div>
        )}

        <div className={s.readings}>
          {rows.map((r, i) => {
            const ok = r.v >= r.lo && r.v <= r.hi;
            return (
              <div key={r.k} className={i < shown ? (ok ? s.rdOk : s.rdBad) : s.rdWait}>
                <span>{r.k}</span>
                <b>{i < shown ? `${r.v.toFixed(r.dp)} ${r.unit}` : "…"}</b>
                <em>Spec {r.lo}–{r.hi} {r.unit}</em>
                <i>{i < shown ? (ok ? "✓" : "✕") : ""}</i>
              </div>
            );
          })}
        </div>

        <div className={s.checklist}>
          <b>{t("checklist")}</b>
          {CHECKS.map((c, i) => (
            <label key={c}><input type="checkbox" checked={checks[i]} onChange={(e) => setChecks((x) => x.map((y, j) => (j === i ? e.target.checked : y)))} />{c}</label>
          ))}
        </div>

        <div className={s.overall}>
          <div className={result === "pass" ? s.ovPass : result === "fail" ? s.ovFail : s.ovWait}>
            <span>{t("overall")}</span>
            <b>{result === "pass" ? t("pass") : result === "fail" ? t("fail") : "—"}</b>
            {defect && <em>Defect: {defect}</em>}
            {!result && <em>Tick the checklist to finish</em>}
          </div>
          <div className={s.ovActions}>
            <button type="button" className={s.btnGhost} onClick={() => setPicking((p) => !p)}>{t("recordDefect")}</button>
            <button type="button" className={s.btn} disabled={!result || done} onClick={() => setDone(true)}>{t("confirm")}</button>
          </div>
        </div>
        {picking && (
          <div className={s.defects}>
            {DEFECTS.map((d) => <button key={d} type="button" onClick={() => { setDefect(d); setPicking(false); }}>{d}</button>)}
            {defect && <button type="button" onClick={() => { setDefect(null); setPicking(false); }}>Clear defect</button>}
          </div>
        )}
        {done && (
          <p className={result === "pass" ? s.scanOk : s.scanBad} role="status">
            <i>{result === "pass" ? "✓" : "!"}</i>
            <span>{result === "pass" ? `${serial} passed and is released to the next stage set for line PL-1.` : `${serial} failed and is held for an engineer to review.`} Recorded against badge {PEOPLE.inspector.badge}.</span>
          </p>
        )}
      </Tablet>
    </>
  );
}
