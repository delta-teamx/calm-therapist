import { BRAND } from "@/lib/brand";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createUser, setVerifyToken } from "@/lib/users";
import { buildSessionCookie, cookieDomainFor, isAdminEmail, signSession } from "@/lib/auth";
import { scheduleEmail } from "@/lib/email-queue";
import { sendEmail } from "@/lib/email";
import { getTemplate } from "@/lib/email-templates";

export const runtime = "nodejs";

const APP_URL = BRAND.url;

export async function POST(req: Request) {
  let body: { email?: string; password?: string; name?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const email = (body.email ?? "").trim();
  const password = body.password ?? "";
  const name = (body.name ?? "").trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password needs at least 8 characters." }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ error: "Tell us what to call you." }, { status: 400 });
  }

  try {
    let source: { landing?: string; referrer?: string } | undefined;
    try {
      const raw = cookies().get("calm_src")?.value;
      if (raw) {
        const p = JSON.parse(raw) as { l?: string; r?: string; u?: string };
        source = { landing: [p.l, p.u].filter(Boolean).join(" ?") || undefined, referrer: p.r || undefined };
      }
    } catch {}
    const user = await createUser({ email, password, name, source });
    const token = await signSession({
      sub: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      isAdmin: user.isAdmin || isAdminEmail(user.email),
    });

    // Send verify email immediately (synchronous — user expects it now).
    try {
      const token = await setVerifyToken(user.id);
      const actionUrl = `${APP_URL}/auth/verify?token=${encodeURIComponent(token)}`;
      const built = getTemplate("verify-email").build({
        name: user.name,
        email: user.email,
        appUrl: APP_URL,
        actionUrl,
      });
      await sendEmail({ to: user.email, subject: built.subject, html: built.html, text: built.text });
    } catch (err) {
      // Don't fail signup if email is temporarily down — they can re-request.
      console.warn("verify email send failed", (err as Error).message);
    }

    // Schedule the welcome sequence. The same scheduler runs on session ends
    // and inactivity ticks elsewhere — here we set the first three touches.
    const ctx = { name: user.name, email: user.email, appUrl: APP_URL };
    await scheduleEmail({ userId: user.id, to: user.email, templateKey: "welcome", ctx });
    await scheduleEmail({ userId: user.id, to: user.email, templateKey: "day-2", ctx });
    await scheduleEmail({ userId: user.id, to: user.email, templateKey: "day-7", ctx });

    const host = req.headers.get("host");
    const cookie = buildSessionCookie(token, {
      domain: cookieDomainFor(host),
      secure: process.env.NODE_ENV === "production",
    });

    return new NextResponse(
      JSON.stringify({ user: { email: user.email, name: user.name, plan: user.plan } }),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": cookie,
        },
      }
    );
  } catch (err) {
    if ((err as Error).message === "EMAIL_TAKEN") {
      return NextResponse.json(
        { error: "An account with that email already exists." },
        { status: 409 }
      );
    }
    console.error("signup error", err);
    return NextResponse.json({ error: "Could not create account." }, { status: 500 });
  }
}
