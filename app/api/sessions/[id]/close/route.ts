import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";
import { closeSession, getSession } from "@/lib/sessions";
import { summariseSession } from "@/lib/reflection";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Ends a conversation. Aura writes her note afterwards: a one-line summary
 * on the session and up to three memories. Safe to call twice; the second
 * call is a no-op. Sent as a beacon on tab close, so the body may be empty.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const claims = await verifySession(cookies().get(SESSION_COOKIE)?.value);
  if (!claims) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  let moodAfter: number | undefined;
  try {
    const body = (await req.json()) as { moodAfter?: unknown };
    if (typeof body.moodAfter === "number" && body.moodAfter >= 1 && body.moodAfter <= 5) moodAfter = Math.round(body.moodAfter);
  } catch {}
  const before = await getSession(claims.sub, params.id);
  if (!before) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (before.endedAt) return NextResponse.json({ ok: true, alreadyClosed: true });
  const closed = await closeSession(claims.sub, params.id, { moodAfter });
  // Aura's note runs after the response would have been sent from a beacon;
  // await it here so serverless hosts do not cut it off.
  let summary: string | undefined;
  try {
    summary = await summariseSession(claims.sub, params.id);
  } catch (err) {
    console.warn("[sessions] summary failed", (err as Error).message);
  }
  return NextResponse.json({ ok: !!closed, summary });
}
