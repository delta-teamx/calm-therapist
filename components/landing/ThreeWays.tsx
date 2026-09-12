import Link from "next/link";
import { Style } from "@/components/ui/Style";
import { BRAND } from "@/lib/brand";
import { CIRCLES_OPEN_AT } from "@/lib/circle-themes";

const WAYS = [
  {
    eyebrow: "Chat · free forever",
    title: "Write to Aura",
    body: "Type at your own pace, any hour. Aura remembers what you said last week, notices the loop you are in, and asks one question at a time. No session cap, no card, ever.",
    href: "/features/chat",
    cta: "How chat works",
  },
  {
    eyebrow: "Voice · opens from $5",
    title: "Talk to Aura",
    body: "When typing is too much. Shorter turns, slower pace, the same memory. Minutes land on your account when you support the work, and they are yours to keep.",
    href: "/features/voice",
    cta: "How voice works",
  },
  {
    eyebrow: `Circles · opens at ${CIRCLES_OPEN_AT} members`,
    title: "Sit with others",
    body: "Small anonymous rooms of people carrying the same thing, 45 minutes a night, hosted by Aura with a human on call. You talk to each other.",
    href: "/circles",
    cta: "How circles work",
  },
];

/** The product in three cards. Server-rendered so the copy is in the HTML for search. */
export function ThreeWays() {
  return (
    <section style={{ background: "var(--calm-white)", padding: "112px 24px" }}>
      <div className="container">
        <span className="micro-label" style={{ color: "var(--calm-forest)" }}>Three ways in</span>
        <h2 style={{ marginTop: 16, marginBottom: 16 }}>One companion. Three rooms.</h2>
        <p className="body-large" style={{ color: "var(--calm-ink-70)", maxWidth: 640, marginBottom: 48 }}>
          {BRAND.name} is one memory across everything. What you write in chat, Aura carries into voice.
          What you hear in a circle, she remembers privately for you.
        </p>
        <div className="ways-grid">
          {WAYS.map((w) => (
            <article key={w.title} className="ways-card">
              <p className="body-micro" style={{ color: "var(--calm-forest)", marginBottom: 12 }}>{w.eyebrow}</p>
              <h3 style={{ fontSize: 28, marginBottom: 12 }}>{w.title}</h3>
              <p style={{ fontSize: 15, lineHeight: 1.75, color: "var(--calm-ink-70)", flex: 1 }}>{w.body}</p>
              <Link href={w.href} style={{ marginTop: 20, fontSize: 14, color: "var(--calm-forest)", fontWeight: 500 }}>
                {w.cta} →
              </Link>
            </article>
          ))}
        </div>
      </div>
      <Style>{`
        .ways-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .ways-card { display: flex; flex-direction: column; background: var(--calm-mist); border: 1px solid var(--calm-ink-10); border-radius: 16px; padding: 32px 28px; min-height: 280px; }
        @media (max-width: 860px) { .ways-grid { grid-template-columns: 1fr; } }
      `}</Style>
    </section>
  );
}
