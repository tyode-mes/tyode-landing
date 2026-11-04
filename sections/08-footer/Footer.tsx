"use client";

import { useEffect, useRef, useState } from "react";
import { LOGO } from "@/components/brand/TyodeLogo";
import TyodeMark from "@/components/brand/TyodeMark";
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
  { href: "#impact", label: "Impact" },
  { href: "#team", label: "Team" },
];

/**
 * Section 08: Footer — a white band asking to work together (the hero's white band, full
 * height), then the small print, the site's sections, and the Tyode logo drawn huge across
 * the bottom and cut off by the edge of the page, construction lines and all. The logo's
 * intro plays when the footer comes into view. The nav's CTA links to id="footer".
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
          <a href="#">Book a walkthrough</a>
          <a href="#">Get in touch</a>
        </div>
      </div>

      {/* ---------- small print ---------- */}
      <div className={styles.base}>
        <div className={styles.row}>
          <div className={styles.left}>
            <div className={styles.social}>
              <a href="#" aria-label="Tyode on LinkedIn">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45z" />
                </svg>
              </a>
              <a href="#" aria-label="Tyode on GitHub">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 .3a12 12 0 0 0-3.8 23.38c.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18a4.65 4.65 0 0 1 1.23 3.22c0 4.61-2.8 5.63-5.48 5.92.42.36.81 1.1.81 2.22v3.29c0 .32.21.7.82.58A12 12 0 0 0 12 .3" />
                </svg>
              </a>
              <a href="#" aria-label="Email Tyode">
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
    </footer>
  );
}
