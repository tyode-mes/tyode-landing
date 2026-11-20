/* Section 03: scroll-linked headline settle, staggered reveals,
   icon line-draws and a pointer sheen on the tiles.
   Subscribes to scrollBus (zero layout reads during scroll, no DOM transforms on Hero). */

import { scrollBus } from "@/lib/scrollBus";

export function initOverview(sec: HTMLElement): () => void {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cleanups: Array<() => void> = [];

  /* 1. Reveal on enter */
  const io = new IntersectionObserver(
    (es) =>
      es.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      }),
    { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }
  );
  sec.querySelectorAll<HTMLElement>(".ov-head, .ov-sub, .ov-floor, .ov-close").forEach((el) => io.observe(el));

  /* 2. Tiles: stagger by column, prepare icon strokes for line-draw, batched pointer sheen */
  const cols = window.innerWidth <= 620 ? 1 : window.innerWidth <= 1000 ? 2 : 4;
  sec.querySelectorAll<HTMLElement>(".ov-tile").forEach((tile, i) => {
    const d = (i % cols) * 0.1;
    tile.style.setProperty("--d", `${d}s`);
    tile.querySelectorAll<SVGGeometryElement>("svg path, svg rect, svg circle:not(.sig):not(.dot)").forEach((g, k) => {
      const len = Math.ceil(g.getTotalLength());
      g.classList.add("dr");
      g.style.strokeDasharray = `${len}`;
      g.style.strokeDashoffset = reduce ? "0" : `${len}`;
      g.style.transitionDelay = `${d + 0.35 + k * 0.12}s`;
    });
    io.observe(tile);

    let rect: DOMRect | null = null;
    let ptrRaf = 0;
    let px = 0;
    let py = 0;
    const enter = () => {
      rect = tile.getBoundingClientRect();
    };
    const move = (ev: PointerEvent) => {
      if (!rect) rect = tile.getBoundingClientRect();
      px = ev.clientX - rect.left;
      py = ev.clientY - rect.top;
      if (!ptrRaf) {
        ptrRaf = requestAnimationFrame(() => {
          ptrRaf = 0;
          tile.style.setProperty("--mx", `${px.toFixed(1)}px`);
          tile.style.setProperty("--my", `${py.toFixed(1)}px`);
        });
      }
    };
    const leave = () => {
      rect = null;
    };
    tile.addEventListener("pointerenter", enter, { passive: true });
    tile.addEventListener("pointermove", move, { passive: true });
    tile.addEventListener("pointerleave", leave, { passive: true });
    cleanups.push(() => {
      tile.removeEventListener("pointerenter", enter);
      tile.removeEventListener("pointermove", move);
      tile.removeEventListener("pointerleave", leave);
      if (ptrRaf) cancelAnimationFrame(ptrRaf);
    });
  });

  /* 3. Headline rise settle: --p goes 0 -> 1 via cached bounds on scrollBus */
  const head = sec.querySelector<HTMLElement>(".ov-head");
  if (head && !reduce) {
    let headTop = 0;
    let lastP = "";

    const measure = () => {
      headTop = head.getBoundingClientRect().top + window.scrollY;
    };
    measure();

    const unsubResize = scrollBus.onResize(measure);
    const unsubScroll = scrollBus.subscribe((s) => {
      const top = headTop - s.y;
      const p = Math.min(1, Math.max(0, (s.vh - top) / (s.vh * 0.6)));
      const pStr = p.toFixed(3);
      if (pStr !== lastP) {
        lastP = pStr;
        head.style.setProperty("--p", pStr);
      }
    });

    cleanups.push(unsubResize, unsubScroll);
  } else if (head) {
    head.style.setProperty("--p", "1");
  }

  return () => {
    io.disconnect();
    cleanups.forEach((f) => f());
  };
}