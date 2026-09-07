import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";
import { deleteMemory, listMemories } from "@/lib/profiles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The member can remove anything Aura remembers. */
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const claims = await verifySession(cookies().get(SESSION_COOKIE)?.value);
  if (!claims) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  await deleteMemory(claims.sub, params.id);
  return NextResponse.json({ ok: true, memories: await listMemories(claims.sub, 50) });
}
