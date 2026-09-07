"use client";

import { useEffect, useState } from "react";

interface Reflection { month: string; label: string; sessions: number; checkins: number; averageMood?: number; previousAverageMood?: number; themes: string[]; quotes: string[]; shift: string; enough: boolean }

export default function ReflectPage() {
  const [r, setR] = useState<Reflection | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/reflect").then(async (res) => {
      const d = await res.json();
      if (!res.ok) setError(d.error ?? "Could not build the month.");
      else setR(d.reflection);
    }).catch(() => setError("Could not build the month."));
  }, []);

  return (
    <div style={{ padding: "48px 32px", maxWidth: 880, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 8 }}>{r?.label ?? "Looking back"}</h2>
      <p className="body-large" style={{ color: "var(--calm-ink-40)", marginBottom: 40 }}>A month, in your own words.</p>

      {error && <div className="card-mist" style={{ marginBottom: 32 }}><p>{error}</p></div>}
      {!r && !error && <div className="card-mist" style={{ marginBottom: 32 }}><p style={{ color: "var(--calm-ink-40)" }}>Reading the month…</p></div>}

      {r && (
        <>
          <div className="card-mist" style={{ marginBottom: 32 }}>
            <p className="body-micro" style={{ color: "var(--calm-forest)", marginBottom: 12 }}>The month in numbers</p>
            <p style={{ fontSize: 16, lineHeight: 1.7 }}>
              {r.sessions} conversation{r.sessions === 1 ? "" : "s"}, {r.checkins} check-in{r.checkins === 1 ? "" : "s"}
              {r.averageMood ? `, arriving on average at ${r.averageMood} of 5` : ""}
              {r.previousAverageMood ? ` (${r.previousAverageMood} the month before)` : ""}.
            </p>
            {r.themes.length > 0 && (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14 }}>
                {r.themes.map((t) => <span key={t} className="pill" style={{ cursor: "default" }}>{t}</span>)}
              </div>
            )}
          </div>

          <div className="card" style={{ marginBottom: 32 }}>
            <p className="body-micro" style={{ color: "var(--calm-forest)", marginBottom: 16 }}>Where you shifted</p>
            <p style={{ fontSize: 17, lineHeight: 1.8 }}>{r.shift}</p>
          </div>

          {r.quotes.length > 0 && (
            <div className="card" style={{ marginBottom: 32 }}>
              <p className="body-micro" style={{ color: "var(--calm-forest)", marginBottom: 16 }}>What you said</p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 16 }}>
                {r.quotes.map((q, i) => (
                  <li key={i} style={{ paddingLeft: 16, borderLeft: "2px solid var(--calm-forest)", fontFamily: "var(--font-heading)", fontStyle: "italic", fontSize: 20, lineHeight: 1.5 }}>&ldquo;{q}&rdquo;</li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
