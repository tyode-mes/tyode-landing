import type { Metadata } from "next";
import Link from "next/link";
import LegalPage, { type LegalSection } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Use - Tyode",
  description: "The terms that apply when you use the Tyode website and live demo.",
  alternates: { canonical: "/terms" },
};

const UPDATED = "17 November 2026";

const sections: LegalSection[] = [
  {
    id: "agree",
    title: "Using this website",
    body: (
      <>
        <p>
          These terms apply to the Tyode website, including the live demo at <Link href="/demo">/demo</Link>. By using
          the site you agree to them. If you do not agree, please do not use the site.
        </p>
        <p>
          Tyode is built by a student team at the Informatics Institute of Technology, in partnership with the
          University of Westminster. &ldquo;Tyode&rdquo;, &ldquo;we&rdquo; and &ldquo;us&rdquo; mean that team.
        </p>
      </>
    ),
  },
  {
    id: "demo",
    title: "Concept visuals and sample data",
    body: (
      <>
        <p>
          Product screens, the counting visual and the live demo are concepts that show how Tyode is designed to work.
          They run on <b>simulated sample data</b>. Names, tyre labels, counts, times and machine readings shown on the
          site are examples, not records from any real factory, and are not a promise of specific results in your
          plant.
        </p>
        <p>
          Features and timelines described on the site may change as the product develops. Any commitment about what
          Tyode will deliver for a customer is made only in a separate written agreement.
        </p>
      </>
    ),
  },
  {
    id: "use",
    title: "What you may and may not do",
    body: (
      <>
        <p>You are welcome to browse the site, try the demo and share links to it. Please do not:</p>
        <ul>
          <li>copy, resell or republish the site&apos;s design, code, videos or text without our permission;</li>
          <li>try to break, overload or gain unauthorised access to the site or the services behind it;</li>
          <li>use automated tools to scrape the site in bulk;</li>
          <li>send spam, false information or harmful content through the contact or booking forms.</li>
        </ul>
      </>
    ),
  },
  {
    id: "ip",
    title: "Our content",
    body: (
      <>
        <p>
          The Tyode name and logo, the site&apos;s design, videos, 3D models, illustrations and text belong to the
          Tyode team unless stated otherwise. Logos of partner institutions belong to their owners and are shown only
          to describe our relationship with them.
        </p>
      </>
    ),
  },
  {
    id: "feedback",
    title: "Ideas you send us",
    body: (
      <p>
        If you send us feedback or suggestions, we may use them to improve Tyode without owing you anything. Please do
        not send us confidential information through the contact form. If you need to share something confidential, ask
        us first and we will agree how to handle it.
      </p>
    ),
  },
  {
    id: "links",
    title: "Other websites",
    body: (
      <p>
        The site links to services such as Cal.com, LinkedIn, Instagram and GitHub. Those sites have their own terms and
        privacy policies, and we are not responsible for them.
      </p>
    ),
  },
  {
    id: "warranty",
    title: "No guarantees",
    body: (
      <p>
        We work to keep the site accurate and available, but it is provided <b>&ldquo;as is&rdquo;</b>. We do not
        guarantee that it will always be available, error-free or up to date, and nothing on it is professional,
        engineering or legal advice.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Limits on our liability",
    body: (
      <p>
        As far as the law allows, we are not liable for any loss that comes from using, or not being able to use, this
        website or the demo, including decisions made based on sample data shown here. Nothing in these terms limits
        any liability that cannot be limited by law.
      </p>
    ),
  },
  {
    id: "privacy",
    title: "Your personal data",
    body: (
      <p>
        How we handle the details you send us is explained in our <Link href="/privacy">Privacy Policy</Link>.
      </p>
    ),
  },
  {
    id: "law",
    title: "Changes and governing law",
    body: (
      <>
        <p>
          We may update these terms from time to time. The date at the top shows when they last changed, and the
          version on this page is the one that applies.
        </p>
        <p>These terms are governed by the laws of Sri Lanka, and the courts of Sri Lanka will handle any dispute.</p>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      kicker="Legal · Terms"
      title="Terms of Use"
      updated={UPDATED}
      other={{ href: "/privacy", label: "Read our Privacy Policy" }}
      intro={
        <p>
          <b>The short version:</b> enjoy the site and the demo. Everything you see runs on sample data, so treat it as a
          concept, not a measurement. Please don&apos;t copy our work or misuse the forms.
        </p>
      }
      sections={sections}
    />
  );
}
