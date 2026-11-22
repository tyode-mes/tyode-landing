"use client";

import { useEffect, useRef, type CSSProperties } from "react";
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
  const ref = useRef<HTMLElement>(null);

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
      { threshold: 0.15 }
    );
    sec.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      id="prototype"
      className={styles.section}
      aria-labelledby="prototype-title"
    >
      <div className={styles.inner}>
        <header className={styles.head} data-reveal>
          <div className={styles.headCopy}>
            <span className={styles.badge}>Concept · sample data</span>
            <h2 id="prototype-title" className={styles.heading}>
              <span className={styles.ln}>
                <span>See the</span>
              </span>
              <span className={styles.ln}>
                <span>prototype.</span>
              </span>
            </h2>
            <p className={styles.sub}>
              High-fidelity screens from the plant-floor workflow, built to trace every tyre and
              isolate faults fast.
            </p>
          </div>

          <Link href="/demo" className={styles.cta}>
            <span>Open live demo</span>
            <span className={styles.arrow} aria-hidden="true">
              →
            </span>
          </Link>
        </header>

        <ol className={styles.grid}>
          {SCREENS.map((screen, i) => (
            <li
              key={screen.id}
              className={styles.item}
              data-reveal
              style={{ "--i": i } as CSSProperties}
            >
              <figure className={styles.card}>
                <div className={styles.frame}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={screen.src}
                    alt={screen.alt}
                    width={1440}
                    height={900}
                    loading="lazy"
                    decoding="async"
                    className={styles.image}
                  />
                </div>
                <figcaption className={styles.meta}>
                  <div className={styles.metaTop}>
                    <span className={styles.title}>
                      <span className={styles.index}>{screen.id}</span>
                      {screen.title}
                    </span>
                    <span className={styles.tag}>Concept · sample data</span>
                  </div>
                  <p className={styles.caption}>{screen.caption}</p>
                </figcaption>
              </figure>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}