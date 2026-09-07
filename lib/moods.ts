import { dbEnabled, prisma } from "./prisma";

/** Daily check-in scores, 1 to 5. One per member per UTC day. */

export interface MoodPoint {
  day: string; // YYYY-MM-DD
  score: number;
  note?: string;
}

const g = globalThis as unknown as { __calmMoods?: Map<string, Map<string, MoodPoint>> };
const memory = g.__calmMoods ?? new Map<string, Map<string, MoodPoint>>();
g.__calmMoods = memory;

export function dayKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

export async function setMood(userId: string, score: number, note?: string, day: string = dayKey()): Promise<MoodPoint> {
  const s = Math.max(1, Math.min(5, Math.round(score)));
  const n = note?.trim().slice(0, 240) || undefined;
  if (dbEnabled) {
    const row = await prisma.moodEntry.upsert({
      where: { userId_day: { userId, day: new Date(day) } },
      create: { userId, day: new Date(day), score: s, note: n ?? null },
      update: { score: s, note: n ?? null },
    });
    return { day: row.day.toISOString().slice(0, 10), score: row.score, note: row.note ?? undefined };
  }
  const m = memory.get(userId) ?? new Map<string, MoodPoint>();
  const p = { day, score: s, note: n };
  m.set(day, p);
  memory.set(userId, m);
  return p;
}

/** The last N days, oldest first, with gaps left out. */
export async function listMoods(userId: string, days = 30): Promise<MoodPoint[]> {
  const since = new Date(Date.now() - days * 86400000);
  if (dbEnabled) {
    const rows = await prisma.moodEntry.findMany({ where: { userId, day: { gte: since } }, orderBy: { day: "asc" } });
    return rows.map((r) => ({ day: r.day.toISOString().slice(0, 10), score: r.score, note: r.note ?? undefined }));
  }
  return Array.from(memory.get(userId)?.values() ?? [])
    .filter((p) => new Date(p.day) >= since)
    .sort((a, b) => (a.day < b.day ? -1 : 1));
}

export async function moodsBetween(userId: string, from: Date, to: Date): Promise<MoodPoint[]> {
  if (dbEnabled) {
    const rows = await prisma.moodEntry.findMany({ where: { userId, day: { gte: from, lt: to } }, orderBy: { day: "asc" } });
    return rows.map((r) => ({ day: r.day.toISOString().slice(0, 10), score: r.score, note: r.note ?? undefined }));
  }
  return Array.from(memory.get(userId)?.values() ?? [])
    .filter((p) => new Date(p.day) >= from && new Date(p.day) < to)
    .sort((a, b) => (a.day < b.day ? -1 : 1));
}
