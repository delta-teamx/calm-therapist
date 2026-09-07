import { dbEnabled, prisma } from "./prisma";
import { dayKey } from "./moods";

/** Small, specific goals with a tick per day. At most five at a time. */

export type Frequency = "daily" | "3x-week" | "weekly";

export interface GoalView {
  id: string;
  title: string;
  description?: string;
  frequency: Frequency;
  createdAt: string;
  /** Last seven UTC days, oldest first: done or not. */
  week: { day: string; done: boolean }[];
  /** Ticks in the last seven days over the target for the frequency. */
  progress: number;
  doneToday: boolean;
}

export const MAX_GOALS = 5;
const TARGET: Record<Frequency, number> = { daily: 7, "3x-week": 3, weekly: 1 };

interface MemGoal { id: string; userId: string; title: string; description?: string; frequency: Frequency; createdAt: string; done: Set<string> }
const g = globalThis as unknown as { __calmGoals?: Map<string, MemGoal> };
const memory = g.__calmGoals ?? new Map<string, MemGoal>();
g.__calmGoals = memory;

function lastSevenDays(): string[] {
  const out: string[] = [];
  for (let i = 6; i >= 0; i--) out.push(dayKey(new Date(Date.now() - i * 86400000)));
  return out;
}

function toFrequency(v: unknown): Frequency {
  return v === "daily" || v === "weekly" ? v : "3x-week";
}

function view(goal: { id: string; title: string; description?: string | null; frequency: string; createdAt: string | Date }, doneDays: Set<string>): GoalView {
  const days = lastSevenDays();
  const week = days.map((day) => ({ day, done: doneDays.has(day) }));
  const ticks = week.filter((w) => w.done).length;
  const frequency = toFrequency(goal.frequency);
  return {
    id: goal.id,
    title: goal.title,
    description: goal.description ?? undefined,
    frequency,
    createdAt: typeof goal.createdAt === "string" ? goal.createdAt : goal.createdAt.toISOString(),
    week,
    progress: Math.min(1, ticks / TARGET[frequency]),
    doneToday: doneDays.has(dayKey()),
  };
}

export async function listGoals(userId: string): Promise<GoalView[]> {
  const since = new Date(Date.now() - 7 * 86400000);
  if (dbEnabled) {
    const rows = await prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
      include: { completions: { where: { date: { gte: since } } } },
    });
    return rows.map((r) => view(r, new Set(r.completions.map((c) => dayKey(c.date)))));
  }
  return Array.from(memory.values())
    .filter((x) => x.userId === userId)
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1))
    .map((x) => view(x, x.done));
}

export async function createGoal(userId: string, input: { title: string; description?: string; frequency?: string }): Promise<GoalView | null> {
  const title = input.title.trim().slice(0, 120);
  if (!title) return null;
  const description = input.description?.trim().slice(0, 240) || undefined;
  const frequency = toFrequency(input.frequency);
  const existing = await listGoals(userId);
  if (existing.length >= MAX_GOALS) return null;
  if (dbEnabled) {
    const row = await prisma.goal.create({ data: { userId, title, description: description ?? null, frequency } });
    return view(row, new Set());
  }
  const rec: MemGoal = { id: `g_${Date.now().toString(36)}`, userId, title, description, frequency, createdAt: new Date().toISOString(), done: new Set() };
  memory.set(rec.id, rec);
  return view(rec, rec.done);
}

export async function deleteGoal(userId: string, id: string): Promise<boolean> {
  if (dbEnabled) {
    const r = await prisma.goal.deleteMany({ where: { id, userId } });
    return r.count > 0;
  }
  const rec = memory.get(id);
  if (!rec || rec.userId !== userId) return false;
  memory.delete(id);
  return true;
}

/** Ticks or unticks today. */
export async function toggleToday(userId: string, id: string): Promise<GoalView | null> {
  const today = dayKey();
  if (dbEnabled) {
    const goal = await prisma.goal.findFirst({ where: { id, userId } });
    if (!goal) return null;
    const start = new Date(today);
    const end = new Date(start.getTime() + 86400000);
    const existing = await prisma.goalCompletion.findFirst({ where: { goalId: id, date: { gte: start, lt: end } } });
    if (existing) await prisma.goalCompletion.delete({ where: { id: existing.id } });
    else await prisma.goalCompletion.create({ data: { goalId: id, date: new Date() } });
    const goals = await listGoals(userId);
    return goals.find((x) => x.id === id) ?? null;
  }
  const rec = memory.get(id);
  if (!rec || rec.userId !== userId) return null;
  if (rec.done.has(today)) rec.done.delete(today);
  else rec.done.add(today);
  return view(rec, rec.done);
}
