"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * The two gates on voice and circles, in one dialog.
 *
 * Gate one: tell us how it went. Any rating opens the gate, including a low
 * one, and the words stay private unless the member ticks the box themselves.
 * We never pay for a public review and never require a good one.
 *
 * Gate two: support the work on Ko-fi. The member copies a short code into the
 * Ko-fi message so the payment can find their account; if they forget, the
 * "I already paid" panel matches it by transaction id or email instead.
 */

export interface UnlockState {
  unlocked: boolean;
  gates: { reviewed: boolean; supported: boolean };
  code: string | null;
  kofiUrl: string | null;
  minUsd: number;
  pass: { tierKey: string; expiresAt: string; voiceMinutesGranted: number } | null;
  voice: { balanceSec: number; remainingSec: number };
}

interface Props {
  open: boolean;
  onClose: () => void;
  /** What they were reaching for, so the dialog can name it. */
  feature?: "voice" | "circles";
  onUnlocked?: (state: UnlockState) => void;
}

export function UnlockDialog({ open, onClose, feature = "voice", onUnlocked }: Props) {
  const [state, setState] = useState<UnlockState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/unlock", { cache: "no-store" });
      if (res.ok) {
        const data: UnlockState = await res.json();
        setState(data);
        if (data.unlocked) onUnlocked?.(data);
      }
    } catch {
      setError("Could not load. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, [onUnlocked]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const thing = feature === "circles" ? "Circles" : "Voice";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Open ${thing.toLowerCase()}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgba(20, 32, 28, 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
        overflowY: "auto",
      }}
    >
      <div
        className="card-mist"
        style={{ maxWidth: 560, width: "100%", position: "relative", maxHeight: "90vh", overflowY: "auto" }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            width: 32,
            height: 32,
            borderRadius: 999,
            color: "var(--calm-ink-40)",
            background: "transparent",
          }}
        >
          ×
        </button>

        {loading && !state ? (
          <p style={{ fontSize: 14, color: "var(--calm-ink-70)" }}>One moment…</p>
        ) : state?.unlocked ? (
          <Unlocked state={state} onClose={onClose} />
        ) : state ? (
          <Gates state={state} feature={feature} reload={load} />
        ) : (
          <p style={{ fontSize: 14, color: "var(--calm-ink-70)" }}>{error ?? "Could not load."}</p>
        )}
      </div>
    </div>
  );
}

function Unlocked({ state, onClose }: { state: UnlockState; onClose: () => void }) {
  const until = state.pass
    ? new Date(state.pass.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
    : null;
  return (
    <>
      <p className="body-micro" style={{ color: "var(--calm-forest)", marginBottom: 8 }}>
        Thank you
      </p>
      <h3 style={{ marginBottom: 12 }}>Voice and circles are open.</h3>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--calm-ink-70)", marginBottom: 16 }}>
        You have {Math.floor(state.voice.remainingSec / 60)} minutes of voice on your account
        {until ? `, and circles until ${until}` : ""}. Minutes are yours; they do not expire at
        the end of a month.
      </p>
      <button type="button" className="btn-primary" onClick={onClose}>
        Start talking
      </button>
    </>
  );
}

function Gates({ state, feature, reload }: { state: UnlockState; feature: "voice" | "circles"; reload: () => Promise<void> }) {
  return (
    <>
      <p className="body-micro" style={{ color: "var(--calm-forest)", marginBottom: 8 }}>
        Two small things
      </p>
      <h3 style={{ marginBottom: 12 }}>
        {feature === "circles" ? "Circles" : "Talking out loud"} opens after these.
      </h3>
      <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--calm-ink-70)", marginBottom: 24 }}>
        Chat with Aura stays free, always. Voice and circles cost real money to run, so they open
        when you have told us how it is going and helped cover the bill.
      </p>

      <Step n={1} done={state.gates.reviewed} title="Tell us how it went">
        {state.gates.reviewed ? (
          <p style={{ fontSize: 14, color: "var(--calm-ink-70)" }}>Done. Thank you for the honesty.</p>
        ) : (
          <ReviewStep onDone={reload} />
        )}
      </Step>

      <Step n={2} done={state.gates.supported} title="Support the work">
        {state.gates.reviewed ? (
          <SupportStep state={state} onDone={reload} />
        ) : (
          <p style={{ fontSize: 14, color: "var(--calm-ink-40)" }}>The first one first.</p>
        )}
      </Step>
    </>
  );
}

function Step({ n, done, title, children }: { n: number; done: boolean; title: string; children: React.ReactNode }) {
  return (
    <section
      style={{
        borderTop: "1px solid var(--calm-ink-10)",
        paddingTop: 20,
        marginTop: 20,
        opacity: done ? 0.75 : 1,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <span
          aria-hidden
          style={{
            width: 26,
            height: 26,
            borderRadius: 999,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 13,
            background: done ? "var(--calm-forest)" : "var(--calm-white)",
            color: done ? "white" : "var(--calm-ink-70)",
            border: "1px solid " + (done ? "var(--calm-forest)" : "var(--calm-ink-10)"),
            flexShrink: 0,
          }}
        >
          {done ? "✓" : n}
        </span>
        <h4 style={{ fontSize: 16, margin: 0 }}>{title}</h4>
      </div>
      {children}
    </section>
  );
}

function ReviewStep({ onDone }: { onDone: () => Promise<void> }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError("Pick a number of stars first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment, publicConsent: consent }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Could not save that.");
        return;
      }
      await onDone();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <p style={{ fontSize: 14, color: "var(--calm-ink-70)", margin: 0 }}>
        An honest rating, high or low. It stays private between you and us unless you tick the box.
      </p>
      <div style={{ display: "flex", gap: 8 }} role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            type="button"
            key={n}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
            aria-pressed={rating === n}
            onClick={() => setRating(n)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: rating >= n ? "var(--calm-forest)" : "transparent",
              color: rating >= n ? "white" : "var(--calm-ink-40)",
              border: "1px solid " + (rating >= n ? "var(--calm-forest)" : "var(--calm-ink-10)"),
              fontSize: 18,
              cursor: "pointer",
            }}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        className="input"
        rows={3}
        placeholder="What worked, what did not? (optional)"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        style={{ resize: "vertical" }}
      />
      <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--calm-ink-70)" }}>
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        You may quote me on the public site (first name only). Entirely optional.
      </label>
      {error && <p style={{ fontSize: 13, color: "var(--calm-ink)" }}>{error}</p>}
      <button type="submit" className="btn-primary" disabled={busy} style={{ alignSelf: "flex-start" }}>
        {busy ? "Saving…" : "Send it"}
      </button>
    </form>
  );
}

function SupportStep({ state, onDone }: { state: UnlockState; onDone: () => Promise<void> }) {
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);
  const [manual, setManual] = useState(false);
  const [ref, setRef] = useState("");
  const [error, setError] = useState<string | null>(null);

  const copy = async () => {
    if (!state.code) return;
    try {
      await navigator.clipboard.writeText(state.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(false);
    }
  };

  const check = async () => {
    setChecking(true);
    setError(null);
    await onDone();
    setChecking(false);
    setError("Not showing yet. Ko-fi can take a minute — or use the line below.");
  };

  const claim = async (e: React.FormEvent) => {
    e.preventDefault();
    setChecking(true);
    setError(null);
    const value = ref.trim();
    const payload = value.includes("@") ? { email: value } : { transactionId: value };
    try {
      const res = await fetch("/api/unlock/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Could not find it.");
        return;
      }
      await onDone();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <p style={{ fontSize: 14, color: "var(--calm-ink-70)", margin: 0 }}>
        Buy the creator a coffee — anything from ${state.minUsd}, whatever this has been worth to
        you. There is no plan to pick and nothing to cancel. The more you can give, the more voice
        we can afford to put on your account, and those minutes are then yours to keep.
      </p>

      {state.code && (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: 10,
            background: "var(--calm-white)",
            border: "1px dashed var(--calm-forest)",
          }}
        >
          <p style={{ fontSize: 13, color: "var(--calm-ink-70)", marginBottom: 8 }}>
            Paste this into the Ko-fi message so the payment finds your account:
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <code style={{ fontSize: 18, letterSpacing: "0.08em", fontWeight: 600 }}>{state.code}</code>
            <button type="button" className="btn-ghost" onClick={copy} style={{ fontSize: 13 }}>
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {state.kofiUrl && (
          <a
            className="btn-primary"
            href={state.kofiUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => void copy()}
          >
            Open Ko-fi
          </a>
        )}
        <button type="button" className="btn-ghost" onClick={check} disabled={checking}>
          {checking ? "Checking…" : "I have paid"}
        </button>
      </div>

      {error && <p style={{ fontSize: 13, color: "var(--calm-ink)", margin: 0 }}>{error}</p>}

      {!manual ? (
        <button
          type="button"
          onClick={() => setManual(true)}
          className="btn-ghost"
          style={{ alignSelf: "flex-start", fontSize: 13 }}
        >
          I paid without the code
        </button>
      ) : (
        <form onSubmit={claim} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <label style={{ fontSize: 13, color: "var(--calm-ink-70)" }}>
            Your Ko-fi transaction id, or the email you paid with.
          </label>
          <input
            className="input"
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            placeholder="0a1b2c3d-… or you@example.com"
          />
          <button type="submit" className="btn-primary" disabled={checking || ref.trim().length < 4} style={{ alignSelf: "flex-start" }}>
            {checking ? "Looking…" : "Find my payment"}
          </button>
        </form>
      )}
    </div>
  );
}
