import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { dbEnabled, prisma } from "./prisma";

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  plan: "free" | "pro";
  isAdmin: boolean;
  /** 1-based order of signup. Drives founding access (see lib/access.ts). */
  memberNumber?: number;
  /** First-touch attribution captured at signup. */
  signupLanding?: string;
  signupReferrer?: string;
  createdAt: string;
  emailVerified?: string;
  emailOptOut: boolean;
  unsubscribeToken?: string;
  crisisTier: number;
  crisisTierAt?: string;
  /** Hashed single-use tokens. Never the raw token. */
  verifyTokenHash?: string;
  verifyTokenExpires?: string;
  resetTokenHash?: string;
  resetTokenExpires?: string;
}

/* ------------------------------------------------------------------ */
/* In-memory fallback (used only when DATABASE_URL is missing).        */
/* ------------------------------------------------------------------ */

const globalAny = globalThis as unknown as {
  __calmUsers?: Map<string, UserRecord>;
  __calmUsersSeeded?: boolean;
  __calmMemberCounter?: number;
};
const memoryStore: Map<string, UserRecord> = globalAny.__calmUsers ?? new Map();
globalAny.__calmUsers = memoryStore;

function key(email: string) {
  return email.trim().toLowerCase();
}

function newId() {
  return `usr_${Date.now()}_${randomBytes(4).toString("hex")}`;
}

function nextMemoryMemberNumber(): number {
  globalAny.__calmMemberCounter = (globalAny.__calmMemberCounter ?? 0) + 1;
  return globalAny.__calmMemberCounter;
}

function updateMemory(id: string, patch: Partial<UserRecord>): UserRecord | null {
  for (const [k, u] of memoryStore.entries()) {
    if (u.id === id) {
      const next = { ...u, ...patch };
      memoryStore.set(k, next);
      return next;
    }
  }
  return null;
}

/* ------------------------------------------------------------------ */
/* Tokens                                                              */
/* ------------------------------------------------------------------ */

function randomToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// A precomputed hash so unknown emails cost the same as wrong passwords.
const DUMMY_HASH = bcrypt.hashSync(randomBytes(16).toString("hex"), 10);

/* ------------------------------------------------------------------ */
/* Admin seeding                                                       */
/* ------------------------------------------------------------------ */

/**
 * Seeds the admin account only when BOTH ADMIN_EMAIL and ADMIN_INITIAL_PASSWORD
 * are set. There is no default account and no default password. The seeded
 * flag is only set on success so a cold-start DB hiccup retries next time.
 */
async function seedAdmin() {
  if (globalAny.__calmUsersSeeded) return;

  const adminEmail = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = process.env.ADMIN_INITIAL_PASSWORD ?? "";
  if (!adminEmail || !password) return;
  if (password.length < 12) {
    console.warn("[users] ADMIN_INITIAL_PASSWORD is shorter than 12 characters; admin not seeded.");
    return;
  }

  if (dbEnabled) {
    try {
      const existing = await prisma.user.findUnique({ where: { email: adminEmail } });
      if (!existing) {
        const passwordHash = await bcrypt.hash(password, 10);
        await prisma.user.create({
          data: { email: adminEmail, name: "Admin", passwordHash, plan: "pro", isAdmin: true, memberNumber: null },
        });
      } else if (!existing.isAdmin) {
        await prisma.user.update({ where: { id: existing.id }, data: { isAdmin: true } });
      }
      globalAny.__calmUsersSeeded = true;
    } catch (err) {
      console.warn("[users] admin seed deferred (DB not reachable yet):", (err as Error).message);
    }
    return;
  }

  if (!memoryStore.has(adminEmail)) {
    const passwordHash = await bcrypt.hash(password, 10);
    memoryStore.set(adminEmail, {
      id: `usr_admin_seed`,
      email: adminEmail,
      name: "Admin",
      passwordHash,
      plan: "pro",
      isAdmin: true,
      createdAt: new Date().toISOString(),
      emailOptOut: false,
      crisisTier: 0,
    });
  }
  globalAny.__calmUsersSeeded = true;
}
void seedAdmin();

/* ------------------------------------------------------------------ */
/* Create / read                                                       */
/* ------------------------------------------------------------------ */

async function createDbUser(data: { email: string; name: string; passwordHash: string; signupLanding?: string; signupReferrer?: string }): Promise<UserRecord> {
  // Member number = count + 1. The unique constraint catches a concurrent
  // signup; retry once with a fresh count.
  for (let attempt = 0; attempt < 3; attempt++) {
    const count = await prisma.user.count({ where: { memberNumber: { not: null } } });
    try {
      const created = await prisma.user.create({
        data: { ...data, plan: "free", memberNumber: count + 1 },
      });
      return rowToRecord(created);
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code !== "P2002" || attempt === 2) throw err;
    }
  }
  throw new Error("MEMBER_NUMBER_RACE");
}

export interface SignupSource {
  landing?: string;
  referrer?: string;
}

export async function createUser(input: { email: string; password: string; name: string; source?: SignupSource }): Promise<UserRecord> {
  if (input.password.length < 8) throw new Error("PASSWORD_TOO_SHORT");
  const k = key(input.email);
  const passwordHash = await bcrypt.hash(input.password, 10);
  const trimmedName = input.name.trim().slice(0, 60) || k.split("@")[0];

  if (dbEnabled) {
    const existing = await prisma.user.findUnique({ where: { email: k } });
    if (existing) throw new Error("EMAIL_TAKEN");
    return createDbUser({ email: k, name: trimmedName, passwordHash, signupLanding: input.source?.landing, signupReferrer: input.source?.referrer });
  }

  if (memoryStore.has(k)) throw new Error("EMAIL_TAKEN");
  const record: UserRecord = {
    id: newId(),
    email: k,
    name: trimmedName,
    passwordHash,
    plan: "free",
    isAdmin: false,
    memberNumber: nextMemoryMemberNumber(),
    createdAt: new Date().toISOString(),
    emailOptOut: false,
    crisisTier: 0,
  };
  memoryStore.set(k, record);
  return record;
}

export async function verifyCredentials(email: string, password: string): Promise<UserRecord | null> {
  const k = key(email);
  let record: UserRecord | null = null;
  if (dbEnabled) {
    const row = await prisma.user.findUnique({ where: { email: k } });
    record = row ? rowToRecord(row) : null;
  } else {
    record = memoryStore.get(k) ?? null;
  }
  // Always run one bcrypt compare so timing does not reveal whether the
  // email exists.
  const ok = await bcrypt.compare(password, record?.passwordHash ?? DUMMY_HASH);
  return record && ok ? record : null;
}

export async function getUserById(id: string): Promise<UserRecord | null> {
  if (dbEnabled) {
    const row = await prisma.user.findUnique({ where: { id } });
    return row ? rowToRecord(row) : null;
  }
  for (const u of memoryStore.values()) if (u.id === id) return u;
  return null;
}

export async function getUserByEmail(email: string): Promise<UserRecord | null> {
  const k = key(email);
  if (dbEnabled) {
    const row = await prisma.user.findUnique({ where: { email: k } });
    return row ? rowToRecord(row) : null;
  }
  return memoryStore.get(k) ?? null;
}

export async function setUserPlan(id: string, plan: "free" | "pro"): Promise<UserRecord | null> {
  if (dbEnabled) {
    const row = await prisma.user.update({ where: { id }, data: { plan } });
    return rowToRecord(row);
  }
  return updateMemory(id, { plan });
}

export async function findOrCreateOAuthUser(input: { email: string; name: string }): Promise<UserRecord> {
  const k = key(input.email);
  const name = input.name.trim().slice(0, 60) || k.split("@")[0];
  if (dbEnabled) {
    const row = await prisma.user.findUnique({ where: { email: k } });
    if (row) return rowToRecord(row);
    const passwordHash = await bcrypt.hash(`oauth:${randomBytes(16).toString("hex")}`, 10);
    return createDbUser({ email: k, name, passwordHash });
  }
  let user = memoryStore.get(k);
  if (!user) {
    const passwordHash = await bcrypt.hash(`oauth:${randomBytes(16).toString("hex")}`, 10);
    user = {
      id: newId(),
      email: k,
      name,
      passwordHash,
      plan: "free",
      isAdmin: false,
      memberNumber: nextMemoryMemberNumber(),
      createdAt: new Date().toISOString(),
      emailOptOut: false,
      crisisTier: 0,
    };
    memoryStore.set(k, user);
  }
  return user;
}

export async function listAllUsers(): Promise<UserRecord[]> {
  if (dbEnabled) {
    const rows = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
    return rows.map(rowToRecord);
  }
  return Array.from(memoryStore.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

/** Number of members who have been assigned a member number. */
export async function memberCount(): Promise<number> {
  if (dbEnabled) return prisma.user.count({ where: { memberNumber: { not: null } } });
  return Array.from(memoryStore.values()).filter((u) => u.memberNumber != null).length;
}

/* ------------------------------------------------------------------ */
/* Safety state                                                        */
/* ------------------------------------------------------------------ */

export async function setCrisisTier(userId: string, tier: number): Promise<void> {
  const at = new Date();
  if (dbEnabled) {
    await prisma.user.update({ where: { id: userId }, data: { crisisTier: tier, crisisTierAt: at } });
    return;
  }
  updateMemory(userId, { crisisTier: tier, crisisTierAt: at.toISOString() });
}

/* ------------------------------------------------------------------ */
/* Email preferences                                                   */
/* ------------------------------------------------------------------ */

export async function ensureUnsubscribeToken(userId: string): Promise<string | null> {
  const user = await getUserById(userId);
  if (!user) return null;
  if (user.unsubscribeToken) return user.unsubscribeToken;
  const token = randomToken();
  if (dbEnabled) {
    await prisma.user.update({ where: { id: userId }, data: { unsubscribeToken: token } });
  } else {
    updateMemory(userId, { unsubscribeToken: token });
  }
  return token;
}

export async function setEmailOptOutByToken(token: string): Promise<UserRecord | null> {
  if (dbEnabled) {
    const row = await prisma.user.findUnique({ where: { unsubscribeToken: token } });
    if (!row) return null;
    const updated = await prisma.user.update({ where: { id: row.id }, data: { emailOptOut: true } });
    return rowToRecord(updated);
  }
  for (const u of memoryStore.values()) {
    if (u.unsubscribeToken === token) return updateMemory(u.id, { emailOptOut: true });
  }
  return null;
}

export async function setEmailOptOut(userId: string, optOut: boolean): Promise<void> {
  if (dbEnabled) {
    await prisma.user.update({ where: { id: userId }, data: { emailOptOut: optOut } });
    return;
  }
  updateMemory(userId, { emailOptOut: optOut });
}

/* ------------------------------------------------------------------ */
/* Row mapping                                                         */
/* ------------------------------------------------------------------ */

interface PrismaUserRow {
  id: string;
  signupLanding?: string | null;
  signupReferrer?: string | null;
  email: string;
  name: string;
  passwordHash: string;
  plan: string;
  isAdmin: boolean;
  memberNumber: number | null;
  createdAt: Date;
  emailVerified?: Date | null;
  emailOptOut: boolean;
  unsubscribeToken?: string | null;
  crisisTier: number;
  crisisTierAt?: Date | null;
  verifyToken?: string | null;
  verifyTokenExpires?: Date | null;
  resetToken?: string | null;
  resetTokenExpires?: Date | null;
}

function rowToRecord(row: PrismaUserRow): UserRecord {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    passwordHash: row.passwordHash,
    plan: row.plan === "pro" ? "pro" : "free",
    isAdmin: row.isAdmin,
    memberNumber: row.memberNumber ?? undefined,
    signupLanding: row.signupLanding ?? undefined,
    signupReferrer: row.signupReferrer ?? undefined,
    createdAt: row.createdAt.toISOString(),
    emailVerified: row.emailVerified?.toISOString(),
    emailOptOut: row.emailOptOut,
    unsubscribeToken: row.unsubscribeToken ?? undefined,
    crisisTier: row.crisisTier,
    crisisTierAt: row.crisisTierAt?.toISOString(),
    verifyTokenHash: row.verifyToken ?? undefined,
    verifyTokenExpires: row.verifyTokenExpires?.toISOString(),
    resetTokenHash: row.resetToken ?? undefined,
    resetTokenExpires: row.resetTokenExpires?.toISOString(),
  };
}

/* ------------------------------------------------------------------ */
/* Verification and password reset (hashed, single-use, expiring)     */
/* ------------------------------------------------------------------ */

export async function setVerifyToken(userId: string): Promise<string> {
  const token = randomToken();
  const hash = hashToken(token);
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24); // 24h
  if (dbEnabled) {
    await prisma.user.update({
      where: { id: userId },
      data: { verifyToken: hash, verifyTokenExpires: expires },
    });
    return token;
  }
  const ok = updateMemory(userId, { verifyTokenHash: hash, verifyTokenExpires: expires.toISOString() });
  if (!ok) throw new Error("USER_NOT_FOUND");
  return token;
}

export async function consumeVerifyToken(token: string): Promise<UserRecord | null> {
  const now = new Date();
  const hash = hashToken(token);
  if (dbEnabled) {
    const row = await prisma.user.findUnique({ where: { verifyToken: hash } });
    if (!row || !row.verifyTokenExpires || row.verifyTokenExpires < now) return null;
    const updated = await prisma.user.update({
      where: { id: row.id },
      data: { emailVerified: now, verifyToken: null, verifyTokenExpires: null },
    });
    return rowToRecord(updated);
  }
  for (const u of memoryStore.values()) {
    if (u.verifyTokenHash !== hash) continue;
    if (!u.verifyTokenExpires || new Date(u.verifyTokenExpires) < now) return null;
    return updateMemory(u.id, {
      emailVerified: now.toISOString(),
      verifyTokenHash: undefined,
      verifyTokenExpires: undefined,
    });
  }
  return null;
}

export async function setResetToken(email: string): Promise<{ user: UserRecord; token: string } | null> {
  const k = key(email);
  const token = randomToken();
  const hash = hashToken(token);
  const expires = new Date(Date.now() + 1000 * 60 * 60); // 1h
  if (dbEnabled) {
    const row = await prisma.user.findUnique({ where: { email: k } });
    if (!row) return null;
    const updated = await prisma.user.update({
      where: { id: row.id },
      data: { resetToken: hash, resetTokenExpires: expires },
    });
    return { user: rowToRecord(updated), token };
  }
  const user = memoryStore.get(k);
  if (!user) return null;
  const next = updateMemory(user.id, { resetTokenHash: hash, resetTokenExpires: expires.toISOString() })!;
  return { user: next, token };
}

export async function consumeResetToken(token: string, newPassword: string): Promise<UserRecord | null> {
  if (newPassword.length < 8) throw new Error("PASSWORD_TOO_SHORT");
  const now = new Date();
  const hash = hashToken(token);
  // Validate the token before paying for a bcrypt hash.
  if (dbEnabled) {
    const row = await prisma.user.findUnique({ where: { resetToken: hash } });
    if (!row || !row.resetTokenExpires || row.resetTokenExpires < now) return null;
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const updated = await prisma.user.update({
      where: { id: row.id },
      data: { passwordHash, resetToken: null, resetTokenExpires: null },
    });
    return rowToRecord(updated);
  }
  for (const u of memoryStore.values()) {
    if (u.resetTokenHash !== hash) continue;
    if (!u.resetTokenExpires || new Date(u.resetTokenExpires) < now) return null;
    const passwordHash = await bcrypt.hash(newPassword, 10);
    return updateMemory(u.id, { passwordHash, resetTokenHash: undefined, resetTokenExpires: undefined });
  }
  return null;
}
