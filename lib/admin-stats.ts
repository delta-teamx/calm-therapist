import { listLeads } from "@/lib/leads";
import { feedbackStats, listFeedback } from "@/lib/feedback";
import { usageTotals, type UsageTotals } from "@/lib/usage";
import { listAllUsers, type UserRecord } from "@/lib/users";
import { FOUNDING_MEMBER_CAP } from "@/lib/access";
import { CIRCLES_OPEN_AT } from "@/lib/circle-themes";

export interface AdminStats {
  signups: { total: number; last7d: number; last30d: number };
  leads: { total: number; last7d: number };
  conversion: { leadsToSignups: number; verified: number };
  founding: { seatsTaken: number; cap: number; circlesOpenAt: number };
  api: UsageTotals;
  feedback: { total: number; positive: number; needsAttention: number; average: number };
  liveUsers: number;
  recurringUsers: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Members only: the admin account is not a signup. */
export async function computeAdminStats(): Promise<AdminStats> {
  const [allUsers, leads, api, fb] = await Promise.all([listAllUsers(), listLeads(), usageTotals(), feedbackStats()]);
  const users = allUsers.filter((u) => !u.isAdmin);

  const now = Date.now();
  const since7 = now - 7 * DAY_MS;
  const since30 = now - 30 * DAY_MS;

  const signupsTotal = users.length;
  const signups7 = users.filter((u) => Date.parse(u.createdAt) >= since7).length;
  const signups30 = users.filter((u) => Date.parse(u.createdAt) >= since30).length;
  const verified = users.filter((u) => !!u.emailVerified).length;

  const leadsTotal = leads.length;
  const leads7 = leads.filter((l) => Date.parse(l.capturedAt) >= since7).length;
  const leadsToSignups = leadsTotal === 0 ? 0 : Math.min(1, signupsTotal / leadsTotal);

  return {
    signups: { total: signupsTotal, last7d: signups7, last30d: signups30 },
    leads: { total: leadsTotal, last7d: leads7 },
    conversion: {
      leadsToSignups: Number((leadsToSignups * 100).toFixed(1)),
      verified: signupsTotal === 0 ? 0 : Number(((verified / signupsTotal) * 100).toFixed(1)),
    },
    founding: {
      seatsTaken: users.filter((u) => u.memberNumber != null && u.memberNumber <= FOUNDING_MEMBER_CAP).length,
      cap: FOUNDING_MEMBER_CAP,
      circlesOpenAt: CIRCLES_OPEN_AT,
    },
    api,
    feedback: fb,
    liveUsers: api.liveUsers,
    recurringUsers: api.recurringUsers,
  };
}

export async function listUsersForAdmin(): Promise<UserRecord[]> {
  return listAllUsers();
}

export async function recentFeedback() {
  return listFeedback();
}

export async function recentLeads() {
  const list = await listLeads();
  return list.sort((a, b) => (a.capturedAt < b.capturedAt ? 1 : -1));
}
