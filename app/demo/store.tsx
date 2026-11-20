"use client";

/* What a visitor changes in the demo (approving a report, placing holds, editing rules, the
   language switch) is kept here, so it carries across pages. Kept for this browser tab only. */

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { COOL, RULES, TYRES, type Rule } from "./data";

export type Scan = { serial: string; at: string; stage: string; result: "ok" | "blocked" | "undone" };
export type DemoState = {
  lang: "EN" | "SI";
  report: "draft" | "approved" | "dismissed";
  dismissReason: string;
  summary: string | null;
  batchHold: string[];
  approvedUnattributed: boolean;
  rules: Record<string, Pick<Rule, "on" | "limit">>;
  scans: Scan[];
  supervisorAlerts: string[];
};

const START: DemoState = {
  lang: "EN", report: "draft", dismissReason: "", summary: null, batchHold: [], approvedUnattributed: false,
  rules: Object.fromEntries(RULES.map((r) => [r.id, { on: r.on, limit: r.limit }])), scans: [], supervisorAlerts: [],
};
const KEY = "tyode-demo-v3";

const Ctx = createContext<{ st: DemoState; set: (f: (s: DemoState) => DemoState) => void; reset: () => void } | null>(null);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [st, setSt] = useState<DemoState>(START);
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      if (raw) { const saved = { ...START, ...JSON.parse(raw) }; const id = window.setTimeout(() => setSt(saved), 0); return () => window.clearTimeout(id); }
    } catch { /* storage unavailable: start fresh */ }
  }, []);
  const set = useCallback((f: (s: DemoState) => DemoState) => {
    setSt((s) => { const n = f(s); try { sessionStorage.setItem(KEY, JSON.stringify(n)); } catch { /* ignore */ } return n; });
  }, []);
  const reset = useCallback(() => { try { sessionStorage.removeItem(KEY); } catch { /* ignore */ } setSt(START); }, []);
  return <Ctx.Provider value={{ st, set, reset }}>{children}</Ctx.Provider>;
}

export function useDemo() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useDemo outside DemoProvider");
  return c;
}

/* why a tyre is on hold right now, or null */
export function holdOf(serial: string, st: DemoState): string | null {
  const t = TYRES.find((x) => x.serial === serial);
  if (!t) return null;
  if (t.stage === "held") return t.note ?? "Held for an engineer.";
  if (st.report === "approved" && COOL.includes(t)) return "Held by P. Silva on investigation A-207: cured below 155 °C in P-03.";
  if (st.batchHold.includes(t.serial)) return "Held by P. Silva: contains suspect compound batch C-1042.";
  return null;
}
export const heldList = (st: DemoState) => TYRES.filter((t) => holdOf(t.serial, st));
