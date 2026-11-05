// The landing page: every section, in order. Each section lives in its own folder under
// /sections, so the team can work on them at the same time without touching each other's
// files. You normally don't need to edit this file — work inside your section's folder.
import SiteNav from "@/sections/01-navbar/SiteNav";
import Hero from "@/sections/02-hero/Hero";
import Overview from "@/sections/03-overview/Overview";
import HowItWorks from "@/sections/04-how-it-works/HowItWorks";
import Features from "@/sections/05-features/Features";
import Team from "@/sections/07-team/Team";
import Footer from "@/sections/08-footer/Footer";
import Partners from "@/sections/06-partners/Partners";


export default function Home() {
  return (
    <>
      <SiteNav />
      <main>
        <Hero />
        <Overview />
        <Partners />
        <HowItWorks />
        <Features />
        <Team />
      </main>
      <Footer />
    </>
  );
}
