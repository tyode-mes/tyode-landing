import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/** /robots.txt: lets every search engine crawl the whole site and points them to the sitemap */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
