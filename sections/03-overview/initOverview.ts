/* Section 03: scroll-linked focus pull on the headline, staggered reveals,
   icon line-draws and a pointer sheen on the tiles.
   Runs once on mount and returns a cleanup function (safe under React Strict Mode). */

export function initOverview(sec: HTMLElement): () => void {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cleanups: Array<() => void> = [];

  /* 1. Reveal on enter */
  const io = new IntersectionObserver(
    (es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }),
    { threshold: 0.2, rootMargin: "0px 0px -8% 0px" }
  );
  sec.querySelectorAll<HTMLElement>(".ov-head, .ov-sub, .ov-floor, .ov-close").forEach((el) => io.observe(el));

  /* 2. Tiles: stagger by column, prepare icon strokes for a line-draw */
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

    /* pointer sheen */
    const move = (ev: PointerEvent) => {
      const r = tile.getBoundingClientRect();
      tile.style.setProperty("--mx", `${ev.clientX - r.left}px`);
      tile.style.setProperty("--my", `${ev.clientY - r.top}px`);
    };
    tile.addEventListener("pointermove", move);
    cleanups.push(() => tile.removeEventListener("pointermove", move));
  });

  /* 3. Headline focus pull: --p goes 0 -> 1 as the headline rises into place */
  const head = sec.querySelector<HTMLElement>(".ov-head");
  if (head && !reduce) {
    let raf = 0;
    const update = () => {
      raf = 0;
      const r = head.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = Math.min(1, Math.max(0, (vh - r.top) / (vh * 0.6)));
      head.style.setProperty("--p", p.toFixed(3));
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    cleanups.push(() => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    });
  } else if (head) {
    head.style.setProperty("--p", "1");
  }

  /* 4. No scroll effect between the hero and the overview: the hero is left exactly as it is, and the
     overview starts straight under it. */

  return () => { io.disconnect(); cleanups.forEach((f) => f()); };
}
