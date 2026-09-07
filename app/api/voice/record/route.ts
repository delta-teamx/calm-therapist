import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";
import { getUserById } from "@/lib/users";
import { accessFor } from "@/lib/access";
import { closeVoiceSession, getVoiceQuotaSnapshot } from "@/lib/voice-quota";
import { agentId, getConversation } from "@/lib/elevenlabs";
import { recordVoiceSession, type Turn } from "@/lib/sessions";
import { summariseSession } from "@/lib/reflection";

export const runtime = "nodejs";

/**
 * Closes a voice session. The browser tells us which session and which
 * ElevenLabs conversation; the duration comes from ElevenLabs, not the
 * browser. Replays and other members' conversations are rejected.
 */
export async function POST(req: Request) {
  const claims = await verifySession(cookies().get(SESSION_COOKIE)?.value);
  if (!claims) return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  const user = await getUserById(claims.sub);
  if (!user) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  let body: { sessionId?: string; conversationId?: string; transcript?: unknown; startedAt?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const sessionId = typeof body.sessionId === "string" ? body.sessionId.slice(0, 64) : "";
  const conversationId = typeof body.conversationId === "string" ? body.conversationId.slice(0, 128) : "";
  if (!sessionId || !conversationId) return NextResponse.json({ error: "Missing ids" }, { status: 400 });

  // The transcript is saved first and exactly once per conversation, so the
  // beacon and the fetch that both fire on disconnect do not double it.
  const turns: Turn[] = Array.isArray(body.transcript)
    ? (body.transcript as unknown[])
        .filter((t): t is { role: string; content: string; at?: string } => !!t && typeof t === "object" && typeof (t as { content?: unknown }).content === "string")
        .map((t) => ({ role: t.role === "assistant" ? "assistant" : "user", content: t.content, at: typeof t.at === "string" ? t.at : new Date().toISOString() }))
    : [];
  if (turns.length) {
    try {
      const saved = await recordVoiceSession(user.id, turns, {
        externalId: conversationId,
        startedAt: typeof body.startedAt === "string" ? body.startedAt : undefined,
      });
      if (!saved.summary) void summariseSession(user.id, saved.id).catch(() => {});
    } catch (err) {
      console.warn("[voice/record] transcript save failed", (err as Error).message);
    }
  }

  // ElevenLabs finalises the record shortly after disconnect; retry briefly.
  let durationSec: number | undefined;
  let convAgent: string | undefined;
  for (let attempt = 0; attempt < 4; attempt++) {
    const conv = await getConversation(conversationId);
    if (conv) {
      convAgent = conv.agentId;
      if (typeof conv.durationSec === "number" && conv.durationSec > 0) {
        durationSec = conv.durationSec;
        break;
      }
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  if (durationSec == null) {
    return NextResponse.json({ ok: false, error: "Duration not available yet" }, { status: 202 });
  }
  if (convAgent && agentId() && convAgent !== agentId()) {
    return NextResponse.json({ error: "Conversation does not belong to this agent" }, { status: 400 });
  }

  const recorded = await closeVoiceSession({ sessionId, userId: user.id, conversationId, durationSec });
  const access = accessFor(user);
  const snap = await getVoiceQuotaSnapshot(user.id, access);
  return NextResponse.json({ ok: recorded, durationSec, quota: { plan: user.plan, access, ...snap } });
}
