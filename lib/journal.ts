import { dbEnabled, prisma } from "./prisma";
import { llmClient, llmConfigured, AURA_MODEL } from "./aura";
import { sessionsBetween } from "./sessions";
import { moodsBetween } from "./moods";
import { listMemories } from "./profiles";
import { recordLlmUsage } from "./usage";

/** One entry per member per week, with Aura's read of the week. */

export interface JournalWeek {
  weekStart: string; // YYYY-MM-DD, Monday UTC
  content: string;
  aiAnalysis?: string;
  updatedAt?: string;
}

const g = globalThis as unknown as { __calmJournal?: Map<string, JournalWeek> };
const memory = g.__calmJournal ?? new Map<string, JournalWeek>();
g.__calmJournal = memory;

export function weekStartOf(d: Date = new Date()): string {
  const day = d.getUTCDay();
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - ((day + 6) % 7)));
  return monday.toISOString().slice(0, 10);
}

function isWeekKey(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && new Date(s).getUTCDay() === 1;
}

export async function getWeek(userId: string, weekStart: string): Promise<JournalWeek> {
  if (!isWeekKey(weekStart)) weekStart = weekStartOf();
  if (dbEnabled) {
    const row = await prisma.journalEntry.findFirst({ where: { userId, weekStart: new Date(weekStart) }, orderBy: { createdAt: "desc" } });
    return row
      ? { weekStart, content: row.content, aiAnalysis: row.aiAnalysis ?? undefined, updatedAt: row.createdAt.toISOString() }
      : { weekStart, content: "" };
  }
  return memory.get(`${userId}:${weekStart}`) ?? { weekStart, content: "" };
}

export async function saveWeek(userId: string, weekStart: string, content: string): Promise<JournalWeek> {
  if (!isWeekKey(weekStart)) weekStart = weekStartOf();
  const text = content.slice(0, 8000);
  if (dbEnabled) {
    const existing = await prisma.journalEntry.findFirst({ where: { userId, weekStart: new Date(weekStart) } });
    const row = existing
      ? await prisma.journalEntry.update({ where: { id: existing.id }, data: { content: text } })
      : await prisma.journalEntry.create({ data: { userId, weekStart: new Date(weekStart), content: text } });
    return { weekStart, content: row.content, aiAnalysis: row.aiAnalysis ?? undefined, updatedAt: row.createdAt.toISOString() };
  }
  const cur = memory.get(`${userId}:${weekStart}`) ?? { weekStart, content: "" };
  const next = { ...cur, content: text, updatedAt: new Date().toISOString() };
  memory.set(`${userId}:${weekStart}`, next);
  return next;
}

export async function listWeeks(userId: string, limit = 12): Promise<JournalWeek[]> {
  if (dbEnabled) {
    const rows = await prisma.journalEntry.findMany({ where: { userId }, orderBy: { weekStart: "desc" }, take: limit });
    return rows.map((r) => ({ weekStart: r.weekStart.toISOString().slice(0, 10), content: r.content, aiAnalysis: r.aiAnalysis ?? undefined, updatedAt: r.createdAt.toISOString() }));
  }
  return Array.from(memory.entries())
    .filter(([k]) => k.startsWith(`${userId}:`))
    .map(([, v]) => v)
    .sort((a, b) => (a.weekStart < b.weekStart ? 1 : -1))
    .slice(0, limit);
}

const READ_PROMPT = `You are Aura, reading back a member's week in a mental-wellness app. Write two or three short paragraphs, plain language, second person, warm, specific. Name patterns you can actually see in the material: repeated words, days that went differently, what helped, what went quiet. No diagnosis, no advice unless they asked for it in the entry, no bullet points, no headings. Never quote crisis detail. If the material is too thin, say so kindly in one paragraph and suggest one thing to notice next week.`;

/** Aura's read of the week from the entry, the week's conversations, and the check-ins. */
export async function analyseWeek(userId: string, weekStart: string): Promise<string> {
  if (!isWeekKey(weekStart)) weekStart = weekStartOf();
  const from = new Date(weekStart);
  const to = new Date(from.getTime() + 7 * 86400000);
  const [entry, sessions, moods, memories] = await Promise.all([
    getWeek(userId, weekStart),
    sessionsBetween(userId, from, to),
    moodsBetween(userId, from, to),
    listMemories(userId, 10),
  ]);
  const summaries = sessions.map((s) => `- ${s.startedAt.slice(0, 10)} (${s.mode}): ${s.summary ?? s.transcript.filter((t) => t.role === "user").slice(0, 2).map((t) => t.content.slice(0, 120)).join(" / ")}`);
  const moodLine = moods.length ? moods.map((m) => `${m.day}: ${m.score}/5`).join(", ") : "no check-ins";

  let text: string;
  if (!llmConfigured()) {
    text = sessions.length || entry.content
      ? `You showed up ${sessions.length} time${sessions.length === 1 ? "" : "s"} this week and checked in ${moods.length} day${moods.length === 1 ? "" : "s"}. That is the material a pattern is made of; keep going and I will read it back to you properly.`
      : "Nothing to read yet this week. Three lines is enough.";
  } else {
    const started = Date.now();
    const res = await llmClient().chat.completions.create({
      model: AURA_MODEL,
      max_completion_tokens: 500,
      reasoning_effort: "low",
      messages: [
        { role: "system", content: READ_PROMPT },
        {
          role: "user",
          content: `Week starting ${weekStart}.\n\nEntry:\n${entry.content || "(no entry)"}\n\nConversations:\n${summaries.join("\n") || "(none)"}\n\nCheck-ins: ${moodLine}\n\nWhat you already remember about them:\n${memories.map((m) => `- ${m.statement}`).join("\n") || "(nothing yet)"}`,
        },
      ],
    });
    void recordLlmUsage({ userId, tokensIn: res.usage?.prompt_tokens, tokensOut: res.usage?.completion_tokens, durationMs: Date.now() - started, model: AURA_MODEL, stance: "journal" }).catch(() => {});
    text = (res.choices[0]?.message?.content ?? "").trim();
  }
  if (dbEnabled) {
    const existing = await prisma.journalEntry.findFirst({ where: { userId, weekStart: new Date(weekStart) } });
    if (existing) await prisma.journalEntry.update({ where: { id: existing.id }, data: { aiAnalysis: text } });
    else await prisma.journalEntry.create({ data: { userId, weekStart: new Date(weekStart), content: "", aiAnalysis: text } });
  } else {
    const cur = memory.get(`${userId}:${weekStart}`) ?? { weekStart, content: "" };
    memory.set(`${userId}:${weekStart}`, { ...cur, aiAnalysis: text });
  }
  return text;
}
