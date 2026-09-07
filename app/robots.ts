import type { MetadataRoute } from "next";
import { BRAND } from "@/lib/brand";

const BASE = BRAND.url;
// Netlify sets CONTEXT at build time. Only the production deploy may be indexed.
const PRODUCTION = !process.env.CONTEXT || process.env.CONTEXT === "production";
const PRIVATE = ["/dashboard", "/onboarding", "/api", "/auth", "/admin", "/_next/"];

export default function robots(): MetadataRoute.Robots {
  if (!PRODUCTION) return { rules: [{ userAgent: "*", disallow: "/" }] };
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      // Answer engines that cite sources. Training-only crawlers are not listed and follow "*".
      { userAgent: "OAI-SearchBot", allow: "/", disallow: PRIVATE },
      { userAgent: "PerplexityBot", allow: "/", disallow: PRIVATE },
      { userAgent: "ChatGPT-User", allow: "/", disallow: PRIVATE },
    ],
    sitemap: [`${BASE}/sitemap.xml`, `${BASE}/feed.xml`],
    host: BASE,
  };
}
