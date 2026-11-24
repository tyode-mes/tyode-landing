"use client";

/* Scroll-in reveals for the parts of the landing page that don't animate themselves: the end of How it
   works (closing line, From paper to proof table, button), the end of Features, the prototype section and
   the footer. Each block rises a little, fades in and sharpens as it enters the screen, like the rest of the
   page. List items come in one after another.

   Only marks elements once JavaScript runs (so the page is never hidden without it), skips everything when
   the visitor asks for reduced motion, and removes its own styling after the reveal so hover effects work
   as before. To reveal something new, add its selector to GROUPS. */

import { useEffect } from "react";
import "./reveal.css";

const GROUPS: { sel: string; stagger?: number }[] = [
  // How it works: closing
  { sel: ".h3-close > h2" },
  { sel: ".h3-cmp > h3" },
  { sel: ".h3-cmp-card" },
  { sel: ".h3-cmp tbody tr", stagger: 0.08 },
  { sel: ".h3-close > .h3-next" },
  // Features: closing
  { sel: ".ft-close > h2" },
  { sel: ".ft-close > .ft-cta" },
  { sel: ".ft-close > .ft-note" },
  // See the prototype
  { sel: "#prototype header" },
  { sel: "#prototype [role='tablist'] > li", stagger: 0.07 },
  { sel: "#prototype figure" },
  // Footer
  { sel: "#footer > *", stagger: 0.1 },
];

export default function ScrollReveal() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof IntersectionObserver === "undefined") return;

    const marked: HTMLElement[] = [];
    const timers: number[] = [];
    const done = (el: HTMLElement) => {
      el.removeAttribute("data-rv");
      el.classList.remove("rv-in");
      el.style.removeProperty("--rv-d");
    };

    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const el = en.target as HTMLElement;
          io.unobserve(el);
          el.classList.add("rv-in");
          const delay = parseFloat(el.style.getPropertyValue("--rv-d")) || 0;
          timers.push(window.setTimeout(() => done(el), (delay + 1.3) * 1000));
        }),
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );

    for (const g of GROUPS) {
      document.querySelectorAll<HTMLElement>(g.sel).forEach((el, i) => {
        if (el.hasAttribute("data-rv")) return;
        el.setAttribute("data-rv", "");
        if (g.stagger) el.style.setProperty("--rv-d", `${(i * g.stagger).toFixed(2)}s`);
        marked.push(el);
        io.observe(el);
      });
    }

    return () => {
      io.disconnect();
      timers.forEach((t) => window.clearTimeout(t));
      marked.forEach(done);
    };
  }, []);

  return null;
}
