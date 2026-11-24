"use client";

/* Scroll-in reveals for the parts of the landing page that don't animate themselves: the pinned scenes in
   How it works and Features as they arrive, the end of How it works (closing line, From paper to proof
   table, button), the end of Features, the prototype section and the footer. Each block rises a little,
   fades in and sharpens as it enters the screen, like the rest of the page; lists come in one by one.

   It uses the browser's animation API rather than CSS classes, so it starts from each element's own
   resting position (the pinned scenes position things themselves) and leaves nothing behind when done.
   Nothing is hidden until JavaScript runs, and it is skipped when the visitor asks for reduced motion.
   To reveal something new, add its selector to GROUPS. */

import { useEffect } from "react";

const GROUPS: { sel: string; stagger?: number }[] = [
  // How it works: the pinned tyre scene as it arrives
  { sel: ".h3-seg, .h3-canvas, .h3-copy, .h3-pass", stagger: 0.12 },
  // How it works: closing
  { sel: ".h3-close > h2" },
  { sel: ".h3-cmp > h3" },
  { sel: ".h3-cmp-card" },
  { sel: ".h3-cmp tbody tr", stagger: 0.08 },
  { sel: ".h3-close > .h3-next" },
  // Features: the pinned panel as it arrives
  { sel: ".ft-copy > *, .ft-screen", stagger: 0.12 },
  // Features: closing
  { sel: ".ft-close > h2" },
  { sel: ".ft-close > .ft-cta" },
  { sel: ".ft-close > .ft-note" },
  // See the prototype
  { sel: "#prototype header" },
  { sel: "#prototype [role='tablist'] > li", stagger: 0.07 },
  { sel: "#prototype figure" },
  // Footer: the closing line and its links, then the rest
  { sel: "#footer > :first-child > *", stagger: 0.12 },
  { sel: "#footer > :not(:first-child)", stagger: 0.1 },
];

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

export default function ScrollReveal() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (typeof IntersectionObserver === "undefined" || typeof Element.prototype.animate !== "function") return;

    const anims = new Map<Element, Animation>();

    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          io.unobserve(en.target);
          anims.get(en.target)?.play();
        }),
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    );

    for (const g of GROUPS) {
      document.querySelectorAll<HTMLElement>(g.sel).forEach((el, i) => {
        if (anims.has(el) || el.getClientRects().length === 0) return; // already set up, or not shown
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight * 0.94 && r.bottom > 0) return; // already on screen: leave it be
        const cs = getComputedStyle(el);
        const rest = cs.transform === "none" ? "" : cs.transform;
        const restFilter = cs.filter === "none" ? "" : cs.filter;
        const a = el.animate(
          [
            { opacity: 0, transform: `translate3d(0, 26px, 0) ${rest}`, filter: `blur(6px) ${restFilter}` },
            { opacity: cs.opacity, transform: rest || "none", filter: restFilter || "none" },
          ],
          { duration: 1000, delay: (g.stagger ?? 0) * i * 1000, easing: EASE, fill: "backwards" }
        );
        a.pause(); // holds the first frame (hidden) until it scrolls into view
        anims.set(el, a);
        io.observe(el);
      });
    }

    return () => {
      io.disconnect();
      anims.forEach((a) => a.cancel());
    };
  }, []);

  return null;
}
