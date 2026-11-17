import type { Metadata } from "next";
import LegalPage, { type LegalSection } from "@/components/legal/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy - Tyode",
  description: "What personal data the Tyode website collects, why, who it is shared with, and your rights.",
  alternates: { canonical: "/privacy" },
};

const UPDATED = "17 November 2026";

const sections: LegalSection[] = [
  {
    id: "who",
    title: "Who we are",
    body: (
      <>
        <p>
          Tyode is a traceability platform for pneumatic and solid tyre plants, built by a student team at the Informatics Institute of
          Technology, in partnership with the University of Westminster. &ldquo;Tyode&rdquo;, &ldquo;we&rdquo; and
          &ldquo;us&rdquo; in this policy mean that team. We decide how the personal data collected through this
          website is used, so we are responsible for it.
        </p>
        <p>
          You can reach us about anything in this policy at <a href="mailto:contact@tyode.com">contact@tyode.com</a>.
        </p>
      </>
    ),
  },
  {
    id: "collect",
    title: "What we collect",
    body: (
      <>
        <p>We only collect what you choose to send us, plus the basic technical data any website receives.</p>
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th>What</th>
              <th>Why</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Get in touch form</td>
              <td>Your name, email, company (optional) and message</td>
              <td>To reply to you</td>
            </tr>
            <tr>
              <td>Book a walkthrough</td>
              <td>Your name, email, chosen time and anything you add to the booking</td>
              <td>To arrange and hold the meeting</td>
            </tr>
            <tr>
              <td>Emailing us</td>
              <td>Your email address and what you write</td>
              <td>To reply to you</td>
            </tr>
            <tr>
              <td>Visiting the site</td>
              <td>IP address, browser type and pages requested, in server logs</td>
              <td>To deliver the site and keep it secure</td>
            </tr>
          </tbody>
        </table>
        <p>
          We do not use analytics, advertising trackers or tracking cookies on this website. The live demo and the
          counting visual on the home page run entirely in your browser on sample data, and anything you type into the
          demo&apos;s search box is not sent to us.
        </p>
      </>
    ),
  },
  {
    id: "basis",
    title: "Why we are allowed to use it",
    body: (
      <>
        <p>
          We use the details you send us because you asked us to reply or to book a meeting, and because we have a
          legitimate interest in answering enquiries about Tyode. We use server logs because they are needed to run
          the site safely. We never use your data for anything unrelated to these purposes, and we never sell it.
        </p>
      </>
    ),
  },
  {
    id: "share",
    title: "Who we share it with",
    body: (
      <>
        <p>We use a small number of services to run the website. Each one only gets what it needs:</p>
        <ul>
          <li>
            <b>Vercel</b> hosts the website and keeps short-lived request logs.
          </li>
          <li>
            <b>Web3Forms</b> receives the Get in touch form and forwards it to our email.
          </li>
          <li>
            <b>Cal.com</b> handles walkthrough bookings. When you open the booking window, Cal.com may set its own
            cookies that it needs for the calendar to work.
          </li>
          <li>
            <b>Our email provider</b> stores messages we send and receive.
          </li>
        </ul>
        <p>
          These providers may store data outside Sri Lanka. We only use providers that protect personal data under
          their own published privacy terms. We will also share data if the law requires us to.
        </p>
      </>
    ),
  },
  {
    id: "keep",
    title: "How long we keep it",
    body: (
      <>
        <p>
          We keep enquiries and booking details for as long as we are talking with you, and for up to 24 months after
          our last contact, unless you ask us to delete them sooner. Hosting logs are kept by Vercel for a short period
          under its own retention rules.
        </p>
      </>
    ),
  },
  {
    id: "rights",
    title: "Your rights",
    body: (
      <>
        <p>You can ask us at any time to:</p>
        <ul>
          <li>tell you what personal data we hold about you and give you a copy;</li>
          <li>correct anything that is wrong or out of date;</li>
          <li>delete your data, or stop using it;</li>
          <li>withdraw any consent you have given.</li>
        </ul>
        <p>
          Email <a href="mailto:contact@tyode.com">contact@tyode.com</a> and we will reply within 21 days. We follow
          Sri Lanka&apos;s Personal Data Protection Act, No. 9 of 2022 (as amended). If you are unhappy with how we
          handled your request, you can complain to the Data Protection Authority of Sri Lanka.
        </p>
      </>
    ),
  },
  {
    id: "security",
    title: "Keeping it safe",
    body: (
      <>
        <p>
          The website is served only over HTTPS, access to our inboxes and tools is limited to the team, and we keep
          the amount of data we hold as small as we can. No method of sending data over the internet is perfectly
          secure, but we will tell you promptly if a breach affects your data.
        </p>
      </>
    ),
  },
  {
    id: "platform",
    title: "The Tyode platform",
    body: (
      <>
        <p>
          This policy covers this website only. When a manufacturer uses the Tyode platform in its own plant, the data
          recorded there, such as builder sign-ins and production records, belongs to that manufacturer and is covered
          by a separate agreement with them.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>This website is meant for businesses and is not aimed at anyone under 18. We do not knowingly collect their data.</p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        If we change this policy we will update the date at the top of this page. If the change is significant and we
        hold your email address, we will let you know.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      kicker="Legal · Privacy"
      title="Privacy Policy"
      updated={UPDATED}
      other={{ href: "/terms", label: "Read our Terms of Use" }}
      intro={
        <>
          <p>
            <b>The short version:</b> we only collect what you send us through the contact form, a booking or an email.
            We use it to reply to you, we never sell it, and there are no trackers or ads on this site.
          </p>
        </>
      }
      sections={sections}
    />
  );
}
