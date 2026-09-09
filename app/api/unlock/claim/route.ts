import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";
import { claimPaymentManually } from "@/lib/support";
import { rateLimit, identifierFor } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The fallback for a member whose payment did not carry their code: they give
 * the Ko-fi transaction id, or the email they paid with, and we attach the
 * one unclaimed payment that matches.
 *
 * A transaction id is a guessable-length string, so this is rate limited hard:
 * without that, someone could walk the space and steal a stranger's payment.
 */
export async function POST(req: Request) {
  const claims = await verifySession(cookies().get(SESSION_COOKIE)?.value);
  if (!claims) return NextResponse.json({ error: "Sign in first." }, { status: 401 });

  const limit = rateLimit(`${claims.sub}:${identifierFor(req)}`, {
    bucket: "unlock-claim",
    windowSec: 60 * 60,
    max: 8,
  });
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Too many tries. Wait an hour, or email us and we will sort it by hand." },
      { status: 429 }
    );
  }

  let body: { transactionId?: unknown; email?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const transactionId = typeof body.transactionId === "string" ? body.transactionId : undefined;
  const email = typeof body.email === "string" ? body.email : undefined;
  if (!transactionId && !email) {
    return NextResponse.json({ error: "Give the transaction id or the email you paid with." }, { status: 400 });
  }

  const result = await claimPaymentManually(claims.sub, { transactionId, email });
  if (!result.ok) {
    const message =
      result.reason === "already-claimed"
        ? "That payment is already on an account."
        : result.reason === "below-minimum"
        ? "That payment is under the minimum, so it does not open voice and circles. Thank you all the same."
        : "We cannot find that payment yet. Ko-fi can take a minute; try again shortly.";
    return NextResponse.json({ error: message, reason: result.reason }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    pass: result.pass
      ? { tierKey: result.pass.tierKey, expiresAt: result.pass.expiresAt, voiceMinutesGranted: result.pass.voiceMinutesGranted }
      : null,
  });
}
