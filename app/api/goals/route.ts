import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function uid(): Promise<string | null> {
  const claims = await verifySession(cookies().get(SESSION_COOKIE)?.value);
  return claims?.sub ?? null;
}
import { createGoal, listGoals, MAX_GOALS } from "@/lib/goals";

export async function GET() {
  const userId = await uid();
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  return NextResponse.json({ goals: await listGoals(userId), max: MAX_GOALS });
}

export async function POST(req: Request) {
  const userId = await uid();
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  let body: { title?: unknown; description?: unknown; frequency?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  if (typeof body.title !== "string" || !body.title.trim()) return NextResponse.json({ error: "Give the goal a name." }, { status: 400 });
  const goal = await createGoal(userId, {
    title: body.title,
    description: typeof body.description === "string" ? body.description : undefined,
    frequency: typeof body.frequency === "string" ? body.frequency : undefined,
  });
  if (!goal) return NextResponse.json({ error: `Five goals at a time is plenty.` }, { status: 400 });
  return NextResponse.json({ goal, goals: await listGoals(userId) });
}
