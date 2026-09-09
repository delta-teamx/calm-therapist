import { activePass, type Pass } from "./support";

/**
 * What a member can use, decided on the server from their record.
 *
 * The rules:
 * - Chat with Aura is free for everyone, forever. No message cap beyond the
 *   anti-abuse rate limit, no timer, no upgrade wall inside a conversation.
 * - Voice and circles cost real money to run. They open when a member has an
 *   active support pass (see lib/support.ts): they gave honest private
 *   feedback, then supported the creator.
 * - A member number is still assigned in order of signup. It is a badge and
 *   nothing else; it grants no access.
 *
 * Nothing on the client decides access. Routes call accessForUser().
 */

/** Everyone can chat this many times a day. High enough that no real person meets it. */
export const FREE_CHAT_MESSAGES_PER_DAY = Number(process.env.FREE_CHAT_MESSAGES_PER_DAY ?? 120);
/** Aura's weekly journal read and monthly reflection are LLM calls; these are their fair-use caps. */
export const FREE_JOURNAL_READS_PER_WEEK = Number(process.env.FREE_JOURNAL_READS_PER_WEEK ?? 3);
/** Kept for the badge on the profile and the admin count. Grants nothing. */
export const FOUNDING_MEMBER_CAP = Number(process.env.FOUNDING_MEMBER_CAP ?? 150);

export type AccessTier = "member" | "supporter" | "admin";

export interface Access {
  tier: AccessTier;
  chat: true;
  voice: boolean;
  circles: boolean;
  voiceMinutesPerMonth: number;
  chatMessagesPerDay: number;
  /** ISO date the support pass runs out, when there is one. */
  supportUntil?: string;
  supportTier?: string;
  memberNumber?: number;
  /** Inside the first FOUNDING_MEMBER_CAP signups. A badge, not a permission. */
  isFoundingMember: boolean;
}

export interface AccessInput {
  memberNumber?: number | null;
  createdAt: string | Date;
  isAdmin?: boolean;
}

/** Pure: given a member and their pass, what is open. */
export function accessFor(user: AccessInput, pass: Pass | null, now: Date = new Date()): Access {
  const memberNumber = user.memberNumber ?? undefined;
  const isFoundingMember = memberNumber != null && memberNumber <= FOUNDING_MEMBER_CAP;
  const live = pass && new Date(pass.expiresAt) > now ? pass : null;

  if (user.isAdmin) {
    return {
      tier: "admin",
      chat: true,
      voice: true,
      circles: true,
      voiceMinutesPerMonth: 120,
      chatMessagesPerDay: FREE_CHAT_MESSAGES_PER_DAY,
      supportUntil: live?.expiresAt,
      supportTier: live?.tierKey,
      memberNumber,
      isFoundingMember,
    };
  }

  if (live) {
    return {
      tier: "supporter",
      chat: true,
      // Minutes are owned, not rented: the balance in VoiceQuota is what is
      // actually spendable, and the quota check enforces it.
      voice: true,
      circles: live.circles,
      voiceMinutesPerMonth: 0,
      chatMessagesPerDay: FREE_CHAT_MESSAGES_PER_DAY,
      supportUntil: live.expiresAt,
      supportTier: live.tierKey,
      memberNumber,
      isFoundingMember,
    };
  }

  return {
    tier: "member",
    chat: true,
    voice: false,
    circles: false,
    voiceMinutesPerMonth: 0,
    chatMessagesPerDay: FREE_CHAT_MESSAGES_PER_DAY,
    memberNumber,
    isFoundingMember,
  };
}

/** Loads the member's pass and resolves their access. */
export async function accessForUser(user: AccessInput & { id: string }, now: Date = new Date()): Promise<Access> {
  const pass = await activePass(user.id);
  return accessFor(user, pass, now);
}

/** Short human line for the dashboard. */
export function describeAccess(a: Access): string {
  if (a.tier === "admin") return "Admin account. Everything is open.";
  if (a.tier === "supporter" && a.supportUntil) {
    const when = new Date(a.supportUntil).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    return `Thank you. Voice and circles are open until ${when}.`;
  }
  return "Chat with Aura is free, always. Voice and circles open when you support the creator.";
}
