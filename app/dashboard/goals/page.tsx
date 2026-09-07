"use client";

import { useEffect, useState } from "react";
import { Style } from "@/components/ui/Style";

interface Goal { id: string; title: string; description?: string; frequency: "daily" | "3x-week" | "weekly"; week: { day: string; done: boolean }[]; progress: number; doneToday: boolean }

const FREQ_LABEL = { daily: "Every day", "3x-week": "Three times a week", weekly: "Once a week" };

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [max, setMax] = useState(5);
  const [loaded, setLoaded] = useState(false);
  const [title, setTitle] = useState("");
  const [frequency, setFrequency] = useState<Goal["frequency"]>("3x-week");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/goals").then((r) => (r.ok ? r.json() : null)).then((d) => { if (d) { setGoals(d.goals ?? []); setMax(d.max ?? 5); } }).finally(() => setLoaded(true));
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/goals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, frequency }) });
    const d = await res.json();
    if (!res.ok) { setError(d.error ?? "Could not add that."); return; }
    setGoals(d.goals);
    setTitle("");
  };
  const toggle = async (id: string) => {
    const res = await fetch(`/api/goals/${id}`, { method: "PATCH" });
    if (res.ok) setGoals((await res.json()).goals);
  };
  const remove = async (id: string) => {
    if (!window.confirm("Let this goal go?")) return;
    const res = await fetch(`/api/goals/${id}`, { method: "DELETE" });
    if (res.ok) setGoals((await res.json()).goals);
  };

  return (
    <div style={{ padding: "48px 32px", maxWidth: 880, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 8 }}>What you&apos;re after</h2>
      <p className="body-large" style={{ color: "var(--calm-ink-40)", marginBottom: 32 }}>Small, specific, and yours. Tick the day it happened.</p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 32 }}>
        {loaded && goals.length === 0 && (
          <div className="card-mist"><p style={{ fontSize: 15, lineHeight: 1.7 }}>No goals yet. The best first one is tiny: something you could do tomorrow, tied to something you care about.</p></div>
        )}
        {goals.map((g) => (
          <div key={g.id} className="card goal-card">
            <Ring progress={g.progress} />
            <div style={{ flex: 1, minWidth: 200 }}>
              <h4 style={{ marginBottom: 4 }}>{g.title}</h4>
              <p style={{ fontSize: 13, color: "var(--calm-ink-40)" }}>{FREQ_LABEL[g.frequency]}{g.description ? ` · ${g.description}` : ""}</p>
              <div className="week-dots" aria-label="Last seven days">
                {g.week.map((w) => <span key={w.day} data-done={w.done ? "true" : "false"} title={w.day} />)}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" className={g.doneToday ? "btn-primary" : "btn-ghost"} style={{ height: 36, fontSize: 13 }} onClick={() => toggle(g.id)}>
                {g.doneToday ? "Done today" : "Did it today"}
              </button>
              <button type="button" className="btn-ghost" style={{ height: 36, fontSize: 13, color: "var(--calm-ink-40)" }} onClick={() => remove(g.id)} aria-label="Remove goal">×</button>
            </div>
          </div>
        ))}
      </div>

      {goals.length < max && (
        <form onSubmit={add} className="card" style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Walk after dinner" maxLength={120} style={{ flex: 1, minWidth: 220 }} required />
          <select className="input" value={frequency} onChange={(e) => setFrequency(e.target.value as Goal["frequency"])} style={{ width: 190 }}>
            <option value="daily">Every day</option>
            <option value="3x-week">Three times a week</option>
            <option value="weekly">Once a week</option>
          </select>
          <button type="submit" className="btn-primary" style={{ height: 44 }}>Add ({goals.length}/{max})</button>
          {error && <p style={{ fontSize: 13, color: "var(--calm-ink)", width: "100%" }}>{error}</p>}
        </form>
      )}

      <Style>{`
        .goal-card { display: flex; gap: 20px; align-items: center; flex-wrap: wrap; }
        .week-dots { display: flex; gap: 6px; margin-top: 10px; }
        .week-dots span { width: 12px; height: 12px; border-radius: 999px; background: var(--calm-ink-10); }
        .week-dots span[data-done="true"] { background: var(--calm-forest); }
      `}</Style>
    </div>
  );
}

function Ring({ progress }: { progress: number }) {
  const dash = 2 * Math.PI * 22;
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" aria-hidden>
      <circle cx="30" cy="30" r="22" fill="none" stroke="var(--calm-ink-10)" strokeWidth="4" />
      <circle cx="30" cy="30" r="22" fill="none" stroke="var(--calm-forest)" strokeWidth="4" strokeDasharray={dash} strokeDashoffset={dash * (1 - progress)} strokeLinecap="round" transform="rotate(-90 30 30)" />
    </svg>
  );
}
