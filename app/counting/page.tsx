import type { Metadata } from "next";
import CountingDemo from "./CountingDemo";

export const metadata: Metadata = {
  title: "Green Tyre Counting Demo - Tyode",
  description:
    "A live concept demo of automatic green tyre counting: counted from the machine, labelled at the build, reconciled at the press.",
};

export default function CountingPage() {
  return <CountingDemo />;
}
