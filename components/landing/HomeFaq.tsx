import Link from "next/link";
import { JsonLd, faqSchema } from "@/lib/seo";
import { BRAND } from "@/lib/brand";
import { CIRCLES_OPEN_AT } from "@/lib/circle-themes";

const MIN_SUPPORT = process.env.NEXT_PUBLIC_MIN_SUPPORT_USD ?? "5";

export const HOME_FAQS = [
  {
    q: "Is this really a free AI therapist?",
    a: `Yes. Chat with Aura is free for everyone, with no session cap, no trial and no card. Voice and circles are the two parts that cost real money to run, so they open once you tell us how Aura is going and support the work, from $${MIN_SUPPORT}. Ko-fi shows monthly support by default; you can switch to a single payment, or cancel a monthly one at any time from your Ko-fi account. Chat never becomes paid either way.`,
  },
  {
    q: "Is an AI therapist a replacement for a real therapist?",
    a: "No. Aura is support: a place to think out loud, be heard, and see your own patterns, available at 2am. She does not diagnose or prescribe, and she tells you plainly when a licensed professional is the right next step. Many people use both.",
  },
  {
    q: "What makes Aura different from ChatGPT?",
    a: "Memory, rules, and safety. Aura remembers you across sessions, keeps replies short, pushes back on distorted thinking instead of agreeing, reads your cultural profile, and runs every message through a crisis-aware safety layer with the right hotline for your country.",
  },
  {
    q: "What are circles?",
    a: `Small anonymous text rooms of up to eight people carrying the same thing, 45 minutes a night, hosted by Aura with a human on call. You join as an anonymous animal and talk to each other. They open when ${CIRCLES_OPEN_AT} members have joined.`,
  },
  {
    q: "How do I unlock voice and circles?",
    a: `Two things, both inside your dashboard. First, tell us honestly how Aura has been — any rating, high or low, kept private unless you choose to be quoted. Then buy the work a coffee on Ko-fi, from $${MIN_SUPPORT}, whatever it is worth to you. Ko-fi defaults to monthly support — keep it if you want minutes topped up each month, or switch it to a single payment. Voice minutes land on your account and are yours to keep; they do not reset, and cancelling never takes back minutes you already have.`,
  },
  {
    q: "Which languages does Aura speak?",
    a: "English, Urdu, Hindi, Arabic, Spanish, and French, including Roman Urdu and Hinglish. Switch mid-sentence and Aura follows.",
  },
  {
    q: "What happens to what I say?",
    a: `Your conversations are stored for you, in your account, and used only to help Aura remember you. ${BRAND.name} never sells your data and never trains a model on it. You can delete everything from Settings in one click.`,
  },
  {
    q: "What if I am in crisis?",
    a: "Aura slows down, stays with you, and shows the crisis line for your country. If you are in immediate danger, contact your local emergency number first. Aura is not an emergency service.",
  },
];

/** Homepage FAQ with FAQPage schema so the answers can appear in search. */
export function HomeFaq() {
  return (
    <section style={{ background: "var(--calm-white)", padding: "112px 24px" }}>
      <JsonLd data={faqSchema(HOME_FAQS)} />
      <div className="container" style={{ maxWidth: 860 }}>
        <span className="micro-label" style={{ color: "var(--calm-forest)" }}>Questions</span>
        <h2 style={{ marginTop: 16, marginBottom: 40 }}>Before you decide.</h2>
        <div style={{ display: "grid", gap: 12 }}>
          {HOME_FAQS.map((f) => (
            <details key={f.q} className="card" style={{ padding: "20px 24px" }}>
              <summary style={{ cursor: "pointer", fontFamily: "var(--font-heading)", fontSize: 21, listStyle: "none" }}>{f.q}</summary>
              <p style={{ marginTop: 12, fontSize: 15, lineHeight: 1.75, color: "var(--calm-ink-70)" }}>{f.a}</p>
            </details>
          ))}
        </div>
        <p style={{ marginTop: 32, fontSize: 15, color: "var(--calm-ink-70)" }}>
          More in <Link href="/what-is-an-ai-therapist" style={{ color: "var(--calm-forest)" }}>What is an AI therapist?</Link>,{" "}
          <Link href="/is-ai-therapy-effective" style={{ color: "var(--calm-forest)" }}>Is AI therapy effective?</Link> and{" "}
          <Link href="/ai-therapist-vs-chatgpt" style={{ color: "var(--calm-forest)" }}>AI therapist vs ChatGPT</Link>.
        </p>
      </div>
    </section>
  );
}
