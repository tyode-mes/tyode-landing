"use client";

/* Screen 08: rules and limits. Each line's checks and alert limits are configuration, not code. */

import { useState } from "react";
import { RULES } from "../data";
import { useDemo } from "../store";
import { Card, PageHead, Pill } from "../ui";
import s from "../demo.module.css";

export default function Rules() {
  const { st, set } = useDemo();
  const [edit, setEdit] = useState<string | null>("R-04");
  const rule = RULES.find((r) => r.id === edit);
  const cur = rule ? st.rules[rule.id] : undefined;
  const [limit, setLimit] = useState(cur?.limit ?? "");
  const open = (id: string) => { setEdit(id); setLimit(st.rules[id].limit); };
  const toggle = (id: string) => set((x) => ({ ...x, rules: { ...x.rules, [id]: { ...x.rules[id], on: !x.rules[id].on } } }));

  return (
    <>
      <PageHead title="Rules & limits" sub="The checks and alert limits for line PL-1. They are set in configuration, so changing a limit or adding a line doesn't need new code. Every change is logged." />
      <div className={s.rulesLayout}>
        <Card className={s.flush}>
          <table className={`${s.table} ${s.tableBig}`}>
            <thead><tr><th>Rule</th><th>Limit</th><th>Action</th><th>Stage</th><th>On</th></tr></thead>
            <tbody>
              {RULES.map((r) => {
                const v = st.rules[r.id];
                return (
                  <tr key={r.id} className={`${edit === r.id ? s.rowOn : ""} ${s.rowClick}`} onClick={() => open(r.id)}>
                    <td><b>{r.name}</b><small>{r.when}</small></td>
                    <td>{v.limit === "—" ? "—" : `${r.id === "R-05" ? "± " : r.id === "R-04" ? "< " : r.id === "R-02" ? "> " : ""}${v.limit} ${r.unit ?? ""}`}</td>
                    <td>{r.action}</td>
                    <td><Pill tone="grey">{r.stage}</Pill></td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <button type="button" role="switch" aria-checked={v.on} aria-label={`${r.name} ${v.on ? "on" : "off"}`} className={`${s.switch} ${v.on ? s.switchOn : ""}`} onClick={() => toggle(r.id)}><i /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Card>

        {rule && cur && (
          <Card className={s.editPanel}>
            <span className={s.kick}>Edit rule · {rule.id}</span>
            <h2 className={s.caseId}>{rule.name}</h2>
            <p className={s.muted}>{rule.when}.</p>
            <div className={s.form}>
              <label>Line<select defaultValue="PL-1"><option>PL-1 · pneumatic</option></select></label>
              {rule.limit !== "—" && (
                <label>Limit
                  <span className={s.withUnit}><input value={limit} onChange={(e) => setLimit(e.target.value.replace(/[^\d.]/g, ""))} inputMode="decimal" /><em>{rule.unit}</em></span>
                </label>
              )}
              {rule.id === "R-04" && <label>For longer than<span className={s.withUnit}><input defaultValue="10" inputMode="numeric" /><em>min</em></span></label>}
              <label>Action<select defaultValue={rule.action}><option>{rule.action}</option><option>Alert only</option></select></label>
              <label>Severity<select defaultValue={rule.severity}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label>
              <label>Notify<select defaultValue="sup"><option value="sup">Shift supervisor</option><option>Process engineer</option><option>Both</option></select></label>
            </div>
            {rule.id === "R-04" && <p className={s.why}><b>Starts an investigation.</b> When this rule raises an alert, the Root-Cause Detective drafts a report for an engineer to approve or dismiss.</p>}
            <div className={s.actionsRow}>
              <button type="button" className={s.btn} disabled={limit === cur.limit} onClick={() => set((x) => ({ ...x, rules: { ...x.rules, [rule.id]: { ...x.rules[rule.id], limit } } }))}>Save change</button>
              <button type="button" className={s.btnGhost} onClick={() => setLimit(cur.limit)}>Cancel</button>
            </div>
            <p className={s.fine}>Changes apply from the next signal. Only roles allowed to edit rules see this panel.</p>
          </Card>
        )}
      </div>
    </>
  );
}
