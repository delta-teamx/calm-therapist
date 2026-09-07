export const dynamic = "force-dynamic";

/**
 * IndexNow key verification. The key lives in INDEXNOW_KEY; this URL is passed
 * as keyLocation when pinging, so no static file has to be committed.
 */
export async function GET() {
  const key = process.env.INDEXNOW_KEY;
  if (!key) return new Response("not configured", { status: 404 });
  return new Response(key, { headers: { "Content-Type": "text/plain" } });
}
