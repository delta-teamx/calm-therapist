import { dbEnabled, prisma } from "./prisma";
import type { UserProfile } from "./aura";
import { cultureFromFields } from "./profile-input";

/**
 * The member's profile and memories on the server, in both storage modes.
 * This is what the dashboard hydrates from, so a profile survives a new
 * device and Aura's memory is hers, not the browser's.
 */

export interface StoredProfile {
  name: string;
  age?: string;
  tone: "warm" | "direct" | "clinical";
  language: string;
  focusAreas: string[];
  goals: string[];
  culturalContext?: string;
  familySystem?: string;
  countryOfResidence?: string;
  diasporaStatus?: string;
  stigmaContext?: string;
  somaticExpression?: string;
  emailOptOut: boolean;
  crisisContactName?: string;
  crisisContactPhone?: string;
}

export interface StoredMemory {
  id: string;
  statement: string;
  category: string;
  mentions: number;
  firstMentioned: string;
  lastMentioned: string;
}

interface MemoryProfileRow extends Partial<StoredProfile> {
  memories: StoredMemory[];
}

const g = globalThis as unknown as { __calmProfiles?: Map<string, MemoryProfileRow> };
const store: Map<string, MemoryProfileRow> = g.__calmProfiles ?? new Map();
g.__calmProfiles = store;

export const ALLOWED_TONES = new Set(["warm", "direct", "clinical"]);

const LIMITS = { name: 40, age: 12, language: 24, focusArea: 60, goal: 160, culture: 80, memory: 240, contact: 60 };

function str(v: unknown, max: number): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.replace(/[\r\n\t]+/g, " ").trim();
  return s ? s.slice(0, max) : undefined;
}
function list(v: unknown, max: number, count: number): string[] | undefined {
  if (!Array.isArray(v)) return undefined;
  return v.map((x) => str(x, max)).filter((x): x is string => !!x).slice(0, count);
}

/** Cleans a client payload. Unknown keys are dropped; `country` maps to countryOfResidence. */
export function sanitizeProfilePatch(body: Record<string, unknown>): Partial<StoredProfile> {
  const out: Partial<StoredProfile> = {};
  const name = str(body.name, LIMITS.name);
  if (name) out.name = name;
  const age = str(body.age, LIMITS.age);
  if (age) out.age = age;
  if (typeof body.tone === "string" && ALLOWED_TONES.has(body.tone)) out.tone = body.tone as StoredProfile["tone"];
  const language = str(body.language, LIMITS.language);
  if (language) out.language = language;
  const focus = list(body.focusAreas, LIMITS.focusArea, 8);
  if (focus) out.focusAreas = focus;
  const goals = list(body.goals ?? body.currentGoals, LIMITS.goal, 6);
  if (goals) out.goals = goals;
  const country = str(body.countryOfResidence ?? body.country, 3);
  if (country) out.countryOfResidence = country.toUpperCase();
  for (const k of ["culturalContext", "familySystem", "diasporaStatus", "stigmaContext", "somaticExpression"] as const) {
    const v = str(body[k], LIMITS.culture);
    if (v) out[k] = v;
  }
  if (typeof body.emailOptOut === "boolean") out.emailOptOut = body.emailOptOut;
  const cn = str(body.crisisContactName, LIMITS.contact);
  if (cn !== undefined) out.crisisContactName = cn;
  const cp = str(body.crisisContactPhone, LIMITS.contact);
  if (cp !== undefined) out.crisisContactPhone = cp;
  return out;
}

export async function getProfile(userId: string): Promise<StoredProfile | null> {
  if (dbEnabled) {
    const u = await prisma.user.findUnique({ where: { id: userId } });
    if (!u) return null;
    return {
      name: u.name,
      age: u.ageGroup ?? undefined,
      tone: (ALLOWED_TONES.has(u.tone) ? u.tone : "warm") as StoredProfile["tone"],
      language: u.language,
      focusAreas: u.focusAreas,
      goals: (await prisma.goal.findMany({ where: { userId }, orderBy: { createdAt: "asc" }, take: 6 })).map((x) => x.title),
      culturalContext: u.culturalContext ?? undefined,
      familySystem: u.familySystem ?? undefined,
      countryOfResidence: u.countryOfResidence ?? undefined,
      diasporaStatus: u.diasporaStatus ?? undefined,
      stigmaContext: u.stigmaContext ?? undefined,
      somaticExpression: u.somaticExpression ?? undefined,
      emailOptOut: u.emailOptOut,
      crisisContactName: u.crisisContactName ?? undefined,
      crisisContactPhone: u.crisisContactPhone ?? undefined,
    };
  }
  const row = store.get(userId);
  return {
    name: row?.name ?? "friend",
    age: row?.age,
    tone: row?.tone ?? "warm",
    language: row?.language ?? "en",
    focusAreas: row?.focusAreas ?? [],
    goals: row?.goals ?? [],
    culturalContext: row?.culturalContext,
    familySystem: row?.familySystem,
    countryOfResidence: row?.countryOfResidence,
    diasporaStatus: row?.diasporaStatus,
    stigmaContext: row?.stigmaContext,
    somaticExpression: row?.somaticExpression,
    emailOptOut: row?.emailOptOut ?? false,
    crisisContactName: row?.crisisContactName,
    crisisContactPhone: row?.crisisContactPhone,
  };
}

export async function saveProfile(userId: string, patch: Partial<StoredProfile>): Promise<void> {
  if (dbEnabled) {
    const { goals, age, ...rest } = patch;
    await prisma.user.update({
      where: { id: userId },
      data: { ...rest, ...(age !== undefined ? { ageGroup: age } : {}) },
    });
    if (goals?.length) {
      // Onboarding goals are added, never replace what the member already tracks.
      const existing = await prisma.goal.findMany({ where: { userId }, select: { title: true } });
      const have = new Set(existing.map((x) => x.title.toLowerCase()));
      const fresh = goals.filter((t) => !have.has(t.toLowerCase())).slice(0, Math.max(0, 5 - existing.length));
      if (fresh.length) await prisma.goal.createMany({ data: fresh.map((title) => ({ userId, title, frequency: "weekly" })) });
    }
    return;
  }
  const cur = store.get(userId) ?? { memories: [] };
  store.set(userId, { ...cur, ...patch });
}

/* ------------------------------------------------------------------ */
/* Memories                                                            */
/* ------------------------------------------------------------------ */

export async function listMemories(userId: string, limit = 20): Promise<StoredMemory[]> {
  if (dbEnabled) {
    const rows = await prisma.memory.findMany({ where: { userId }, orderBy: [{ mentions: "desc" }, { lastMentioned: "desc" }], take: limit });
    return rows.map((m) => ({
      id: m.id,
      statement: m.statement,
      category: m.category,
      mentions: m.mentions,
      firstMentioned: m.firstMentioned.toISOString(),
      lastMentioned: m.lastMentioned.toISOString(),
    }));
  }
  const row = store.get(userId);
  return (row?.memories ?? []).slice().sort((a, b) => b.mentions - a.mentions).slice(0, limit);
}

export async function addMemory(userId: string, statement: string, category = "pattern"): Promise<void> {
  const text = str(statement, LIMITS.memory);
  if (!text) return;
  const now = new Date();
  if (dbEnabled) {
    const existing = await prisma.memory.findFirst({ where: { userId, statement: text } });
    if (existing) {
      await prisma.memory.update({ where: { id: existing.id }, data: { mentions: { increment: 1 }, lastMentioned: now } });
    } else {
      await prisma.memory.create({ data: { userId, statement: text, category } });
    }
    return;
  }
  const row = store.get(userId) ?? { memories: [] };
  const found = row.memories.find((m) => m.statement === text);
  if (found) {
    found.mentions += 1;
    found.lastMentioned = now.toISOString();
  } else {
    row.memories.push({
      id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      statement: text,
      category,
      mentions: 1,
      firstMentioned: now.toISOString(),
      lastMentioned: now.toISOString(),
    });
  }
  store.set(userId, row);
}

export async function deleteMemory(userId: string, id: string): Promise<void> {
  if (dbEnabled) {
    await prisma.memory.deleteMany({ where: { userId, id } });
    return;
  }
  const row = store.get(userId);
  if (row) row.memories = row.memories.filter((m) => m.id !== id);
}

/** Distinct days on which the member talked to Aura. */
export async function sessionCount(userId: string): Promise<number> {
  if (!dbEnabled) return 1;
  const rows = await prisma.usageEvent.findMany({
    where: { userId, service: "llm" },
    select: { at: true },
    orderBy: { at: "desc" },
    take: 2000,
  });
  const days = new Set(rows.map((r) => r.at.toISOString().slice(0, 10)));
  return Math.max(1, days.size);
}

/** Builds the UserProfile Aura's prompt uses, from the stored record. */
export function toUserProfile(p: StoredProfile, memories: StoredMemory[], sessions: number): UserProfile {
  return {
    name: p.name,
    age: p.age,
    tone: p.tone,
    focusAreas: p.focusAreas,
    currentGoals: p.goals,
    sessionCount: sessions,
    memories: memories.map((m) => m.statement),
    language: p.language,
    culture: cultureFromFields({
      language: p.language,
      countryOfResidence: p.countryOfResidence,
      culturalContext: p.culturalContext,
      familySystem: p.familySystem,
      diasporaStatus: p.diasporaStatus,
      stigmaContext: p.stigmaContext,
      somaticExpression: p.somaticExpression,
    }),
    activeModes: [],
  };
}
