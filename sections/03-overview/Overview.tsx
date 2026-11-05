"use client";

import { useEffect, useRef } from "react";
import { OVERVIEW_MARKUP } from "./markup";
import { initOverview } from "./initOverview";

/* Section 03, overview: process intelligence for solid tyres, who it serves, and how it fits the plant floor.
   Styles live in ./overview.css, imported once in app/layout.tsx. */
export default function Overview() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    return initOverview(ref.current);
  }, []);

  return (
    <section
      ref={ref}
      className="ov"
      id="overview"
      aria-labelledby="ov-title"
      dangerouslySetInnerHTML={{ __html: OVERVIEW_MARKUP }}
    />
  );
}
