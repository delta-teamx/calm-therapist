import crypto from "crypto";
import { dbEnabled, prisma } from "./prisma";
import { grantVoiceMinutes } from "./voice-quota";

/**
 * Supporting the creator, and what it unlocks.
 *
 * Chat with Aura is free for everyone, forever. Voice and circles cost real
 * money to run, so they open when a member does two things: tells us honestly
 * how Aura is doing (private feedback, never published), and supports the
 * creator with whatever they choose.
 *
 * The payment happens on Ko-fi, outside this app. Ko-fi tells us about it
 * with a webhook. Because the email someone pays with is often not the email
 * they signed up with, the reliable link is a short code the member puts in
 * the Ko-fi message. Email is a fallback, and an admin can match by hand.
 */

/* ------------------------------------------------------------------ */
/* Delivery bands                                                      */
/* ------------------------------------------------------------------ */

/**
 * These are NOT plans and are never shown to a member as a price list.
 *
 * Nobody picks one of these. The member is asked one thing — buy the creator
 * a coffee, anything from the minimum — and gives whatever they want to give.
 * These bands are only how the server decides, after the money has arrived,
 * how much voice we can afford to deliver for it. Keep them out of the API
 * responses and out of the UI: the moment a member sees a ladder, an open
 * invitation to support the work turns into a subscription page, which is
 * exactly what this product is not.
 */
export interface SupportTier {
  /** Internal band name. Stored on the pass so support can reason about it. */
  key: string;
  label: string;
  /** Lowest amount in USD that lands in this band. */
  minUsd: number;
  /** Reference amount for internal maths only. Never rendered. */
  suggestUsd: number;
  /** Voice minutes added to the member's balance. Minutes are owned, not rented. */
  voiceMinutes: number;
  /** How long circles stay open, and how long the minutes remain spendable. */
  months: number;
  /** Internal note describing the band. Not user-facing copy. */
  blurb: string;
}

/**
 * A voice minute costs about 8.1 cents all in (provider minute plus the model
 * tokens behind it). Payment fees take roughly 2.9% plus 30 cents. The minute
 * counts below leave about half of each contribution for everything else:
 * hosting, email, the database, and the chat that stays free for everyone.
 *
 * Circles are text and cost close to nothing, so they stay open for the whole
 * period rather than being metered.
 *
 * Every number is env-tunable; if the voice provider's price moves, move these.
 */
export const SUPPORT_TIERS: SupportTier[] = [
  {
    key: "coffee",
    label: "A coffee",
    minUsd: 3,
    suggestUsd: 3,
    voiceMinutes: Number(process.env.SUPPORT_MINUTES_COFFEE ?? 15),
    months: 1,
    blurb: "15 minutes of voice, and circles for a month.",
  },
  {
    key: "supporter",
    label: "Supporter",
    minUsd: 10,
    suggestUsd: 10,
    voiceMinutes: Number(process.env.SUPPORT_MINUTES_SUPPORTER ?? 60),
    months: 3,
    blurb: "An hour of voice, and circles for three months.",
  },
  {
    key: "patron",
    label: "Patron",
    minUsd: 25,
    suggestUsd: 25,
    voiceMinutes: Number(process.env.SUPPORT_MINUTES_PATRON ?? 150),
    months: 6,
    blurb: "Two and a half hours of voice, and circles for six months.",
  },
  {
    key: "founder",
    label: "Founder",
    minUsd: 50,
    suggestUsd: 50,
    voiceMinutes: Number(process.env.SUPPORT_MINUTES_FOUNDER ?? 300),
    months: 12,
    blurb: "Five hours of voice, circles for a year, and a founder badge.",
  },
];

/** Below this, we say thank you and record it, but no pass is created. */
export const MIN_SUPPORT_USD = Number(process.env.MIN_SUPPORT_USD ?? 3);

export function tierForAmount(amountUsd: number): SupportTier | null {
  if (!Number.isFinite(amountUsd) || amountUsd < MIN_SUPPORT_USD) return null;
  let match: SupportTier | null = null;
  for (const t of SUPPORT_TIERS) if (amountUsd >= t.minUsd) match = t;
  return match ?? SUPPORT_TIERS[0];
}

/* ------------------------------------------------------------------ */
/* Unlock codes                                                        */
/* ------------------------------------------------------------------ */

/** No 0/O/1/I so a code read off a screen and typed by hand still matches. */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_PREFIX = "AURA";
const CODE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function randomCode(): string {
  const bytes = crypto.randomBytes(6);
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return `${CODE_PREFIX}-${out}`;
}

/** Finds an unlock code anywhere in a free-text Ko-fi message. */
export function extractClaimCode(message: string | null | undefined): string | null {
  if (!message) return null;
  const m = message.toUpperCase().match(/AURA[\s-]?([ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6})/);
  return m ? `${CODE_PREFIX}-${m[1]}` : null;
}

interface MemCode {
  code: string;
  userId: string;
  createdAt: string;
  expiresAt: string;
  consumedAt?: string;
}
const g = globalThis as unknown as {
  __calmCodes?: Map<string, MemCode>;
  __calmPasses?: Map<string, MemPass>;
  __calmKofi?: Map<string, MemPayment>;
};
const codeStore = g.__calmCodes ?? new Map<string, MemCode>();
g.__calmCodes = codeStore;

/** The member's live code, or a fresh one. Stable so they can come back to it. */
export async function currentUnlockCode(userId: string): Promise<string> {
  const now = new Date();
  if (dbEnabled) {
    const live = await prisma.unlockCode.findFirst({
      where: { userId, consumedAt: null, expiresAt: { gt: now } },
      orderBy: { createdAt: "desc" },
    });
    if (live) return live.code;
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const row = await prisma.unlockCode.create({
          data: { userId, code: randomCode(), expiresAt: new Date(now.getTime() + CODE_TTL_MS) },
        });
        return row.code;
      } catch (err) {
        if ((err as { code?: string }).code !== "P2002" || attempt === 4) throw err;
      }
    }
  }
  const live = Array.from(codeStore.values()).find(
    (c) => c.userId === userId && !c.consumedAt && new Date(c.expiresAt) > now
  );
  if (live) return live.code;
  const code = randomCode();
  codeStore.set(code, {
    code,
    userId,
    createdAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + CODE_TTL_MS).toISOString(),
  });
  return code;
}

/**
 * The account a code belongs to, or null.
 *
 * A code is single use. Once a payment has consumed it, a later payment
 * quoting the same code — a stranger copying a public Ko-fi message, or the
 * member pasting a stale one — must not be absorbed into that account. It is
 * recorded unmatched instead, and can be claimed by hand. currentUnlockCode()
 * issues a fresh code once the old one is spent.
 */
async function userIdForCode(code: string): Promise<string | null> {
  const now = new Date();
  if (dbEnabled) {
    const row = await prisma.unlockCode.findUnique({ where: { code } });
    if (!row || row.consumedAt || row.expiresAt < now) return null;
    return row.userId;
  }
  const row = codeStore.get(code);
  if (!row || row.consumedAt || new Date(row.expiresAt) < now) return null;
  return row.userId;
}

async function consumeCode(code: string): Promise<void> {
  if (dbEnabled) {
    await prisma.unlockCode.updateMany({ where: { code, consumedAt: null }, data: { consumedAt: new Date() } });
    return;
  }
  const row = codeStore.get(code);
  if (row && !row.consumedAt) row.consumedAt = new Date().toISOString();
}

/* ------------------------------------------------------------------ */
/* Passes                                                              */
/* ------------------------------------------------------------------ */

export interface Pass {
  id: string;
  userId: string;
  tierKey: string;
  amountUsd: number;
  /** Minutes this pass added to the balance. The live balance lives in VoiceQuota. */
  voiceMinutesGranted: number;
  circles: boolean;
  source: string;
  startedAt: string;
  expiresAt: string;
}

interface MemPass extends Pass {
  kofiPaymentId?: string;
}
const passStore = g.__calmPasses ?? new Map<string, MemPass>();
g.__calmPasses = passStore;

function addMonths(d: Date, months: number): Date {
  const out = new Date(d);
  out.setUTCMonth(out.getUTCMonth() + months);
  return out;
}

/** The pass in force right now, longest-dated first, or null. */
export async function activePass(userId: string): Promise<Pass | null> {
  const now = new Date();
  if (dbEnabled) {
    const row = await prisma.supportPass.findFirst({
      where: { userId, expiresAt: { gt: now } },
      orderBy: { expiresAt: "desc" },
    });
    return row
      ? {
          id: row.id,
          userId: row.userId,
          tierKey: row.tierKey,
          amountUsd: row.amountUsd,
          voiceMinutesGranted: row.voiceMinutesPerMonth,
          circles: row.circles,
          source: row.source,
          startedAt: row.startedAt.toISOString(),
          expiresAt: row.expiresAt.toISOString(),
        }
      : null;
  }
  return (
    Array.from(passStore.values())
      .filter((p) => p.userId === userId && new Date(p.expiresAt) > now)
      .sort((a, b) => (a.expiresAt < b.expiresAt ? 1 : -1))[0] ?? null
  );
}

/**
 * Creates a pass. A member who supports again while a pass is live has the
 * new period added on the end rather than replacing what they already have.
 */
export async function grantPass(input: {
  userId: string;
  amountUsd: number;
  currency?: string;
  source?: string;
  kofiPaymentId?: string;
  note?: string;
}): Promise<Pass | null> {
  const tier = tierForAmount(input.amountUsd);
  if (!tier) return null;
  const existing = await activePass(input.userId);
  const startedAt = new Date();
  const base = existing && new Date(existing.expiresAt) > startedAt ? new Date(existing.expiresAt) : startedAt;
  const expiresAt = addMonths(base, tier.months);

  await grantVoiceMinutes(input.userId, tier.voiceMinutes);

  if (dbEnabled) {
    const row = await prisma.supportPass.create({
      data: {
        userId: input.userId,
        tierKey: tier.key,
        amountUsd: input.amountUsd,
        currency: input.currency ?? "USD",
        voiceMinutesPerMonth: tier.voiceMinutes,
        circles: true,
        source: input.source ?? "kofi",
        kofiPaymentId: input.kofiPaymentId ?? null,
        startedAt,
        expiresAt,
        note: input.note ?? null,
      },
    });
    return {
      id: row.id,
      userId: row.userId,
      tierKey: row.tierKey,
      amountUsd: row.amountUsd,
      voiceMinutesGranted: row.voiceMinutesPerMonth,
      circles: row.circles,
      source: row.source,
      startedAt: row.startedAt.toISOString(),
      expiresAt: row.expiresAt.toISOString(),
    };
  }
  const pass: MemPass = {
    id: `pass_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    userId: input.userId,
    tierKey: tier.key,
    amountUsd: input.amountUsd,
    voiceMinutesGranted: tier.voiceMinutes,
    circles: true,
    source: input.source ?? "kofi",
    startedAt: startedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    kofiPaymentId: input.kofiPaymentId,
  };
  passStore.set(pass.id, pass);
  return pass;
}

/* ------------------------------------------------------------------ */
/* Ko-fi payments                                                      */
/* ------------------------------------------------------------------ */

export interface KofiPaymentRecord {
  id: string;
  transactionId?: string;
  type: string;
  amountUsd: number;
  currency: string;
  fromName?: string;
  email?: string;
  message?: string;
  claimCode?: string;
  receivedAt: string;
  userId?: string;
}

interface MemPayment extends KofiPaymentRecord {
  raw: unknown;
}
const kofiStore = g.__calmKofi ?? new Map<string, MemPayment>();
g.__calmKofi = kofiStore;

/** The webhook body Ko-fi posts, after JSON parsing. Fields vary by type. */
export interface KofiWebhookData {
  verification_token?: string;
  message_id?: string;
  timestamp?: string;
  type?: string;
  is_public?: boolean;
  from_name?: string;
  message?: string | null;
  amount?: string;
  url?: string;
  email?: string;
  currency?: string;
  is_subscription_payment?: boolean;
  is_first_subscription_payment?: boolean;
  kofi_transaction_id?: string;
  tier_name?: string | null;
}

export interface IngestResult {
  status: "recorded" | "duplicate" | "matched" | "below-minimum";
  paymentId: string;
  userId?: string;
  pass?: Pass | null;
}

/**
 * Stores one webhook and, when the message carries a live unlock code, links
 * it to that account and grants the pass. Idempotent on Ko-fi's message id:
 * a redelivery returns "duplicate" and changes nothing.
 */
export async function ingestKofiPayment(data: KofiWebhookData): Promise<IngestResult> {
  const id = String(data.message_id ?? data.kofi_transaction_id ?? "").slice(0, 128);
  if (!id) throw new Error("KOFI_NO_MESSAGE_ID");

  const amountUsd = Number.parseFloat(String(data.amount ?? "0")) || 0;
  const currency = (data.currency ?? "USD").toUpperCase().slice(0, 8);
  const message = typeof data.message === "string" ? data.message.slice(0, 1000) : undefined;
  const claimCode = extractClaimCode(message) ?? undefined;
  const email = typeof data.email === "string" ? data.email.toLowerCase().trim().slice(0, 200) : undefined;

  if (dbEnabled) {
    const seen = await prisma.kofiPayment.findUnique({ where: { id } });
    if (seen) return { status: "duplicate", paymentId: id, userId: seen.userId ?? undefined };
    try {
      await prisma.kofiPayment.create({
        data: {
          id,
          transactionId: data.kofi_transaction_id ?? null,
          type: String(data.type ?? "Donation").slice(0, 64),
          amountUsd,
          currency,
          fromName: data.from_name?.slice(0, 200) ?? null,
          email: email ?? null,
          message: message ?? null,
          claimCode: claimCode ?? null,
          isSubscription: data.is_subscription_payment === true,
          raw: data as object,
        },
      });
    } catch (err) {
      if ((err as { code?: string }).code === "P2002") return { status: "duplicate", paymentId: id };
      throw err;
    }
  } else {
    if (kofiStore.has(id)) return { status: "duplicate", paymentId: id };
    kofiStore.set(id, {
      id,
      transactionId: data.kofi_transaction_id,
      type: String(data.type ?? "Donation"),
      amountUsd,
      currency,
      fromName: data.from_name,
      email,
      message,
      claimCode,
      receivedAt: new Date().toISOString(),
      raw: data,
    });
  }

  if (amountUsd < MIN_SUPPORT_USD) return { status: "below-minimum", paymentId: id };

  const userId = claimCode ? await userIdForCode(claimCode) : null;
  if (!userId) return { status: "recorded", paymentId: id };

  const pass = await attachPayment({ paymentId: id, userId, amountUsd, currency, matchedBy: "code" });
  if (claimCode) await consumeCode(claimCode);
  return { status: "matched", paymentId: id, userId, pass };
}

async function attachPayment(input: {
  paymentId: string;
  userId: string;
  amountUsd: number;
  currency: string;
  matchedBy: string;
}): Promise<Pass | null> {
  if (dbEnabled) {
    const claimed = await prisma.kofiPayment.updateMany({
      where: { id: input.paymentId, userId: null },
      data: { userId: input.userId, matchedAt: new Date(), matchedBy: input.matchedBy },
    });
    if (claimed.count === 0) return null;
  } else {
    const row = kofiStore.get(input.paymentId);
    if (!row || row.userId) return null;
    row.userId = input.userId;
  }
  const pass = await grantPass({
    userId: input.userId,
    amountUsd: input.amountUsd,
    currency: input.currency,
    source: "kofi",
    kofiPaymentId: input.paymentId,
  });
  if (pass) await sendSupportReceipt(input.userId, pass);
  return pass;
}

/**
 * The receipt for a pass. Best effort on purpose: money has already changed
 * hands and the minutes are already on the account, so a mail provider having
 * a bad afternoon must not turn into a failed webhook that Ko-fi then retries.
 */
async function sendSupportReceipt(userId: string, pass: Pass): Promise<void> {
  try {
    const { getUserById } = await import("./users");
    const { scheduleEmail } = await import("./email-queue");
    const user = await getUserById(userId);
    if (!user) return;
    await scheduleEmail({
      userId: user.id,
      to: user.email,
      templateKey: "support-thanks",
      ctx: {
        name: user.name,
        email: user.email,
        appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "",
        voiceMinutesGranted: pass.voiceMinutesGranted,
      },
    });
  } catch (err) {
    console.error("[support] receipt not queued", (err as Error).message);
  }
}

/**
 * Fallback for a member who paid without the code: finds an unclaimed payment
 * by Ko-fi transaction id or by the email they paid with, and attaches it.
 */
export async function claimPaymentManually(
  userId: string,
  lookup: { transactionId?: string; email?: string }
): Promise<{ ok: true; pass: Pass | null } | { ok: false; reason: "not-found" | "already-claimed" | "below-minimum" }> {
  const transactionId = lookup.transactionId?.trim().slice(0, 128);
  const email = lookup.email?.toLowerCase().trim().slice(0, 200);
  if (!transactionId && !email) return { ok: false, reason: "not-found" };

  if (dbEnabled) {
    const row = await prisma.kofiPayment.findFirst({
      where: {
        OR: [
          ...(transactionId ? [{ transactionId }, { id: transactionId }] : []),
          ...(email ? [{ email }] : []),
        ],
      },
      orderBy: { receivedAt: "desc" },
    });
    if (!row) return { ok: false, reason: "not-found" };
    if (row.userId) return { ok: false, reason: row.userId === userId ? "already-claimed" : "not-found" };
    if (row.amountUsd < MIN_SUPPORT_USD) return { ok: false, reason: "below-minimum" };
    const pass = await attachPayment({
      paymentId: row.id,
      userId,
      amountUsd: row.amountUsd,
      currency: row.currency,
      matchedBy: transactionId ? "transaction" : "email",
    });
    return { ok: true, pass };
  }

  const row = Array.from(kofiStore.values())
    .filter((p) => (transactionId ? p.transactionId === transactionId || p.id === transactionId : true))
    .filter((p) => (email ? p.email === email : true))
    .sort((a, b) => (a.receivedAt < b.receivedAt ? 1 : -1))[0];
  if (!row) return { ok: false, reason: "not-found" };
  if (row.userId) return { ok: false, reason: row.userId === userId ? "already-claimed" : "not-found" };
  if (row.amountUsd < MIN_SUPPORT_USD) return { ok: false, reason: "below-minimum" };
  const pass = await attachPayment({
    paymentId: row.id,
    userId,
    amountUsd: row.amountUsd,
    currency: row.currency,
    matchedBy: transactionId ? "transaction" : "email",
  });
  return { ok: true, pass };
}

/** Payments nobody has claimed, for the admin screen. */
export async function unclaimedPayments(limit = 50): Promise<KofiPaymentRecord[]> {
  if (dbEnabled) {
    const rows = await prisma.kofiPayment.findMany({
      where: { userId: null },
      orderBy: { receivedAt: "desc" },
      take: limit,
    });
    return rows.map((r) => ({
      id: r.id,
      transactionId: r.transactionId ?? undefined,
      type: r.type,
      amountUsd: r.amountUsd,
      currency: r.currency,
      fromName: r.fromName ?? undefined,
      email: r.email ?? undefined,
      message: r.message ?? undefined,
      claimCode: r.claimCode ?? undefined,
      receivedAt: r.receivedAt.toISOString(),
    }));
  }
  return Array.from(kofiStore.values())
    .filter((p) => !p.userId)
    .sort((a, b) => (a.receivedAt < b.receivedAt ? 1 : -1))
    .slice(0, limit);
}

/** Total supported, for the admin dashboard. */
export async function supportTotals(): Promise<{ payments: number; totalUsd: number; passes: number }> {
  if (dbEnabled) {
    const [agg, passes] = await Promise.all([
      prisma.kofiPayment.aggregate({ _count: { _all: true }, _sum: { amountUsd: true } }),
      prisma.supportPass.count({ where: { expiresAt: { gt: new Date() } } }),
    ]);
    return {
      payments: agg._count._all,
      totalUsd: Number((agg._sum.amountUsd ?? 0).toFixed(2)),
      passes,
    };
  }
  const all = Array.from(kofiStore.values());
  return {
    payments: all.length,
    totalUsd: Number(all.reduce((s, p) => s + p.amountUsd, 0).toFixed(2)),
    passes: Array.from(passStore.values()).filter((p) => new Date(p.expiresAt) > new Date()).length,
  };
}

/** The Ko-fi page, with the code appended as a hint the member can copy. */
export function kofiUrl(): string | null {
  return process.env.NEXT_PUBLIC_KOFI_URL || null;
}
