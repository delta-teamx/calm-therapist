import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";
import { getUserById } from "@/lib/users";
import { accessForUser } from "@/lib/access";
import { getVoiceQuotaSnapshot, openVoiceSession } from "@/lib/voice-quota";
import { elevenLabsConfigured, mintSignedUrl } from "@/lib/elevenlabs";
import { composeSystemPrompt, DEFAULT_PROFILE, UserProfile, AgentModeKey } from "@/lib/aura";
import { modeAddendaFor } from "@/lib/agent-modes";
import { sanitizeProfile } from "@/lib/profile-input";

export const runtime = "nodejs";

const VALID_MODES: AgentModeKey[] = ["burnout", "relationships", "grief", "new-parent", "anxiety"];

/**
 * The only way to start a voice session. Requires a signed-in member with
 * voice access and remaining minutes. Mints a signed URL for the private
 * agent and composes Aura's prompt on the server, so the prompt never ships
 * to the browser and the agent id in the body is ignored.
 */
export async function POST(req: Request) {
  const claims = await verifySession(cookies().get(SESSION_COOKIE)?.value);
  if (!claims) return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  const user = await getUserById(claims.sub);
  if (!user) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  const access = await accessForUser(user);
  if (!access.voice) {
    return NextResponse.json({ error: "Voice is part of an open space.", access }, { status: 403 });
  }
  const quota = await getVoiceQuotaSnapshot(user.id, access);
  if (!quota.canStart) {
    return NextResponse.json({ error: "You've used your voice minutes for this month.", quota }, { status: 403 });
  }
  if (!elevenLabsConfigured()) {
    return NextResponse.json({ error: "Voice is not configured on this server." }, { status: 503 });
  }

  let body: { profile?: Partial<UserProfile> } = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const profile = sanitizeProfile({ ...DEFAULT_PROFILE, ...(body.profile ?? {}), name: user.name });
  const modes = (profile.activeModes ?? []).filter((m) => VALID_MODES.includes(m));

  const signedUrl = await mintSignedUrl();
  if (!signedUrl) return NextResponse.json({ error: "Could not start voice right now." }, { status: 502 });

  const sessionId = await openVoiceSession(user.id);
  const prompt = composeSystemPrompt({ profile, modeAddenda: modeAddendaFor(modes), voice: true });

  return NextResponse.json({
    signedUrl,
    sessionId,
    overrides: {
      agent: {
        prompt: { prompt },
        firstMessage: `Hi ${profile.name}. I'm here. How are you arriving today?`,
      },
      tts: { voiceId: profile.tone === "direct" ? "pNInz6obpgDQGcFmaJgB" : "EXAVITQu4vr4xnSDxMaL" },
    },
    quota,
  });
}
