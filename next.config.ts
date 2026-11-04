import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  // Hero clips + posters never change under the same name (rename or bump the cache
  // version when you replace them), so browsers and CDNs may keep them for a year.
  async headers() {
    return [
      {
        source: "/videos/:file*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
  turbopack: {
    rules: {
      // Only globals.css goes through Tailwind, so *.module.css files stay CSS Modules
      "globals.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
