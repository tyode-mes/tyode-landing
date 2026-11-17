import Link from "next/link";
import type { ReactNode } from "react";
import TyodeLogo from "@/components/brand/TyodeLogo";
import styles from "./LegalPage.module.css";

export type LegalSection = { id: string; title: string; body: ReactNode };

type Props = {
  kicker: string;
  title: string;
  updated: string;
  intro: ReactNode;
  sections: LegalSection[];
  other: { href: string; label: string };
};

/**
 * Shared layout for /privacy and /terms: a dark header with the page title, a sticky contents
 * list on wide screens, and numbered sections. Server-rendered, no scripts.
 */
export default function LegalPage({ kicker, title, updated, intro, sections, other }: Props) {
  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div className={styles.bar}>
          <Link href="/" className={styles.logo} aria-label="Tyode home">
            <TyodeLogo />
          </Link>
          <nav className={styles.barLinks} aria-label="Legal">
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
            <Link href="/" className={styles.back}>
              Back to site <span aria-hidden="true">→</span>
            </Link>
          </nav>
        </div>
        <div className={styles.hero}>
          <p className={styles.kicker}>{kicker}</p>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.updated}>Last updated {updated}</p>
        </div>
      </header>

      <main className={styles.main}>
        <aside className={styles.toc} aria-label="On this page">
          <p className={styles.tocHead}>On this page</p>
          <ol>
            {sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </aside>

        <article className={styles.doc}>
          <div className={styles.intro}>{intro}</div>
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className={styles.section}>
              <h2>
                <span className={styles.num}>{String(i + 1).padStart(2, "0")}</span>
                {s.title}
              </h2>
              <div className={styles.body}>{s.body}</div>
            </section>
          ))}
          <div className={styles.end}>
            <p>Questions about this page?</p>
            <a href="mailto:contact@tyode.com">contact@tyode.com</a>
            <Link href={other.href} className={styles.other}>
              {other.label} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </article>
      </main>

      <footer className={styles.foot}>
        <span>© 2026 Tyode</span>
        <span>Built at Informatics Institute of Technology · University of Westminster</span>
      </footer>
    </div>
  );
}
