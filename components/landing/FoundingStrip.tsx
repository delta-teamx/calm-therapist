"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Style } from "@/components/ui/Style";

interface Founding {
  members: number;
  cap: number;
  seatsLeft: number;
  minSupportUsd: number;
  circlesOpenAt: number;
}

/**
 * The landing strip: chat is free for everyone, and how many people are
 * already here. The founding number is a badge for the first arrivals, not
 * an access window — nothing on this strip promises free voice or circles.
 * Reads the public endpoint; renders a quiet fallback until it answers.
 */
export function FoundingStrip() {
  const [f, setF] = useState<Founding | null>(null);
  useEffect(() => {
    fetch("/api/founding")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Founding | null) => d && setF(d))
      .catch(() => {});
  }, []);

  const cap = f?.cap ?? Number(process.env.NEXT_PUBLIC_FOUNDING_CAP ?? 150);
  const taken = f?.members ?? 0;
  const pct = Math.min(100, Math.round((taken / cap) * 100));

  return (
    <section style={{ background: "var(--calm-forest)", color: "white", padding: "28px 24px" }}>
      <div className="container founding-strip">
        <div style={{ flex: 1, minWidth: 260 }}>
          <p className="body-micro" style={{ opacity: 0.8, marginBottom: 6 }}>Free to start</p>
          <p style={{ fontFamily: "var(--font-heading)", fontSize: 26, lineHeight: 1.2 }}>
            Chat with Aura is free. No card, no trial.
          </p>
          <p style={{ fontSize: 14, opacity: 0.85, marginTop: 6 }}>
            The first {cap} members keep a founding badge and their number. Voice and circles open
            later, from ${f?.minSupportUsd ?? 3}, whenever you want them.
          </p>
        </div>
        <div style={{ minWidth: 220, flex: "0 1 320px" }}>
          <div className="founding-bar" role="img" aria-label={`${taken} of ${cap} founding badges claimed`}>
            <span style={{ width: `${pct}%` }} />
          </div>
          <p style={{ fontSize: 13, marginTop: 8, opacity: 0.9 }}>
            {f ? `${taken} of ${cap} founding badges claimed` : `${cap} badges`}
          </p>
        </div>
        <Link href="/auth/signup" className="btn-light" style={{ whiteSpace: "nowrap" }}>
          Start free
        </Link>
      </div>
      <Style>{`
        .founding-strip { display: flex; align-items: center; gap: 32px; flex-wrap: wrap; }
        .founding-bar { height: 8px; background: rgba(255,255,255,0.25); border-radius: 999px; overflow: hidden; }
        .founding-bar span { display: block; height: 100%; background: white; border-radius: 999px; transition: width 0.6s ease; }
      `}</Style>
    </section>
  );
}
