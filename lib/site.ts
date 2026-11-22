/**
 * The site's public details, used for search engines and link previews (app/layout.tsx,
 * app/robots.ts, app/sitemap.ts).
 *
 * SITE_URL is the live address. Set NEXT_PUBLIC_SITE_URL in your hosting settings to override
 * it (e.g. once you add a custom domain). On Vercel, the production address is picked up
 * automatically.
 */
const fromEnv =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined);

export const SITE_URL = (fromEnv ?? "http://localhost:3000").replace(/\/+$/, "");

export const SITE_NAME = "Tyode";

export const SITE_TITLE = "Tyode - Traceability for Solid and Pneumatic Tyres";

/** ~155 characters: roughly what Google shows under the title in results */
export const SITE_DESCRIPTION =
  "Tyode counts every green tyre at the machine, gives each solid and pneumatic tyre a digital passport, and uses AI to explain defects with every source cited.";
