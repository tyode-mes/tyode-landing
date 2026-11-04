/* Animation and scroll logic for the features section.
   Runs once on mount and returns a cleanup function (safe under React Strict Mode). */

type Meta = { mod: string; st: string; hud: string; ro: string };

const META: Meta[] = [
  { mod: "Trace", st: "Where", hud: "Trace / Passport", ro: '<small>Passport</small><b data-n="8">8</b> of 8 stages' },
  { mod: "Trace", st: "Where", hud: "Trace / Containment", ro: '<small>Contained</small><b data-n="46">46</b> tyres, <em><b data-n="8">8</b> loaded for export</em>' },
  { mod: "Check", st: "What's wrong", hud: "Check / Quality check", ro: '<small>Inspector</small>Suspect, <em>void at <b data-n="212">212</b>°</em>' },
  { mod: "Check", st: "What's wrong", hud: "Check / Drift", ro: "<small>Drift alert</small>Build line B2, <em>trending heavy</em>" },
  { mod: "Explain", st: "Why", hud: "Explain / Core cure", ro: '<small>Core cure estimate</small><em><b data-n="86">86</b>%</em>, below target' },
  { mod: "Explain", st: "Why", hud: "Explain / Process clues", ro: "<small>Process clue</small>Press 3, <em>check cure</em>" },
];

export function initFeatures(sec: HTMLElement): () => void {
  const $ = <T extends Element = HTMLElement>(sel: string) => sec.querySelector(sel) as T;
  const scroll = $(".ft-scroll");
  const items = Array.from(sec.querySelectorAll<HTMLElement>(".ft-item"));
  const N = items.length;
  const tpl = $<HTMLTemplateElement>("#ft-scenes");
  const desk = $("#ft-scenes-desk");
  const mob = $("#ft-mob");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  const timers: number[] = [];

  /* build scenes: desktop screen + mobile cards (cleared first, so a re-run never duplicates) */
  desk.innerHTML = "";
  mob.innerHTML = "";
  desk.appendChild(tpl.content.cloneNode(true));
  items.forEach((it, i) => {
    const a = document.createElement("article");
    const title = Array.from(it.querySelectorAll("h3 .ln > span")).map((s) => s.textContent).join(" ");
    a.innerHTML = `<div class="m-meta">${META[i].mod} · ${META[i].st}</div><div class="m-screen"></div><h3>${title}</h3><p>${it.querySelector("p")?.textContent ?? ""}</p>`;
    const sc = tpl.content.querySelector(`.sc[data-s="${i}"]`)!.cloneNode(true);
    a.querySelector(".m-screen")!.appendChild(sc);
    mob.appendChild(a);
  });

  /* data matrix: fixed finder edges + a seeded fill, identical in every copy */
  sec.querySelectorAll("#ft-dm").forEach((g) => {
    let s = "", seed = 427;
    const n = 12, c = 8, x0 = 96, y0 = 40;
    const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    for (let r = 0; r < n; r++)
      for (let q = 0; q < n; q++) {
        const on = q === 0 || r === n - 1 || (r === 0 && q % 2 === 0) || (q === n - 1 && r % 2 === 1) || (r > 0 && r < n - 1 && q > 0 && q < n - 1 && rnd() > 0.5);
        if (on) s += `<rect x="${x0 + q * c}" y="${y0 + r * c}" width="${c}" height="${c}" fill="#f2f2f3"/>`;
      }
    g.innerHTML = s;
    g.removeAttribute("id");
  });

  /* contained tyres by location: 12 in WIP, 26 in the warehouse, 8 loaded for export */
  sec.querySelectorAll("#ft-dots").forEach((g) => {
    let s = "", k = 0;
    ([[110, 12, "hit"], [218, 13, "hit"], [246, 13, "hit"], [350, 8, "ship"]] as const).forEach(([y, n, cls]) => {
      for (let j = 0; j < n; j++, k++) {
        const x = 328 + j * 30;
        s += `<circle class="dot ${cls}" style="--d:${(0.7 + k * 0.022).toFixed(3)}s" cx="${x}" cy="${y}" r="10"/><circle cx="${x}" cy="${y}" r="3.5" fill="#0c0c0d"/>`;
      }
    });
    g.innerHTML = s;
    g.removeAttribute("id");
  });

  /* control chart: weight per tyre, trending toward the upper limit */
  const spc = Array.from({ length: 40 }, (_, k) => {
    const noise = (((k * 37) % 11) - 5) * 4, trend = k >= 22 ? -(k - 22) * 5.6 : 0;
    return [90 + k * 16, Math.max(160, 270 + noise + trend)];
  });
  sec.querySelectorAll("#ft-spc-line").forEach((p) => {
    p.setAttribute("d", "M" + spc.map(([x, y]) => `${x} ${y}`).join(" L"));
    p.removeAttribute("id");
  });
  sec.querySelectorAll("#ft-spc").forEach((g) => {
    g.innerHTML = spc
      .map(([x, y], k) => `<circle class="pt pop${k >= 34 ? " hot" : ""}" style="--d:${(0.3 + k * 0.025).toFixed(3)}s" cx="${x}" cy="${y}" r="${k >= 34 ? 4.5 : 3.5}"/>`)
      .join("");
    g.removeAttribute("id");
  });
  const scenes = Array.from(desk.querySelectorAll<HTMLElement>(".sc"));

  /* intro reveal */
  const introIO = new IntersectionObserver(
    (es, o) => es.forEach((e) => { if (e.isIntersecting) { sec.classList.add("in"); o.disconnect(); } }),
    { threshold: 0.2 }
  );
  introIO.observe($(".ft-intro"));

  /* pinned stage */
  const idx = $("#ft-index"), mod = $("#ft-module"), hudL = $("#ft-hud-l"), hudR = $("#ft-hud-r"),
        ro = $("#ft-readout"), screen = $("#ft-screen"), clk = $("#ft-clock");
  const gs = [0, 1, 2].map((k) => $("#ft-g" + k));
  let cur = -1, stacked = false;

  const countUp = (el: HTMLElement) => {
    if (reduce.matches) return;
    el.querySelectorAll<HTMLElement>("[data-n]").forEach((b) => {
      const n = Number(b.dataset.n), t0 = performance.now(), d = 900;
      const step = (t: number) => {
        const k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 3);
        b.textContent = String(Math.round(n * e));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  };

  /* clock in the screen header, ticking like timecode */
  let secs = 2 * 3600 + 14 * 60 + 9;
  const clock = window.setInterval(() => {
    secs = (secs + 1) % 86400;
    const h = String(Math.floor(secs / 3600)).padStart(2, "0"),
          mi = String(Math.floor(secs / 60) % 60).padStart(2, "0"),
          se = String(secs % 60).padStart(2, "0");
    clk.textContent = `Pilot line · ${h}:${mi}:${se}`;
  }, 1000);

  function show(i: number) {
    if (i === cur) return;
    cur = i;
    items.forEach((it, k) => it.classList.toggle("on", k === i));
    scenes.forEach((s, k) => {
      if (s.classList.contains("on") && k !== i) {
        s.classList.add("out");
        timers.push(window.setTimeout(() => s.classList.remove("out"), 900));
      }
      s.classList.toggle("on", k === i);
    });
    const m = META[i];
    idx.textContent = String(i + 1).padStart(2, "0");
    mod.innerHTML = `<b>${m.mod}</b><i>${m.st}</i>`;
    hudL.textContent = m.hud;
    hudR.textContent = `${String(i + 1).padStart(2, "0")} / 0${N}`;
    ro.innerHTML = m.ro;
    countUp(ro);
    /* restart the cut: progress line, light bloom, text roll */
    screen.classList.remove("cut");
    [ro, hudL, idx].forEach((el) => el.classList.remove("roll"));
    void screen.offsetWidth;
    screen.classList.add("cut");
    [ro, hudL, idx].forEach((el) => el.classList.add("roll"));
    screen.classList.toggle("hot", i > 0);
    gs.forEach((g, k) => g.classList.toggle("on", Math.floor(i / 2) === k));
  }

  function onScroll() {
    if (stacked) return;
    const r = scroll.getBoundingClientRect(), total = scroll.offsetHeight - window.innerHeight;
    const p = Math.min(1, Math.max(0, -r.top / (total || 1)));
    sec.style.setProperty("--p", p.toFixed(4));
    show(Math.min(N - 1, Math.floor(p * N * 0.9999)));
  }

  function layout() {
    stacked = window.innerWidth < 960 || reduce.matches;
    sec.classList.toggle("is-stacked", stacked);
    scroll.style.height = stacked ? "" : N * 85 + 100 + "vh";
    if (!stacked) onScroll();
  }

  /* jump to a feature from the ruler */
  const goButtons = Array.from(sec.querySelectorAll<HTMLElement>("[data-go]"));
  const onGo = (ev: Event) => {
    const i = Number((ev.currentTarget as HTMLElement).dataset.go), total = scroll.offsetHeight - window.innerHeight;
    window.scrollTo({ top: scroll.getBoundingClientRect().top + window.scrollY + total * ((i + 0.5) / N), behavior: reduce.matches ? "auto" : "smooth" });
  };
  goButtons.forEach((b) => b.addEventListener("click", onGo));

  /* pointer parallax and screen light */
  const onPointer = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" || stacked) return;
    sec.style.setProperty("--mx", ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3));
    sec.style.setProperty("--my", ((e.clientY / window.innerHeight) * 2 - 1).toFixed(3));
  };

  /* stacked cards (phones, reduced motion) play their scene when in view */
  const mobIO = new IntersectionObserver(
    (es) => es.forEach((e) => { const sc = e.target.querySelector(".sc"); if (sc) sc.classList.toggle("on", e.isIntersecting); }),
    { threshold: 0.45 }
  );
  mob.querySelectorAll(".m-screen").forEach((m) => mobIO.observe(m));

  window.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", layout);
  reduce.addEventListener?.("change", layout);
  layout();
  show(0);

  return () => {
    window.removeEventListener("pointermove", onPointer);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", layout);
    reduce.removeEventListener?.("change", layout);
    goButtons.forEach((b) => b.removeEventListener("click", onGo));
    introIO.disconnect();
    mobIO.disconnect();
    window.clearInterval(clock);
    timers.forEach((t) => window.clearTimeout(t));
    scroll.style.height = "";
  };
}
