import { test } from "node:test";
import assert from "node:assert/strict";

/**
 * The support-pass model: what a given amount buys, how a Ko-fi message is
 * matched to an account, and that a redelivered webhook changes nothing.
 *
 * These run against the in-memory store (no DATABASE_URL), which is the same
 * code path the demo uses, so the assertions hold for both backends.
 */

import {
  SUPPORT_TIERS,
  MIN_SUPPORT_USD,
  tierForAmount,
  extractClaimCode,
  currentUnlockCode,
  activePass,
  grantPass,
  ingestKofiPayment,
  claimPaymentManually,
} from "../lib/support.ts";
import { accessFor } from "../lib/access.ts";
import { getVoiceQuotaSnapshot, recordVoiceSeconds } from "../lib/voice-quota.ts";

const MEMBER = { memberNumber: 7, createdAt: new Date("2026-01-01") };

/* ---------------------------------------------------------------- */
/* Tiers                                                             */
/* ---------------------------------------------------------------- */

test("tiers are ordered and start at the advertised minimum", () => {
  assert.equal(SUPPORT_TIERS[0].minUsd, MIN_SUPPORT_USD);
  for (let i = 1; i < SUPPORT_TIERS.length; i++) {
    assert.ok(SUPPORT_TIERS[i].minUsd > SUPPORT_TIERS[i - 1].minUsd, "minUsd must ascend");
    assert.ok(
      SUPPORT_TIERS[i].voiceMinutes > SUPPORT_TIERS[i - 1].voiceMinutes,
      "more money must never buy fewer minutes"
    );
  }
});

test("an amount maps to the highest tier it clears", () => {
  assert.equal(tierForAmount(3)?.key, "coffee");
  assert.equal(tierForAmount(7.5)?.key, "coffee", "between tiers rounds down, never up");
  assert.equal(tierForAmount(10)?.key, "supporter");
  assert.equal(tierForAmount(25)?.key, "patron");
  assert.equal(tierForAmount(50)?.key, "founder");
  assert.equal(tierForAmount(500)?.key, "founder", "generosity beyond the top tier still maps");
});

test("anything under the minimum buys no tier", () => {
  assert.equal(tierForAmount(2.99), null);
  assert.equal(tierForAmount(0), null);
  assert.equal(tierForAmount(-5), null);
});

test("every tier stays above cost at $0.081 a voice minute", () => {
  // ElevenLabs conversational cost, all-in, with no volume discount. Payment
  // fees on Ko-fi take roughly 5% plus PayPal/Stripe's own cut; 8% is a safe
  // upper bound. If this fails, the tier is being sold at a loss.
  for (const t of SUPPORT_TIERS) {
    const net = t.minUsd * 0.92;
    const cost = t.voiceMinutes * 0.081;
    assert.ok(cost < net, `${t.key}: $${cost.toFixed(2)} of voice on $${net.toFixed(2)} net`);
  }
});

/* ---------------------------------------------------------------- */
/* Claim codes                                                       */
/* ---------------------------------------------------------------- */

test("a claim code is found anywhere in a free-text Ko-fi message", () => {
  assert.equal(extractClaimCode("AURA-2K4M7P"), "AURA-2K4M7P");
  assert.equal(extractClaimCode("thanks! code AURA-2K4M7P"), "AURA-2K4M7P");
  assert.equal(extractClaimCode("aura-2k4m7p keep going"), "AURA-2K4M7P", "case is normalised");
  assert.equal(extractClaimCode("AURA 2K4M7P"), "AURA-2K4M7P", "a space instead of a dash");
  assert.equal(extractClaimCode("AURA2K4M7P"), "AURA-2K4M7P", "run together");
});

test("a message with no code, or a malformed one, yields nothing", () => {
  assert.equal(extractClaimCode("keep it up!"), null);
  assert.equal(extractClaimCode(""), null);
  assert.equal(extractClaimCode(null), null);
  assert.equal(extractClaimCode("AURA-2K4M"), null, "too short");
  assert.equal(extractClaimCode("AURA-0OI1LM"), null, "excluded letters are not in the alphabet");
});

test("a member's code is stable until it is used", async () => {
  const a = await currentUnlockCode("u-stable");
  const b = await currentUnlockCode("u-stable");
  assert.equal(a, b);
  assert.match(a, /^AURA-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/);
});

test("two members never share a code", async () => {
  const a = await currentUnlockCode("u-one");
  const b = await currentUnlockCode("u-two");
  assert.notEqual(a, b);
});

/* ---------------------------------------------------------------- */
/* Access                                                            */
/* ---------------------------------------------------------------- */

test("chat is open to everyone, with or without a pass", () => {
  assert.equal(accessFor(MEMBER, null).chat, true);
  assert.equal(accessFor({ ...MEMBER, isAdmin: true }, null).chat, true);
});

test("no pass means no voice and no circles", () => {
  const a = accessFor(MEMBER, null);
  assert.equal(a.tier, "member");
  assert.equal(a.voice, false);
  assert.equal(a.circles, false);
});

test("a founding member number is a badge and opens nothing", () => {
  const a = accessFor({ memberNumber: 1, createdAt: new Date() }, null);
  assert.equal(a.isFoundingMember, true, "the badge is still awarded");
  assert.equal(a.voice, false, "but it grants no access");
  assert.equal(a.circles, false);
});

test("a live pass opens voice and circles", () => {
  const pass = {
    id: "p1",
    userId: "u",
    tierKey: "coffee",
    amountUsd: 3,
    voiceMinutesGranted: 15,
    circles: true,
    source: "kofi",
    startedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
  };
  const a = accessFor(MEMBER, pass);
  assert.equal(a.tier, "supporter");
  assert.equal(a.voice, true);
  assert.equal(a.circles, true);
  assert.equal(a.supportTier, "coffee");
});

test("an expired pass closes voice and circles again", () => {
  const pass = {
    id: "p2",
    userId: "u",
    tierKey: "coffee",
    amountUsd: 3,
    voiceMinutesGranted: 15,
    circles: true,
    source: "kofi",
    startedAt: new Date(Date.now() - 2 * 86_400_000).toISOString(),
    expiresAt: new Date(Date.now() - 86_400_000).toISOString(),
  };
  const a = accessFor(MEMBER, pass);
  assert.equal(a.tier, "member");
  assert.equal(a.voice, false);
  assert.equal(a.circles, false);
});

/* ---------------------------------------------------------------- */
/* Granting                                                          */
/* ---------------------------------------------------------------- */

test("a pass puts the tier's minutes on the account", async () => {
  const userId = "u-grant";
  const pass = await grantPass({ userId, amountUsd: 10 });
  assert.ok(pass);
  assert.equal(pass.tierKey, "supporter");
  assert.equal(pass.voiceMinutesGranted, 60);

  const snap = await getVoiceQuotaSnapshot(userId, accessFor(MEMBER, pass));
  assert.equal(snap.balanceSec, 60 * 60);
  assert.equal(snap.canStart, true);
});

test("supporting again extends the end date instead of replacing it", async () => {
  const userId = "u-extend";
  const first = await grantPass({ userId, amountUsd: 3 });
  const second = await grantPass({ userId, amountUsd: 3 });
  assert.ok(first && second);
  assert.ok(
    new Date(second.expiresAt) > new Date(first.expiresAt),
    "the second month is added on the end, not overlapped"
  );
  const snap = await getVoiceQuotaSnapshot(userId, accessFor(MEMBER, second));
  assert.equal(snap.balanceSec, 30 * 60, "and both lots of minutes are kept");
});

test("an amount below the minimum grants no pass", async () => {
  assert.equal(await grantPass({ userId: "u-tiny", amountUsd: 1 }), null);
  assert.equal(await activePass("u-tiny"), null);
});

test("spent minutes come off the balance and never go negative", async () => {
  const userId = "u-spend";
  const pass = await grantPass({ userId, amountUsd: 3 });
  assert.ok(pass);
  await recordVoiceSeconds(userId, 5 * 60);
  let snap = await getVoiceQuotaSnapshot(userId, accessFor(MEMBER, pass));
  assert.equal(snap.balanceSec, 10 * 60);

  await recordVoiceSeconds(userId, 999 * 60);
  snap = await getVoiceQuotaSnapshot(userId, accessFor(MEMBER, pass));
  assert.equal(snap.balanceSec, 0);
  assert.equal(snap.canStart, false, "out of minutes means no new call can start");
});

/* ---------------------------------------------------------------- */
/* The Ko-fi webhook                                                 */
/* ---------------------------------------------------------------- */

function payload(over: Record<string, unknown> = {}) {
  return {
    verification_token: "test-token",
    message_id: `m-${Math.random().toString(36).slice(2)}`,
    type: "Donation",
    from_name: "A supporter",
    amount: "3.00",
    currency: "USD",
    email: "supporter@example.com",
    kofi_transaction_id: `t-${Math.random().toString(36).slice(2)}`,
    ...over,
  };
}

test("a payment carrying a live code is matched to that account", async () => {
  const userId = "u-hook";
  const code = await currentUnlockCode(userId);
  const res = await ingestKofiPayment(payload({ message: `thank you! ${code}`, amount: "10.00" }));
  assert.equal(res.status, "matched");
  assert.equal(res.userId, userId);
  assert.equal(res.pass?.tierKey, "supporter");
  assert.ok(await activePass(userId));
});

test("the same message id twice grants only one pass", async () => {
  const userId = "u-dupe";
  const code = await currentUnlockCode(userId);
  const body = payload({ message: code, amount: "25.00" });

  const first = await ingestKofiPayment(body);
  assert.equal(first.status, "matched");
  const before = await getVoiceQuotaSnapshot(userId, accessFor(MEMBER, first.pass ?? null));

  const second = await ingestKofiPayment(body);
  assert.equal(second.status, "duplicate", "a Ko-fi retry must not pay out twice");

  const after = await getVoiceQuotaSnapshot(userId, accessFor(MEMBER, first.pass ?? null));
  assert.equal(after.balanceSec, before.balanceSec, "no extra minutes from the retry");
});

test("a used code cannot be replayed by a second payment", async () => {
  const userId = "u-replay";
  const code = await currentUnlockCode(userId);
  assert.equal((await ingestKofiPayment(payload({ message: code }))).status, "matched");
  const second = await ingestKofiPayment(payload({ message: code }));
  assert.equal(second.status, "recorded", "the code is spent; the payment waits to be claimed");
  assert.equal(second.userId, undefined);
});

test("a payment with no code is recorded and waits", async () => {
  const res = await ingestKofiPayment(payload({ message: "keep going!" }));
  assert.equal(res.status, "recorded");
  assert.equal(res.userId, undefined);
});

test("a payment under the minimum is kept but buys nothing", async () => {
  const userId = "u-small";
  const code = await currentUnlockCode(userId);
  const res = await ingestKofiPayment(payload({ message: code, amount: "1.00" }));
  assert.equal(res.status, "below-minimum");
  assert.equal(await activePass(userId), null);
});

test("a webhook with no message id is rejected rather than stored", async () => {
  await assert.rejects(
    () => ingestKofiPayment(payload({ message_id: undefined, kofi_transaction_id: undefined })),
    /KOFI_NO_MESSAGE_ID/
  );
});

/* ---------------------------------------------------------------- */
/* Claiming by hand                                                  */
/* ---------------------------------------------------------------- */

test("a member who forgot the code can claim by transaction id", async () => {
  const transactionId = `t-manual-${Date.now()}`;
  await ingestKofiPayment(payload({ kofi_transaction_id: transactionId, amount: "10.00", message: "no code" }));
  const res = await claimPaymentManually("u-manual", { transactionId });
  assert.equal(res.ok, true);
  assert.ok(await activePass("u-manual"));
});

test("a payment already on an account cannot be claimed by someone else", async () => {
  const transactionId = `t-taken-${Date.now()}`;
  await ingestKofiPayment(payload({ kofi_transaction_id: transactionId, amount: "10.00", message: "no code" }));
  assert.equal((await claimPaymentManually("u-first", { transactionId })).ok, true);
  const stolen = await claimPaymentManually("u-thief", { transactionId });
  assert.equal(stolen.ok, false);
  assert.equal(await activePass("u-thief"), null);
});

test("claiming with neither a transaction id nor an email finds nothing", async () => {
  const res = await claimPaymentManually("u-nothing", {});
  assert.equal(res.ok, false);
});
