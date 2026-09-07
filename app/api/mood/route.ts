import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function uid(): Promise<string | null> {
  const claims = await verifySession(cookies().get(SESSION_COOKIE)?.value);
  return claims?.sub ?? null;
}
import { listMoods, setMood } from "@/lib/moods";

export async function GET(req: Request) {
  const userId = await uid();
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const days = Math.min(365, Math.max(1, Number(new URL(req.url).searchParams.get("days") ?? 30) || 30));
  return NextResponse.json({ moods: await listMoods(userId, days) });
}

export async function POST(req: Request) {
  const userId = await uid();
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  let body: { score?: unknown; note?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  if (typeof body.score !== "number" || body.score < 1 || body.score > 5) return NextResponse.json({ error: "Score is 1 to 5." }, { status: 400 });
  const mood = await setMood(userId, body.score, typeof body.note === "string" ? body.note : undefined);
  return NextResponse.json({ mood });
}
