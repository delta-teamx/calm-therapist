import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";
import { getUserById } from "@/lib/users";
import { accessForUser } from "@/lib/access";
import { circleStats, listInterest, setInterest } from "@/lib/circles";
import { anonymousAnimal } from "@/lib/circle-themes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function currentUser() {
  const claims = await verifySession(cookies().get(SESSION_COOKIE)?.value);
  if (!claims) return null;
  return getUserById(claims.sub);
}

export async function GET() {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const [themes, stats] = await Promise.all([listInterest(user.id), circleStats()]);
  return NextResponse.json({
    themes,
    stats,
    access: await accessForUser(user),
    animal: anonymousAnimal(user.id),
  });
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  let body: { themes?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  const themes = Array.isArray(body.themes) ? body.themes.filter((t): t is string => typeof t === "string") : [];
  const saved = await setInterest(user.id, themes);
  const stats = await circleStats();
  return NextResponse.json({ themes: saved, stats });
}
