import { dbEnabled, prisma } from "./prisma";

export type FeedbackStatus = "new" | "reviewed" | "responded";
export type FeedbackCategory = "positive" | "neutral" | "needs-attention";

export interface FeedbackRecord {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number;
  comment: string;
  publicConsent: boolean;
  category: FeedbackCategory;
  status: FeedbackStatus;
  createdAt: string;
  adminResponse?: string;
  respondedAt?: string;
  sessionId?: string;
}

const globalAny = globalThis as unknown as { __calmFeedback?: FeedbackRecord[] };
const memoryStore: FeedbackRecord[] = globalAny.__calmFeedback ?? [];
globalAny.__calmFeedback = memoryStore;

function categorize(rating: number): FeedbackCategory {
  if (rating >= 4) return "positive";
  if (rating < 3) return "needs-attention";
  return "neutral";
}

export async function captureFeedback(input: {
  userId: string;
  userName: string;
  userEmail: string;
  rating: number;
  comment: string;
  publicConsent: boolean;
  sessionId?: string;
}): Promise<FeedbackRecord> {
  const rating = Math.max(1, Math.min(5, Math.round(input.rating)));
  const category = categorize(rating);

  if (dbEnabled) {
    const row = await prisma.feedback.create({
      data: {
        userId: input.userId,
        userName: input.userName,
        userEmail: input.userEmail,
        rating,
        comment: input.comment.trim(),
        publicConsent: input.publicConsent,
        category,
        status: "new",
        sessionId: input.sessionId ?? null,
      },
    });
    return rowToRecord(row);
  }

  const record: FeedbackRecord = {
    id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    userId: input.userId,
    userName: input.userName,
    userEmail: input.userEmail,
    rating,
    comment: input.comment.trim(),
    publicConsent: input.publicConsent,
    category,
    status: "new",
    createdAt: new Date().toISOString(),
    sessionId: input.sessionId,
  };
  memoryStore.push(record);
  return record;
}

/** True when the member already left feedback in the last seven days. */
export async function recentlyGaveFeedback(userId: string): Promise<boolean> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  if (dbEnabled) {
    const n = await prisma.feedback.count({ where: { userId, createdAt: { gte: since } } });
    return n > 0;
  }
  return memoryStore.some((f) => f.userId === userId && new Date(f.createdAt) >= since);
}

export async function listFeedback(filter?: {
  category?: FeedbackCategory;
  status?: FeedbackStatus;
}): Promise<FeedbackRecord[]> {
  if (dbEnabled) {
    const rows = await prisma.feedback.findMany({
      where: {
        ...(filter?.category ? { category: filter.category } : {}),
        ...(filter?.status ? { status: filter.status } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
    return rows.map(rowToRecord);
  }
  return [...memoryStore]
    .filter((r) => !filter?.category || r.category === filter.category)
    .filter((r) => !filter?.status || r.status === filter.status)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function publicHighlights(limit = 6): Promise<FeedbackRecord[]> {
  if (dbEnabled) {
    const rows = await prisma.feedback.findMany({
      where: { category: "positive", publicConsent: true, comment: { not: "" } },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return rows.map(rowToRecord);
  }
  return memoryStore
    .filter((r) => r.category === "positive" && r.publicConsent && r.comment.length > 0)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, limit);
}

export async function setFeedbackStatus(
  id: string,
  status: FeedbackStatus,
  adminResponse?: string
): Promise<FeedbackRecord | null> {
  if (dbEnabled) {
    try {
      const row = await prisma.feedback.update({
        where: { id },
        data: {
          status,
          adminResponse: adminResponse ?? undefined,
          respondedAt: status === "responded" ? new Date() : undefined,
        },
      });
      return rowToRecord(row);
    } catch {
      return null;
    }
  }
  const idx = memoryStore.findIndex((r) => r.id === id);
  if (idx === -1) return null;
  const cur = memoryStore[idx];
  const next: FeedbackRecord = {
    ...cur,
    status,
    adminResponse: adminResponse ?? cur.adminResponse,
    respondedAt: status === "responded" ? new Date().toISOString() : cur.respondedAt,
  };
  memoryStore[idx] = next;
  return next;
}

export async function feedbackStats() {
  if (dbEnabled) {
    const [total, positive, needs, avgAgg] = await Promise.all([
      prisma.feedback.count(),
      prisma.feedback.count({ where: { category: "positive" } }),
      prisma.feedback.count({ where: { category: "needs-attention" } }),
      prisma.feedback.aggregate({ _avg: { rating: true } }),
    ]);
    return {
      total,
      positive,
      needsAttention: needs,
      average: Number((avgAgg._avg.rating ?? 0).toFixed(2)),
    };
  }
  const total = memoryStore.length;
  const positive = memoryStore.filter((r) => r.category === "positive").length;
  const needs = memoryStore.filter((r) => r.category === "needs-attention").length;
  const avg = total === 0 ? 0 : memoryStore.reduce((s, r) => s + r.rating, 0) / total;
  return { total, positive, needsAttention: needs, average: Number(avg.toFixed(2)) };
}

interface PrismaFeedbackRow {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number;
  comment: string;
  publicConsent: boolean;
  category: string;
  status: string;
  adminResponse: string | null;
  respondedAt: Date | null;
  createdAt: Date;
  sessionId: string | null;
}

function rowToRecord(row: PrismaFeedbackRow): FeedbackRecord {
  return {
    id: row.id,
    userId: row.userId,
    userName: row.userName,
    userEmail: row.userEmail,
    rating: row.rating,
    comment: row.comment,
    publicConsent: row.publicConsent,
    category: (row.category as FeedbackCategory) ?? "neutral",
    status: (row.status as FeedbackStatus) ?? "new",
    adminResponse: row.adminResponse ?? undefined,
    respondedAt: row.respondedAt?.toISOString(),
    sessionId: row.sessionId ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}
