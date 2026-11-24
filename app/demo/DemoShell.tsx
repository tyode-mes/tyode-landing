"use client";

/* App frame for the public demo: the dark sidebar and the top bar from the report's screens. */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import TyodeLogo from "@/components/brand/TyodeLogo";
import { LINE, hhmm } from "./data";
import { DemoProvider, heldList, openAlerts, useDemo } from "./store";
import { Icon } from "./ui";
import s from "./demo.module.css";

type Item = { href: string; label: string; icon: string; badge?: (n: { alerts: number; held: number }) => number };
const NAV: { group: string; items: Item[] }[] = [
  {
    group: "The floor",
    items: [
      { href: "/demo", label: "Overview", icon: "overview" },
      { href: "/demo/count", label: "Green tyre count", icon: "tyre" },
      { href: "/demo/alerts", label: "Alerts", icon: "alert", badge: (n) => n.alerts },
      { href: "/demo/holds", label: "Holds", icon: "lock", badge: (n) => n.held },
    ],
  },
  {
    group: "The record",
    items: [
      { href: "/demo/tyres", label: "Tyre lookup", icon: "search" },
      { href: "/demo/ask", label: "Ask Tyode", icon: "chat" },
      { href: "/demo/report", label: "Shift report", icon: "report" },
    ],
  },
  {
    group: "Setup",
    items: [
      { href: "/demo/devices", label: "Devices", icon: "device" },
      { href: "/demo/rules", label: "Rules & limits", icon: "sliders" },
    ],
  },
  {
    group: "Station screens",
    items: [
      { href: "/demo/station/scan", label: "Stage scan", icon: "tablet" },
      { href: "/demo/station/inspect", label: "Inspection", icon: "check" },
    ],
  },
];

function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { st, set } = useDemo();
  const [q, setQ] = useState("");
  const [bell, setBell] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const open = openAlerts(st);
  const counts = { alerts: open.length, held: heldList(st).length };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); input.current?.focus(); }
      if (e.key === "Escape") setBell(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    const v = q.trim().toUpperCase();
    if (!v) return;
    if (/^C-?\d+$/.test(v)) { router.push(`/demo/holds?batch=${v.replace(/^C-?/, "C-")}`); return; }
    const serial = /^\d+$/.test(v) ? `GT-2611-${v.padStart(4, "0")}` : v;
    router.push(`/demo/tyres?serial=${encodeURIComponent(serial)}`);
  };

  return (
    <div className={s.app}>
      <aside className={s.side}>
        <Link href="/" className={s.brand} aria-label="tyode.com"><TyodeLogo className={s.logo} /></Link>
        <span className={s.product}>Traceability and green tyre count</span>
        <div className={s.plant}><i>DP</i><div><b>Demo plant</b><span>{LINE.label}</span></div></div>
        <nav className={s.nav} aria-label="Demo">
          {NAV.map((g) => (
            <div key={g.group} className={s.navGroup}>
              <span>{g.group}</span>
              {g.items.map((it) => {
                const on = it.href === "/demo" ? path === "/demo" : path.startsWith(it.href);
                const n = it.badge?.(counts) ?? 0;
                return (
                  <Link key={it.href} href={it.href} className={on ? s.on : ""} aria-current={on ? "page" : undefined}>
                    <Icon name={it.icon} color="currentColor" size={18} />
                    {it.label}
                    {n ? <em>{n}</em> : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <p className={s.sideNote}>
          <b>Read-only on machines.</b> Tyode reads signals and never changes machine settings.
        </p>
        <div className={s.user}>
          <i>PS</i>
          <div><b>P. Silva</b><span>Process engineer · demo</span></div>
        </div>
      </aside>

      <div className={s.mainCol}>
        <header className={s.bar}>
          <select className={s.select} aria-label="Area" defaultValue="all">
            <option value="all">All areas</option>
            <option value="build">Building</option>
            <option value="cure">Curing</option>
            <option value="inspect">Inspection</option>
          </select>
          <form onSubmit={search} className={s.search} role="search">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm9 16-4.2-4.2" /></svg>
            <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a tyre or batch" aria-label="Find a tyre or batch" />
            <kbd>Ctrl K</kbd>
          </form>
          <div className={s.barRight}>
            <span className={s.shift}><i className={s.liveDot} />Shift A · {hhmm(6 * 60)}–{hhmm(14 * 60)}</span>
            <div className={s.seg} role="group" aria-label="Operator screen language">
              {(["EN", "SI"] as const).map((l) => (
                <button key={l} type="button" aria-pressed={st.lang === l} className={st.lang === l ? s.segOn : ""} onClick={() => set((x) => ({ ...x, lang: l }))}>{l}</button>
              ))}
            </div>
            <div className={s.bellWrap}>
              <button type="button" className={s.bell} aria-label={`${open.length} open alerts`} aria-expanded={bell} onClick={() => setBell((b) => !b)}>
                <Icon name="bell" color="currentColor" size={19} />
                {open.length ? <em>{open.length}</em> : null}
              </button>
              {bell && (
                <div className={s.bellMenu}>
                  <b>Open alerts</b>
                  {open.slice(0, 4).map((a) => (
                    <Link key={a.id} href="/demo/alerts" onClick={() => setBell(false)}>
                      <i className={s["sev_" + a.severity]} />
                      <span>{a.title}<small>{hhmm(a.at)} · {a.where}</small></span>
                    </Link>
                  ))}
                  {!open.length && <span className={s.muted}>Nothing open.</span>}
                </div>
              )}
            </div>
            <span className={s.sim}>Sample data</span>
            <Link href="/passport" className={s.start}>Plant walkthrough</Link>
            <span className={s.avatarSm} aria-label="P. Silva">PS</span>
          </div>
        </header>
        <main className={s.content}>{children}</main>
      </div>
    </div>
  );
}

export default function DemoShell({ children }: { children: React.ReactNode }) {
  // client sign-in and the signed-in client page are full-screen pages of their own, without the demo frame
  const path = usePathname() ?? "";
  if (path.startsWith("/demo/sign-in") || path.startsWith("/demo/client")) return <>{children}</>;
  return <DemoProvider><Shell>{children}</Shell></DemoProvider>;
}
