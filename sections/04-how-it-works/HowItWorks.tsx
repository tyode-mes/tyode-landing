"use client";

import { useEffect, useRef } from "react";
import { HOW_IT_WORKS_MARKUP } from "./markup";

/* Section 04, how it works: a live 3D solid tyre told in eight stages.
   three.js loads only in the browser, when this section mounts.
   Styles live in ./how-it-works.css, imported once in app/layout.tsx. */
export default function HowItWorks() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let cancelled = false;
    import("./initHowItWorks3D").then(({ initHowItWorks3D }) => {
      if (cancelled || !ref.current) return;
      try {
        cleanup = initHowItWorks3D(ref.current);
      } catch {
        /* no WebGL (rare, e.g. locked-down office PCs): keep the copy and passport, hide the canvas */
        ref.current.classList.add("no3d");
      }
    });
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return (
    <section
      ref={ref}
      className="h3"
      id="how-it-works"
      aria-labelledby="h3-title"
      dangerouslySetInnerHTML={{ __html: HOW_IT_WORKS_MARKUP }}
    />
  );
}
