import { Style } from "@/components/ui/Style";
import Link from "next/link";

const MIN_SUPPORT = process.env.NEXT_PUBLIC_MIN_SUPPORT_USD ?? "3";

/**
 * What things cost, said plainly.
 *
 * Chat with Aura is free for everyone with no card and no trial. Voice and
 * circles run on metered providers, so they open on a one-off support pass
 * from $3, which puts minutes on the account that are then owned outright.
 * There is no subscription and nothing renews on its own.
 */
export function Pricing() {
  return (
    <section id="pricing" style={{ background: "var(--calm-white)", padding: "120px 24px" }}>
      <div className="container">
        <div style={{ textAlign: "center", maxWidth: 720, margin: "0 auto 48px" }}>
          <span className="micro-label" style={{ color: "var(--calm-forest)" }}>What it costs</span>
          <h2 style={{ marginTop: 16, marginBottom: 16 }}>Chat is free. Always.</h2>
          <p className="body-large" style={{ color: "var(--calm-ink-70)" }}>
            No card, no trial, no timer. Voice and circles cost us real money every minute they
            run, so they open when you tell us how it is going and buy the work a coffee —
            from ${MIN_SUPPORT}, once, not a subscription.
          </p>
        </div>

        <div
          className="pricing-grid"
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, maxWidth: 880, margin: "0 auto" }}
        >
          <Card
            title="Everyone"
            headline="Free"
            badge="No card"
            features={[
              "Chat with Aura, as much as you need",
              "Aura remembers you between conversations",
              "Journal, moods, and goals",
              "Your record, kept and yours to export",
              "Crisis-aware from message one",
            ]}
            cta="Start talking"
            href="/auth/signup"
            primary
          />
          <Card
            title="When you want voice or circles"
            headline={`From $${MIN_SUPPORT}`}
            features={[
              "Tell us honestly how Aura is going — any rating, kept private",
              "Buy the work a coffee on Ko-fi, whatever it is worth to you",
              "Voice minutes land on your account and are yours to keep",
              "A seat in the nightly circles",
              "One payment. Nothing renews on its own.",
            ]}
            cta="Start free, unlock later"
            href="/auth/signup"
            primary={false}
          />
        </div>

        <p style={{ marginTop: 32, textAlign: "center", fontSize: 13, color: "var(--calm-ink-40)", maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>
          Your feedback is never required to be public or positive — an honest low rating opens
          voice just the same. Calm Therapist is a place to think out loud with support. It is not a substitute for care
          from a licensed professional, and it will always tell you when that is the right next step.
        </p>
      </div>

      <Style>{`
        @media (max-width: 760px) { .pricing-grid { grid-template-columns: 1fr !important; } }
      `}</Style>
    </section>
  );
}

function Card({
  title, headline, badge, features, cta, href, primary,
}: {
  title: string;
  headline: string;
  badge?: string;
  features: string[];
  cta: string;
  href: string;
  primary: boolean;
}) {
  return (
    <div
      style={{
        position: "relative",
        background: primary ? "var(--calm-forest)" : "var(--calm-white)",
        color: primary ? "white" : "var(--calm-ink)",
        border: primary ? "1px solid var(--calm-forest)" : "1px solid var(--calm-ink-10)",
        borderRadius: 20,
        padding: 36,
        display: "flex",
        flexDirection: "column",
        gap: 20,
      }}
    >
      {badge && (
        <span
          style={{
            position: "absolute",
            top: -12,
            left: 28,
            padding: "4px 12px",
            borderRadius: 999,
            background: "var(--calm-ink)",
            color: "white",
            fontSize: 11,
            fontWeight: 500,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {badge}
        </span>
      )}
      <div>
        <p className="body-micro" style={{ opacity: 0.85 }}>{title}</p>
        <p style={{ fontFamily: "var(--font-heading)", fontSize: 34, fontWeight: 500, marginTop: 8, lineHeight: 1.15 }}>
          {headline}
        </p>
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        {features.map((f) => (
          <li key={f} style={{ fontSize: 15, display: "flex", alignItems: "flex-start", gap: 10 }}>
            <span
              aria-hidden
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: primary ? "rgba(255,255,255,0.85)" : "var(--calm-forest)",
                marginTop: 9,
                flexShrink: 0,
              }}
            />
            {f}
          </li>
        ))}
      </ul>
      <Link href={href} className={primary ? "btn-light" : "btn-primary"} style={{ marginTop: "auto", textAlign: "center" }}>
        {cta}
      </Link>
    </div>
  );
}
