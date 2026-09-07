import Link from "next/link";
import { PageShell } from "@/components/seo/PageShell";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "About Calm Therapist | Backed by Implenix",
  description:
    "Calm Therapist is the AI therapy platform from Implenix. We exist to close the 12 documented failures in AI mental health products — for everyone.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <PageShell>
      <article style={{ padding: "120px 24px 80px" }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <p className="micro-label micro-label-bordered" style={{ marginBottom: 24 }}>
            About
          </p>
          <h1 style={{ marginBottom: 32 }}>This is not another wellness app.</h1>

          <Para>
            Calm Therapist is built by Implenix because the AI therapy market is failing the people
            who need it most. We mapped the 12 most common failure modes — memory loss, fake
            empathy, dangerous crisis responses, cultural blindness, the absence of a human
            handoff, the stigma men face when stepping into therapy spaces, and more — and built
            Calm Therapist to solve each of them.
          </Para>

          <Para>
            We are not chasing the next mental health buzzword. We are not building a habit-loop
            engagement engine. We are trying to make a tool that, when a person is having a hard
            moment at 3am, actually helps. The bar is whether someone vulnerable feels safer
            after using it. That is the only metric we care about.
          </Para>

          <h2 style={{ marginTop: 48, marginBottom: 16 }}>About Implenix</h2>
          <Para>
            <a href="https://implenix.net" target="_blank" rel="noopener noreferrer">
              Implenix.net
            </a>{" "}
            is the parent organisation that backs Calm Therapist. Implenix builds technology
            products with long horizons. Our incentive structure is alignment with user wellbeing.
            We are not optimising for venture-scale growth at the expense of the people the
            product serves.
          </Para>

          <h2 style={{ marginTop: 48, marginBottom: 16 }}>What we believe</h2>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 16 }}>
            <Belief>The thing that makes therapy work is memory.</Belief>
            <Belief>Empathy is not a script. It is specificity.</Belief>
            <Belief>Support should speak your language: Urdu, Hindi, Arabic, Spanish, French, and the mix between.</Belief>
            <Belief>Men should not have to learn therapy vocabulary to get help.</Belief>
            <Belief>A safe AI is one that knows the limits of its own competence.</Belief>
            <Belief>Your data is yours. Always.</Belief>
          </ul>

          <div style={{ marginTop: 64 }}>
            <Link href="/auth/signup" className="btn-primary">Start with Calm Therapist</Link>
          </div>
        </div>
      </article>
    </PageShell>
  );
}

function Para({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 17, lineHeight: 1.85, marginBottom: 24, color: "var(--calm-ink)" }}>
      {children}
    </p>
  );
}

function Belief({ children }: { children: React.ReactNode }) {
  return (
    <li style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
      <span
        style={{ width: 6, height: 6, borderRadius: 999, background: "var(--calm-forest)", marginTop: 11, flexShrink: 0 }}
      />
      <span style={{ fontSize: 17, lineHeight: 1.85 }}>{children}</span>
    </li>
  );
}
