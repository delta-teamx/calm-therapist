import { NextResponse } from "next/server";
import { memberCount } from "@/lib/users";
import { FOUNDING_MEMBER_CAP } from "@/lib/access";
import { MIN_SUPPORT_USD } from "@/lib/support";
import { CIRCLES_OPEN_AT } from "@/lib/circle-themes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public numbers the landing page shows: the badge count and the circles gate. */
export async function GET() {
  let members = 0;
  try {
    members = await memberCount();
  } catch {}
  return NextResponse.json(
    {
      members,
      cap: FOUNDING_MEMBER_CAP,
      seatsLeft: Math.max(0, FOUNDING_MEMBER_CAP - members),
      minSupportUsd: MIN_SUPPORT_USD,
      circlesOpenAt: CIRCLES_OPEN_AT,
    },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } }
  );
}
