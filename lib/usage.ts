import { dbEnabled, prisma } from "./prisma";

export interface UsageEvent {
  service: "llm" | "elevenlabs";
  userId?: string;
  tokensIn?: number;
  tokensOut?: number;
  durationMs?: number;
  estimatedCostUsd?: number;
  stance?: string;
  ruleViolations?: string;
  sessionId?: string;
  model?: string;
  cacheReadTokens?: number;
  at: string;
}

const globalAny = globalThis as unknown as { __calmUsage?: UsageEvent[] };
const memoryStore: UsageEvent[] = globalAny.__calmUsage ?? [];
globalAny.__calmUsage = memoryStore;

/** $ per million tokens: [input, cached input, output]. Unknown models fall back to gpt-5.4-mini pricing. */
const PRICES: Record<string, [number, number, number]> = {
  "gpt-5.4-mini": [0.75, 0.075, 4.5],
  "gpt-5.4": [2.5, 0.25, 15.0],
};
const DEFAULT_PRICE_MODEL = "gpt-5.4-mini";

export function estimateLlmCost(model: string | undefined, tokensIn = 0, cacheRead = 0, tokensOut = 0): number {
  const [pin, pcache, pout] = PRICES[model ?? ""] ?? PRICES[DEFAULT_PRICE_MODEL];
  const uncached = Math.max(0, tokensIn - cacheRead);
  return (uncached / 1e6) * pin + (cacheRead / 1e6) * pcache + (tokensOut / 1e6) * pout;
}

export async function recordLlmUsage(input: {
  userId?: string;
  tokensIn?: number;
  tokensOut?: number;
  cacheReadTokens?: number;
  durationMs?: number;
  model?: string;
  stance?: string;
  ruleViolations?: string;
  sessionId?: string;
}): Promise<void> {
  const cost = estimateLlmCost(input.model, input.tokensIn, input.cacheReadTokens, input.tokensOut);
  const event: UsageEvent = {
    service: "llm",
    userId: input.userId,
    tokensIn: input.tokensIn,
    tokensOut: input.tokensOut,
    durationMs: input.durationMs,
    estimatedCostUsd: Number(cost.toFixed(6)),
    stance: input.stance,
    ruleViolations: input.ruleViolations,
    sessionId: input.sessionId,
    model: input.model,
    cacheReadTokens: input.cacheReadTokens,
    at: new Date().toISOString(),
  };
  if (dbEnabled) {
    await prisma.usageEvent.create({
      data: {
        service: "llm",
        userId: input.userId ?? null,
        tokensIn: input.tokensIn,
        tokensOut: input.tokensOut,
        durationMs: input.durationMs,
        estimatedCostUsd: event.estimatedCostUsd,
        stance: input.stance ?? null,
        ruleViolations: input.ruleViolations ?? null,
        sessionId: input.sessionId ?? null,
        model: input.model ?? null,
        cacheReadTokens: input.cacheReadTokens ?? null,
      },
    });
    return;
  }
  memoryStore.push(event);
}

export async function recordVoiceUsage(input: {
  userId?: string;
  durationMs?: number;
  estimatedCostUsd?: number;
}): Promise<void> {
  const event: UsageEvent = {
    service: "elevenlabs",
    userId: input.userId,
    durationMs: input.durationMs,
    estimatedCostUsd: input.estimatedCostUsd,
    at: new Date().toISOString(),
  };
  if (dbEnabled) {
    await prisma.usageEvent.create({
      data: {
        service: "elevenlabs",
        userId: input.userId ?? null,
        durationMs: input.durationMs,
        estimatedCostUsd: input.estimatedCostUsd,
      },
    });
    return;
  }
  memoryStore.push(event);
}

export async function listUsage(): Promise<UsageEvent[]> {
  if (dbEnabled) {
    const rows = await prisma.usageEvent.findMany({
      orderBy: { at: "desc" },
      take: 500,
    });
    return rows.map((r) => ({
      service: r.service === "elevenlabs" ? "elevenlabs" : "llm",
      userId: r.userId ?? undefined,
      tokensIn: r.tokensIn ?? undefined,
      tokensOut: r.tokensOut ?? undefined,
      durationMs: r.durationMs ?? undefined,
      estimatedCostUsd: r.estimatedCostUsd ?? undefined,
      at: r.at.toISOString(),
    }));
  }
  return [...memoryStore];
}

export interface UsageTotals {
  llmRequests: number;
  voiceRequests: number;
  totalTokensIn: number;
  totalTokensOut: number;
  totalCostUsd: number;
  /** Same figures for the last 30 days. */
  last30d: { llmRequests: number; voiceRequests: number; totalCostUsd: number };
  /** Members with a request in the last five minutes. */
  liveUsers: number;
  /** Members active on at least two distinct days in the last 30. */
  recurringUsers: number;
}

/** Full-table figures for admin, not a window over the last 500 rows. */
export async function usageTotals(): Promise<UsageTotals> {
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const since5m = new Date(Date.now() - 5 * 60 * 1000);
  if (dbEnabled) {
    const [llm, voice, llm30, voice30, live, recurring] = await Promise.all([
      prisma.usageEvent.aggregate({ where: { service: "llm" }, _count: { _all: true }, _sum: { tokensIn: true, tokensOut: true, estimatedCostUsd: true } }),
      prisma.usageEvent.aggregate({ where: { service: "elevenlabs" }, _count: { _all: true }, _sum: { estimatedCostUsd: true } }),
      prisma.usageEvent.aggregate({ where: { service: "llm", at: { gte: since30 } }, _count: { _all: true }, _sum: { estimatedCostUsd: true } }),
      prisma.usageEvent.aggregate({ where: { service: "elevenlabs", at: { gte: since30 } }, _count: { _all: true }, _sum: { estimatedCostUsd: true } }),
      prisma.usageEvent.groupBy({ by: ["userId"], where: { at: { gte: since5m }, userId: { not: null } } }),
      prisma.$queryRaw<{ n: bigint | number }[]>`SELECT COUNT(*)::int AS n FROM (SELECT "userId" FROM "UsageEvent" WHERE "at" >= ${since30} AND "userId" IS NOT NULL GROUP BY "userId" HAVING COUNT(DISTINCT DATE("at")) >= 2) t`,
    ]);
    return {
      llmRequests: llm._count._all,
      voiceRequests: voice._count._all,
      totalTokensIn: llm._sum.tokensIn ?? 0,
      totalTokensOut: llm._sum.tokensOut ?? 0,
      totalCostUsd: Number(((llm._sum.estimatedCostUsd ?? 0) + (voice._sum.estimatedCostUsd ?? 0)).toFixed(4)),
      last30d: {
        llmRequests: llm30._count._all,
        voiceRequests: voice30._count._all,
        totalCostUsd: Number(((llm30._sum.estimatedCostUsd ?? 0) + (voice30._sum.estimatedCostUsd ?? 0)).toFixed(4)),
      },
      liveUsers: live.length,
      recurringUsers: Number(recurring[0]?.n ?? 0),
    };
  }
  const ev = memoryStore;
  const llm = ev.filter((e) => e.service === "llm");
  const voice = ev.filter((e) => e.service === "elevenlabs");
  const in30 = ev.filter((e) => new Date(e.at) >= since30);
  const days = new Map<string, Set<string>>();
  for (const e of in30) if (e.userId) days.set(e.userId, (days.get(e.userId) ?? new Set()).add(e.at.slice(0, 10)));
  return {
    llmRequests: llm.length,
    voiceRequests: voice.length,
    totalTokensIn: llm.reduce((s, e) => s + (e.tokensIn ?? 0), 0),
    totalTokensOut: llm.reduce((s, e) => s + (e.tokensOut ?? 0), 0),
    totalCostUsd: Number(ev.reduce((s, e) => s + (e.estimatedCostUsd ?? 0), 0).toFixed(4)),
    last30d: {
      llmRequests: in30.filter((e) => e.service === "llm").length,
      voiceRequests: in30.filter((e) => e.service === "elevenlabs").length,
      totalCostUsd: Number(in30.reduce((s, e) => s + (e.estimatedCostUsd ?? 0), 0).toFixed(4)),
    },
    liveUsers: new Set(ev.filter((e) => new Date(e.at) >= since5m && e.userId).map((e) => e.userId)).size,
    recurringUsers: Array.from(days.values()).filter((d) => d.size >= 2).length,
  };
}

export async function usageSummary() {
  const events = await listUsage();
  const claude = events.filter((e) => e.service === "llm");
  const voice = events.filter((e) => e.service === "elevenlabs");
  const totalCost = events.reduce((s, e) => s + (e.estimatedCostUsd ?? 0), 0);
  const totalTokensIn = claude.reduce((s, e) => s + (e.tokensIn ?? 0), 0);
  const totalTokensOut = claude.reduce((s, e) => s + (e.tokensOut ?? 0), 0);
  return {
    llmRequests: claude.length,
    voiceRequests: voice.length,
    totalTokensIn,
    totalTokensOut,
    totalCostUsd: Number(totalCost.toFixed(4)),
  };
}
