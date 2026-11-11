import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** /sitemap.xml: the pages search engines should index (the landing page and the live demo) */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      changeFrequency: "monthly",
      priority: 1,
      images: [`${SITE_URL}/opengraph-image.png`],
    },
    {
      url: `${SITE_URL}/demo`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];
}
