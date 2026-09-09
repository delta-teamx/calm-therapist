"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { VoiceAgent } from "@/components/agents/VoiceAgent";
import { UnlockDialog } from "@/components/dashboard/UnlockDialog";
import { ModeBar } from "@/components/agents/ModeBar";
import { useServerProfile } from "@/components/dashboard/useServerProfile";
import type { AgentModeKey, UserProfile } from "@/lib/aura";
import { Style } from "@/components/ui/Style";
import type { Access } from "@/lib/access";

interface QuotaSnapshot {
  plan: "free" | "pro";
  access: Access;
  monthlyLimitSec: number;
  monthlyUsedSec: number;
  monthlyRemainingSec: number;
  balanceSec: number;
  remainingSec: number;
  canStart: boolean;
}

export default function VoicePage() {
  const { profile, memoryCount } = useServerProfile();
  const [activeMode, setActiveMode] = useState<AgentModeKey | null>(null);
  const [quota, setQuota] = useState<QuotaSnapshot | null>(null);
  const [dateLine, setDateLine] = useState("");
  const [unlockOpen, setUnlockOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = window.sessionStorage.getItem("calm-therapist:active-mode");
      if (raw) setActiveMode(raw as AgentModeKey);
    } catch {}
    setDateLine(new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" }));
    refreshQuota();
  }, []);

  const persistMode = (next: AgentModeKey | null) => {
    setActiveMode(next);
    try {
      if (next) window.sessionStorage.setItem("calm-therapist:active-mode", next);
      else window.sessionStorage.removeItem("calm-therapist:active-mode");
    } catch {}
  };

  const refreshQuota = async () => {
    try {
      const res = await fetch("/api/voice/quota");
      const data = await res.json();
      if (res.ok) setQuota(data);
    } catch {}
  };

  const hasVoice = quota?.access.voice === true;
  const outOfMinutes = quota ? hasVoice && !quota.canStart : false;

  const profileWithMode: UserProfile = { ...profile, activeModes: activeMode ? [activeMode] : [] };

  return (
    <div className="voice-page">
      <header className="voice-chrome">
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <span className="body-micro" style={{ color: "var(--calm-ink-40)" }}>
            Voice{dateLine ? ` · ${dateLine}` : ""}
          </span>
          <span style={{ fontSize: 13, color: "var(--calm-forest)", marginTop: 4, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span aria-hidden style={{ width: 6, height: 6, borderRadius: 999, background: "var(--calm-forest)" }} />
            {memoryCount === 0
              ? "Aura is getting to know you"
              : `Aura remembers ${memoryCount} ${memoryCount === 1 ? "thing" : "things"} about you`}
          </span>
        </div>
        {hasVoice && <ModeBar active={activeMode} onChange={persistMode} />}
      </header>

      {quota && !hasVoice && <NoVoice onOpen={() => setUnlockOpen(true)} />}

      {outOfMinutes && quota && <OutOfMinutes onOpen={() => setUnlockOpen(true)} />}

      {hasVoice && !outOfMinutes && quota && (
        <VoiceAgent profile={profileWithMode} onSessionRecorded={refreshQuota} />
      )}

      {hasVoice && quota && (
        <p style={{ textAlign: "center", fontSize: 12, color: "var(--calm-ink-40)", padding: "0 24px 24px" }}>
          {Math.floor(quota.remainingSec / 60)} voice minutes left on your account. They are yours and
          do not expire; minutes are counted from the call itself, after it ends.
        </p>
      )}

      <UnlockDialog
        open={unlockOpen}
        feature="voice"
        onClose={() => setUnlockOpen(false)}
        onUnlocked={() => void refreshQuota()}
      />

      <Style>{`
        .voice-page { padding: 0; height: 100%; display: flex; flex-direction: column; }
        .voice-chrome {
          display: flex; justify-content: space-between; align-items: center; gap: 16px;
          padding: 16px 24px; border-bottom: 1px solid var(--calm-ink-10); flex-wrap: wrap;
        }
      `}</Style>
    </div>
  );
}

function NoVoice({ onOpen }: { onOpen: () => void }) {
  return (
    <div
      style={{
        margin: 32,
        background: "var(--calm-mist)",
        border: "1px solid var(--calm-forest-20)",
        borderLeft: "3px solid var(--calm-forest)",
        borderRadius: 14,
        padding: 32,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        maxWidth: 720,
      }}
    >
      <p className="body-micro" style={{ color: "var(--calm-forest)" }}>Two small things open voice</p>
      <h3>Chat is always free. Talking out loud opens with your support.</h3>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--calm-ink-70)" }}>
        Every voice minute costs us real money at the provider, so voice opens once you have told
        us how Aura is going and helped cover the bill. From $3. The minutes are then yours to
        keep — they do not reset at the end of a month.
      </p>
      <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
        <button type="button" className="btn-primary" onClick={onOpen}>Open voice</button>
        <Link href="/dashboard/session" className="btn-ghost">Talk by text</Link>
      </div>
    </div>
  );
}

function OutOfMinutes({ onOpen }: { onOpen: () => void }) {
  return (
    <div
      style={{
        margin: 32,
        background: "var(--calm-white)",
        border: "1px solid var(--calm-ink-10)",
        borderRadius: 14,
        padding: 32,
        display: "flex",
        flexDirection: "column",
        gap: 12,
        maxWidth: 720,
      }}
    >
      <p className="body-micro" style={{ color: "var(--calm-forest)" }}>Your voice minutes are spent</p>
      <h3>We have talked a lot. Text is open and waiting.</h3>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--calm-ink-70)" }}>
        Chat with Aura carries on free, with everything she remembers. When you want more voice,
        another coffee adds more minutes to your account.
      </p>
      <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
        <Link href="/dashboard/session" className="btn-primary">Switch to text</Link>
        <button type="button" className="btn-ghost" onClick={onOpen}>Add minutes</button>
      </div>
    </div>
  );
}
