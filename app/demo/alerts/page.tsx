"use client";

/* Screen 05: alerts by severity, and the investigation report the AI Root-Cause Detective drafted.
   The detective only drafts. An engineer approves (which places the hold) or dismisses with a reason. */

import { useState } from "react";
import Link from "next/link";
import { ALERTS, COOL, REPORT, hhmm, type Severity } from "../data";
import { useDemo } from "../store";
import { Card, PageHead, Pill } from "../ui";
import s from "../demo.module.css";

const SEV: Record<Severity, { label: string; tone: "red" | "amber" | "grey" }> = {
  high: { label: "High", tone: "red" }, medium: { label: "Medium", tone: "amber" }, low: { label: "Low", tone: "grey" },
};
const STEPS = [
  ["Fixed playbook", "Always collects the affected tyres and their records."],
  ["AI analysis", "The model reads the evidence and may make up to 8 more read-only lookups."],
  ["Records checked", "Code checks that every record the draft mentions exists."],
  ["Draft report", "Summary, likely cause with confidence, evidence, what was ruled out, suggested actions."],
];

export default function Alerts() {
  const { st, set } = useDemo();
  const [open, setOpen] = useState("A-207");
  const [mode, setMode] = useState<"view" | "dismiss" | "edit">("view");
  const [reason, setReason] = useState("");
  const [draft, setDraft] = useState(st.summary ?? REPORT.summary);
  const order: Severity[] = ["high", "medium", "low"];
  const status = (id: string) => id === "A-207" ? (st.report === "approved" ? "Hold placed" : st.report === "dismissed" ? "Dismissed" : "Report ready")
    : id === "A-202" && st.approvedUnattributed ? "Approved" : "Open";

  return (
    <>
      <PageHead title="Alerts" sub="Raised by the rules set for this line. For the serious ones, the Root-Cause Detective gathers the evidence and drafts a report. An engineer always makes the decision.">
        <Pill tone="blue">Detective · Extra</Pill>
      </PageHead>

      <div className={s.alertLayout}>
        <div className={s.alertList}>
          {order.map((sev) => (
            <div key={sev} className={s.sevGroup}>
              <span>{SEV[sev].label}</span>
              {ALERTS.filter((a) => a.severity === sev).map((a) => (
                <button key={a.id} type="button" className={`${s.alertRow} ${open === a.id ? s.alertOn : ""}`} onClick={() => { setOpen(a.id); setMode("view"); }}>
                  <i className={s["sev_" + a.severity]} />
                  <div><b>{a.title}</b><small>{a.id} · {hhmm(a.at)} · {a.rule}</small></div>
                  <em className={status(a.id) === "Open" || status(a.id) === "Report ready" ? "" : s.emDone}>{status(a.id)}</em>
                </button>
              ))}
            </div>
          ))}
        </div>

        {open !== "A-207" ? (() => {
          const a = ALERTS.find((x) => x.id === open)!;
          return (
            <Card>
              <div className={s.caseHead}>
                <div>
                  <Pill tone={SEV[a.severity].tone}>{SEV[a.severity].label} · {a.rule}</Pill>
                  <h2 className={s.caseId}>{a.title}</h2>
                  <p className={s.muted}>{a.id} · {hhmm(a.at)} · {a.where}</p>
                </div>
              </div>
              <p className={s.body}>{a.text}</p>
              <p className={s.why}><b>No investigation needed.</b> The rule already did its job. The record is kept and can be opened from the tyre or machine.</p>
              {a.href && <div className={s.actionsRow}><Link className={s.btnGhost} href={a.href}>Open the record</Link></div>}
            </Card>
          );
        })() : (
          <section className={s.report} aria-label="Investigation report A-207">
            <div className={s.reportHead}>
              <div>
                <span className={s.kick}>Investigation report · drafted by the Root-Cause Detective at {hhmm(REPORT.drafted)}</span>
                <h2>P-03 ran below cure temperature</h2>
                <p className={s.muted}>Alert A-207 · rule &quot;Cure too cool&quot; (below 155 °C for 10 min) · 148 °C recorded</p>
              </div>
              <Pill tone={st.report === "approved" ? "green" : st.report === "dismissed" ? "grey" : "amber"}>
                {st.report === "approved" ? "Approved · hold placed" : st.report === "dismissed" ? "Dismissed" : "Draft · awaiting engineer"}
              </Pill>
            </div>

            <ol className={s.detSteps}>
              {STEPS.map(([k, v], i) => <li key={k}><i>{i + 1}</i><div><b>{k}</b><span>{v}</span></div></li>)}
            </ol>

            <div className={s.repGrid}>
              <div className={s.repBlock}>
                <h3>Summary</h3>
                {mode === "edit" ? (
                  <>
                    <textarea className={s.textarea} value={draft} onChange={(e) => setDraft(e.target.value)} rows={5} aria-label="Edit summary" />
                    <div className={s.actionsRow}>
                      <button type="button" className={s.btn} onClick={() => { set((x) => ({ ...x, summary: draft })); setMode("view"); }}>Save edit</button>
                      <button type="button" className={s.btnGhost} onClick={() => { setDraft(st.summary ?? REPORT.summary); setMode("view"); }}>Cancel</button>
                    </div>
                  </>
                ) : <p className={s.body}>{st.summary ?? REPORT.summary}{st.summary && <em className={s.edited}> Edited by P. Silva.</em>}</p>}
              </div>
              <div className={s.repBlock}>
                <h3>Likely cause</h3>
                <p className={s.cause}><b>{REPORT.cause}</b><Pill tone="amber">Confidence: {REPORT.confidence}</Pill></p>
                <p className={s.muted}>{REPORT.why}</p>
              </div>
              <div className={s.repBlock}>
                <h3>Evidence</h3>
                <ul className={s.bullets}>{REPORT.evidence.map((e) => <li key={e}>{e}</li>)}</ul>
              </div>
              <div className={s.repBlock}>
                <h3>Ruled out</h3>
                <ul className={s.bullets}>{REPORT.ruledOut.map((e) => <li key={e}>{e}</li>)}</ul>
              </div>
              <div className={s.repBlock}>
                <h3>Records used <span className={s.okNote}>✓ all {REPORT.checked} checked, every one exists</span></h3>
                <div className={s.chips}>{REPORT.records.map((r) => r.startsWith("GT-") ? <Link key={r} href={`/demo/tyres?serial=${r}`} className={s.srcChip}>{r}</Link> : <span key={r} className={s.srcChip}>{r}</span>)}</div>
              </div>
              <div className={s.repBlock}>
                <h3>Suggested actions</h3>
                <ol className={s.bullets}>{REPORT.actions.map((e) => <li key={e}>{e}</li>)}</ol>
              </div>
            </div>

            <div className={s.repTyres}>
              <h3>Affected tyres ({COOL.length})</h3>
              <div className={s.chips}>{COOL.map((t) => <Link key={t.serial} href={`/demo/tyres?serial=${t.serial}`} className={`${s.srcChip} ${st.report === "approved" ? s.chipHeld : ""}`}>{t.serial}{st.report === "approved" ? " · ON HOLD" : ""}</Link>)}</div>
            </div>

            {st.report === "draft" && mode !== "dismiss" && (
              <div className={s.decide}>
                <p>The detective never places holds or changes records. Your decision is logged.</p>
                <div className={s.actionsRow}>
                  <button type="button" className={s.btnGhost} onClick={() => setMode("dismiss")}>Dismiss</button>
                  <button type="button" className={s.btnGhost} onClick={() => setMode("edit")}>Edit</button>
                  <button type="button" className={s.btn} onClick={() => set((x) => ({ ...x, report: "approved" }))}>Approve &amp; place hold on {COOL.length} tyres</button>
                </div>
              </div>
            )}
            {st.report === "draft" && mode === "dismiss" && (
              <div className={s.decide}>
                <label className={s.lbl} htmlFor="why">Reason for dismissing (required, logged)</label>
                <textarea id="why" className={s.textarea} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="For example: steam valve already replaced at 10:05, tyres re-checked and fine." />
                <div className={s.actionsRow}>
                  <button type="button" className={s.btnGhost} onClick={() => setMode("view")}>Back</button>
                  <button type="button" className={s.btn} disabled={reason.trim().length < 8} onClick={() => set((x) => ({ ...x, report: "dismissed", dismissReason: reason.trim() }))}>Dismiss report</button>
                </div>
              </div>
            )}
            {st.report === "approved" && (
              <div className={`${s.decide} ${s.decideOk}`}>
                <p><b>Approved by P. Silva. {COOL.length} tyres are ON HOLD.</b> Any of them scanned at a later stage is blocked and the supervisor is alerted. Logged.</p>
                <div className={s.actionsRow}>
                  <Link className={s.btn} href="/demo/station/scan?try=GT-2611-0427">Try scanning a held tyre</Link>
                  <Link className={s.btnGhost} href="/demo/holds">See holds</Link>
                  <button type="button" className={s.linkBtn} onClick={() => set((x) => ({ ...x, report: "draft" }))}>Reset this demo step</button>
                </div>
              </div>
            )}
            {st.report === "dismissed" && (
              <div className={s.decide}>
                <p><b>Dismissed by P. Silva.</b> Reason logged: &ldquo;{st.dismissReason}&rdquo;. No tyres were held.</p>
                <button type="button" className={s.linkBtn} onClick={() => set((x) => ({ ...x, report: "draft", dismissReason: "" }))}>Reset this demo step</button>
              </div>
            )}
            <p className={s.fine}>The AI model runs either on the plant&apos;s local server or through an approved cloud service, to be agreed with the plant.</p>
          </section>
        )}
      </div>
    </>
  );
}
