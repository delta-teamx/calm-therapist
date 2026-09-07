import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";
import { currentSession } from "@/lib/sessions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The open chat session to continue, with its transcript, or null. */
export async function GET(req: Request) {
  const claims = await verifySession(cookies().get(SESSION_COOKIE)?.value);
  if (!claims) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const mode = new URL(req.url).searchParams.get("mode") === "voice" ? "voice" : "chat";
  const session = await currentSession(claims.sub, mode);
  return NextResponse.json({ session });
}
