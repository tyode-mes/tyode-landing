import type { Metadata } from "next";
import Link from "next/link";
import TyodeMark from "@/components/brand/TyodeMark";
import SignInForm from "./SignInForm";
import s from "./signin.module.css";

export const metadata: Metadata = {
  title: "Client sign in - Tyode",
  description: "Sign in to your plant's edition of Tyode, or open the public demo.",
  robots: { index: false, follow: false },
};

/* Two ways in, on Tyode's drawing board: the public demo (open to anyone) and the client sign-in
   (each client's own edition at /demo/client). */
/* sample tyres for the demo card's feed (the same kind of thing the public demo shows) */
const FEED = [
  { serial: "GT-2611-0431", where: "BM-01", label: "Built", state: "ok" },
  { serial: "GT-2611-0430", where: "P-03", label: "Held", state: "held" },
  { serial: "GT-2611-0429", where: "BM-05", label: "Built", state: "ok" },
  { serial: "GT-2611-0428", where: "P-07", label: "Cured", state: "ok" },
  { serial: "GT-2611-0427", where: "BM-04", label: "Flagged", state: "flag" },
  { serial: "GT-2611-0426", where: "P-01", label: "Cured", state: "ok" },
  { serial: "GT-2611-0425", where: "BM-02", label: "Built", state: "ok" },
];

export default function SignInPage() {
  return (
    <div className={s.page}>
      <header className={s.top}>
        <Link href="/" className={s.back}><span aria-hidden="true">←</span> tyode.com</Link>
        <Link href="/demo" className={s.demoPill}><i aria-hidden="true" />Public demo</Link>
      </header>

      <main className={s.split}>
        <section className={s.brand}>
          <Link href="/" className={s.markWrap} aria-label="Tyode home">
            <TyodeMark pad={36} />
            <span className={s.scan} aria-hidden="true" />
          </Link>
          <h1 className={s.headline}>
            <span>Every tyre, traced.</span>
            <span>Two ways in.</span>
          </h1>

          <Link href="/demo" className={s.demo}>
            <span className={s.demoCopy}>
              <span className={s.demoTag}><i aria-hidden="true" />No sign-in needed</span>
              <span className={s.demoTitle}>Explore the public demo</span>
              <span className={s.demoText}>A sample plant, live: builds counted, tyres traced, defects caught.</span>
              <span className={s.demoGo}>
                Open the demo
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
              </span>
            </span>
            {/* a taste of what's inside: the plant's tyres going by */}
            <span className={s.feed} aria-hidden="true">
              <span className={s.feedTrack}>
                {[...FEED, ...FEED].map((r, i) => (
                  <span key={i} className={s.row} data-state={r.state}>
                    <b>{r.serial}</b>
                    <em>{r.where}</em>
                    <u>{r.label}</u>
                  </span>
                ))}
              </span>
            </span>
          </Link>
        </section>

        <section className={s.card} aria-labelledby="signin-title">
          <span className={s.crop} aria-hidden="true" />
          <p className={s.eyebrow}>
            <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1.6" /><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" /></svg>
            Client sign in
          </p>
          <h2 id="signin-title" className={s.title}>
            Your plant&apos;s Tyode.<br /><span>Set up for your line.</span>
          </h2>

          <SignInForm />

          <p className={s.help}>
            Trouble signing in? <a href="mailto:contact@tyode.com?subject=Client%20sign-in%20help">Contact the Tyode team</a>
          </p>
        </section>
      </main>
    </div>
  );
}
