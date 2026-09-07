"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Style } from "@/components/ui/Style";

interface Memory { id: string; statement: string; category: string; mentions: number; firstMentioned: string; lastMentioned: string }
interface Profile { name: string; age?: string; tone: string; language: string; focusAreas: string[]; countryOfResidence?: string }
interface SessionRow { id: string; mode: "chat" | "voice"; startedAt: string; endedAt?: string; summary?: string; turns: number }
interface Mood { day: string; score: number }

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [moods, setMoods] = useState<Mood[]>([]);
  const [memberSince, setMemberSince] = useState<string>("");
  const [memberNumber, setMemberNumber] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/users/me/profile").then((r) => (r.ok ? r.json() : null)).then((d) => { if (d?.profile) { setProfile(d.profile); setMemories(d.memories ?? []); } }).catch(() => {});
    fetch("/api/sessions?limit=20").then((r) => (r.ok ? r.json() : null)).then((d) => d && setSessions(d.sessions ?? [])).catch(() => {});
    fetch("/api/mood?days=30").then((r) => (r.ok ? r.json() : null)).then((d) => d && setMoods(d.moods ?? [])).catch(() => {});
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (d.user?.createdAt) setMemberSince(new Date(d.user.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" }));
      if (typeof d.user?.memberNumber === "number") setMemberNumber(d.user.memberNumber);
    }).catch(() => {});
  }, []);

  const forget = async (id: string) => {
    const res = await fetch(`/api/users/me/memories/${id}`, { method: "DELETE" });
    if (res.ok) {
      const d = await res.json();
      setMemories(d.memories ?? memories.filter((m) => m.id !== id));
      setNotice("Forgotten.");
    }
  };

  const exportData = async () => {
    setNotice("Preparing your record…");
    const res = await fetch("/api/users/me/export");
    if (!res.ok) { setNotice("Could not prepare the export. Try again in a moment."); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `my-record-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setNotice("Downloaded.");
  };

  const avg = moods.length ? (moods.reduce((s, m) => s + m.score, 0) / moods.length).toFixed(1) : null;

  return (
    <div style={{ padding: "48px 32px", maxWidth: 980, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 32 }}>Your space</h2>

      <div className="card" style={{ marginBottom: 32 }}>
        <Row label="Name" value={profile?.name ?? "…"} />
        <Row label="Age" value={profile?.age ?? "—"} />
        <Row label="Tone" value={profile ? capitalize(profile.tone) : "…"} />
        <Row label="Language" value={profile ? languageLabel(profile.language) : "…"} />
        <Row label="Focus" value={profile?.focusAreas.length ? profile.focusAreas.join(", ") : "—"} />
        <Row label="Member" value={memberNumber ? `#${memberNumber}${memberSince ? ` · since ${memberSince}` : ""}` : memberSince || "…"} last />
        <Link href="/dashboard/settings" style={{ display: "inline-block", marginTop: 16, fontSize: 14, color: "var(--calm-forest)" }}>Change these in Preferences →</Link>
      </div>

      <div className="card-mist" style={{ marginBottom: 32 }}>
        <p className="body-micro" style={{ color: "var(--calm-forest)", marginBottom: 6 }}>What Aura remembers</p>
        <p style={{ fontSize: 14, color: "var(--calm-ink-40)", marginBottom: 16 }}>
          Written by Aura after conversations, in plain words. Remove anything you would rather she did not carry.
        </p>
        {memories.length === 0 ? (
          <p style={{ fontSize: 15, color: "var(--calm-ink-70)" }}>Nothing yet. After a real conversation, Aura writes one to three lines here.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
            {memories.map((m) => (
              <li key={m.id} className="mem-row">
                <div>
                  <p style={{ fontSize: 15, lineHeight: 1.6 }}>{m.statement}</p>
                  <p style={{ fontSize: 12, color: "var(--calm-ink-40)", marginTop: 4 }}>
                    {m.category}{m.mentions > 1 ? ` · came up ${m.mentions} times` : ""} · first {new Date(m.firstMentioned).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </p>
                </div>
                <button type="button" className="btn-ghost" style={{ height: 32, fontSize: 12 }} onClick={() => forget(m.id)}>Forget</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="dash-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
        <div className="card">
          <p className="body-micro" style={{ color: "var(--calm-forest)", marginBottom: 16 }}>Last 30 days</p>
          {moods.length === 0 ? (
            <p style={{ fontSize: 15, color: "var(--calm-ink-70)" }}>No check-ins yet. The one tap on your Today page builds this.</p>
          ) : (
            <>
              <div className="mood-bars" role="img" aria-label={`${moods.length} check-ins, average ${avg} out of 5`}>
                {moods.map((m) => (
                  <span key={m.day} title={`${m.day}: ${m.score}/5`} style={{ height: `${m.score * 20}%` }} data-score={m.score} />
                ))}
              </div>
              <p style={{ fontSize: 13, color: "var(--calm-ink-40)", marginTop: 10 }}>{moods.length} check-ins · average {avg} of 5</p>
            </>
          )}
        </div>
        <div className="card">
          <p className="body-micro" style={{ color: "var(--calm-forest)", marginBottom: 16 }}>Your record</p>
          <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--calm-ink-70)" }}>
            Everything here is yours. Download it as a file, or delete the account and all of it from Preferences.
          </p>
          <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
            <button type="button" className="btn-ghost" onClick={exportData}>Download my record</button>
            <Link href="/dashboard/settings#delete" className="btn-ghost" style={{ color: "var(--calm-ink)" }}>Delete account</Link>
          </div>
          {notice && <p style={{ fontSize: 13, color: "var(--calm-forest)", marginTop: 10 }}>{notice}</p>}
        </div>
      </div>

      <div className="card">
        <p className="body-micro" style={{ color: "var(--calm-forest)", marginBottom: 16 }}>Conversations</p>
        {sessions.length === 0 ? (
          <p style={{ fontSize: 15, color: "var(--calm-ink-70)" }}>None yet. <Link href="/dashboard/session" style={{ color: "var(--calm-forest)" }}>Talk to Aura →</Link></p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {sessions.map((s) => (
              <li key={s.id} className="sess-row">
                <div style={{ minWidth: 96 }}>
                  <p style={{ fontSize: 13, color: "var(--calm-ink-40)" }}>{new Date(s.startedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</p>
                  <p className="body-micro" style={{ color: "var(--calm-forest)" }}>{s.mode === "voice" ? "Voice" : "Chat"} · {s.turns} turns</p>
                </div>
                <p style={{ fontSize: 15, flex: 1, minWidth: 220, color: s.summary ? "var(--calm-ink)" : "var(--calm-ink-40)" }}>
                  {s.summary ?? (s.endedAt ? "No note for this one." : "Still open.")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Style>{`
        .mem-row { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; background: var(--calm-white); border: 1px solid var(--calm-ink-10); padding: 12px 16px; border-radius: 10px; }
        .sess-row { padding: 14px 0; border-bottom: 1px solid var(--calm-ink-10); display: flex; gap: 16px; flex-wrap: wrap; }
        .sess-row:last-child { border-bottom: 0; }
        .mood-bars { display: flex; align-items: flex-end; gap: 3px; height: 64px; }
        .mood-bars span { flex: 1; min-width: 4px; border-radius: 3px 3px 0 0; background: var(--calm-forest-20); }
        .mood-bars span[data-score="4"], .mood-bars span[data-score="5"] { background: var(--calm-forest); }
        .mood-bars span[data-score="1"], .mood-bars span[data-score="2"] { background: var(--calm-ink-40); }
        @media (max-width: 760px) { .dash-grid { grid-template-columns: 1fr !important; } }
      `}</Style>
    </div>
  );
}

function Row({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 16, padding: "12px 0", borderBottom: last ? "none" : "1px solid var(--calm-ink-10)", flexWrap: "wrap" }}>
      <span style={{ fontSize: 14, color: "var(--calm-ink-40)" }}>{label}</span>
      <span style={{ fontSize: 15, textAlign: "right" }}>{value}</span>
    </div>
  );
}
function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
function languageLabel(code: string) {
  return { en: "English", ur: "Urdu", hi: "Hindi", ar: "Arabic", es: "Spanish", fr: "French" }[code] ?? code;
}
