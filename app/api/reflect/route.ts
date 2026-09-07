import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function uid(): Promise<string | null> {
  const claims = await verifySession(cookies().get(SESSION_COOKIE)?.value);
  return claims?.sub ?? null;
}
import { buildReflection, monthKey } from "@/lib/reflect";
import { rateLimit } from "@/lib/rate-limit";

export async function GET(req: Request) {
  const userId = await uid();
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const limit = rateLimit(userId, { bucket: "reflect", windowSec: 3600, max: 10 });
  if (!limit.allowed) return NextResponse.json({ error: "Come back in an hour for another read." }, { status: 429 });
  const month = new URL(req.url).searchParams.get("month") ?? monthKey();
  return NextResponse.json({ reflection: await buildReflection(userId, month) });
}
