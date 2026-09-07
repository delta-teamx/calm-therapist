import { llmClient, llmConfigured, AURA_MODEL } from "./aura";
import { sessionsBetween } from "./sessions";
import { moodsBetween } from "./moods";
import { listMemories } from "./profiles";
import { recordLlmUsage } from "./usage";

/**
 * A month in the member's own words. Built on demand from real sessions,
 * check-ins, and memories. Nothing is stored; the material is the record.
 */

export interface Reflection {
  month: string; // YYYY-MM
  label: string;
  sessions: number;
  checkins: number;
  averageMood?: number;
  previousAverageMood?: number;
  themes: string[];
  quotes: string[];
  shift: string;
  enough: boolean;
}

const STOP = new Set("the a an and or but so to of in on at for with from by is are was were be been being i me my we our you your it its this that these those they them their he she his her not no do did does have has had can could would should will just like really very about into over than then there here what when where which who why how if as up down out off again more most some any all one two also get got going want need think know feel felt feeling".split(" "));

export function monthKey(d: Date = new Date()): string {
  return d.toISOString().slice(0, 7);
}

function monthRange(month: string): { from: Date; to: Date; prevFrom: Date } {
  const [y, m] = month.split("-").map(Number);
  const from = new Date(Date.UTC(y, m - 1, 1));
  const to = new Date(Date.UTC(y, m, 1));
  const prevFrom = new Date(Date.UTC(y, m - 2, 1));
  return { from, to, prevFrom };
}

function topWords(texts: string[], n = 5): string[] {
  const counts = new Map<string, number>();
  for (const t of texts) {
    for (const w of t.toLowerCase().replace(/[^\p{L}\s']/gu, " ").split(/\s+/)) {
      if (w.length < 4 || STOP.has(w)) continue;
      counts.set(w, (counts.get(w) ?? 0) + 1);
    }
  }
  return Array.from(counts.entries())
    .filter(([, c]) => c >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([w]) => w);
}

function pickQuotes(texts: string[], n = 4): string[] {
  const candidates = texts
    .map((t) => t.trim())
    .filter((t) => t.length >= 30 && t.length <= 140 && !/https?:\/\//.test(t))
    .filter((t) => !/\b(kill|suicid|die|dead|overdos|cut myself)\b/i.test(t));
  const out: string[] = [];
  const step = Math.max(1, Math.floor(candidates.length / n));
  for (let i = 0; i < candidates.length && out.length < n; i += step) out.push(candidates[i]);
  return out;
}

const SHIFT_PROMPT = `You are Aura. Write one paragraph, 60 to 120 words, second person, plain and warm, about how this month compares with the one before for this member: what came up most, what moved, what stayed. Use only the material given. No diagnosis, no advice, no bullet points, no headings. If there is not enough material, say what there is and that a month of showing up is itself the record.`;

export async function buildReflection(userId: string, month: string = monthKey()): Promise<Reflection> {
  if (!/^\d{4}-\d{2}$/.test(month)) month = monthKey();
  const { from, to, prevFrom } = monthRange(month);
  const [sessions, prevSessions, moods, prevMoods, memories] = await Promise.all([
    sessionsBetween(userId, from, to),
    sessionsBetween(userId, prevFrom, from),
    moodsBetween(userId, from, to),
    moodsBetween(userId, prevFrom, from),
    listMemories(userId, 12),
  ]);
  const userTexts = sessions.flatMap((s) => s.transcript.filter((t) => t.role === "user").map((t) => t.content));
  const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : undefined);
  const enough = sessions.length >= 2 || moods.length >= 5;
  const label = from.toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
  const base: Reflection = {
    month,
    label,
    sessions: sessions.length,
    checkins: moods.length,
    averageMood: avg(moods.map((m) => m.score)),
    previousAverageMood: avg(prevMoods.map((m) => m.score)),
    themes: topWords(userTexts),
    quotes: pickQuotes(userTexts),
    shift: "",
    enough,
  };
  if (!enough) {
    base.shift = sessions.length
      ? `One conversation so far in ${label}. A month of showing up is itself the record; come back and this page fills in.`
      : `Nothing in ${label} yet. Talk to Aura once or twice and check in on a few days, and this page will read the month back to you.`;
    return base;
  }
  if (!llmConfigured()) {
    base.shift = `${sessions.length} conversations and ${moods.length} check-ins in ${label}, against ${prevSessions.length} and ${prevMoods.length} the month before. The words that came up most: ${base.themes.join(", ") || "not enough yet"}.`;
    return base;
  }
  const started = Date.now();
  const res = await llmClient().chat.completions.create({
    model: AURA_MODEL,
    max_completion_tokens: 400,
    reasoning_effort: "low",
    messages: [
      { role: "system", content: SHIFT_PROMPT },
      {
        role: "user",
        content: `Month: ${label}. This month: ${sessions.length} conversations, ${moods.length} check-ins, average mood ${base.averageMood ?? "n/a"}/5.\nSession notes:\n${sessions.map((s) => `- ${s.summary ?? "(no note)"}`).join("\n")}\n\nMonth before: ${prevSessions.length} conversations, ${prevMoods.length} check-ins, average mood ${base.previousAverageMood ?? "n/a"}/5.\nNotes:\n${prevSessions.map((s) => `- ${s.summary ?? "(no note)"}`).join("\n") || "(none)"}\n\nWords that came up most this month: ${base.themes.join(", ") || "n/a"}.\nWhat you remember about them:\n${memories.map((m) => `- ${m.statement}`).join("\n") || "(nothing yet)"}`,
      },
    ],
  });
  void recordLlmUsage({ userId, tokensIn: res.usage?.prompt_tokens, tokensOut: res.usage?.completion_tokens, durationMs: Date.now() - started, model: AURA_MODEL, stance: "reflect" }).catch(() => {});
  base.shift = (res.choices[0]?.message?.content ?? "").trim();
  return base;
}
