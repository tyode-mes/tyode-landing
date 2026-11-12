import type { Metadata } from "next";
import PassportDemo from "./PassportDemo";

export const metadata: Metadata = {
  title: "Tyode Demo - Tyre Passport",
  description: "Follow one solid tyre from raw material to customer and watch its passport fill in, then use it to contain a bad batch, answer a customer claim and stop expired material. Concept demo on sample data.",
  alternates: { canonical: "/passport" },
};

export default function PassportPage() {
  return <PassportDemo />;
}
