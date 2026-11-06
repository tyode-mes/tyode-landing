import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** /sitemap.xml: the list of pages search engines should index (just the one landing page) */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE_URL,
      changeFrequency: "monthly",
      priority: 1,
      images: [`${SITE_URL}/opengraph-image.png`],
    },
  ];
}
