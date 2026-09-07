import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/auth";

const DASHBOARD_SUBDOMAIN = process.env.DASHBOARD_SUBDOMAIN ?? "relax";
const SOURCE_COOKIE = "calm_src";

// Paths that bypass the relax-subdomain rewrite (they live at the original path).
const REWRITE_PASSTHROUGH = [
  "/api",
  "/_next",
  "/dashboard",
  "/onboarding",
  "/auth",
  "/admin",
  "/static",
  "/favicon",
  "/robots",
  "/sitemap",
];

// Paths under /dashboard that don't require auth (none for now, but keep the hook).
const PUBLIC_DASHBOARD_PATHS: string[] = [];

export async function middleware(req: NextRequest) {
  const host = req.headers.get("host") ?? "";
  const hostname = host.split(":")[0];
  const isDashboardHost = hostname.startsWith(`${DASHBOARD_SUBDOMAIN}.`);

  const url = req.nextUrl.clone();
  let pathname = url.pathname;

  // 1) Rewrite for the relax.* subdomain → /dashboard/*
  if (isDashboardHost && !REWRITE_PASSTHROUGH.some((p) => pathname.startsWith(p))) {
    url.pathname = pathname === "/" ? "/dashboard" : `/dashboard${pathname}`;
    pathname = url.pathname;
  }

  // 2) Auth gate for anything under /dashboard or /admin.
  const needsAuth = pathname.startsWith("/dashboard") || pathname.startsWith("/admin");
  if (needsAuth && !PUBLIC_DASHBOARD_PATHS.some((p) => pathname.startsWith(p))) {
    const token = req.cookies.get(SESSION_COOKIE)?.value;
    const claims = await verifySession(token);
    if (!claims) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.pathname = "/auth/login";
      const intended = isDashboardHost
        ? req.nextUrl.pathname === "/"
          ? "/dashboard"
          : `/dashboard${req.nextUrl.pathname}`
        : req.nextUrl.pathname;
      loginUrl.searchParams.set("next", intended);
      if (isDashboardHost) {
        const mainHost = hostname.replace(`${DASHBOARD_SUBDOMAIN}.`, "");
        if (mainHost) {
          const port = host.includes(":") ? host.split(":")[1] : "";
          loginUrl.host = port ? `${mainHost}:${port}` : mainHost;
        }
      }
      return NextResponse.redirect(loginUrl);
    }
    // Admin gate — only the configured admin can see /admin.
    if (pathname.startsWith("/admin") && !claims.isAdmin) {
      const denied = req.nextUrl.clone();
      denied.pathname = "/dashboard";
      return NextResponse.redirect(denied);
    }
  }

  // First-touch source for signup attribution: landing path, referrer, and
  // utm tags, kept in a small cookie until the visitor signs up.
  const res = url.pathname !== req.nextUrl.pathname ? NextResponse.rewrite(url) : NextResponse.next();
  const isPage = req.method === "GET" && !pathname.startsWith("/api") && !pathname.startsWith("/_next") && !pathname.includes(".");
  if (isPage && !req.cookies.get(SOURCE_COOKIE)) {
    const ref = req.headers.get("referer") ?? "";
    const sameSite = ref && (() => { try { return new URL(ref).host === host; } catch { return false; } })();
    const utm = ["utm_source", "utm_medium", "utm_campaign"].map((k) => req.nextUrl.searchParams.get(k)).filter(Boolean).join("/");
    const value = JSON.stringify({ l: pathname.slice(0, 120), r: sameSite ? "" : ref.slice(0, 200), u: utm.slice(0, 120) });
    res.cookies.set(SOURCE_COOKIE, value, { path: "/", maxAge: 60 * 60 * 24 * 30, sameSite: "lax", httpOnly: true });
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
