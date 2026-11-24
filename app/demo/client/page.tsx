import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import TyodeLogo from "@/components/brand/TyodeLogo";
import { currentClient } from "@/lib/clientSession";
import { signOut } from "../sign-in/actions";
import s from "../sign-in/signin.module.css";

export const metadata: Metadata = {
  title: "Your edition - Tyode",
  robots: { index: false, follow: false },
};

/* A signed-in client's own edition of Tyode. Their plant-specific screens go here as they are built. */
export default function ClientPage() {
  return (
    <div className={s.page}>
      <header className={s.top}>
        <Link href="/" className={s.logo} aria-label="Tyode home"><TyodeLogo /></Link>
        <Link href="/" className={s.site}>tyode.com <span aria-hidden="true">↗</span></Link>
      </header>
      <main className={s.main}>
        <section className={s.card} aria-labelledby="client-title">
          <Suspense fallback={<p className={s.loading}>Opening your edition…</p>}>
            <Welcome />
          </Suspense>
        </section>
      </main>
    </div>
  );
}

async function Welcome() {
  const client = await currentClient();
  if (!client) redirect("/demo/sign-in");
  return (
    <>
      <p className={s.eyebrow}>
        <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1.6" /><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" /></svg>
        Signed in
      </p>
      <h1 id="client-title" className={s.title}>
        Welcome, {client.name}.<br /><span>Your edition is being prepared.</span>
      </h1>
      <p className={s.sub}>Your plant&apos;s screens will appear here. Until then, the public demo shows how Tyode works.</p>
      <div className={s.welcome}>
        <Link href="/demo" className={s.submit} style={{ display: "grid", placeItems: "center", textDecoration: "none" }}>Open the demo</Link>
        <form action={signOut}><button type="submit" className={s.ghost} style={{ width: "100%" }}>Sign out</button></form>
      </div>
    </>
  );
}
