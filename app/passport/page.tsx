import type { Metadata } from "next";
import PassportDemo from "./PassportDemo";

export const metadata: Metadata = {
  title: "Tyode Demo - Tyre Passport",
  description: "Follow one pneumatic tyre on line PL-1 from raw material to the dispatch gate and watch its passport fill in, then use it to hold the tyres from a press that ran too cool. A solid line is available too. Concept demo on sample data.",
  alternates: { canonical: "/passport" },
};

export default function PassportPage() {
  return <PassportDemo />;
}
