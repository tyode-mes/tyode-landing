"use client";

import { useEffect, useRef, useState } from "react";
import { LOGO } from "@/components/brand/TyodeLogo";
import TyodeMark from "@/components/brand/TyodeMark";
import { BOOKING_URL, openBooking } from "@/components/booking/booking";
import ContactModal from "@/components/contact/ContactModal";
import { openContact } from "@/components/contact/contact";
import styles from "./Footer.module.css";

// room round the logo for its construction lines (logo units), and where the giant logo is
// cut off at the bottom of the page (logo units from the top of the letters)
const PAD = 36;
const CUT = 92;

// the copyright year (fixed: the page is prerendered, so it can't read today's date)
const YEAR = 2026;

const LINKS = [
  { href: "#overview", label: "Overview" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#team", label: "Team" },
];

/**
 * Section 08: Footer — a white band asking to work together (the hero's white band, full
 * height), then the small print, the site's sections, and the Tyode logo drawn huge across
 * the bottom and cut off by the edge of the page, construction lines and all. The logo's
 * intro plays when the footer comes into view.
 * optimized
 */
export default function Footer() {
  const giantRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = giantRef.current;
    if (!el) return;
    // the guides are one screen pixel thick: tell the logo how big a pixel is in its units
    const size = () => {
      const k = (LOGO.width + PAD * 2) / (el.clientWidth || 1);
      el.style.setProperty("--hair", `${k.toFixed(3)}px`);
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(el);
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => {
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return (
    <footer id="footer" className={styles.footer}>
      {/* ---------- the ask ---------- */}
      <div className={styles.cta}>
        <p className={styles.ctaLine}>
          Let&apos;s trace it <b>together</b>
        </p>
        <div className={styles.ctaLinks}>
          <a href={BOOKING_URL} target="_blank" rel="noopener noreferrer" onClick={openBooking}>
            Book a walkthrough
          </a>
          <a href="#footer" onClick={openContact}>
            Get in touch
          </a>
        </div>
      </div>

      {/* ---------- small print ---------- */}
      <div className={styles.base}>
        <div className={styles.row}>
          <div className={styles.left}>
            <div className={styles.social}>
              <a href="https://www.linkedin.com/company/tyode" target="_blank" rel="noopener noreferrer" aria-label="Tyode on LinkedIn">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45z" />
                </svg>
              </a>
              <a href="https://www.instagram.com/tyode_mes/" target="_blank" rel="noopener noreferrer" aria-label="Tyode on Instagram">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63a5.9 5.9 0 0 0-2.13 1.38A5.9 5.9 0 0 0 .63 4.14C.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.31.79.72 1.46 1.38 2.13a5.9 5.9 0 0 0 2.13 1.38c.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56a5.9 5.9 0 0 0 2.13-1.38 5.9 5.9 0 0 0 1.38-2.13c.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91a5.9 5.9 0 0 0-1.38-2.13A5.9 5.9 0 0 0 19.86.63C19.1.33 18.22.13 16.95.07 15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.4-11.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z" />
                </svg>
              </a>
              <a href="https://github.com/tyode-mes" target="_blank" rel="noopener noreferrer" aria-label="Tyode on GitHub">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 .3a12 12 0 0 0-3.8 23.38c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.92.42.36.81 1.1.81 2.22v3.29c0 .32.21.7.82.58A12 12 0 0 0 12 .3" />
                </svg>
              </a>
              <a href="mailto:contact@tyode.com" aria-label="Email Tyode">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 4h16a2 2 0 0 1 2 2v.4l-10 6.25L2 6.4V6a2 2 0 0 1 2-2zm-2 4.75 9.47 5.92a1 1 0 0 0 1.06 0L22 8.75V18a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2z" />
                </svg>
              </a>
            </div>
            <div className={styles.legal}>
              <span className={styles.copy}>© {YEAR} Tyode</span>
              <a href="#">Terms of use</a>
              <a href="#">Privacy policy</a>
            </div>
          </div>

          <div className={styles.cols}>
            <nav aria-label="Footer">
              <p className={styles.colHead}>Explore</p>
              {LINKS.map((l) => (
                <a key={l.href} href={l.href}>
                  {l.label}
                </a>
              ))}
            </nav>
            <div>
              <p className={styles.colHead}>Built at</p>
              <span>Informatics Institute of Technology</span>
              <span>University of Westminster</span>
              <a href="#top" className={styles.top}>
                Back to top ↑
              </a>
            </div>
          </div>
        </div>

        {/* ---------- the logo, huge, cut off by the page ---------- */}
        <div
          ref={giantRef}
          className={styles.giant}
          data-in={inView || undefined}
          style={{ aspectRatio: `${LOGO.width + PAD * 2} / ${CUT + PAD}` }}
          aria-hidden="true"
        >
          <TyodeMark pad={PAD} />
        </div>
      </div>

      {/* the "Get in touch" pop-up (contact form) */}
      <ContactModal />
    </footer>
  );
}
