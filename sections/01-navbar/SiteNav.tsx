"use client";

import React, { useEffect, useRef, useState, type CSSProperties } from "react";
import { LOGO } from "@/components/brand/TyodeLogo";
import TyodeMark from "@/components/brand/TyodeMark";
import BookingModal from "@/components/booking/BookingModal";
import { BOOKING_URL, openBooking } from "@/components/booking/booking";
import styles from "./SiteNav.module.css";

/**
 * Floating navigation: a dark capsule over the page. Logo on the left (it draws itself in on
 * load; hover it to see its guide lines), links in the middle, a call-to-action on the right,
 * and a fine line along the bottom edge that fills as you scroll down the page. It tightens
 * gradually as you scroll down the first part of the page. On small screens the links fold into a menu button.
 *
 * Links point at the section ids in /sections (see app/page.tsx).
 */
const LINKS = [
  { href: "#overview", label: "Overview" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#impact", label: "Impact" },
  { href: "#team", label: "Team" },
];
// opens the team's Cal.com booking calendar in a pop-up over the site (see components/booking)
const CTA = { href: BOOKING_URL, label: "Book a walkthrough" };

// logo size in the bar: the whole logo (ascender to descender) this many px tall
const LOGO_PX = 27;
const K = LOGO_PX / LOGO.height; // css px per logo unit
const PAD = 8; // logo units of room round the logo for its guides

export default function SiteNav() {
  const ref = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  // the soft pill that slides to whichever link the pointer is on
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null);
  const showPill = (e: React.PointerEvent<HTMLAnchorElement> | React.FocusEvent<HTMLAnchorElement>) => {
    const a = e.currentTarget;
    setPill({ x: a.offsetLeft, w: a.offsetWidth });
  };

  useEffect(() => {
    const nav = ref.current;
    if (!nav) return;
    let raf = 0;
    let last = "";
    let lastK = "";
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      const v = p.toFixed(4);
      if (v !== last) nav.style.setProperty("--scroll", (last = v));
      // how far it has tightened: follows the scroll over the first stretch, eased
      const t = Math.min(1, Math.max(0, window.scrollY / 420));
      const k = (t * t * (3 - 2 * t)).toFixed(4);
      if (k !== lastK) nav.style.setProperty("--k", (lastK = k));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // close the menu with Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const box = {
    width: `${(LOGO.width + PAD * 2) * K}px`,
    height: `${(LOGO.height + PAD * 2) * K}px`,
    margin: `${-PAD * K}px`,
    "--hair": `${(1 / K).toFixed(3)}px`,
  } as CSSProperties;

  return (
    <header ref={ref} className={styles.nav} data-open={open || undefined}>
      <div className={styles.bar}>
        <div className={styles.start}>
          <a href="#top" className={styles.brand} aria-label="Tyode, back to top">
            <span className={styles.logo} style={box}>
              <TyodeMark pad={PAD} settle />
            </span>
          </a>
          <span className={styles.tag}>Solid Tyre Passport</span>
        </div>

        <nav className={styles.links} aria-label="Main" onPointerLeave={() => setPill(null)}>
          <span
            className={styles.pill}
            aria-hidden="true"
            data-on={pill ? "" : undefined}
            style={pill ? ({ "--x": `${pill.x}px`, "--w": `${pill.w}px` } as CSSProperties) : undefined}
          />
          {LINKS.map((l) => (
            <a
              key={l.label}
              href={l.href}
              className={styles.link}
              onPointerEnter={showPill}
              onFocus={showPill}
              onBlur={() => setPill(null)}
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className={styles.end}>
          <a href={CTA.href} className={styles.cta} target="_blank" rel="noopener noreferrer" onClick={openBooking}>
            {CTA.label}
            <span className={styles.arrow} aria-hidden="true">
              →
            </span>
          </a>
          <button
            type="button"
            className={styles.menu}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="site-menu"
            onClick={() => setOpen((o) => !o)}
          >
            <span />
            <span />
          </button>
        </div>

        <span className={styles.progress} aria-hidden="true" />
      </div>

      {/* small screens: the links, dropped down under the bar */}
      <div id="site-menu" className={styles.panel} hidden={!open}>
        {LINKS.map((l) => (
          <a key={l.label} href={l.href} className={styles.panelLink} onClick={() => setOpen(false)}>
            {l.label}
          </a>
        ))}
        <a
          href={CTA.href}
          className={styles.panelCta}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => {
            setOpen(false);
            openBooking(e);
          }}
        >
          {CTA.label} →
        </a>
      </div>

      {/* the booking pop-up, shared by every "Book a walkthrough" button on the page */}
      <BookingModal />
    </header>
  );
}
