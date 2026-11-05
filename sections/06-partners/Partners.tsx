import styles from "./Partners.module.css";

/* Section 06: the programme Tyode is built under. Logos sit in /public/logos.
   `h` is each logo's display height in px, tuned so the three read at the same visual weight. */
const LOGOS = [
  { src: "/logos/atp.svg", alt: "Agile Team Project", h: 72 },
  { src: "/logos/iit.png", alt: "Informatics Institute of Technology", h: 60 },
  { src: "/logos/westminster.svg", alt: "University of Westminster", h: 46 },
];

export default function Partners() {
  return (
    <section className={styles.wrap} aria-labelledby="partners-title">
      <div className={styles.inner}>
        <header className={styles.head}>
          <p className={styles.kicker}>Developed as part of</p>
          <h2 id="partners-title" className={styles.title}>
            A university project, <span>built for a real plant.</span>
          </h2>
        </header>
        <ul className={styles.panel}>
          {LOGOS.map((l) => (
            <li key={l.alt} className={styles.cell}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={l.src} alt={l.alt} style={{ height: l.h }} loading="lazy" decoding="async" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
