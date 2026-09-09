import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { ingestKofiPayment, type KofiWebhookData } from "@/lib/support";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Ko-fi's webhook.
 *
 * Ko-fi posts application/x-www-form-urlencoded with a single field, `data`,
 * whose value is a JSON *string*. It is not a JSON body, so req.json() would
 * fail; read the form, then parse that one field.
 *
 * Ko-fi has no HMAC. All it sends is a static `verification_token` inside the
 * payload, so this endpoint treats the token as a shared secret and nothing
 * more: compared in constant time, on a path that should be long and
 * unguessable, with the payload never logged. Replay safety comes from the
 * message id, which is the primary key of KofiPayment — a redelivery of the
 * same id changes nothing.
 *
 * Ko-fi retries anything that is not a 200, forever, so every outcome we have
 * already recorded answers 200. A 500 is reserved for a failure where a retry
 * is genuinely the right thing.
 */

function tokenMatches(sent: string | undefined, expected: string): boolean {
  if (!sent) return false;
  const a = Buffer.from(sent);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const expected = process.env.KOFI_VERIFICATION_TOKEN;
  if (!expected) {
    console.error("[kofi] KOFI_VERIFICATION_TOKEN is not set; refusing the webhook");
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  let data: KofiWebhookData;
  try {
    const form = await req.formData();
    const raw = form.get("data");
    if (typeof raw !== "string") {
      return NextResponse.json({ ok: false, error: "no data field" }, { status: 400 });
    }
    data = JSON.parse(raw) as KofiWebhookData;
  } catch {
    // Malformed: retrying will not help, so do not ask Ko-fi to.
    return NextResponse.json({ ok: false, error: "unparseable" }, { status: 400 });
  }

  if (!tokenMatches(data.verification_token, expected)) {
    console.warn("[kofi] webhook rejected: verification token mismatch");
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  try {
    const result = await ingestKofiPayment(data);
    // Never log the payload: it carries the supporter's email and message.
    console.info(`[kofi] ${result.status} ${result.paymentId}${result.userId ? " matched" : ""}`);
    return NextResponse.json({ ok: true, status: result.status });
  } catch (err) {
    if ((err as Error).message === "KOFI_NO_MESSAGE_ID") {
      return NextResponse.json({ ok: false, error: "no message id" }, { status: 400 });
    }
    console.error("[kofi] webhook failed", (err as Error).message);
    // A real failure: let Ko-fi retry.
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
