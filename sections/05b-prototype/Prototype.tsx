"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import styles from "./Prototype.module.css";

type PrototypeScreen = {
  id: string;
  title: string;
  caption: string;
  src: string;
  alt: string;
};

const SCREENS: PrototypeScreen[] = [
  {
    id: "01",
    title: "Green tyre count board",
    caption: "Live shift totals across building stations for solid and pneumatic tyres.",
    src: "/prototype/count-board.webp",
    alt: "High-fidelity Tyode prototype screen showing the live green tyre count board with shift output, station targets, and batch progress.",
  },
  {
    id: "02",
    title: "Digital Passport",
    caption: "Full lifecycle record linking compound batch, build, cure, and inspection checks.",
    src: "/prototype/digital-passport.webp",
    alt: "High-fidelity Tyode prototype screen showing a tyre Digital Passport with compound batch origin, build and curing history, and quality results.",
  },
  {
    id: "03",
    title: "Batch hold",
    caption: "Quarantine suspect compound batches before affected tyres reach curing or export.",
    src: "/prototype/batch-hold.webp",
    alt: "High-fidelity Tyode prototype screen showing the batch hold view with quarantined compound lots, affected tyre counts, and release actions.",
  },
  {
    id: "04",
    title: "Detective report",
    caption: "Groups recurring faults across moulds, shifts, and lots to surface likely causes.",
    src: "/prototype/detective-report.webp",
    alt: "High-fidelity Tyode prototype screen showing the Detective report correlating defect clusters across moulds, shifts, and compound batches.",
  },
];

export default function Prototype() {
  const [active, setActive] = useState(0);

  const step = (delta: number) =>
    setActive((prev) => (prev + delta + SCREENS.length) % SCREENS.length);

  return (
    <section
      id="prototype"
      className={styles.section}
      aria-labelledby="prototype-title"
    >
      <div className={styles.inner}>
        <header className={styles.head}>
          <div className={styles.headLeft}>
            <h2 id="prototype-title" className={styles.heading}>
              See the <span className={styles.muted}>prototype.</span>
            </h2>
            <span className={styles.label}>Concept · sample data</span>
          </div>

          <div className={styles.headRight}>
            <div className={styles.pager}>
              <span className={styles.counter} aria-live="polite">
                {SCREENS[active].id} / 0{SCREENS.length}
              </span>
              <div className={styles.arrows}>
                <button
                  type="button"
                  className={styles.arrowBtn}
                  onClick={() => step(-1)}
                  aria-label="Previous prototype screen"
                >
                  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      d="M10 3.5 5.5 8l4.5 4.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button
                  type="button"
                  className={styles.arrowBtn}
                  onClick={() => step(1)}
                  aria-label="Next prototype screen"
                >
                  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path
                      d="M6 3.5 10.5 8 6 12.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <span className={styles.divider} aria-hidden="true" />

            <Link href="/demo" className={styles.demoLink}>
              Open live demo
              <span className={styles.arrow} aria-hidden="true">
                ↗
              </span>
            </Link>
          </div>
        </header>

        <div className={styles.stage}>
          <div
            className={styles.track}
            style={{ "--active": active } as CSSProperties}
          >
            {SCREENS.map((screen, i) => {
              const isActive = i === active;
              return (
                <figure
                  key={screen.id}
                  className={`${styles.slide} ${isActive ? styles.activeSlide : ""}`}
                >
                  <div className={styles.frame}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={screen.src}
                      alt={screen.alt}
                      width={1440}
                      height={900}
                      loading={i === 0 ? "eager" : "lazy"}
                      decoding="async"
                      className={styles.image}
                    />
                  </div>
                  <figcaption className={styles.mobileCaption}>
                    <span className={styles.capIndex}>{screen.id}</span>
                    <strong className={styles.capTitle}>{screen.title}</strong>
                    <span className={styles.capText}>{screen.caption}</span>
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </div>

        <ol className={styles.tabs} role="tablist" aria-label="Prototype screens">
          {SCREENS.map((screen, i) => {
            const isActive = i === active;
            return (
              <li key={screen.id} className={styles.tabItem} role="presentation">
                <button
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  className={`${styles.tab} ${isActive ? styles.activeTab : ""}`}
                  onClick={() => setActive(i)}
                >
                  <span className={styles.tabTop}>
                    <span className={styles.capIndex}>{screen.id}</span>
                    <span className={styles.capTitle}>{screen.title}</span>
                  </span>
                  <span className={styles.capText}>{screen.caption}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}