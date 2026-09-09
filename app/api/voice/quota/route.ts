import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";
import { getUserById } from "@/lib/users";
import { accessForUser } from "@/lib/access";
import { getVoiceQuotaSnapshot } from "@/lib/voice-quota";

export const runtime = "nodejs";

export async function GET() {
  const claims = await verifySession(cookies().get(SESSION_COOKIE)?.value);
  if (!claims) return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  const user = await getUserById(claims.sub);
  if (!user) return NextResponse.json({ error: "Account not found" }, { status: 404 });
  const access = await accessForUser(user);
  const snap = await getVoiceQuotaSnapshot(user.id, access);
  return NextResponse.json({ plan: user.plan, access, ...snap });
}
