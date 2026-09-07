"use client";

import { useEffect, useState } from "react";
import { readState, writeState } from "@/components/onboarding/OnboardingShell";
import { SupportLink } from "@/components/ui/SupportLink";
import type { Access } from "@/lib/access";

interface Me {
  email: string;
  name: string;
  plan: "free" | "pro";
  memberNumber: number | null;
  emailOptOut: boolean;
  access: Access;
  accessLine: string;
}

interface Quota {
  monthlyLimitSec: number;
  monthlyUsedSec: number;
  monthlyRemainingSec: number;
}

export default function SettingsPage() {
  const [language, setLanguage] = useState("en");
  const [tone, setTone] = useState("warm");
  const [crisisName, setCrisisName] = useState("");
  const [crisisPhone, setCrisisPhone] = useState("");
  const [me, setMe] = useState<Me | null>(null);
  const [emailOptOut, setEmailOptOut] = useState(false);
  const [saved, setSaved] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const s = readState() as Record<string, string>;
    if (s.language) setLanguage(s.language);
    if (s.tone) setTone(s.tone);
    if (s.crisisContactName) setCrisisName(s.crisisContactName);
    if (s.crisisContactPhone) setCrisisPhone(s.crisisContactPhone);

    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data: { user: Me | null }) => {
        setMe(data.user);
        if (data.user) setEmailOptOut(data.user.emailOptOut);
      })
      .catch(() => {});
    fetch("/api/users/me/profile")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { profile?: { language?: string; tone?: string; crisisContactName?: string; crisisContactPhone?: string } } | null) => {
        const p = d?.profile;
        if (!p) return;
        if (p.language) setLanguage(p.language);
        if (p.tone) setTone(p.tone as typeof tone);
        if (p.crisisContactName) setCrisisName(p.crisisContactName);
        if (p.crisisContactPhone) setCrisisPhone(p.crisisContactPhone);
      })
      .catch(() => {});
  }, []);

  const save = async () => {
    writeState({ language, tone, crisisContactName: crisisName, crisisContactPhone: crisisPhone });
    setSaved(null);
    try {
      const res = await fetch("/api/users/me/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language, tone, emailOptOut, crisisContactName: crisisName, crisisContactPhone: crisisPhone }),
      });
      setSaved(res.ok ? "Saved." : "Saved on this device. Could not reach the server.");
    } catch {
      setSaved("Saved on this device. Could not reach the server.");
    }
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/auth/login";
  };

  const deleteAccount = async () => {
    const sure = window.confirm(
      "This deletes your account, your sessions, memories, journal, and goals. It cannot be undone. Continue?"
    );
    if (!sure) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/users/me", { method: "DELETE" });
      if (res.ok) {
        try {
          window.localStorage.clear();
        } catch {}
        window.location.href = "/";
        return;
      }
      const data = await res.json().catch(() => ({}));
      window.alert(data.error ?? "Could not delete the account.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ padding: "48px 32px", maxWidth: 880, margin: "0 auto" }}>
      <h2 style={{ marginBottom: 32 }}>Settings</h2>

      {me && (
        <div className="card" style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <p className="body-micro" style={{ color: "var(--calm-forest)" }}>Account</p>
            <p style={{ fontSize: 16, marginTop: 6 }}>{me.name} · {me.email}</p>
          </div>
          <span
            style={{
              padding: "6px 12px",
              borderRadius: 999,
              background: me.access.tier === "member" ? "var(--calm-mist)" : "var(--calm-forest)",
              color: me.access.tier === "member" ? "var(--calm-ink)" : "white",
              fontSize: 12,
              fontWeight: 500,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {me.access.tier === "founding"
              ? `Founding member${me.memberNumber ? ` #${me.memberNumber}` : ""}`
              : me.access.tier === "pro"
              ? "Open space"
              : "Member"}
          </span>
        </div>
      )}

      <Membership me={me} />

      <Group title="Voice & language">
        <Field label="Preferred language">
          <select className="input" value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="en">English</option>
            <option value="ur">Urdu</option>
            <option value="hi">Hindi</option>
            <option value="ar">Arabic</option>
            <option value="es">Spanish</option>
            <option value="fr">French</option>
          </select>
        </Field>
        <Field label="Tone">
          <select className="input" value={tone} onChange={(e) => setTone(e.target.value)}>
            <option value="warm">Warm and gentle</option>
            <option value="direct">Direct and clear</option>
            <option value="clinical">Clinical and structured</option>
          </select>
        </Field>
      </Group>

      <Group title="Email">
        <label style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", gap: 16 }}>
          <span style={{ fontSize: 15 }}>
            Send me check-ins and updates by email
            <span style={{ display: "block", fontSize: 13, color: "var(--calm-ink-40)", marginTop: 4 }}>
              Account emails such as password resets are always sent.
            </span>
          </span>
          <input type="checkbox" checked={!emailOptOut} onChange={(e) => setEmailOptOut(!e.target.checked)} />
        </label>
      </Group>

      <Group title="Crisis contact">
        <Field label="Trusted person (optional)">
          <input className="input" placeholder="Their name" value={crisisName} onChange={(e) => setCrisisName(e.target.value)} />
        </Field>
        <Field label="Phone number">
          <input className="input" placeholder="Including country code" value={crisisPhone} onChange={(e) => setCrisisPhone(e.target.value)} />
        </Field>
      </Group>

      <div style={{ display: "flex", gap: 12, marginTop: 32, flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={save} className="btn-primary">Save changes</button>
        <button onClick={logout} className="btn-ghost">Log out</button>
        {saved && <span style={{ fontSize: 13, color: "var(--calm-forest)" }}>{saved}</span>}
      </div>

      <section style={{ marginTop: 56, paddingTop: 24, borderTop: "1px solid var(--calm-ink-10)" }}>
        <p className="body-micro" style={{ color: "var(--calm-ink-40)", marginBottom: 12 }}>Delete account</p>
        <p style={{ fontSize: 14, color: "var(--calm-ink-70)", maxWidth: 560, lineHeight: 1.7 }}>
          Removes your account and everything attached to it from our servers. Safety records are kept
          without your identity, as described in the privacy policy.
        </p>
        <button onClick={deleteAccount} className="btn-ghost" disabled={deleting} style={{ marginTop: 12, color: "var(--calm-ink)" }}>
          {deleting ? "Deleting…" : "Delete my account"}
        </button>
      </section>
    </div>
  );
}

function Membership({ me }: { me: Me | null }) {
  const [quota, setQuota] = useState<Quota | null>(null);

  useEffect(() => {
    if (!me?.access.voice) return;
    fetch("/api/voice/quota")
      .then((r) => r.json())
      .then((d: Quota) => setQuota(d))
      .catch(() => {});
  }, [me?.access.voice]);

  if (!me) return null;
  const usedMin = quota ? Math.floor(quota.monthlyUsedSec / 60) : 0;
  const limitMin = quota ? Math.floor(quota.monthlyLimitSec / 60) : me.access.voiceMinutesPerMonth;
  const pct = limitMin === 0 ? 0 : Math.min(100, (usedMin / limitMin) * 100);

  return (
    <Group title="Membership">
      <div className="card" style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
        <p style={{ fontSize: 16, lineHeight: 1.6, margin: 0 }}>{me.accessLine}</p>
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
          <Row ok label="Chat with Aura, unlimited" />
          <Row ok={me.access.voice} label={me.access.voice ? `Voice sessions, ${me.access.voiceMinutesPerMonth} minutes a month` : "Voice sessions"} />
          <Row ok={me.access.circles} label="A seat in circles when they open" />
        </ul>
        {me.access.voice && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <span className="body-micro" style={{ color: "var(--calm-ink-40)" }}>Voice this month</span>
              <span style={{ fontSize: 13, color: "var(--calm-ink-70)" }}>{usedMin} / {limitMin} min</span>
            </div>
            <div style={{ height: 6, background: "var(--calm-ink-10)", borderRadius: 999, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: "var(--calm-forest)", transition: "width 0.4s ease" }} />
            </div>
            <p style={{ marginTop: 6, fontSize: 12, color: "var(--calm-ink-40)" }}>Resets on the 1st. Counted from the call itself, after it ends.</p>
          </div>
        )}
        {me.access.tier === "member" && (
          <p style={{ fontSize: 14, color: "var(--calm-ink-70)", lineHeight: 1.7, margin: 0 }}>
            Voice and circles are part of an open space. Prices will appear here when they are ready.
            Nothing is for sale yet.
          </p>
        )}
      </div>
      <SupportLink variant="card" />
    </Group>
  );
}

function Row({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: ok ? "var(--calm-ink)" : "var(--calm-ink-40)" }}>
      <span aria-hidden style={{ width: 18, textAlign: "center", color: ok ? "var(--calm-forest)" : "var(--calm-ink-40)" }}>{ok ? "✓" : "–"}</span>
      {label}
    </li>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 40, paddingBottom: 32, borderBottom: "1px solid var(--calm-ink-10)" }}>
      <p className="body-micro" style={{ color: "var(--calm-forest)", marginBottom: 16 }}>{title}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <span style={{ fontSize: 13, color: "var(--calm-ink-40)" }}>{label}</span>
      {children}
    </label>
  );
}
