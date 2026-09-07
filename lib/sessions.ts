import type { Prisma } from "@prisma/client";
import { dbEnabled, prisma } from "./prisma";

const toJson = (turns: Turn[]) => turns as unknown as Prisma.InputJsonValue;
const fromJson = (v: unknown): Turn[] => (Array.isArray(v) ? (v as unknown as Turn[]) : []);

/**
 * Conversations, persisted. One Session row per chat or voice conversation,
 * with the transcript as JSON. Chat reuses the open session for a few hours
 * so a reload does not start a new one; voice sessions are written once at
 * the end from the ElevenLabs transcript.
 */

export type SessionMode = "chat" | "voice";

export interface Turn {
  role: "user" | "assistant";
  content: string;
  at: string;
}

export interface SessionRecord {
  id: string;
  userId: string;
  mode: SessionMode;
  startedAt: string;
  endedAt?: string;
  transcript: Turn[];
  summary?: string;
  moodBefore?: number;
  moodAfter?: number;
}

export interface SessionSummaryRow {
  id: string;
  mode: SessionMode;
  startedAt: string;
  endedAt?: string;
  summary?: string;
  turns: number;
}

const MAX_TURNS = 400;
const MAX_TURN_CHARS = 4000;
/** A chat session stays open for this long after its last turn. */
const OPEN_WINDOW_MS = 6 * 60 * 60 * 1000;

const globalAny = globalThis as unknown as { __calmSessions?: Map<string, SessionRecord> };
const memory = globalAny.__calmSessions ?? new Map<string, SessionRecord>();
globalAny.__calmSessions = memory;

function cleanTurns(turns: Turn[]): Turn[] {
  return turns
    .filter((t) => (t.role === "user" || t.role === "assistant") && typeof t.content === "string" && t.content.trim())
    .map((t) => ({ role: t.role, content: t.content.slice(0, MAX_TURN_CHARS), at: t.at || new Date().toISOString() }));
}

function rowToRecord(row: {
  id: string;
  userId: string;
  mode: string;
  startedAt: Date;
  endedAt: Date | null;
  transcript: unknown;
  summary: string | null;
  moodBefore: number | null;
  moodAfter: number | null;
}): SessionRecord {
  return {
    id: row.id,
    userId: row.userId,
    mode: row.mode === "voice" ? "voice" : "chat",
    startedAt: row.startedAt.toISOString(),
    endedAt: row.endedAt?.toISOString(),
    transcript: fromJson(row.transcript),
    summary: row.summary ?? undefined,
    moodBefore: row.moodBefore ?? undefined,
    moodAfter: row.moodAfter ?? undefined,
  };
}

export async function openSession(userId: string, mode: SessionMode, opts: { moodBefore?: number } = {}): Promise<SessionRecord> {
  if (dbEnabled) {
    const row = await prisma.session.create({
      data: { userId, mode, transcript: toJson([]), moodBefore: opts.moodBefore ?? null },
    });
    return rowToRecord(row);
  }
  const rec: SessionRecord = {
    id: `s_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    userId,
    mode,
    startedAt: new Date().toISOString(),
    transcript: [],
    moodBefore: opts.moodBefore,
  };
  memory.set(rec.id, rec);
  return rec;
}

export async function getSession(userId: string, id: string): Promise<SessionRecord | null> {
  if (dbEnabled) {
    const row = await prisma.session.findFirst({ where: { id, userId } });
    return row ? rowToRecord(row) : null;
  }
  const rec = memory.get(id);
  return rec && rec.userId === userId ? rec : null;
}

/** The most recent chat session that is still open and recent enough to continue. */
export async function currentSession(userId: string, mode: SessionMode): Promise<SessionRecord | null> {
  const since = new Date(Date.now() - OPEN_WINDOW_MS);
  if (dbEnabled) {
    const row = await prisma.session.findFirst({
      where: { userId, mode, endedAt: null, startedAt: { gte: since } },
      orderBy: { startedAt: "desc" },
    });
    if (!row) return null;
    const rec = rowToRecord(row);
    const last = rec.transcript[rec.transcript.length - 1];
    if (last && new Date(last.at) < since) return null;
    return rec;
  }
  const candidates = Array.from(memory.values())
    .filter((s) => s.userId === userId && s.mode === mode && !s.endedAt && new Date(s.startedAt) >= since)
    .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
  return candidates[0] ?? null;
}

/** Returns the session to write this turn into: the given one if it is the member's, else the open one, else a new one. */
export async function resolveSession(userId: string, mode: SessionMode, sessionId?: string | null): Promise<SessionRecord> {
  if (sessionId) {
    const existing = await getSession(userId, sessionId);
    if (existing && !existing.endedAt) return existing;
  }
  return (await currentSession(userId, mode)) ?? openSession(userId, mode);
}

export async function appendTurns(userId: string, id: string, turns: Turn[]): Promise<number> {
  const clean = cleanTurns(turns);
  if (!clean.length) return 0;
  if (dbEnabled) {
    const row = await prisma.session.findFirst({ where: { id, userId }, select: { transcript: true } });
    if (!row) return 0;
    const current = fromJson(row.transcript);
    const next = [...current, ...clean].slice(-MAX_TURNS);
    await prisma.session.update({ where: { id }, data: { transcript: toJson(next) } });
    return next.length;
  }
  const rec = memory.get(id);
  if (!rec || rec.userId !== userId) return 0;
  rec.transcript = [...rec.transcript, ...clean].slice(-MAX_TURNS);
  return rec.transcript.length;
}

export async function closeSession(
  userId: string,
  id: string,
  patch: { summary?: string; moodAfter?: number } = {}
): Promise<SessionRecord | null> {
  if (dbEnabled) {
    const row = await prisma.session.findFirst({ where: { id, userId } });
    if (!row) return null;
    const updated = await prisma.session.update({
      where: { id },
      data: {
        endedAt: row.endedAt ?? new Date(),
        ...(patch.summary !== undefined ? { summary: patch.summary.slice(0, 600) } : {}),
        ...(patch.moodAfter !== undefined ? { moodAfter: patch.moodAfter } : {}),
      },
    });
    return rowToRecord(updated);
  }
  const rec = memory.get(id);
  if (!rec || rec.userId !== userId) return null;
  rec.endedAt = rec.endedAt ?? new Date().toISOString();
  if (patch.summary !== undefined) rec.summary = patch.summary.slice(0, 600);
  if (patch.moodAfter !== undefined) rec.moodAfter = patch.moodAfter;
  return rec;
}

/** Writes a finished voice conversation once, keyed by the provider's conversation id. */
export async function recordVoiceSession(
  userId: string,
  turns: Turn[],
  opts: { externalId?: string; startedAt?: string } = {}
): Promise<SessionRecord> {
  const clean = cleanTurns(turns).slice(-MAX_TURNS);
  const startedAt = opts.startedAt;
  if (dbEnabled) {
    if (opts.externalId) {
      const existing = await prisma.session.findUnique({ where: { externalId: opts.externalId } });
      if (existing && existing.userId === userId) {
        const merged = clean.length > fromJson(existing.transcript).length ? clean : undefined;
        const row = merged ? await prisma.session.update({ where: { id: existing.id }, data: { transcript: toJson(merged) } }) : existing;
        return rowToRecord(row);
      }
    }
    const row = await prisma.session.create({
      data: {
        userId,
        mode: "voice",
        transcript: toJson(clean),
        externalId: opts.externalId ?? null,
        startedAt: startedAt ? new Date(startedAt) : new Date(),
        endedAt: new Date(),
      },
    });
    return rowToRecord(row);
  }
  if (opts.externalId) {
    const existing = Array.from(memory.values()).find((s) => s.userId === userId && s.id === `voice_${opts.externalId}`);
    if (existing) {
      if (clean.length > existing.transcript.length) existing.transcript = clean;
      return existing;
    }
  }
  const rec: SessionRecord = {
    id: opts.externalId ? `voice_${opts.externalId}` : `s_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    userId,
    mode: "voice",
    startedAt: startedAt ?? new Date().toISOString(),
    endedAt: new Date().toISOString(),
    transcript: clean,
  };
  memory.set(rec.id, rec);
  return rec;
}

export async function listSessions(userId: string, limit = 30): Promise<SessionSummaryRow[]> {
  if (dbEnabled) {
    const rows = await prisma.session.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      take: limit,
      select: { id: true, mode: true, startedAt: true, endedAt: true, summary: true, transcript: true },
    });
    return rows.map((r) => ({
      id: r.id,
      mode: r.mode === "voice" ? "voice" : "chat",
      startedAt: r.startedAt.toISOString(),
      endedAt: r.endedAt?.toISOString(),
      summary: r.summary ?? undefined,
      turns: fromJson(r.transcript).length,
    }));
  }
  return Array.from(memory.values())
    .filter((s) => s.userId === userId)
    .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))
    .slice(0, limit)
    .map((s) => ({ id: s.id, mode: s.mode, startedAt: s.startedAt, endedAt: s.endedAt, summary: s.summary, turns: s.transcript.length }));
}

/** Sessions in a date window, full transcripts, oldest first. For journal and reflect. */
export async function sessionsBetween(userId: string, from: Date, to: Date): Promise<SessionRecord[]> {
  if (dbEnabled) {
    const rows = await prisma.session.findMany({
      where: { userId, startedAt: { gte: from, lt: to } },
      orderBy: { startedAt: "asc" },
    });
    return rows.map(rowToRecord);
  }
  return Array.from(memory.values())
    .filter((s) => s.userId === userId && new Date(s.startedAt) >= from && new Date(s.startedAt) < to)
    .sort((a, b) => (a.startedAt < b.startedAt ? -1 : 1));
}
