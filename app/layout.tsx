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
  title: "Tyode - Process Intelligence for Solid Tyres",  description:
    "A complete digital passport and process intelligence platform for every solid tyre — tracing materials, logging cures, and explaining defects from compound batch to export container."
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
