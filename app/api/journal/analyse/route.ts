import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function uid(): Promise<string | null> {
  const claims = await verifySession(cookies().get(SESSION_COOKIE)?.value);
  return claims?.sub ?? null;
}
import { analyseWeek, weekStartOf } from "@/lib/journal";
import { rateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const userId = await uid();
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const limit = rateLimit(userId, { bucket: "journal:read", windowSec: 3600, max: 6 });
  if (!limit.allowed) return NextResponse.json({ error: "Aura has read this week a few times already. Try again in an hour." }, { status: 429 });
  let week = weekStartOf();
  try {
    const body = (await req.json()) as { week?: unknown };
    if (typeof body.week === "string") week = body.week;
  } catch {}
  const aiAnalysis = await analyseWeek(userId, week);
  return NextResponse.json({ aiAnalysis });
}
