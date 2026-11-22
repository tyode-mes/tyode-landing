"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import styles from "./Prototype.module.css";

type PrototypeScreen = {
  id: string;
  title: string;
  route: string;
  caption: string;
  src: string;
  alt: string;
};

const SCREENS: PrototypeScreen[] = [
  {
    id: "01",
    title: "Green tyre count board",
    route: "tyode / demo",
    caption: "Live shift totals across building stations for solid and pneumatic tyres.",
    src: "/prototype/count-board.webp",
    alt: "High-fidelity Tyode prototype screen showing the live green tyre count board with shift output, station targets, and batch progress.",
  },
  {
    id: "02",
    title: "Digital Passport",
    route: "tyode / demo / passport",
    caption: "Full lifecycle record linking compound batch, build, cure, and inspection checks.",
    src: "/prototype/digital-passport.webp",
    alt: "High-fidelity Tyode prototype screen showing a tyre Digital Passport with compound batch origin, build and curing history, and quality results.",
  },
  {
    id: "03",
    title: "Batch hold",
    route: "tyode / demo / holds",
    caption: "Quarantine suspect compound batches before affected tyres reach curing or export.",
    src: "/prototype/batch-hold.webp",
    alt: "High-fidelity Tyode prototype screen showing the batch hold view with quarantined compound lots, affected tyre counts, and release actions.",
  },
  {
    id: "04",
    title: "Detective report",
    route: "tyode / demo / detective",
    caption: "Groups recurring faults across moulds, shifts, and lots to surface likely causes.",
    src: "/prototype/detective-report.webp",
    alt: "High-fidelity Tyode prototype screen showing the Detective report correlating defect clusters across moulds, shifts, and compound batches.",
  },
];

export default function Prototype() {
  const ref = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const sec = ref.current;
    if (!sec) return;
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.in);
            io.unobserve(entry.target);
          }
        }),
      { threshold: 0.12 }
    );
    sec.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const current = SCREENS[active];
  const step = (delta: number) =>
    setActive((prev) => (prev + delta + SCREENS.length) % SCREENS.length);

  return (
    <section
      ref={ref}
      id="prototype"
      className={styles.section}
      aria-labelledby="prototype-title"
    >
      <div className={styles.layout}>
        <header className={styles.head} data-reveal>
          <p className={styles.kicker}>Concept · sample data</p>
          <h2 id="prototype-title" className={styles.heading}>
            <span className={styles.ln}>
              <span>See the</span>
            </span>
            <span className={styles.ln}>
              <span>prototype.</span>
            </span>
          </h2>
        </header>

        <ol className={styles.rail} data-reveal>
          {SCREENS.map((screen, i) => {
            const isActive = i === active;
            return (
              <li key={screen.id} className={styles.railItem}>
                <button
                  type="button"
                  className={`${styles.tab} ${isActive ? styles.activeTab : ""}`}
                  onClick={() => setActive(i)}
                  aria-pressed={isActive}
                >
                  <span className={styles.tabHead}>
                    <span className={styles.tabIndex}>{screen.id}</span>
                    <span className={styles.tabTitle}>{screen.title}</span>
                  </span>
                  <span className={styles.tabCaption}>{screen.caption}</span>
                </button>
              </li>
            );
          })}
        </ol>

        <div className={styles.ctaWrap} data-reveal>
          <Link href="/demo" className={styles.cta}>
            <span>Open live demo</span>
            <span className={styles.ctaCircle} aria-hidden="true">
              <svg viewBox="0 0 16 16" fill="none">
                <path
                  d="M3.25 8h9.5m0 0L8.75 4m4 4-4 4"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </Link>
        </div>

        <div className={styles.stageWrap} data-reveal>
          <div className={styles.bezel}>
            <div className={styles.chrome}>
              <div className={styles.chromeMeta}>
                <span className={styles.counter}>
                  {current.id} / 0{SCREENS.length}
                </span>
                <span className={styles.sep} aria-hidden="true">
                  ·
                </span>
                <span className={styles.route}>{current.route}</span>
              </div>

              <div className={styles.steppers}>
                <button
                  type="button"
                  className={styles.stepBtn}
                  onClick={() => step(-1)}
                  aria-label="Previous prototype screen"
                >
                  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      d="M9.75 3.5 5.25 8l4.5 4.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  className={styles.stepBtn}
                  onClick={() => step(1)}
                  aria-label="Next prototype screen"
                >
                  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      d="M6.25 3.5 10.75 8l-4.5 4.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className={styles.viewport}>
              {SCREENS.map((screen, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={screen.id}
                  src={screen.src}
                  alt={screen.alt}
                  width={1440}
                  height={900}
                  loading={i === 0 ? "eager" : "lazy"}
                  decoding="async"
                  aria-hidden={i !== active}
                  className={`${styles.screen} ${i === active ? styles.activeScreen : ""}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}