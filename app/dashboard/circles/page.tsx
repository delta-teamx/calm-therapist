"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Style } from "@/components/ui/Style";
import { UnlockDialog } from "@/components/dashboard/UnlockDialog";
import type { Access } from "@/lib/access";
import { CIRCLE_MINUTES, CIRCLE_RULES, CIRCLE_SEATS, CIRCLE_THEMES } from "@/lib/circle-themes";

interface Stats { members: number; openAt: number; interested: number; themes: { slug: string; count: number }[] }
interface Payload { themes: string[]; stats: Stats; access: Access; animal: string }

export default function CirclesDashboardPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<"idle" | "done" | "error">("idle");
  const [unlockOpen, setUnlockOpen] = useState(false);

  const load = () => {
    fetch("/api/circles/interest")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Payload | null) => {
        if (!d) return;
        setData(d);
        setPicked(new Set(d.themes));
      })
      .catch(() => {});
  };

  useEffect(load, []);

  const toggle = (slug: string) => {
    setSaved("idle");
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    setSaved("idle");
    try {
      const res = await fetch("/api/circles/interest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themes: Array.from(picked) }),
      });
      if (!res.ok) throw new Error();
      const d = (await res.json()) as { themes: string[]; stats: Stats };
      setData((prev) => (prev ? { ...prev, themes: d.themes, stats: d.stats } : prev));
      setSaved("done");
    } catch {
      setSaved("error");
    } finally {
      setSaving(false);
    }
  };

  const stats = data?.stats;
  const pct = stats ? Math.min(100, Math.round((stats.members / stats.openAt) * 100)) : 0;
  const open = stats ? stats.members >= stats.openAt : false;
  const counts = new Map((stats?.themes ?? []).map((t) => [t.slug, t.count]));

  return (
    <div style={{ padding: "48px 32px", maxWidth: 980, margin: "0 auto" }}>
      <p className="body-micro" style={{ color: "var(--calm-forest)", marginBottom: 12 }}>Circles</p>
      <h2 style={{ marginBottom: 8 }}>{open ? "Circles are open." : "Small rooms, opening soon."}</h2>
      <p className="body-large" style={{ color: "var(--calm-ink-40)", marginBottom: 32, maxWidth: 640 }}>
        Up to {CIRCLE_SEATS} people, one theme, {CIRCLE_MINUTES} minutes, text only, once a night. Aura hosts. A human is on
        call. You would be in the room as <strong style={{ color: "var(--calm-ink)" }}>{data?.animal ?? "an anonymous animal"}</strong>.
      </p>

      <section className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "baseline" }}>
          <p className="body-micro" style={{ color: "var(--calm-forest)" }}>
            {open ? "Open" : `Opens at ${stats?.openAt ?? 50} members`}
          </p>
          <p style={{ fontSize: 14, color: "var(--calm-ink-40)" }}>
            {stats ? `${stats.members} member${stats.members === 1 ? "" : "s"} so far · ${stats.interested} picked themes` : "…"}
          </p>
        </div>
        <div className="circle-bar" role="img" aria-label={stats ? `${stats.members} of ${stats.openAt} members` : "loading"}>
          <span style={{ width: `${pct}%` }} />
        </div>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--calm-ink-70)", marginTop: 16 }}>
          {data?.access.circles
            ? "Your seat is held. When circles open, Aura invites you to the nights that match the themes you pick below."
            : "A seat in a circle opens when you have told us how Aura is going and supported the work, from $5. Pick your themes either way; that is how the first nights get planned."}
        </p>
        {data && !data.access.circles && (
          <button type="button" className="btn-primary" style={{ marginTop: 16 }} onClick={() => setUnlockOpen(true)}>
            Open my seat
          </button>
        )}
      </section>

      <section className="card" style={{ marginBottom: 24 }}>
        <p className="body-micro" style={{ color: "var(--calm-forest)", marginBottom: 8 }}>Which circles would you sit in?</p>
        <p style={{ fontSize: 14, color: "var(--calm-ink-40)", marginBottom: 20 }}>
          Pick as many as fit. Nobody sees your picks; Aura uses them to plan nights and to invite you.
        </p>
        <div className="theme-grid">
          {CIRCLE_THEMES.map((t) => {
            const on = picked.has(t.slug);
            const n = counts.get(t.slug) ?? 0;
            return (
              <button
                key={t.slug}
                type="button"
                onClick={() => toggle(t.slug)}
                className="theme-chip"
                data-on={on ? "true" : "false"}
                aria-pressed={on}
              >
                <span className="theme-title">{t.title}</span>
                <span className="theme-line">{t.line}</span>
                {n > 0 && <span className="theme-count">{n} waiting</span>}
              </button>
            );
          })}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 20, flexWrap: "wrap" }}>
          <button type="button" className="btn-primary" onClick={save} disabled={saving || !data}>
            {saving ? "Saving…" : "Save my picks"}
          </button>
          {saved === "done" && <span style={{ fontSize: 14, color: "var(--calm-forest)" }}>Saved. Aura has them.</span>}
          {saved === "error" && <span style={{ fontSize: 14, color: "var(--calm-ink)" }}>That did not save. Try again.</span>}
        </div>
      </section>

      <div className="dash-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <section className="card">
          <p className="body-micro" style={{ color: "var(--calm-forest)", marginBottom: 16 }}>How a night goes</p>
          <ol style={{ paddingLeft: 18, margin: 0, display: "grid", gap: 8, fontSize: 14, lineHeight: 1.6, color: "var(--calm-ink-70)" }}>
            <li>An invitation card here, and an email if you want one.</li>
            <li>Read the rules once, enter as your animal.</li>
            <li>Arrive: one line each on how you are coming in.</li>
            <li>The question for the night, then sharing rounds. You answer each other.</li>
            <li>Aura reflects what she heard. One word each to close.</li>
            <li>A private after-care note from Aura in your chat.</li>
          </ol>
        </section>
        <section className="card">
          <p className="body-micro" style={{ color: "var(--calm-forest)", marginBottom: 16 }}>The rules</p>
          <ul style={{ paddingLeft: 18, margin: 0, display: "grid", gap: 8, fontSize: 14, lineHeight: 1.6, color: "var(--calm-ink-70)" }}>
            {CIRCLE_RULES.map((r) => <li key={r}>{r}</li>)}
          </ul>
        </section>
      </div>

      <p style={{ marginTop: 24, fontSize: 14, color: "var(--calm-ink-40)" }}>
        Until circles open, the private room is always here. <Link href="/dashboard/session" style={{ color: "var(--calm-forest)" }}>Talk to Aura →</Link>
      </p>

      <UnlockDialog
        open={unlockOpen}
        feature="circles"
        onClose={() => setUnlockOpen(false)}
        onUnlocked={load}
      />

      <Style>{`
        .circle-bar { height: 10px; background: var(--calm-forest-10); border-radius: 999px; overflow: hidden; margin-top: 14px; }
        .circle-bar span { display: block; height: 100%; background: var(--calm-forest); border-radius: 999px; transition: width 0.6s ease; }
        .theme-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; }
        .theme-chip { display: flex; flex-direction: column; align-items: flex-start; gap: 4px; text-align: left; padding: 14px 16px; border-radius: 12px; border: 1px solid var(--calm-ink-10); background: var(--calm-white); color: var(--calm-ink); transition: border-color 0.15s ease, background 0.15s ease; }
        .theme-chip:hover { border-color: var(--calm-forest); }
        .theme-chip[data-on="true"] { background: var(--calm-forest-10); border-color: var(--calm-forest); }
        .theme-title { font-size: 15px; font-weight: 500; }
        .theme-line { font-size: 13px; color: var(--calm-ink-40); }
        .theme-count { margin-top: 4px; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; color: var(--calm-forest); }
        @media (max-width: 760px) { .dash-grid { grid-template-columns: 1fr !important; } }
      `}</Style>
    </div>
  );
}
