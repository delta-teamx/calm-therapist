import Link from "next/link";
import { PageShell } from "@/components/seo/PageShell";
import { JsonLd, howToSchema, pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "How It Works | A Free AI Therapist That Remembers You",
  description:
    "How Calm Therapist works: 5-minute onboarding, voice or chat sessions, memory across every conversation, weekly journaling, and monthly reflections.",
  path: "/how-it-works",
});

const STEPS = [
  {
    title: "1. Tell Calm Therapist who you are",
    body:
      "Five questions. Less than five minutes. Calm Therapist learns your name, the things on your mind, the tone you want to be spoken to in, and what you'd like to be true a month from now. This is the foundation it builds everything on.",
  },
  {
    title: "2. Choose your way in",
    body:
      "Voice when typing is impossible. Chat when you'd rather write. The journal for the long view. Crisis Safe when things get serious. You can switch any time — Calm Therapist's memory is shared across every feature.",
  },
  {
    title: "3. Build a longitudinal record",
    body:
      "Every session feeds the next. Calm Therapist remembers what you said in week one when it talks to you in week eight. Memory isn't a feature — it's the architecture.",
  },
  {
    title: "4. Reflect monthly",
    body:
      "Once a month, Calm Therapist surfaces your themes, your shifts, and your own quotes back to you. Not a dashboard — a piece of writing about you, in your own words.",
  },
];

export default function HowItWorksPage() {
  return (
    <PageShell>
      <JsonLd data={howToSchema()} />
      <section className="section">
        <div className="container" style={{ maxWidth: 880 }}>
          <p className="micro-label micro-label-bordered" style={{ marginBottom: 24 }}>
            How it works
          </p>
          <h1 style={{ marginBottom: 24 }}>Designed around how your mind actually works.</h1>
          <p className="body-large" style={{ color: "var(--calm-ink-40)", marginBottom: 56 }}>
            Calm Therapist is not a chatbot. It&apos;s a longitudinal companion that remembers,
            reflects, and adapts to you. Here&apos;s the full arc.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {STEPS.map((s) => (
              <div key={s.title} className="card-mist">
                <h3 style={{ marginBottom: 12 }}>{s.title}</h3>
                <p style={{ fontSize: 16, lineHeight: 1.8 }}>{s.body}</p>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 56, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/auth/signup" className="btn-primary">
              Start your first session
            </Link>
            <Link href="/features" className="btn-ghost">
              Explore features
            </Link>
          </div>
        </div>
      </section>

      <section style={{ background: "var(--calm-mist)", padding: "80px 24px" }}>
        <div className="container" style={{ maxWidth: 880 }}>
          <h2 style={{ marginBottom: 32 }}>Common questions</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { q: "Is Calm Therapist a replacement for a human therapist?", a: "No. It is a companion alongside human care, not a substitute for it. If you have a clinician, tell them what you and Aura have been working on; many people bring their patterns to sessions." },
              { q: "Does it train on my data?", a: "No. We do not train on your conversations. You can read the full architecture on the privacy page." },
              { q: "What languages does it support?", a: "English, Urdu, Hindi, Arabic, Spanish, and French, including Roman Urdu and Hinglish. Aura switches when you do, mid-sentence." },
              { q: "Will I lose my data if I take a break?", a: "No. Calm Therapist holds your record indefinitely until you ask us to delete it. There is no streak system to lose." },
            ].map((f) => (
              <details key={f.q} className="card" style={{ padding: 24 }}>
                <summary style={{ fontSize: 16, fontWeight: 500 }}>{f.q}</summary>
                <p style={{ marginTop: 12, fontSize: 15, lineHeight: 1.8, color: "var(--calm-ink-40)" }}>
                  {f.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
