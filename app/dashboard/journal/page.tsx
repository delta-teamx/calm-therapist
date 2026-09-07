"use client";

import { useEffect, useRef, useState } from "react";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface Entry { weekStart: string; content: string; aiAnalysis?: string }
interface Mood { day: string; score: number }
interface SessionRow { id: string; mode: string; startedAt: string; summary?: string }

export default function JournalPage() {
  const [entry, setEntry] = useState<Entry | null>(null);
  const [content, setContent] = useState("");
  const [moods, setMoods] = useState<Mood[]>([]);
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [saving, setSaving] = useState<"idle" | "saving" | "saved">("idle");
  const [reading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetch("/api/journal").then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (!d) return;
      setEntry(d.entry); setContent(d.entry.content ?? ""); setMoods(d.moods ?? []); setSessions(d.sessions ?? []);
    }).catch(() => {});
  }, []);

  const save = async (text: string) => {
    if (!entry) return;
    setSaving("saving");
    try {
      const res = await fetch("/api/journal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ week: entry.weekStart, content: text }) });
      setSaving(res.ok ? "saved" : "idle");
    } catch { setSaving("idle"); }
  };
  const onChange = (text: string) => {
    setContent(text);
    setSaving("idle");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => save(text), 1200);
  };
  const read = async () => {
    if (!entry) return;
    setReading(true); setError(null);
    if (timer.current) { clearTimeout(timer.current); await save(content); }
    try {
      const res = await fetch("/api/journal/analyse", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ week: entry.weekStart }) });
      const d = await res.json();
      if (!res.ok) setError(d.error ?? "Aura could not read the week just now.");
      else setEntry({ ...entry, aiAnalysis: d.aiAnalysis });
    } catch { setError("Aura could not read the week just now."); }
    finally { setReading(false); }
  };

  const weekDays = entry ? Array.from({ length: 7 }, (_, i) => new Date(new Date(entry.weekStart).getTime() + i * 86400000).toISOString().slice(0, 10)) : [];
  const scoreFor = (day: string) => moods.find((m) => m.day === day)?.score ?? null;

  return (
    <div style={{ padding: "48px 32px", maxWidth: 880, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 8 }}>This week</h2>
      <p className="body-large" style={{ color: "var(--calm-ink-40)", marginBottom: 40 }}>{entry ? weekRange(entry.weekStart) : "…"}</p>

      <div className="card-mist" style={{ marginBottom: 32 }}>
        <p className="body-micro" style={{ color: "var(--calm-forest)", marginBottom: 16 }}>How you arrived each day</p>
        <div style={{ display: "flex", gap: 8 }}>
          {DAYS.map((d, i) => {
            const s = weekDays[i] ? scoreFor(weekDays[i]) : null;
            return (
              <div key={d} style={{ flex: 1, textAlign: "center" }}>
                <p style={{ fontSize: 12, color: "var(--calm-ink-40)", marginBottom: 8 }}>{d}</p>
                <div title={s ? `${s}/5` : "no check-in"} style={{ width: 12, height: 12, margin: "0 auto", borderRadius: 999, background: s === null ? "var(--calm-ink-10)" : s >= 4 ? "var(--calm-forest)" : s >= 3 ? "var(--calm-forest-20)" : "var(--calm-ink-40)" }} />
              </div>
            );
          })}
        </div>
        {sessions.length > 0 && (
          <p style={{ fontSize: 13, color: "var(--calm-ink-40)", marginTop: 14 }}>
            {sessions.length} conversation{sessions.length === 1 ? "" : "s"} this week{sessions.some((s) => s.summary) ? `: ${sessions.filter((s) => s.summary).map((s) => s.summary).join(" · ")}` : "."}
          </p>
        )}
      </div>

      <div className="card" style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <p className="body-micro" style={{ color: "var(--calm-forest)" }}>Your entry</p>
          <span style={{ fontSize: 12, color: "var(--calm-ink-40)" }}>{saving === "saving" ? "Saving…" : saving === "saved" ? "Saved" : ""}</span>
        </div>
        <textarea className="input" value={content} onChange={(e) => onChange(e.target.value)} rows={8} placeholder="Three lines is enough. What was this week like?" style={{ resize: "vertical", lineHeight: 1.7 }} maxLength={8000} />
      </div>

      <div className="card-mist">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <p className="body-micro" style={{ color: "var(--calm-forest)" }}>What Aura noticed this week</p>
          <button type="button" className="btn-ghost" style={{ height: 32, fontSize: 12 }} onClick={read} disabled={reading || !entry}>
            {reading ? "Reading…" : entry?.aiAnalysis ? "Read again" : "Ask Aura to read the week"}
          </button>
        </div>
        {entry?.aiAnalysis ? (
          entry.aiAnalysis.split(/\n{2,}/).map((p, i) => <p key={i} style={{ fontSize: 16, lineHeight: 1.8, marginBottom: 14 }}>{p}</p>)
        ) : (
          <p style={{ fontSize: 15, color: "var(--calm-ink-70)" }}>Write a few lines, or have a conversation or two, then ask. Aura reads the entry, the week&apos;s conversations, and your check-ins.</p>
        )}
        {error && <p style={{ fontSize: 13, color: "var(--calm-ink)", marginTop: 8 }}>{error}</p>}
      </div>
    </div>
  );
}

function weekRange(weekStart: string) {
  const monday = new Date(weekStart);
  const sunday = new Date(monday.getTime() + 6 * 86400000);
  const f = (d: Date) => d.toLocaleDateString(undefined, { month: "short", day: "numeric", timeZone: "UTC" });
  return `Week of ${f(monday)} – ${f(sunday)}`;
}
