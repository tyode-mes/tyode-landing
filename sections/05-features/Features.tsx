"use client";

import { useEffect, useRef } from "react";
import { FEATURES_MARKUP } from "./markup";
import { initFeatures } from "./initFeatures";

/* Features section: pinned, scroll-driven scenes for Trace, Check and Explain.
   Styles live in ./features.css, imported once in app/layout.tsx. */
export default function Features() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    return initFeatures(ref.current);
  }, []);

  return (
    <section
      ref={ref}
      className="ft"
      id="features"
      aria-labelledby="ft-title"
      dangerouslySetInnerHTML={{ __html: FEATURES_MARKUP }}
    />
  );
}
