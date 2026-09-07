"use client";

import Link from "next/link";
import { Style } from "@/components/ui/Style";
import { CIRCLE_MINUTES, CIRCLE_SEATS, CIRCLE_THEMES, CIRCLES_OPEN_AT } from "@/lib/circle-themes";

const STEPS = [
  {
    title: "An invitation, not a feed",
    body: `Each evening Aura plans a few circles from what members are carrying. If one fits you, a card appears in your dashboard and an email arrives. Take a seat or ignore it.`,
  },
  {
    title: "An anonymous animal",
    body: "You enter as Anonymous Heron or Anonymous Lizard, fresh each night. No name, no photo, no profile. People, not accounts.",
  },
  {
    title: `${CIRCLE_MINUTES} minutes, up to ${CIRCLE_SEATS} people`,
    body: "Arrive, one line each. A question for the night. Sharing rounds where you answer each other. Aura hosts, keeps time, and stays quiet while you find each other.",
  },
  {
    title: "Held, not moderated by a bot alone",
    body: "Every message passes the same safety check as your private chat. A human is on call for every circle. No private messages, ever.",
  },
];

export function CirclesSection() {
  return (
    <section id="circles" style={{ background: "var(--calm-ink)", color: "white", padding: "120px 24px" }}>
      <div className="container">
        <div className="circles-head">
          <div>
            <span className="micro-label" style={{ color: "var(--calm-mist)" }}>Circles · opens at {CIRCLES_OPEN_AT} members</span>
            <h2 style={{ color: "white", marginTop: 16, marginBottom: 16 }}>Not alone with it.</h2>
            <p className="body-large" style={{ color: "rgba(255,255,255,0.78)", maxWidth: 560 }}>
              An AI therapist is a private room. A circle is a small, anonymous one, with people carrying the
              same thing: the same guilt, the same family, the same 2am. Aura hosts. You talk to each other.
            </p>
          </div>
          <div className="circles-themes" aria-label="Circle themes">
            {CIRCLE_THEMES.slice(0, 8).map((t) => (
              <span key={t.slug} className="circles-chip">{t.title}</span>
            ))}
          </div>
        </div>

        <div className="circles-grid">
          {STEPS.map((s, i) => (
            <div
              key={s.title}
              className="circles-card"
            >
              <span className="circles-num">{String(i + 1).padStart(2, "0")}</span>
              <h4 style={{ color: "white", marginBottom: 8 }}>{s.title}</h4>
              <p style={{ fontSize: 15, lineHeight: 1.7, color: "rgba(255,255,255,0.72)" }}>{s.body}</p>
            </div>
          ))}
        </div>

        <div className="circles-cta">
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.78)", maxWidth: 520 }}>
            Circles open the night the {CIRCLES_OPEN_AT}th member has had a session. Join now, pick the themes you would
            sit in, and the first nights are planned around you.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link href="/auth/signup" className="btn-light">Reserve a seat</Link>
            <Link href="/circles" className="btn-ghost-light">How circles work</Link>
          </div>
        </div>
      </div>
      <Style>{`
        .circles-head { display: grid; grid-template-columns: 1.2fr 1fr; gap: 48px; align-items: center; margin-bottom: 56px; }
        .circles-themes { display: flex; flex-wrap: wrap; gap: 10px; }
        .circles-chip { padding: 10px 16px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.22); font-size: 14px; color: rgba(255,255,255,0.88); }
        .circles-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 48px; }
        .circles-card { position: relative; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); border-radius: 16px; padding: 28px 24px 24px; }
        .circles-num { display: block; font-family: var(--font-heading); font-size: 28px; color: var(--calm-mist); margin-bottom: 14px; }
        .circles-cta { display: flex; justify-content: space-between; align-items: center; gap: 24px; flex-wrap: wrap; border-top: 1px solid rgba(255,255,255,0.12); padding-top: 32px; }
        .btn-ghost-light { display: inline-flex; align-items: center; justify-content: center; height: 48px; padding: 0 22px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.35); color: white; font-size: 14px; font-weight: 500; }
        .btn-ghost-light:hover { background: rgba(255,255,255,0.08); }
        @media (max-width: 960px) { .circles-grid { grid-template-columns: 1fr 1fr; } }
        @media (max-width: 760px) { .circles-head { grid-template-columns: 1fr; gap: 24px; } .circles-grid { grid-template-columns: 1fr; } }
      `}</Style>
    </section>
  );
}
