/* eslint-disable no-console */
/**
 * After a production build, tell Bing (and every IndexNow partner) which URLs
 * exist. Runs only when INDEXNOW_KEY is set and the build is a production
 * deploy, so previews and local builds stay silent. Failures never fail the build.
 */
const key = process.env.INDEXNOW_KEY;
const base = process.env.NEXT_PUBLIC_APP_URL;
const context = process.env.CONTEXT; // Netlify: "production" | "deploy-preview" | "branch-deploy"

if (!key || !base || (context && context !== "production")) {
  console.log("[indexnow] skipped (no key, no URL, or not a production deploy).");
  process.exit(0);
}

async function main() {
  const res = await fetch(`${base}/sitemap.xml`);
  if (!res.ok) throw new Error(`sitemap ${res.status}`);
  const xml = await res.text();
  const urls = Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1]).slice(0, 10000);
  const host = new URL(base).host;
  const ping = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host, key, keyLocation: `${base}/api/indexnow-key`, urlList: urls }),
  });
  console.log(`[indexnow] submitted ${urls.length} urls, status ${ping.status}`);
}

main().catch((err) => {
  console.warn("[indexnow] failed:", err.message);
  process.exit(0);
});
