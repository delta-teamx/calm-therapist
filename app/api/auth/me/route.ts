import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";
import { getUserById } from "@/lib/users";
import { accessForUser, describeAccess } from "@/lib/access";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const claims = await verifySession(cookies().get(SESSION_COOKIE)?.value);
  if (!claims) return NextResponse.json({ user: null }, { status: 200 });
  const user = await getUserById(claims.sub);
  if (!user) return NextResponse.json({ user: null }, { status: 200 });
  const access = await accessForUser(user);
  return NextResponse.json({
    user: {
      email: user.email,
      name: user.name,
      plan: user.plan,
      memberNumber: user.memberNumber ?? null,
      emailOptOut: user.emailOptOut,
      createdAt: user.createdAt,
      access,
      accessLine: describeAccess(access),
    },
  });
}
