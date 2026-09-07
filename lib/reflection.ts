import { llmClient, llmConfigured, AURA_MODEL } from "./aura";
import { addMemory, listMemories } from "./profiles";
import { closeSession, getSession } from "./sessions";
import { recordLlmUsage } from "./usage";

/**
 * Aura's note after a conversation: one line for the session, up to three
 * memories for the person. Written the way a good therapist writes notes,
 * in plain language the member could read without flinching. Skips short
 * conversations and never stores crisis detail as a memory.
 */

const NOTE_PROMPT = `You are Aura, writing a private note after a conversation with a member of a mental-wellness app. Output JSON only.

Return:
{"summary": "<one sentence, 8-25 words, plain, second person: what this conversation was about and how it moved>",
 "memories": [{"statement": "<one fact or pattern worth remembering next time, 6-20 words, third person is fine, no diagnosis>", "category": "family|work|health|relationship|pattern|goal|value"}]}

Rules:
- 0 to 3 memories. Only things that will matter in a future conversation: names and roles, recurring situations, what helped, what they said they wanted.
- Never record methods, means, or details of self-harm or suicide. If the conversation was a crisis, the memory can say "had a very hard night on <weekday>; check in gently" and nothing more.
- Never diagnose or label. "Sleep has been broken for two weeks" not "insomnia". "Anxiety is loud before calls with her manager" not "GAD".
- Do not repeat memories that already exist; say something new or return fewer.
- If the conversation was too short or too vague to note, return {"summary": "", "memories": []}.`;

const MIN_USER_TURNS = 2;
const CATEGORIES = new Set(["family", "work", "health", "relationship", "pattern", "goal", "value"]);

function normalise(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF\u0900-\u097F ]+/g, " ").replace(/\s+/g, " ").trim();
}

function similar(a: string, b: string): boolean {
  const x = normalise(a);
  const y = normalise(b);
  if (!x || !y) return false;
  if (x === y || x.includes(y) || y.includes(x)) return true;
  const wx = new Set(x.split(" "));
  const wy = new Set(y.split(" "));
  let shared = 0;
  for (const w of wx) if (wy.has(w) && w.length > 3) shared++;
  return shared >= Math.min(4, Math.floor(Math.min(wx.size, wy.size) * 0.6));
}

export async function summariseSession(userId: string, sessionId: string): Promise<string | undefined> {
  const session = await getSession(userId, sessionId);
  if (!session) return undefined;
  const userTurns = session.transcript.filter((t) => t.role === "user");
  if (userTurns.length < MIN_USER_TURNS) return undefined;
  if (session.summary) return session.summary;

  if (!llmConfigured()) {
    const first = userTurns[0].content.slice(0, 80);
    const summary = `You talked about ${first.toLowerCase()}${first.length >= 80 ? "…" : ""}`;
    await closeSession(userId, sessionId, { summary });
    return summary;
  }

  const existing = await listMemories(userId, 40);
  const transcript = session.transcript
    .slice(-40)
    .map((t) => `${t.role === "user" ? "Member" : "Aura"}: ${t.content.slice(0, 600)}`)
    .join("\n");
  const known = existing.length ? existing.map((m) => `- ${m.statement}`).join("\n") : "(none yet)";

  const started = Date.now();
  const res = await llmClient().chat.completions.create({
    model: AURA_MODEL,
    max_completion_tokens: 400,
    reasoning_effort: "low",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: NOTE_PROMPT },
      { role: "user", content: `Existing memories:\n${known}\n\nConversation (${session.mode}):\n${transcript}` },
    ],
  });
  void recordLlmUsage({
    userId,
    tokensIn: res.usage?.prompt_tokens,
    tokensOut: res.usage?.completion_tokens,
    cacheReadTokens: res.usage?.prompt_tokens_details?.cached_tokens ?? undefined,
    durationMs: Date.now() - started,
    model: AURA_MODEL,
    stance: "note",
    sessionId,
  }).catch(() => {});

  let parsed: { summary?: unknown; memories?: unknown } = {};
  try {
    parsed = JSON.parse(res.choices[0]?.message?.content ?? "{}");
  } catch {
    return undefined;
  }
  const summary = typeof parsed.summary === "string" ? parsed.summary.trim().slice(0, 300) : "";
  const memories = Array.isArray(parsed.memories) ? parsed.memories.slice(0, 3) : [];
  for (const m of memories) {
    if (!m || typeof m !== "object") continue;
    const statement = typeof (m as { statement?: unknown }).statement === "string" ? (m as { statement: string }).statement.trim().slice(0, 200) : "";
    const category = typeof (m as { category?: unknown }).category === "string" && CATEGORIES.has((m as { category: string }).category) ? (m as { category: string }).category : "pattern";
    if (statement.length < 6) continue;
    if (existing.some((e) => similar(e.statement, statement))) continue;
    await addMemory(userId, statement, category);
  }
  if (summary) await closeSession(userId, sessionId, { summary });
  return summary || undefined;
}
