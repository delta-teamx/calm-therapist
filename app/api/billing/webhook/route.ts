import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe, stripeEnabled } from "@/lib/stripe";
import { dbEnabled, prisma } from "@/lib/prisma";
import { setUserPlan } from "@/lib/users";
import { applyTopup } from "@/lib/voice-quota";
import { scheduleEmail } from "@/lib/email-queue";

export const runtime = "nodejs";
// Stripe needs the raw body to verify the signature.
export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const TOPUP_AMOUNT_USD = 12;

export async function POST(req: Request) {
  if (!stripeEnabled) {
    return NextResponse.json({ ignored: true });
  }
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET missing" }, { status: 500 });
  }
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "missing signature" }, { status: 400 });

  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    return NextResponse.json({ error: `Webhook signature failed: ${(err as Error).message}` }, { status: 400 });
  }

  // Stripe retries deliveries; record the event id first so a retry is a no-op.
  if (dbEnabled) {
    try {
      await prisma.stripeEvent.create({ data: { id: event.id, type: event.type } });
    } catch (err) {
      if ((err as { code?: string }).code === "P2002") return NextResponse.json({ received: true, duplicate: true });
      throw err;
    }
  }
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await endSubscription(event.data.object as Stripe.Subscription);
        break;

      case "invoice.payment_failed":
        await markPastDue(event.data.object as Stripe.Invoice);
        break;

      default:
        // We don't care about most events; Stripe sends a lot.
        break;
    }
  } catch (err) {
    console.error("[stripe webhook] handler error", err);
    // Still return 200 — Stripe retries on non-2xx and we've logged.
    return NextResponse.json({ ok: false, error: (err as Error).message });
  }

  return NextResponse.json({ ok: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const kind = session.metadata?.kind;
  const userId = session.metadata?.userId;
  if (!userId) return;

  if (kind === "topup") {
    await applyTopup(userId);
    if (dbEnabled) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (user) {
        await scheduleEmail({
          userId,
          to: user.email,
          templateKey: "topup-receipt",
          ctx: {
            name: user.name,
            email: user.email,
            appUrl: APP_URL,
            topupAmountUsd: TOPUP_AMOUNT_USD,
          },
        });
      }
    }
    return;
  }

  if (kind === "subscription") {
    // Subscription rows arrive via customer.subscription.created/updated next.
    // Flip the user's plan straight away so the UX feels instant.
    await setUserPlan(userId, "pro");
  }
}

async function syncSubscription(sub: Stripe.Subscription) {
  if (!dbEnabled) {
    // Best we can do without a DB: flip the user's plan based on metadata.
    const userId = sub.metadata?.userId;
    if (userId) await setUserPlan(userId, sub.status === "active" ? "pro" : "free");
    return;
  }

  const userId = sub.metadata?.userId;
  if (!userId) {
    // Try to find by customer id.
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer.id },
    });
    if (!user) return;
    await upsertSubscription(user.id, sub);
    return;
  }
  await upsertSubscription(userId, sub);
}

async function upsertSubscription(userId: string, sub: Stripe.Subscription) {
  const cadence = sub.metadata?.cadence === "yearly" ? "yearly" : "monthly";
  const plan = sub.status === "active" || sub.status === "trialing" ? "pro" : "free";
  const periodEnd = sub.current_period_end ? new Date(sub.current_period_end * 1000) : null;
  const cancelled = sub.status === "canceled";
  const paused = sub.pause_collection != null;

  await prisma.subscription.upsert({
    where: { userId },
    create: {
      userId,
      tier: "pro",
      cadence,
      stripeSubscriptionId: sub.id,
      stripePriceId: sub.items.data[0]?.price.id ?? null,
      status: cancelled ? "cancelled" : paused ? "paused" : sub.status,
      currentPeriodEnd: periodEnd,
      pausedAt: paused ? new Date() : null,
      cancelledAt: cancelled ? new Date() : null,
    },
    update: {
      tier: "pro",
      cadence,
      stripeSubscriptionId: sub.id,
      stripePriceId: sub.items.data[0]?.price.id ?? null,
      status: cancelled ? "cancelled" : paused ? "paused" : sub.status,
      currentPeriodEnd: periodEnd,
      pausedAt: paused ? new Date() : null,
      cancelledAt: cancelled ? new Date() : null,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { plan },
  });
}

async function endSubscription(sub: Stripe.Subscription) {
  if (!dbEnabled) {
    const userId = sub.metadata?.userId;
    if (userId) await setUserPlan(userId, "free");
    return;
  }
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
  const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } });
  if (!user) return;
  await prisma.subscription.update({
    where: { userId: user.id },
    data: {
      status: "cancelled",
      cancelledAt: new Date(),
    },
  });
  await prisma.user.update({ where: { id: user.id }, data: { plan: "free" } });
}

async function markPastDue(invoice: Stripe.Invoice) {
  if (!dbEnabled) return;
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;
  const user = await prisma.user.findFirst({ where: { stripeCustomerId: customerId } });
  if (!user) return;
  await prisma.subscription.update({
    where: { userId: user.id },
    data: { status: "past_due" },
  });
}
