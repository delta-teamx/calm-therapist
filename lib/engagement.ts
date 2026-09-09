import { dbEnabled, prisma } from "./prisma";
import { listAllUsers, type UserRecord } from "./users";
import { sessionsBetween } from "./sessions";
import { scheduleEmail } from "./email-queue";

/**
 * The weekly engagement sweep.
 *
 * The email queue sends one-shot rows, so a recurring email needs something
 * to re-arm it. This is that: the cron calls it, and it queues a weekly
 * look-back for the members who should get one this week. Running it twice in
 * a day is harmless — the seven-day check below means the second run queues
 * nothing.
 *
 * The rules are deliberately conservative, because the evidence on this is
 * one-directional: volume of unsolicited mail predicts uninstalls, tailored
 * nudges buy only a few percent of next-day engagement, and that effect
 * decays. So:
 *
 * - One a week, maximum, and only this one recurring email.
 * - Only to members who have actually used the product in the last month. We
 *   do not chase people who never started; the inactive-3d/7d/30d sequence
 *   already covers going quiet, and after that we let them be.
 * - Never to someone who opted out, and never to an unverified address.
 * - Nothing personal in the body. The look-back lives behind the login.
 */

/** How far back a member must have been seen for the weekly mail to make sense. */
const ACTIVE_WINDOW_DAYS = 30;
/** Never send two within this many days, whatever else happens. */
const MIN_GAP_DAYS = 6;

export interface SweepResult {
  considered: number;
  queued: number;
  skipped: { optedOut: number; unverified: number; inactive: number; recentlySent: number };
}

async function sentWeeklyWithin(userId: string, days: number): Promise<boolean> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  if (dbEnabled) {
    const n = await prisma.emailQueueRow.count({
      where: {
        userId,
        templateKey: "weekly-reflection",
        status: { in: ["pending", "sending", "sent"] },
        createdAt: { gte: since },
      },
    });
    return n > 0;
  }
  // In-memory mode has no durable queue history worth sweeping; treat every
  // member as recently mailed so a demo never spams itself in a loop.
  return true;
}

function eligible(user: UserRecord): "ok" | "optedOut" | "unverified" {
  if (user.emailOptOut) return "optedOut";
  if (!user.emailVerified) return "unverified";
  return "ok";
}

export async function scheduleWeeklyReflections(appUrl: string): Promise<SweepResult> {
  const users = await listAllUsers();
  const result: SweepResult = {
    considered: users.length,
    queued: 0,
    skipped: { optedOut: 0, unverified: 0, inactive: 0, recentlySent: 0 },
  };

  const now = new Date();
  const activeFrom = new Date(now.getTime() - ACTIVE_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const weekFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  for (const user of users) {
    const state = eligible(user);
    if (state !== "ok") {
      result.skipped[state] += 1;
      continue;
    }

    if (await sentWeeklyWithin(user.id, MIN_GAP_DAYS)) {
      result.skipped.recentlySent += 1;
      continue;
    }

    const recent = await sessionsBetween(user.id, activeFrom, now);
    if (recent.length === 0) {
      result.skipped.inactive += 1;
      continue;
    }

    const weekSessions = recent.filter((s) => new Date(s.startedAt) >= weekFrom).length;

    await scheduleEmail({
      userId: user.id,
      to: user.email,
      templateKey: "weekly-reflection",
      ctx: { name: user.name, email: user.email, appUrl, weekSessions },
    });
    result.queued += 1;
  }

  return result;
}
