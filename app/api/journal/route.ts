import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function uid(): Promise<string | null> {
  const claims = await verifySession(cookies().get(SESSION_COOKIE)?.value);
  return claims?.sub ?? null;
}
import { getWeek, listWeeks, saveWeek, weekStartOf } from "@/lib/journal";
import { moodsBetween } from "@/lib/moods";
import { sessionsBetween } from "@/lib/sessions";

export async function GET(req: Request) {
  const userId = await uid();
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const url = new URL(req.url);
  if (url.searchParams.get("list") === "1") return NextResponse.json({ weeks: await listWeeks(userId) });
  const weekStart = url.searchParams.get("week") ?? weekStartOf();
  const entry = await getWeek(userId, weekStart);
  const from = new Date(entry.weekStart);
  const to = new Date(from.getTime() + 7 * 86400000);
  const [moods, sessions] = await Promise.all([moodsBetween(userId, from, to), sessionsBetween(userId, from, to)]);
  return NextResponse.json({
    entry,
    moods,
    sessions: sessions.map((s) => ({ id: s.id, mode: s.mode, startedAt: s.startedAt, summary: s.summary })),
  });
}

export async function POST(req: Request) {
  const userId = await uid();
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  let body: { week?: unknown; content?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  if (typeof body.content !== "string") return NextResponse.json({ error: "Nothing to save." }, { status: 400 });
  const entry = await saveWeek(userId, typeof body.week === "string" ? body.week : weekStartOf(), body.content);
  return NextResponse.json({ entry });
}
