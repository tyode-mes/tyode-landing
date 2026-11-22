"use client";

import { useEffect, useRef, useState, type CSSProperties, type TouchEvent } from "react";
import Link from "next/link";
import styles from "./Prototype.module.css";

type PrototypeScreen = {
  id: string;
  shortTitle: string;
  title: string;
  caption: string;
  src: string;
  alt: string;
};

const SCREENS: PrototypeScreen[] = [
  {
    id: "01",
    shortTitle: "Count board",
    title: "Green tyre count board",
    caption: "Live shift totals across building stations for solid and pneumatic tyres.",
    src: "/prototype/count-board.webp",
    alt: "High-fidelity Tyode prototype screen showing the live green tyre count board with shift output, station targets, and batch progress.",
  },
  {
    id: "02",
    shortTitle: "Digital Passport",
    title: "Digital Passport",
    caption: "Full lifecycle record linking compound batch, build, cure, and inspection checks.",
    src: "/prototype/digital-passport.webp",
    alt: "High-fidelity Tyode prototype screen showing a tyre Digital Passport with compound batch origin, build and curing history, and quality results.",
  },
  {
    id: "03",
    shortTitle: "Batch hold",
    title: "Batch hold",
    caption: "Quarantine suspect compound batches before affected tyres reach curing or export.",
    src: "/prototype/batch-hold.webp",
    alt: "High-fidelity Tyode prototype screen showing the batch hold view with quarantined compound lots, affected tyre counts, and release actions.",
  },
  {
    id: "04",
    shortTitle: "Detective report",
    title: "Detective report",
    caption: "Groups recurring faults across moulds, shifts, and lots to surface likely causes.",
    src: "/prototype/detective-report.webp",
    alt: "High-fidelity Tyode prototype screen showing the Detective report correlating defect clusters across moulds, shifts, and compound batches.",
  },
];

export default function Prototype() {
  const ref = useRef<HTMLElement>(null);
  const touchStartX = useRef<number | null>(null);
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
      { threshold: 0.1 }
    );
    sec.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const step = (delta: number) =>
    setActive((prev) => (prev + delta + SCREENS.length) % SCREENS.length);

  const onTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const onTouchEnd = (e: TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) > 42) {
      step(dx < 0 ? 1 : -1);
    }
  };

  return (
    <section
      ref={ref}
      id="prototype"
      className={styles.section}
      aria-labelledby="prototype-title"
    >
      <header className={styles.head} data-reveal>
        <div className={styles.headCopy}>
          <p className={styles.kicker}>Concept · sample data</p>
          <h2 id="prototype-title" className={styles.heading}>
            <span className={styles.ln}>
              <span>
                See the <span className={styles.muted}>prototype.</span>
              </span>
            </span>
          </h2>
        </div>

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
      </header>

      <div
        className={styles.stage}
        data-reveal
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
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
                onClick={() => {
                  if (!isActive) setActive(i);
                }}
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
                <figcaption className={styles.captionBar}>
                  <span className={styles.capTitle}>
                    <span className={styles.capIndex}>{screen.id}</span>
                    {screen.title}
                  </span>
                  <span className={styles.capText}>{screen.caption}</span>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>

      <div className={styles.controls} data-reveal>
        <button
          type="button"
          className={styles.navBtn}
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

        <div className={styles.dock} role="tablist" aria-label="Prototype screens">
          {SCREENS.map((screen, i) => {
            const isActive = i === active;
            return (
              <button
                key={screen.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`${styles.dockBtn} ${isActive ? styles.dockBtnActive : ""}`}
                onClick={() => setActive(i)}
              >
                {screen.shortTitle}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          className={styles.navBtn}
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
    </section>
  );
}