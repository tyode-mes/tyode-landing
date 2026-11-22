/* Section 05: Features scroll & scene choreography.
   Driven by scrollBus (zero layout reads during scroll, zero forced reflow on stage cut,
   pauses clock & grain off-screen, scoped rAF pointer parallax). */

import { scrollBus } from "@/lib/scrollBus";

/* g = ruler group: 0 Trace, 1 Check, 2 Explain. */
type Meta = { mod: string; st: string; hud: string; ro: string; g: number };

const META: Meta[] = [
  { g: 0, mod: "Trace", st: "How many", hud: "Trace / Green tyre count", ro: '<small>Machine count</small><b data-n="104">104</b> builds, <em>log said 120</em>' },
  { g: 0, mod: "Trace", st: "Where", hud: "Trace / Passport", ro: '<small>Passport</small><b data-n="8">8</b> of 8 stages' },
  { g: 0, mod: "Trace", st: "Where", hud: "Trace / Containment", ro: '<small>Contained</small><b data-n="46">46</b> tyres, <em><b data-n="8">8</b> loaded for export</em>' },
  { g: 1, mod: "Check", st: "What's wrong", hud: "Check / Quality check", ro: '<small>Inspector</small>Suspect, <em>void at <b data-n="212">212</b>°</em>' },
  { g: 1, mod: "Check", st: "What's wrong", hud: "Check / Drift", ro: "<small>Drift alert</small>Build line B2, <em>trending heavy</em>" },
  { g: 2, mod: "Explain", st: "Why", hud: "Explain / Core cure · solid", ro: '<small>Core cure estimate</small><em><b data-n="86">86</b>%</em>, below target' },
  { g: 2, mod: "Explain", st: "Why", hud: "Explain / Process clues", ro: "<small>Process clue</small>Press 3, <em>check cure</em>" },
  { g: 2, mod: "Explain", st: "Why", hud: "Explain / AI Root-Cause Detective", ro: "<small>Draft · engineer to approve</small>Batch <em>C-1182</em>" },
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

  /* build scenes: desktop screen + mobile cards */
  desk.innerHTML = "";
  mob.innerHTML = "";
  desk.appendChild(tpl.content.cloneNode(true));
  items.forEach((it, i) => {
    const a = document.createElement("article");
    const title = Array.from(it.querySelectorAll("h3 .ln > span")).map((s) => s.textContent).join(" ");
    const tag = it.querySelector(".ft-tag")?.textContent;
    a.innerHTML = `<div class="m-meta">${META[i].mod} · ${META[i].st}</div><div class="m-screen"></div>${tag ? `<span class="ft-tag">${tag}</span>` : ""}<h3>${title}</h3><p>${it.querySelector("p")?.textContent ?? ""}</p>`;
    const sc = tpl.content.querySelector(`.sc[data-s="${i}"]`)!.cloneNode(true);
    a.querySelector(".m-screen")!.appendChild(sc);
    mob.appendChild(a);
  });

  /* data matrix */
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

  /* contained tyres */
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

  /* control chart */
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

  /* pinned stage refs & cached geometry */
  const idx = $("#ft-index"), mod = $("#ft-module"), hudL = $("#ft-hud-l"), hudR = $("#ft-hud-r"),
        ro = $("#ft-readout"), screen = $("#ft-screen"), clk = $("#ft-clock");
  const gs = [0, 1, 2].map((k) => $("#ft-g" + k));
  let cur = -1, stacked = false, active = false;
  let scrollTop = 0, scrollHeight = 1, lastPStr = "";
  let cutRaf1 = 0, cutRaf2 = 0;

  const countUp = (el: HTMLElement) => {
    if (reduce.matches) return;
    el.querySelectorAll<HTMLElement>("[data-n]").forEach((b) => {
      const n = Number(b.dataset.n), t0 = performance.now(), d = 800;
      const step = (t: number) => {
        const k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 3);
        b.textContent = String(Math.round(n * e));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  };

  /* shift clock only ticks while section is near viewport */
  let secs = 2 * 3600 + 14 * 60 + 9;
  const clock = window.setInterval(() => {
    if (!active || document.hidden) return;
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
    hudR.textContent = `${String(i + 1).padStart(2, "0")} / ${String(N).padStart(2, "0")}`;
    ro.innerHTML = m.ro;
    countUp(ro);

    /* restart cut animations asynchronously (no synchronous offsetWidth reflow!) */
    cancelAnimationFrame(cutRaf1);
    cancelAnimationFrame(cutRaf2);
    screen.classList.remove("cut");
    ro.classList.remove("roll");
    hudL.classList.remove("roll");
    idx.classList.remove("roll");
    cutRaf1 = requestAnimationFrame(() => {
      cutRaf2 = requestAnimationFrame(() => {
        screen.classList.add("cut");
        ro.classList.add("roll");
        hudL.classList.add("roll");
        idx.classList.add("roll");
      });
    });

    screen.classList.toggle("hot", i > 0);
    gs.forEach((g, k) => g.classList.toggle("on", m.g === k));
  }

  function applyTrackHeight() {
    const nextStacked = window.innerWidth < 960;
    if (nextStacked !== stacked || (!nextStacked && !scroll.style.height)) {
      stacked = nextStacked;
      sec.classList.toggle("is-stacked", stacked);
      scroll.style.height = stacked ? "" : N * 85 + 100 + "vh";
      return true;
    }
    return false;
  }

  function measure() {
    applyTrackHeight();
    const r = scroll.getBoundingClientRect();
    scrollTop = r.top + window.scrollY;
    scrollHeight = scroll.offsetHeight;
  }

  function syncFromScroll(y: number, vh: number) {
    const near = y + vh > scrollTop - 250 && y < scrollTop + scrollHeight + 250;
    if (near !== active) {
      active = near;
      sec.classList.toggle("is-active", active);
    }
    if (stacked || !active) return;

    const total = Math.max(1, scrollHeight - vh);
    const p = Math.min(1, Math.max(0, (y - scrollTop) / total));
    const pStr = p.toFixed(4);
    if (pStr !== lastPStr) {
      lastPStr = pStr;
      sec.style.setProperty("--p", pStr);
    }
    show(Math.min(N - 1, Math.floor(p * N * 0.9999)));
  }

  /* jump to a feature from the ruler via scrollBus */
  const goButtons = Array.from(sec.querySelectorAll<HTMLElement>("[data-go]"));
  const onGo = (ev: Event) => {
    const i = Number((ev.currentTarget as HTMLElement).dataset.go);
    const total = Math.max(1, scrollHeight - scrollBus.getState().vh);
    scrollBus.scrollTo(scrollTop + total * ((i + 0.5) / N), { duration: 0.95 });
  };
  goButtons.forEach((b) => b.addEventListener("click", onGo));

  /* scoped, rAF-throttled pointer parallax on #ft-screen only (not whole section) */
  let ptrRaf = 0;
  let pmx = 0, pmy = 0;
  const onPointer = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" || stacked || !active) return;
    pmx = (e.clientX / window.innerWidth) * 2 - 1;
    pmy = (e.clientY / window.innerHeight) * 2 - 1;
    if (!ptrRaf) {
      ptrRaf = requestAnimationFrame(() => {
        ptrRaf = 0;
        screen.style.setProperty("--mx", pmx.toFixed(3));
        screen.style.setProperty("--my", pmy.toFixed(3));
      });
    }
  };

  /* mobile stacked cards */
  const mobIO = new IntersectionObserver(
    (es) => es.forEach((e) => { const sc = e.target.querySelector(".sc"); if (sc) sc.classList.toggle("on", e.isIntersecting); }),
    { threshold: 0.45 }
  );
  mob.querySelectorAll(".m-screen").forEach((m) => mobIO.observe(m));

  applyTrackHeight();
  measure();
  show(0);

  const unsubResize = scrollBus.onResize(measure);
  const unsubScroll = scrollBus.subscribe((s) => syncFromScroll(s.y, s.vh));
  window.addEventListener("pointermove", onPointer, { passive: true });
  reduce.addEventListener?.("change", measure);

  scrollBus.refresh();

  return () => {
    unsubScroll();
    unsubResize();
    cancelAnimationFrame(cutRaf1);
    cancelAnimationFrame(cutRaf2);
    if (ptrRaf) cancelAnimationFrame(ptrRaf);
    window.removeEventListener("pointermove", onPointer);
    reduce.removeEventListener?.("change", measure);
    goButtons.forEach((b) => b.removeEventListener("click", onGo));
    introIO.disconnect();
    mobIO.disconnect();
    window.clearInterval(clock);
    timers.forEach((t) => window.clearTimeout(t));
    scroll.style.height = "";
  };
}