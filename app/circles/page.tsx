import Link from "next/link";
import { PageShell } from "@/components/seo/PageShell";
import { JsonLd, faqSchema, pageMetadata } from "@/lib/seo";
import { BRAND } from "@/lib/brand";
import { CIRCLE_MINUTES, CIRCLE_RULES, CIRCLE_SEATS, CIRCLE_THEMES, CIRCLES_OPEN_AT } from "@/lib/circle-themes";

export const metadata = pageMetadata({
  title: `Circles | Small anonymous groups hosted by Aura | ${BRAND.name}`,
  description: `Nightly ${CIRCLE_MINUTES}-minute text circles of up to ${CIRCLE_SEATS} people who carry the same thing. Anonymous animal names, Aura as host, a human on call. Your seat opens with a one-off $5 support pass.`,
  path: "/circles",
});

const FAQS = [
  { q: "Who will see my name?", a: "Nobody. You enter each circle as an anonymous animal, assigned fresh that night. Your name, email, and profile never appear in the room." },
  { q: "Does Aura talk the whole time?", a: "No. Aura opens, keeps time, invites people in, reflects a share back to the room, and stays quiet while members answer each other. Roughly a dozen short messages in a 45-minute circle." },
  { q: "What if someone shares something serious?", a: "Every message passes the same safety check as private chat before it reaches the room. Serious messages are held, the member is shown help privately, and a human moderator is paged. Nobody is left alone with it." },
  { q: "When do circles start?", a: `The night the ${CIRCLES_OPEN_AT}th member has had a session. Until then you can pick the themes you would join, and the first nights are planned from those picks.` },
  { q: "Is it free?", a: "Chat with Aura is free for everyone, always. A seat in a circle is not: hosting a room costs real money, so a seat opens once you have told us how Aura is going and supported the work with a one-off coffee, from $5. There is no subscription." },
];

const NIGHT = [
  ["7:00 pm", "An invitation card appears in your dashboard, and an email if you want one. Take a seat or not."],
  ["7:55 pm", "The room opens. You read the rules once and enter as an anonymous animal."],
  ["8:00", "Arrive. One line each: how you are coming in tonight."],
  ["8:08", "The question for the night, from the theme you chose."],
  ["8:13", "Sharing rounds. Aura invites, reflects once, and hands it to the room. You answer each other."],
  ["8:38", "Aura names what she heard across the room. No advice."],
  ["8:43", "One word each. A private after-care note from Aura lands in your chat."],
];

export default function CirclesPage() {
  return (
    <PageShell>
      <JsonLd data={faqSchema(FAQS)} />
      <section className="section">
        <div className="container" style={{ maxWidth: 880 }}>
          <p className="micro-label micro-label-bordered" style={{ marginBottom: 24 }}>Circles · opens at {CIRCLES_OPEN_AT} members</p>
          <h1 style={{ marginBottom: 24 }}>Small rooms for the same thing.</h1>
          <p className="body-large" style={{ color: "var(--calm-ink-70)", marginBottom: 32 }}>
            A circle is up to {CIRCLE_SEATS} people, one theme, {CIRCLE_MINUTES} minutes, text only, once a night. Everyone is
            an anonymous animal. Aura hosts. A human is on call. You talk to each other.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/auth/signup" className="btn-primary">Reserve a seat</Link>
            <Link href="/dashboard/circles" className="btn-ghost">Already a member? Pick your themes</Link>
          </div>
        </div>
      </section>

      <section style={{ background: "var(--calm-mist)", padding: "80px 24px" }}>
        <div className="container" style={{ maxWidth: 880 }}>
          <h2 style={{ marginBottom: 32 }}>One night, minute by minute</h2>
          <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 14 }}>
            {NIGHT.map(([t, body]) => (
              <li key={t} style={{ display: "grid", gridTemplateColumns: "88px 1fr", gap: 16, alignItems: "baseline" }}>
                <span className="body-micro" style={{ color: "var(--calm-forest)" }}>{t}</span>
                <span style={{ fontSize: 16, lineHeight: 1.7 }}>{body}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 880 }}>
          <h2 style={{ marginBottom: 16 }}>Themes for the first nights</h2>
          <p className="body-large" style={{ color: "var(--calm-ink-70)", marginBottom: 32 }}>
            Members pick the ones they would sit in. The themes that fill get scheduled; the ones that do not, rest.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 12 }}>
            {CIRCLE_THEMES.map((t) => (
              <div key={t.slug} className="card" style={{ padding: 20 }}>
                <h4 style={{ fontSize: 18, marginBottom: 6 }}>{t.title}</h4>
                <p style={{ fontSize: 14, color: "var(--calm-ink-40)" }}>{t.line}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: "var(--calm-ink)", color: "white", padding: "80px 24px" }}>
        <div className="container" style={{ maxWidth: 880 }}>
          <h2 style={{ color: "white", marginBottom: 24 }}>The rules, shown once</h2>
          <ul style={{ paddingLeft: 20, display: "grid", gap: 10, color: "rgba(255,255,255,0.85)", fontSize: 16, lineHeight: 1.7 }}>
            {CIRCLE_RULES.map((r) => <li key={r}>{r}</li>)}
          </ul>
        </div>
      </section>

      <section className="section">
        <div className="container" style={{ maxWidth: 880 }}>
          <h2 style={{ marginBottom: 32 }}>Questions people ask</h2>
          <div style={{ display: "grid", gap: 20 }}>
            {FAQS.map((f) => (
              <div key={f.q} className="card">
                <h4 style={{ marginBottom: 8 }}>{f.q}</h4>
                <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--calm-ink-70)" }}>{f.a}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 40, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/auth/signup" className="btn-primary">Reserve a seat</Link>
            <Link href="/free-ai-therapist" className="btn-ghost">Free AI therapist</Link>
            <Link href="/ai-therapist-in-your-language" className="btn-ghost">In your language</Link>
            <Link href="/features/crisis" className="btn-ghost">How safety works</Link>
            <Link href="/how-it-works" className="btn-ghost">How it all works</Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
