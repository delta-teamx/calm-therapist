import { dbEnabled, prisma } from "./prisma";
import type { Access } from "./access";

/**
 * Voice quota — one monthly bucket per member.
 *
 * The monthly allowance comes from lib/access.ts (founding fair-use, pro, or
 * none). Minutes are recorded from ElevenLabs conversation records, never
 * from the browser. Updates use atomic increments so concurrent sessions
 * cannot lose an update.
 *
 * The weekly bucket is kept in the schema for compatibility but no longer
 * gates anything.
 */

export interface VoiceQuotaState {
  userId: string;
  weekKey: string;
  monthKey: string;
  weeklyUsedSec: number;
  monthlyUsedSec: number;
  weeklyBonusSec: number;
  monthlyBonusSec: number;
  topupsThisMonth: number;
  /** Minutes owned outright from a support pass. Survives month rollover. */
  balanceSec: number;
}

const globalAny = globalThis as unknown as { __calmVoiceQuota?: Map<string, VoiceQuotaState> };
const memoryStore: Map<string, VoiceQuotaState> = globalAny.__calmVoiceQuota ?? new Map();
globalAny.__calmVoiceQuota = memoryStore;

const TOPUP_PRICE_USD = 12;
const TOPUP_WEEKLY_BONUS_SEC = 30 * 60;
const TOPUP_MONTHLY_BONUS_SEC = 50 * 60;

function isoWeek(d: Date): string {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dayNum = (t.getUTCDay() + 6) % 7;
  t.setUTCDate(t.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(
      ((t.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7
    );
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function rolledOver(state: VoiceQuotaState, now: Date): VoiceQuotaState {
  const wk = isoWeek(now);
  const mk = monthKey(now);
  let next = state;
  if (state.weekKey !== wk) next = { ...next, weekKey: wk, weeklyUsedSec: 0, weeklyBonusSec: 0 };
  if (state.monthKey !== mk) {
    next = { ...next, monthKey: mk, monthlyUsedSec: 0, monthlyBonusSec: 0, topupsThisMonth: 0 };
  }
  return next;
}

function fresh(userId: string, now: Date): VoiceQuotaState {
  return {
    userId,
    weekKey: isoWeek(now),
    monthKey: monthKey(now),
    weeklyUsedSec: 0,
    monthlyUsedSec: 0,
    weeklyBonusSec: 0,
    monthlyBonusSec: 0,
    topupsThisMonth: 0,
    balanceSec: 0,
  };
}

async function ensure(userId: string): Promise<VoiceQuotaState> {
  const now = new Date();

  if (dbEnabled) {
    const f = fresh(userId, now);
    // upsert so two first-time calls cannot race on create.
    const row = await prisma.voiceQuota.upsert({
      where: { userId },
      create: { userId, weekKey: f.weekKey, monthKey: f.monthKey },
      update: {},
    });
    const cur: VoiceQuotaState = {
      userId,
      weekKey: row.weekKey,
      monthKey: row.monthKey,
      weeklyUsedSec: row.weeklyUsedSec,
      monthlyUsedSec: row.monthlyUsedSec,
      weeklyBonusSec: row.weeklyBonusSec,
      monthlyBonusSec: row.monthlyBonusSec,
      topupsThisMonth: row.topupsThisMonth,
      balanceSec: row.balanceSec,
    };
    const rolled = rolledOver(cur, now);
    if (rolled !== cur) {
      await prisma.voiceQuota.update({
        where: { userId },
        data: {
          weekKey: rolled.weekKey,
          monthKey: rolled.monthKey,
          weeklyUsedSec: rolled.weeklyUsedSec,
          monthlyUsedSec: rolled.monthlyUsedSec,
          weeklyBonusSec: rolled.weeklyBonusSec,
          monthlyBonusSec: rolled.monthlyBonusSec,
          topupsThisMonth: rolled.topupsThisMonth,
        },
      });
    }
    return rolled;
  }

  const cur = memoryStore.get(userId);
  if (cur) {
    const rolled = rolledOver(cur, now);
    if (rolled !== cur) memoryStore.set(userId, rolled);
    return rolled;
  }
  const f = fresh(userId, now);
  memoryStore.set(userId, f);
  return f;
}

export interface VoiceQuotaSnapshot {
  monthlyLimitSec: number;
  monthlyUsedSec: number;
  monthlyRemainingSec: number;
  monthlyBonusSec: number;
  topupsThisMonth: number;
  /** Minutes owned from support, in seconds. */
  balanceSec: number;
  /** Monthly allowance left plus the owned balance. What the member can actually spend. */
  remainingSec: number;
  canStart: boolean;
  /** Kept for older clients; equal to the spendable figures. */
  weeklyLimitSec: number;
  weeklyUsedSec: number;
  weeklyRemainingSec: number;
}

/** Under this, a call is not worth starting: it would end almost immediately. */
export const MIN_START_SEC = 60;

export async function getVoiceQuotaSnapshot(userId: string, access: Access): Promise<VoiceQuotaSnapshot> {
  const s = await ensure(userId);
  const monthlyLimit = access.voice ? access.voiceMinutesPerMonth * 60 + s.monthlyBonusSec : 0;
  const monthlyRemaining = Math.max(0, monthlyLimit - s.monthlyUsedSec);
  const remaining = monthlyRemaining + s.balanceSec;
  return {
    monthlyLimitSec: monthlyLimit,
    monthlyUsedSec: s.monthlyUsedSec,
    monthlyRemainingSec: monthlyRemaining,
    monthlyBonusSec: s.monthlyBonusSec,
    topupsThisMonth: s.topupsThisMonth,
    balanceSec: s.balanceSec,
    remainingSec: remaining,
    canStart: access.voice && remaining >= MIN_START_SEC,
    weeklyLimitSec: monthlyLimit,
    weeklyUsedSec: s.monthlyUsedSec,
    weeklyRemainingSec: remaining,
  };
}

/** Adds owned minutes. Called when a support pass is granted. */
export async function grantVoiceMinutes(userId: string, minutes: number): Promise<void> {
  const sec = Math.round(minutes * 60);
  if (!Number.isFinite(sec) || sec <= 0) return;
  const s = await ensure(userId);
  if (dbEnabled) {
    await prisma.voiceQuota.update({ where: { userId }, data: { balanceSec: { increment: sec } } });
    return;
  }
  memoryStore.set(userId, { ...s, balanceSec: s.balanceSec + sec });
}

/**
 * Records seconds used. A monthly allowance is spent first (admins and any
 * legacy top-up), then the minutes the member owns from supporting. The
 * balance never goes below zero, so an overrun is absorbed rather than
 * leaving a debt.
 */
export async function recordVoiceSeconds(userId: string, seconds: number, monthlyAllowanceSec = 0): Promise<void> {
  const sec = Math.round(seconds);
  if (!Number.isFinite(sec) || sec <= 0) return;
  const s = await ensure(userId);
  const allowanceLeft = Math.max(0, monthlyAllowanceSec + s.monthlyBonusSec - s.monthlyUsedSec);
  const fromAllowance = Math.min(sec, allowanceLeft);
  const fromBalance = Math.min(s.balanceSec, sec - fromAllowance);

  if (dbEnabled) {
    await prisma.voiceQuota.update({
      where: { userId },
      data: {
        weeklyUsedSec: { increment: sec },
        monthlyUsedSec: { increment: sec },
        ...(fromBalance > 0 ? { balanceSec: { decrement: fromBalance } } : {}),
      },
    });
    return;
  }
  memoryStore.set(userId, {
    ...s,
    weeklyUsedSec: s.weeklyUsedSec + sec,
    monthlyUsedSec: s.monthlyUsedSec + sec,
    balanceSec: Math.max(0, s.balanceSec - fromBalance),
  });
}

export async function recordVoiceMinutes(userId: string, minutes: number): Promise<void> {
  return recordVoiceSeconds(userId, minutes * 60);
}

/**
 * Applies a paid top-up. Only the Stripe webhook may call this once paid
 * plans are on. Cap of four per month, enforced atomically in DB mode.
 */
export async function applyTopup(userId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const s = await ensure(userId);
  if (dbEnabled) {
    const res = await prisma.voiceQuota.updateMany({
      where: { userId, topupsThisMonth: { lt: 4 } },
      data: {
        weeklyBonusSec: { increment: TOPUP_WEEKLY_BONUS_SEC },
        monthlyBonusSec: { increment: TOPUP_MONTHLY_BONUS_SEC },
        topupsThisMonth: { increment: 1 },
      },
    });
    if (res.count === 0) return { ok: false, error: "You've reached the top-up cap for this month." };
    return { ok: true };
  }
  if (s.topupsThisMonth >= 4) return { ok: false, error: "You've reached the top-up cap for this month." };
  memoryStore.set(userId, {
    ...s,
    weeklyBonusSec: s.weeklyBonusSec + TOPUP_WEEKLY_BONUS_SEC,
    monthlyBonusSec: s.monthlyBonusSec + TOPUP_MONTHLY_BONUS_SEC,
    topupsThisMonth: s.topupsThisMonth + 1,
  });
  return { ok: true };
}

export const VOICE_TOPUP = {
  priceUsd: TOPUP_PRICE_USD,
  weekMinutes: 30,
  monthMinutes: 50,
};

/* ------------------------------------------------------------------ */
/* Voice sessions (minted server-side; duration from ElevenLabs)        */
/* ------------------------------------------------------------------ */

interface MemorySession {
  id: string;
  userId: string;
  conversationId?: string;
  startedAt: string;
  durationSec?: number;
}
const sessionsAny = globalThis as unknown as { __calmVoiceSessions?: Map<string, MemorySession> };
const sessionStore: Map<string, MemorySession> = sessionsAny.__calmVoiceSessions ?? new Map();
sessionsAny.__calmVoiceSessions = sessionStore;

export async function openVoiceSession(userId: string): Promise<string> {
  if (dbEnabled) {
    const row = await prisma.voiceSession.create({ data: { userId } });
    return row.id;
  }
  const id = `vs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  sessionStore.set(id, { id, userId, startedAt: new Date().toISOString() });
  return id;
}

/**
 * Closes a session with the duration reported by ElevenLabs. Returns false
 * when the conversation was already recorded (replay) or does not belong to
 * this member.
 */
export async function closeVoiceSession(input: {
  sessionId: string;
  userId: string;
  conversationId: string;
  durationSec: number;
  /** The member's monthly allowance in seconds, spent before owned minutes. */
  monthlyAllowanceSec?: number;
}): Promise<boolean> {
  if (dbEnabled) {
    const row = await prisma.voiceSession.findUnique({ where: { id: input.sessionId } });
    if (!row || row.userId !== input.userId || row.conversationId) return false;
    const dup = await prisma.voiceSession.findUnique({ where: { conversationId: input.conversationId } });
    if (dup) return false;
    await prisma.voiceSession.update({
      where: { id: input.sessionId },
      data: { conversationId: input.conversationId, durationSec: input.durationSec, endedAt: new Date() },
    });
    await recordVoiceSeconds(input.userId, input.durationSec, input.monthlyAllowanceSec ?? 0);
    return true;
  }
  const s = sessionStore.get(input.sessionId);
  if (!s || s.userId !== input.userId || s.conversationId) return false;
  for (const other of sessionStore.values()) if (other.conversationId === input.conversationId) return false;
  sessionStore.set(input.sessionId, { ...s, conversationId: input.conversationId, durationSec: input.durationSec });
  await recordVoiceSeconds(input.userId, input.durationSec, input.monthlyAllowanceSec ?? 0);
  return true;
}
