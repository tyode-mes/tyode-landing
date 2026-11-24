"use client";

import React, { useEffect, useRef, useState, type CSSProperties } from "react";
import { LOGO } from "@/components/brand/TyodeLogo";
import TyodeMark from "@/components/brand/TyodeMark";
import BookingModal from "@/components/booking/BookingModal";
import { BOOKING_URL, openBooking } from "@/components/booking/booking";
import { scrollBus } from "@/lib/scrollBus";
import styles from "./SiteNav.module.css";

/**
- Floating navigation: a dark capsule over the page. Logo on the left (it draws itself in on
- load; hover it to see its guide lines), links in the middle, a call-to-action on the right,
- and a fine line along the bottom edge that fills as you scroll down the page. It tightens
- gradually as you scroll down the first part of the page. On small screens the links fold into a menu button.
 *
- Links point at the section ids in /sections (see app/page.tsx). The link for the section you're
- in stays lit (white text, a soft pill and a dot), following the scroll; clicking a link lights it
- straight away and holds it there while the page glides to that section.
 */
const LINKS = [
  { href: "#overview", label: "Overview" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#team", label: "Team" },
  { href: "/demo", label: "Live demo" },
];
// the on-page sections the nav tracks, in page order
const SECTIONS = LINKS.filter((l) => l.href.startsWith("#")).map((l) => l.href.slice(1));
// a section counts as "current" once its top passes this far down the screen
const LINE = 0.4;
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
  // the section you're in (its id), or null above the first one
  const [active, setActive] = useState<string | null>(null);
  // after a click, hold that link lit while the page glides past the sections in between
  const hold = useRef<{ id: string; until: number } | null>(null);
  const pick = (href: string, at: number) => {
    if (!href.startsWith("#")) return;
    const id = href.slice(1);
    hold.current = { id, until: at + 1600 };
    setActive(id);
  };

  // follow the scroll: the current section is the last one whose top has passed the line
  useEffect(() => {
    let tops: { id: string; top: number }[] = [];
    const measure = () => {
      tops = SECTIONS.map((id) => {
        const el = document.getElementById(id);
        return { id, top: el ? el.getBoundingClientRect().top + window.scrollY : Infinity };
      });
    };
    measure();
    // some sections size themselves after load (the 3D story, reveals): measure again once they have
    const late = window.setTimeout(measure, 1500);
    const unsubResize = scrollBus.onResize(measure);
    const unsubScroll = scrollBus.subscribe((s) => {
      const line = s.y + s.vh * LINE;
      let id: string | null = null;
      for (const t of tops) if (t.top <= line) id = t.id;
      const h = hold.current;
      if (h) {
        if (id !== h.id && performance.now() < h.until) return;
        hold.current = null;
      }
      setActive((a) => (a === id ? a : id));
    });
    return () => {
      window.clearTimeout(late);
      unsubResize();
      unsubScroll();
    };
  }, []);

  useEffect(() => {
    const nav = ref.current;
    if (!nav) return;
    let last = "";
    let lastK = "";

    return scrollBus.subscribe((s) => {
      const v = s.progress.toFixed(4);
      if (v !== last) nav.style.setProperty("--scroll", (last = v));
      // how far it has tightened: follows the scroll over the first stretch, eased
      const t = Math.min(1, Math.max(0, s.y / 420));
      const k = (t * t * (3 - 2 * t)).toFixed(4);
      if (k !== lastK) nav.style.setProperty("--k", (lastK = k));
    });
  }, []);

  // close the menu with Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const box = {
    width: `${(LOGO.width + PAD * 2) * K}px`, height: `${(LOGO.height + PAD * 2) * K}px`,
    margin: `${-PAD * K}px`, "--hair": `${(1 / K).toFixed(3)}px`,
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
              aria-current={l.href === `#${active}` ? "location" : undefined}
              onClick={(e) => pick(l.href, e.timeStamp)}
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
          <a
            key={l.label}
            href={l.href}
            className={styles.panelLink}
            aria-current={l.href === `#${active}` ? "location" : undefined}
            onClick={(e) => {
              setOpen(false);
              pick(l.href, e.timeStamp);
            }}
          >
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