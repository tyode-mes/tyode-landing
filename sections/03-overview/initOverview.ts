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

  /* 4. Card rise: the overview slides up over the hero, which drifts back,
     shrinks and fades. Works on whatever section sits directly above this one,
     so no hero or page changes are needed. */
  const hero = sec.previousElementSibling as HTMLElement | null;
  if (hero && !reduce) {
    hero.style.transformOrigin = "50% 0%";
    hero.style.willChange = "transform, opacity, filter";
    let raf2 = 0;
    const tick = () => {
      raf2 = 0;
      const vh = window.innerHeight;
      const top = sec.getBoundingClientRect().top;
      const hp = Math.min(1, Math.max(0, (vh - top) / vh)); // 0: overview below the fold, 1: overview at the top
      const e = hp * hp * (3 - 2 * hp); // smoothstep
      hero.style.transform = `translate3d(0, ${(hp * vh * 0.55).toFixed(1)}px, 0) scale(${(1 - e * 0.07).toFixed(4)})`;
      hero.style.opacity = (1 - e * 0.65).toFixed(3);
      hero.style.filter = e > 0.01 ? `blur(${(e * 6).toFixed(2)}px)` : "";
    };
    const onScroll2 = () => { if (!raf2) raf2 = requestAnimationFrame(tick); };
    tick();
    window.addEventListener("scroll", onScroll2, { passive: true });
    window.addEventListener("resize", onScroll2);
    cleanups.push(() => {
      window.removeEventListener("scroll", onScroll2);
      window.removeEventListener("resize", onScroll2);
      cancelAnimationFrame(raf2);
      ["transform", "opacity", "filter", "transformOrigin", "willChange"].forEach((k) => hero.style.removeProperty(k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())));
    });
  }

  return () => { io.disconnect(); cleanups.forEach((f) => f()); };
}
