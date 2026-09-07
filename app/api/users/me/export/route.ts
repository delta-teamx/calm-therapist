import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";
import { getUserById } from "@/lib/users";
import { getProfile, listMemories } from "@/lib/profiles";
import { listSessions, getSession } from "@/lib/sessions";
import { listMoods } from "@/lib/moods";
import { listGoals } from "@/lib/goals";
import { listWeeks } from "@/lib/journal";
import { rateLimit } from "@/lib/rate-limit";
import { BRAND } from "@/lib/brand";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Everything the member has told Aura, as one JSON file. */
export async function GET() {
  const claims = await verifySession(cookies().get(SESSION_COOKIE)?.value);
  if (!claims) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const limit = rateLimit(claims.sub, { bucket: "export", windowSec: 3600, max: 5 });
  if (!limit.allowed) return NextResponse.json({ error: "Try again in an hour." }, { status: 429 });

  const user = await getUserById(claims.sub);
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  const [profile, memories, sessionRows, moods, goals, journal] = await Promise.all([
    getProfile(user.id),
    listMemories(user.id, 500),
    listSessions(user.id, 500),
    listMoods(user.id, 3650),
    listGoals(user.id),
    listWeeks(user.id, 520),
  ]);
  const sessions = [];
  for (const row of sessionRows) {
    const full = await getSession(user.id, row.id);
    if (full) sessions.push({ id: full.id, mode: full.mode, startedAt: full.startedAt, endedAt: full.endedAt, summary: full.summary, moodBefore: full.moodBefore, moodAfter: full.moodAfter, transcript: full.transcript });
  }
  const payload = {
    exportedAt: new Date().toISOString(),
    product: BRAND.name,
    account: { email: user.email, name: user.name, memberNumber: user.memberNumber ?? null, createdAt: user.createdAt, emailVerified: user.emailVerified ?? null },
    profile,
    memories,
    moods,
    goals,
    journal,
    sessions,
  };
  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="my-record-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
