import HeroVideo, { type HeroClips } from "./HeroVideo";

// Bump this when you replace any file in /public/videos, so browsers fetch the new one
const V = "?v=9";

// Hero clips (made by the asset pipeline). Defined outside the component so the hero
// doesn't restart on every render.
const CLIPS: HeroClips = {
  assembled: "/videos/hero-loop-assembled.mp4" + V,
  breakApart: "/videos/hero-break.mp4" + V,
  exploded: "/videos/hero-loop-exploded.mp4" + V,
  poster: "/videos/hero-poster.jpg" + V,
  // the same break-apart frames as a raw stream, decoded directly for seek-free scrubbing
  breakStream: "/videos/hero-break.h264" + V,
};

// Lighter set for phones, low-memory devices and slow or data-saver connections (the hero picks it
// itself). Same frames at 768 x 864 instead of 1280 x 1440: about 1.9 MB in total instead of 8 MB.
const LITE: HeroClips = {
  assembled: "/videos/hero-loop-assembled-lite.mp4" + V,
  breakApart: "/videos/hero-break-lite.mp4" + V,
  exploded: "/videos/hero-loop-exploded-lite.mp4" + V,
  poster: "/videos/hero-poster-lite.jpg" + V,
  breakStream: "/videos/hero-break-lite.h264" + V,
};

/** Section 02: the scroll-driven 3D hero. Its anchor is #top. */
export default function Hero() {
  return <HeroVideo src="/videos/hero-fallback.mp4" hd={CLIPS} sd={LITE} />;
}
