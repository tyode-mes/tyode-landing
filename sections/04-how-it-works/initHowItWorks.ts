/* Scroll logic for the how-it-works section: the tyre builds, the passport fills, the ruler tracks progress.
   Runs once on mount and returns a cleanup function (safe under React Strict Mode). */

const CAPTIONS = [
  "3 lots scanned · all in date",
  "Base B-1031-04 · cushion C-1028-03 · tread T-1029-07",
  "ID P1-2611-00427 applied to the steel band",
  "3 layers, each linked to its batch",
  "Press P-05 · mould M-02 · cure curve logged",
  "Ultrasound, weight, hardness, size · signed off",
  "Rack C4 · pallet 118",
  "Order EX-2614 · loaded for export",
];

export function initHowItWorks(sec: HTMLElement): () => void {
  const $ = <T extends Element = HTMLElement>(sel: string) => sec.querySelector(sel) as T;
  const scroll = $(".hw-scroll");
  const items = Array.from(sec.querySelectorAll<HTMLElement>(".hw-item"));
  const N = items.length;
  const vis = $("#hw-vis"), cap = $("#hw-cap"), idx = $("#hw-index"), pass = $("#hw-pass"),
        count = $("#hw-count"), mob = $("#hw-mob");
  const rows = Array.from(pass.querySelectorAll<HTMLElement>("li"));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  /* tread blocks around the tyre */
  let blocks = "";
  for (let i = 0; i < 60; i++)
    blocks += `<rect x="244" y="44" width="12" height="16" rx="3" fill="#1b1b1e" transform="rotate(${i * 6} 250 240)"/>`;
  $("#hw-blocks").innerHTML = blocks;

  /* stacked cards for tablets, phones and reduced motion (cleared first, so a re-run never duplicates) */
  mob.innerHTML = "";
  items.forEach((it, i) => {
    const a = document.createElement("article");
    const title = Array.from(it.querySelectorAll("h3 .ln > span")).map((s) => s.textContent).join(" ");
    const device = it.querySelector("dd")?.textContent ?? "";
    const recorded = rows[i].querySelector("em")?.getAttribute("data-v") ?? "";
    a.innerHTML = `<span class="n">${String(i + 1).padStart(2, "0")}</span><h3>${title}</h3><p>${it.querySelector("p")?.textContent ?? ""}</p><div class="rec"><span>${device}</span><span>Recorded: ${recorded}</span></div>`;
    mob.appendChild(a);
  });

  /* intro reveal */
  const introIO = new IntersectionObserver(
    (es, o) => es.forEach((e) => { if (e.isIntersecting) { sec.classList.add("in"); o.disconnect(); } }),
    { threshold: 0.2 }
  );
  introIO.observe($(".hw-intro"));

  let cur = -1, stacked = false;

  function show(i: number) {
    if (i === cur) return;
    cur = i;
    items.forEach((it, k) => it.classList.toggle("on", k === i));
    vis.dataset.s = String(i + 1);
    for (let k = 1; k <= N; k++) vis.classList.toggle("p" + k, k <= i + 1);
    rows.forEach((r, k) => {
      const em = r.querySelector("em")!;
      r.classList.toggle("on", k <= i);
      r.classList.toggle("now", k === i);
      em.textContent = k <= i ? em.getAttribute("data-v") ?? "" : "—";
    });
    count.textContent = `${i + 1} / ${N}`;
    pass.style.setProperty("--pp", ((i + 1) / N).toFixed(3));
    idx.textContent = String(i + 1).padStart(2, "0");
    cap.textContent = CAPTIONS[i];
    /* restart the roll animations */
    [idx, cap].forEach((el) => el.classList.remove("roll"));
    void cap.offsetWidth;
    [idx, cap].forEach((el) => el.classList.add("roll"));
  }

  function onScroll() {
    if (stacked) return;
    const r = scroll.getBoundingClientRect(), total = scroll.offsetHeight - window.innerHeight;
    const p = Math.min(1, Math.max(0, -r.top / (total || 1)));
    sec.style.setProperty("--p", p.toFixed(4));
    show(Math.min(N - 1, Math.floor(p * N * 0.9999)));
  }

  function layout() {
    stacked = window.innerWidth < 1100;
    sec.classList.toggle("is-stacked", stacked);
    scroll.style.height = stacked ? "" : N * 65 + 100 + "vh";
    if (!stacked) onScroll();
  }

  /* jump to a stage from the ruler */
  const goButtons = Array.from(sec.querySelectorAll<HTMLElement>("[data-go]"));
  const onGo = (ev: Event) => {
    const i = Number((ev.currentTarget as HTMLElement).dataset.go), total = scroll.offsetHeight - window.innerHeight;
    window.scrollTo({ top: scroll.getBoundingClientRect().top + window.scrollY + total * ((i + 0.5) / N), behavior: reduce.matches ? "auto" : "smooth" });
  };
  goButtons.forEach((b) => b.addEventListener("click", onGo));

  /* gentle pointer parallax on the tyre */
  const onPointer = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" || stacked) return;
    sec.style.setProperty("--mx", ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3));
    sec.style.setProperty("--my", ((e.clientY / window.innerHeight) * 2 - 1).toFixed(3));
  };

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
    scroll.style.height = "";
  };
}
