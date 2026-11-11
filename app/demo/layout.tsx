import type { Metadata } from "next";
import DemoShell from "./DemoShell";

export const metadata: Metadata = {
  title: "Tyode Demo - Green Tyre Counting",
  description: "Public demo of Tyode green tyre counting: verified counts per builder, press reconciliation and missing tyres, on simulated data.",
};

export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <DemoShell>{children}</DemoShell>;
}
