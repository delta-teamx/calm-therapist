"use client";

import { Style } from "@/components/ui/Style";
import { UnlockDialog } from "@/components/dashboard/UnlockDialog";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { readState } from "@/components/onboarding/OnboardingShell";
import { FeedbackPrompt } from "@/components/dashboard/FeedbackPrompt";
import type { Access } from "@/lib/access";
import { CIRCLES_OPEN_AT } from "@/lib/circle-themes";

const MOOD_LABELS = ["Struggling", "Low", "Okay", "Good", "Settled"];

export default function DashboardHome() {
  const router = useRouter();
  const [name, setName] = useState("friend");
  const [mood, setMood] = useState<number | null>(null);
  const [access, setAccess] = useState<Access | null>(null);
  const [dateLine, setDateLine] = useState("");
  const [accessLine, setAccessLine] = useState<string | null>(null);
  const [members, setMembers] = useState<number | null>(null);
  const [unlockOpen, setUnlockOpen] = useState(false);

  useEffect(() => {
    const s = readState() as Record<string, string>;
    if (s.name) setName(s.name);
    setDateLine(new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }));
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d: { user?: { name?: string; access?: Access; accessLine?: string } }) => {
        if (d.user?.access) setAccess(d.user.access);
        if (d.user?.accessLine) setAccessLine(d.user.accessLine);
        if (d.user?.name && !s.name) setName(d.user.name);
      })
      .catch(() => {});
    fetch("/api/mood?days=1")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { moods?: { day: string; score: number }[] } | null) => {
        const today = new Date().toISOString().slice(0, 10);
        const t = d?.moods?.find((m) => m.day === today);
        if (t) setMood(t.score);
      })
      .catch(() => {});
    fetch("/api/founding")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { members?: number } | null) => {
        if (d && typeof d.members === "number") setMembers(d.members);
      })
      .catch(() => {});
  }, []);

  const greeting = useGreeting();
  const hasVoice = access?.voice === true;

  const onVoiceClick = () => {
    // No voice yet: open the unlock dialog where they stand rather than
    // bouncing them into Settings to find it.
    if (hasVoice) router.push("/dashboard/voice");
    else setUnlockOpen(true);
  };

  return (
    <div style={{ padding: "48px 32px", maxWidth: 980, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 8 }}>
        {greeting}, {name}.
      </h2>
      <p className="body-large" style={{ color: "var(--calm-ink-40)", marginBottom: 20 }}>
        {dateLine}{dateLine ? "." : ""}
      </p>

      {accessLine && (
        <p className="founding-line">
          <span className="founding-dot" aria-hidden />
          {accessLine}
        </p>
      )}

      <div className="start-grid" style={{ marginBottom: 40 }}>
        <Link href="/dashboard/session" className="start-card">
          <div className="start-card-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M3 5h18v12H8l-5 4z" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="start-card-body">
            <h3>Talk it out — text</h3>
            <p>Type at your own pace. Always open. Free.</p>
          </div>
          <span className="start-card-arrow">→</span>
        </Link>

        <button type="button" onClick={onVoiceClick} className="start-card start-card-voice" data-locked={access && !hasVoice ? "true" : "false"}>
          <div className="start-card-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
              <path d="M5 11a7 7 0 0 0 14 0" />
              <path d="M12 18v3" />
            </svg>
          </div>
          <div className="start-card-body">
            <h3>
              Talk it out — voice
              {access && !hasVoice && <span className="start-card-badge">Open space</span>}
            </h3>
            <p>
              {access && !hasVoice
                ? "Voice is part of an open space. See what is included in Settings."
                : "Speak when typing's too much. Fair-use minutes, counted after each call."}
            </p>
          </div>
          <span className="start-card-arrow">{access && !hasVoice ? "🔒" : "→"}</span>
        </button>
      </div>

      <section className="card" style={{ marginBottom: 32 }}>
        <p className="body-micro" style={{ color: "var(--calm-forest)", marginBottom: 16 }}>
          Today&apos;s check-in
        </p>
        <h3 style={{ marginBottom: 24 }}>How are you arriving today?</h3>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              onClick={() => {
                setMood(n);
                fetch("/api/mood", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ score: n }) }).catch(() => {});
              }}
              style={{
                width: 56,
                height: 56,
                borderRadius: 999,
                border: mood === n ? "2px solid var(--calm-forest)" : "1px solid var(--calm-ink-10)",
                background: mood === n ? "var(--calm-forest-10)" : "transparent",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-heading)",
                fontSize: 18,
                color: "var(--calm-ink)",
                transition: "all 0.2s ease",
              }}
              aria-label={MOOD_LABELS[n - 1]}
            >
              {n}
            </button>
          ))}
        </div>
        <p style={{ fontSize: 13, color: "var(--calm-ink-40)" }}>
          {mood ? MOOD_LABELS[mood - 1] : "Tap a number — no explanation needed."}
        </p>
        {mood !== null && (
          <Link href="/dashboard/session" className="btn-primary" style={{ marginTop: 24 }}>
            Open today&apos;s session
          </Link>
        )}
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }} className="dash-grid">
        <Card title="Circles">
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--calm-ink-70)" }}>
            Small anonymous rooms for the same thing, hosted by Aura.{" "}
            {members !== null && members >= CIRCLES_OPEN_AT
              ? "Circles are open. Pick your themes and Aura will invite you."
              : `They open at ${CIRCLES_OPEN_AT} members${members !== null ? `; ${members} so far` : ""}. Pick the themes you would sit in.`}
          </p>
          <div className="circle-mini-bar" aria-hidden>
            <span style={{ width: `${members !== null ? Math.min(100, Math.round((members / CIRCLES_OPEN_AT) * 100)) : 0}%` }} />
          </div>
          <Link href="/dashboard/circles" style={{ display: "inline-block", marginTop: 12, fontSize: 14, color: "var(--calm-forest)" }}>
            Choose your circles →
          </Link>
        </Card>
        <Card title="Your space">
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--calm-ink-70)" }}>
            {access?.tier === "supporter" || access?.tier === "admin"
              ? "Voice and circles are open, and your record is yours."
              : "Chat with Aura is always open and always free."}
          </p>
          <Link href="/dashboard/settings" style={{ display: "inline-block", marginTop: 12, fontSize: 14, color: "var(--calm-forest)" }}>
            Membership details →
          </Link>
        </Card>
      </div>

      <Card title="Your record">
        <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--calm-ink-70)" }}>
          What you tell Aura is kept for you, and only you. Memories from each conversation show up in
          your space, and Aura carries them into the next one.
        </p>
        <Link href="/dashboard/profile" style={{ display: "inline-block", marginTop: 12, fontSize: 14, color: "var(--calm-forest)" }}>
          See what Aura remembers →
        </Link>
      </Card>

      <div style={{ marginTop: 32 }}>
        <FeedbackPrompt />
      </div>


      <UnlockDialog
        open={unlockOpen}
        feature="voice"
        onClose={() => setUnlockOpen(false)}
        onUnlocked={() => router.push("/dashboard/voice")}
      />

      <Style>{`
        .founding-line { display: inline-flex; align-items: center; gap: 10px; font-size: 14px; color: var(--calm-forest); background: var(--calm-forest-10); border-radius: 999px; padding: 8px 14px; margin-bottom: 32px; }
        .founding-dot { width: 8px; height: 8px; border-radius: 999px; background: var(--calm-forest); }
        .circle-mini-bar { height: 6px; background: var(--calm-forest-10); border-radius: 999px; overflow: hidden; margin-top: 14px; }
        .circle-mini-bar span { display: block; height: 100%; background: var(--calm-forest); border-radius: 999px; transition: width 0.6s ease; }
        @media (max-width: 760px) { .dash-grid { grid-template-columns: 1fr !important; } }
        .start-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (max-width: 700px) { .start-grid { grid-template-columns: 1fr !important; } }
        .start-card {
          display: flex;
          align-items: center;
          gap: 16px;
          background: var(--calm-white);
          border: 1px solid var(--calm-ink-10);
          border-radius: 14px;
          padding: 22px 24px;
          text-align: left;
          color: var(--calm-ink);
          font-family: var(--font-body);
          cursor: pointer;
          transition: transform 0.15s ease, background 0.15s ease, border-color 0.15s ease;
          width: 100%;
          text-decoration: none;
        }
        .start-card:hover {
          background: var(--calm-mist);
          transform: translateY(-1px);
        }
        .start-card-voice[data-locked="true"] {
          background: var(--calm-mist);
        }
        .start-card-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          background: var(--calm-forest-10);
          color: var(--calm-forest);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .start-card-body { flex: 1; min-width: 0; }
        .start-card-body h3 {
          font-size: 18px;
          line-height: 1.2;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }
        .start-card-body p {
          font-size: 13px;
          color: var(--calm-ink-70);
          line-height: 1.55;
          margin: 0;
        }
        .start-card-arrow {
          font-size: 20px;
          color: var(--calm-ink-40);
        }
        .start-card-badge {
          padding: 2px 8px;
          font-family: var(--font-body);
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          background: var(--calm-forest);
          color: white;
          border-radius: 999px;
        }
      `}</Style>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <p className="body-micro" style={{ color: "var(--calm-forest)", marginBottom: 16 }}>{title}</p>
      {children}
    </div>
  );
}

function useGreeting() {
  const [g, setG] = useState("Hello");
  useEffect(() => {
    const h = new Date().getHours();
    if (h < 12) setG("Good morning");
    else if (h < 18) setG("Good afternoon");
    else setG("Good evening");
  }, []);
  return g;
}
