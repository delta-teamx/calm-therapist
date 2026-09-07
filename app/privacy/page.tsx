import Link from "next/link";
import { PageShell } from "@/components/seo/PageShell";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Privacy | What We Do With Your Data | Calm Therapist",
  description:
    "Calm Therapist's full privacy architecture. No training on your data. Stored for you, in your account. One-click delete. Backed by Implenix.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <PageShell>
      <article style={{ padding: "120px 24px 80px" }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <p className="micro-label micro-label-bordered" style={{ marginBottom: 24 }}>
            Privacy
          </p>
          <h1 style={{ marginBottom: 32 }}>Your data belongs to you. Always.</h1>
          <p className="body-large" style={{ color: "var(--calm-ink-40)", marginBottom: 56 }}>
            What follows is the entire privacy architecture of Calm Therapist, in plain English.
            No legal smoke. No buried terms.
          </p>

          <Section title="What we never do">
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 16 }}>
              <Bullet>We do not train AI models on your conversations.</Bullet>
              <Bullet>We do not sell your data, ever.</Bullet>
              <Bullet>We do not share your data with advertisers.</Bullet>
              <Bullet>We do not surveil you between sessions.</Bullet>
              <Bullet>We do not share your data with employers, insurers, or family members.</Bullet>
            </ul>
          </Section>

          <Section title="What we do">
            <p>
              We store your sessions in encrypted form, scoped to your account, with strict access
              control. We use OpenAI&apos;s API to generate responses. OpenAI does not train on data
              sent through its API. We use ElevenLabs for voice mode. Voice
              transcripts are routed through their conversational AI agent and stored in your
              account.
            </p>
            <p>
              You can delete everything in one click from Settings. When you delete, the data is
              gone — not soft-deleted, not archived. Gone. A download of your record is on the way;
              until it ships we will not claim it here.
            </p>
          </Section>

          <Section title="Where data lives">
            <p>
              Sessions live in our PostgreSQL database, encrypted at rest. Region selection is
              respected — EU users have data in EU regions; users in other regions can request the
              same. We are pursuing certifications consistent with HIPAA and GDPR data principles
              and intend to publish our subprocessor list quarterly.
            </p>
          </Section>

          <Section title="The crisis exception">
            <p>
              The single exception: if the system detects language indicating immediate self-harm or
              danger, we may surface verified crisis resources for your region and, if you have
              opted in, contact your designated crisis contact. We do not contact authorities. We
              do not break encryption. The exception is human-readable, not a back door.
            </p>
          </Section>

          <Section title="Backed by Implenix">
            <p>
              Calm Therapist is backed by{" "}
              <a href="https://implenix.net" target="_blank" rel="noopener noreferrer">
                Implenix.net
              </a>
              . Implenix is not a venture-funded growth machine. The incentive structure here is
              alignment with user wellbeing, not engagement metrics.
            </p>
          </Section>

          <div id="terms" style={{ marginTop: 64 }}>
            <h2>Terms of use, in short</h2>
            <p style={{ marginTop: 16 }}>
              Calm Therapist is not a replacement for clinical care. If you are in immediate
              danger, call your local emergency number. By using Calm Therapist you agree not to
              attempt to misuse it for harm to yourself or others. We reserve the right to
              terminate accounts engaged in clear abuse. That&apos;s it.
            </p>
          </div>

          <div style={{ marginTop: 64 }}>
            <Link href="/auth/signup" className="btn-primary">
              Start your first session
            </Link>
          </div>
        </div>
      </article>
    </PageShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 48 }}>
      <h2 style={{ marginBottom: 16 }}>{title}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, fontSize: 17, lineHeight: 1.85 }}>
        {children}
      </div>
    </section>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 999,
          background: "var(--calm-forest)",
          marginTop: 11,
          flexShrink: 0,
        }}
      />
      <span style={{ fontSize: 17, lineHeight: 1.85 }}>{children}</span>
    </li>
  );
}
