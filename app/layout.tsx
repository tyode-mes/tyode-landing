import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import "../sections/05-features/features.css";
import "../sections/04-how-it-works/how-it-works.css";
import "../sections/03-overview/overview.css";


const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Tyode — pre-cure inspection and traceability for solid tyres",
  description:
    "Volumetric inspection, AI surface grading and a Digital Passport for every solid tyre — from green tyre to finished unit.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
