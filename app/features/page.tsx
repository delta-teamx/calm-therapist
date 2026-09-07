import Link from "next/link";
import { PageShell } from "@/components/seo/PageShell";
import { FEATURE_LIST } from "@/lib/features";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Features | Chat, Voice, Circles, Crisis Safety | Calm Therapist",
  description:
    "Everything Aura does: free chat that remembers you, voice when typing is too much, anonymous circles, a crisis-aware safety layer, and a weekly journal and monthly reflect built on one memory.",
  path: "/features",
});

export default function FeaturesIndex() {
  return (
    <PageShell>
      <section className="section">
        <div className="container" style={{ maxWidth: 880 }}>
          <p className="micro-label micro-label-bordered" style={{ marginBottom: 24 }}>
            Features
          </p>
          <h1 style={{ marginBottom: 24 }}>One memory. Every way in.</h1>
          <p className="body-large" style={{ color: "var(--calm-ink-70)", marginBottom: 40 }}>
            Chat is free for everyone. Voice and circles come with founding membership. Everything
            shares one memory, so what you said in voice is there in next week&apos;s journal.
          </p>
          <Link href="/circles" className="card" style={{ display: "block", textDecoration: "none", marginBottom: 16, background: "var(--calm-ink)", color: "white" }}>
            <h3 style={{ marginBottom: 8, color: "white" }}>Circles</h3>
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.8)" }}>Small anonymous rooms for the same thing, 45 minutes a night, hosted by Aura with a human on call. Opens at 50 members.</p>
            <p className="body-micro" style={{ color: "var(--calm-mist)", marginTop: 16 }}>How circles work →</p>
          </Link>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {FEATURE_LIST.map((m) => (
              <Link
                key={m.key}
                href={`/features/${m.slug}`}
                className="card"
                style={{ display: "block", textDecoration: "none", color: "inherit" }}
              >
                <h3 style={{ marginBottom: 8 }}>{m.label}</h3>
                <p style={{ fontSize: 16, color: "var(--calm-ink-70)" }}>{m.oneLiner}</p>
                <p className="body-micro" style={{ color: "var(--calm-forest)", marginTop: 16 }}>
                  Open feature →
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
