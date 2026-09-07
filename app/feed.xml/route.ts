import { POSTS } from "@/lib/blog";
import { BRAND } from "@/lib/brand";

export const dynamic = "force-static";

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/** RSS 2.0 feed of the blog. Bing and feed readers use it; Google treats it as one more discovery path. */
export async function GET() {
  const items = [...POSTS]
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))
    .map((p) => {
      const url = `${BRAND.url}/blog/${p.slug}`;
      return `    <item>
      <title>${esc(p.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(p.publishedAt).toUTCString()}</pubDate>
      <description>${esc(p.description)}</description>
    </item>`;
    })
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(BRAND.name)} blog</title>
    <link>${BRAND.url}/blog</link>
    <atom:link href="${BRAND.url}/feed.xml" rel="self" type="application/rss+xml" />
    <description>${esc("Notes from building a free AI therapist: what AI therapy gets wrong, what memory changes, and what circles teach us.")}</description>
    <language>en</language>
${items}
  </channel>
</rss>`;
  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
