import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function uid(): Promise<string | null> {
  const claims = await verifySession(cookies().get(SESSION_COOKIE)?.value);
  return claims?.sub ?? null;
}
import { deleteGoal, listGoals, toggleToday } from "@/lib/goals";

/** Tick or untick today. */
export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  const userId = await uid();
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const goal = await toggleToday(userId, params.id);
  if (!goal) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({ goal, goals: await listGoals(userId) });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const userId = await uid();
  if (!userId) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const ok = await deleteGoal(userId, params.id);
  return NextResponse.json({ ok, goals: await listGoals(userId) });
}
