"use client";

/* App frame for the public demo: sidebar navigation, top bar with area filter and tyre search. */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import TyodeLogo from "@/components/brand/TyodeLogo";
import { FLAGS, TYRES } from "./data";
import { Icon } from "./ui";
import s from "./demo.module.css";

const missingCount = TYRES.filter((t) => t.status === "missing").length;

const NAV: { group: string; items: { href: string; label: string; icon: string; color: string; badge?: number; tag?: string }[] }[] = [
  {
    group: "The floor",
    items: [
      { href: "/demo", label: "Overview", icon: "overview", color: "#0a84ff" },
      { href: "/demo/missing", label: "Missing tyres", icon: "missing", color: "#ff3b30", badge: missingCount },
      { href: "/demo/alerts", label: "Flagged attempts", icon: "flag", color: "#ff9500", badge: FLAGS.length },
    ],
  },
  {
    group: "The record",
    items: [
      { href: "/demo/tyres", label: "Tyre lookup", icon: "search", color: "#5e5ce6" },
      { href: "/demo/builders", label: "Builders", icon: "people", color: "#34c759" },
      { href: "/demo/report", label: "Shift report", icon: "report", color: "#30b0c7" },
    ],
  },
  {
    group: "Setup",
    items: [
      { href: "/demo/devices", label: "Devices", icon: "device", color: "#8e8e93" },
      { href: "/demo/walkthrough", label: "How the count works", icon: "play", color: "#ff2d55" },
      { href: "/demo/passport", label: "Tyre passport", icon: "passport", color: "#af52de", tag: "Next phase" },
    ],
  },
];

export default function DemoShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [q, setQ] = useState("");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); input.current?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    const v = q.trim().toUpperCase();
    if (!v) return;
    const serial = /^\d+$/.test(v) ? `GT-2611-${v.padStart(4, "0")}` : v;
    router.push(`/demo/tyres?serial=${encodeURIComponent(serial)}`);
  };

  return (
    <div className={s.app}>
      <aside className={s.side}>
        <Link href="/" className={s.brand} aria-label="tyode.com"><TyodeLogo className={s.logo} /></Link>
        <span className={s.product}>Green tyre counting</span>
        <div className={s.plant}><i>DP</i><div><b>Demo plant</b><span>6 machines · 12 presses</span></div></div>
        <nav className={s.nav} aria-label="Demo">
          {NAV.map((g) => (
            <div key={g.group} className={s.navGroup}>
              <span>{g.group}</span>
              {g.items.map((it) => {
                const on = it.href === "/demo" ? path === "/demo" : path.startsWith(it.href);
                return (
                  <Link key={it.href} href={it.href} className={on ? s.on : ""} aria-current={on ? "page" : undefined}>
                    <Icon name={it.icon} color={it.color} size={18} />
                    {it.label}
                    {it.badge ? <em>{it.badge}</em> : null}
                    {it.tag ? <small>{it.tag}</small> : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <p className={s.sideNote}>
          <b>Read-only on machines.</b> Tyode reads signals and never changes machine settings.
        </p>
      </aside>

      <div className={s.mainCol}>
        <header className={s.bar}>
          <select className={s.select} aria-label="Area" defaultValue="all">
            <option value="all">All areas</option>
            <option value="build">Building hall</option>
            <option value="cure">Curing hall</option>
          </select>
          <form onSubmit={search} className={s.search} role="search">
            <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Find a tyre by label, e.g. GT-2611-0120" aria-label="Find a tyre" />
            <kbd>Ctrl K</kbd>
          </form>
          <div className={s.barRight}>
            <span className={`${s.shift} ${s.live}`}>Shift A · 06:00–14:00</span>
            <span className={s.sim}>Simulated data</span>
            <Link href="/demo/walkthrough" className={s.start}>Start demo</Link>
          </div>
        </header>
        <main className={s.content}><div className={s.glow} aria-hidden="true" />{children}</main>
      </div>
    </div>
  );
}
