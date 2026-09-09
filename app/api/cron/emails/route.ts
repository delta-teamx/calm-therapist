import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { processDueEmails } from "@/lib/email-queue";
import { scheduleWeeklyReflections } from "@/lib/engagement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Cron-callable processor. Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`;
 * external schedulers may send `x-cron-secret`. The secret is required in
 * production and is never accepted in the query string.
 */
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  const auth = req.headers.get("authorization") ?? "";
  const provided = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : req.headers.get("x-cron-secret") ?? "";
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // The weekly sweep only queues; the processor below does the sending. It is
  // safe on every tick because scheduleWeeklyReflections() will not queue a
  // second look-back within six days of the last one.
  let weekly = null;
  try {
    weekly = await scheduleWeeklyReflections(process.env.NEXT_PUBLIC_APP_URL ?? "");
  } catch (err) {
    // A failure here must never stop verification or reset mail going out.
    console.error("[cron] weekly sweep failed", (err as Error).message);
  }

  const result = await processDueEmails();
  return NextResponse.json({ ok: true, ...result, weekly });
}

export async function GET(req: Request) {
  return POST(req);
}
