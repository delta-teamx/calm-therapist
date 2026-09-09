import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";
import { getUserById } from "@/lib/users";
import { accessForUser } from "@/lib/access";
import { hasGivenFeedback } from "@/lib/feedback";
import { currentUnlockCode, kofiUrl, MIN_SUPPORT_USD, activePass } from "@/lib/support";
import { getVoiceQuotaSnapshot } from "@/lib/voice-quota";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The state of the two gates on voice and circles, for the unlock dialog.
 *
 * Gate one is honest feedback: any rating, kept private, never required to be
 * public and never required to be positive. Gate two is supporting the work.
 *
 * The unlock code is only issued once gate one is done, so the member is never
 * handed a payment code before they have been asked how it went.
 *
 * The tier ladder is deliberately not in this response. Supporting the creator
 * is not a plan being sold and is never presented as one — the member gives
 * what they want to give, and the ladder is only how the server decides what
 * voice package to deliver for what arrived.
 */
export async function GET() {
  const claims = await verifySession(cookies().get(SESSION_COOKIE)?.value);
  if (!claims) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const user = await getUserById(claims.sub);
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const [access, reviewed, pass] = await Promise.all([
    accessForUser(user),
    hasGivenFeedback(user.id),
    activePass(user.id),
  ]);
  const quota = await getVoiceQuotaSnapshot(user.id, access);

  return NextResponse.json({
    unlocked: access.voice && access.circles,
    gates: { reviewed, supported: pass != null },
    code: reviewed ? await currentUnlockCode(user.id) : null,
    kofiUrl: kofiUrl(),
    minUsd: MIN_SUPPORT_USD,
    pass: pass
      ? { tierKey: pass.tierKey, expiresAt: pass.expiresAt, voiceMinutesGranted: pass.voiceMinutesGranted }
      : null,
    voice: { balanceSec: quota.balanceSec, remainingSec: quota.remainingSec },
  });
}
