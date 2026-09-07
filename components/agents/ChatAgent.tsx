"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { AgentModeKey, UserProfile } from "@/lib/aura";
import type { ModeKey } from "@/lib/features";
import { ModeBar } from "./ModeBar";
import { CrisisBanner } from "./CrisisBanner";
import { Aftercare } from "./Aftercare";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface ChatAgentProps {
  profile: UserProfile;
  mode?: ModeKey;
  memoryCount: number;
  sessionNumber: number;
  onSwitchToVoice?: () => void;
  initialOpener?: string;
}

export function ChatAgent({
  profile,
  mode = "chat",
  memoryCount,
  sessionNumber,
  onSwitchToVoice,
  initialOpener,
}: ChatAgentProps) {
  const opener =
    initialOpener ??
    (sessionNumber === 1
      ? `Hi ${profile.name}. I'm glad you came. We can take this slow. What's on your mind?`
      : `Hi ${profile.name}. Last time you mentioned a few things were sitting heavy. How are you arriving today?`);

  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: opener, timestamp: new Date().toISOString() },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [activeMode, setActiveMode] = useState<AgentModeKey | null>(null);
  const [crisisTier, setCrisisTier] = useState(0);
  const [wrappingUp, setWrappingUp] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [dateLine, setDateLine] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  sessionIdRef.current = sessionId;

  useEffect(() => {
    setDateLine(new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" }));
    // Continue today's conversation if there is one, so a reload keeps the thread.
    fetch("/api/sessions/current?mode=chat")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { session?: { id: string; transcript: { role: "user" | "assistant"; content: string; at: string }[] } | null } | null) => {
        const s = d?.session;
        if (!s) return;
        setSessionId(s.id);
        if (s.transcript.length) {
          setMessages([
            { role: "assistant", content: `Welcome back, ${profile.name}. We can pick up where we left off.`, timestamp: s.transcript[0].at },
            ...s.transcript.map((t) => ({ role: t.role, content: t.content, timestamp: t.at })),
          ]);
        }
      })
      .catch(() => {});
    // On tab close, let Aura write her note for the session.
    const onHide = () => {
      const id = sessionIdRef.current;
      if (!id || typeof navigator.sendBeacon !== "function") return;
      navigator.sendBeacon(`/api/sessions/${id}/close`, new Blob(["{}"], { type: "application/json" }));
    };
    window.addEventListener("pagehide", onHide);
    return () => {
      window.removeEventListener("pagehide", onHide);
      abortRef.current?.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Mode resets to None each new browser tab/session — but persists while
    // the user is bouncing around the dashboard within a single tab.
    try {
      const raw = window.sessionStorage.getItem("calm-therapist:active-mode");
      if (raw) setActiveMode(raw as AgentModeKey);
      // Clear any old localStorage entries from earlier multi-select build.
      window.localStorage.removeItem("calm-therapist:active-mode");
      window.localStorage.removeItem("calm-therapist:active-modes");
    } catch {}
  }, []);

  const persistMode = (next: AgentModeKey | null) => {
    setActiveMode(next);
    try {
      if (next) window.sessionStorage.setItem("calm-therapist:active-mode", next);
      else window.sessionStorage.removeItem("calm-therapist:active-mode");
    } catch {}
  };

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages]);

  const send = async () => {
    if (!input.trim() || streaming) return;
    const userMsg: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };
    const next = [...messages, userMsg];
    setMessages([...next, { role: "assistant", content: "", timestamp: new Date().toISOString() }]);
    setInput("");
    setStreaming(true);
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          // The greeting is shown, not sent: the conversation starts with the person.
          messages: next.filter((m, i) => !(i === 0 && m.role === "assistant")).map((m) => ({ role: m.role, content: m.content })),
          profile: { ...profile, activeModes: activeMode ? [activeMode] : [] },
          mode,
          sessionId,
        }),
      });
      if (!res.ok) {
        const text = (await res.text().catch(() => "")) || "Something went wrong on our side.";
        // Not Aura's words: drop the empty assistant turn and show a notice.
        setMessages((msgs) => msgs.slice(0, -1));
        setNotice(res.status === 429 ? text : res.status === 401 ? "Your session expired. Sign in again to keep talking." : text);
        return;
      }
      if (!res.body) throw new Error("No body");
      const sid = res.headers.get("X-Session-Id");
      if (sid && sid !== sessionId) setSessionId(sid);
      const tierHeader = Number(res.headers.get("X-Crisis-Tier") ?? "0");
      if (tierHeader > 0) {
        setCrisisTier(tierHeader);
        // Fire-and-forget: schedule a 24h check-in email for tier 2+.
        fetch("/api/email/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: "crisis-flagged", tier: tierHeader }),
        }).catch(() => {});
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        // Strip the optional [crisis_tier:N] header chunk emitted by the server.
        const errIdx = acc.indexOf("\n[error]");
        if (errIdx !== -1) {
          setNotice(acc.slice(errIdx + 9).trim());
          acc = acc.slice(0, errIdx);
        }
        const cleaned = acc.replace(/\n?\[crisis_tier:\d+\]\n?/g, "");
        setMessages((msgs) => {
          const copy = [...msgs];
          copy[copy.length - 1] = { ...copy[copy.length - 1], content: cleaned };
          return copy;
        });
      }
    } catch (err) {
      if ((err as { name?: string }).name === "AbortError") return;
      console.error(err);
      setMessages((msgs) => msgs.slice(0, -1));
      setNotice("Something went wrong on our side. Try again in a moment.");
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  if (wrappingUp) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
        <Aftercare name={profile.name} onClose={() => setWrappingUp(false)} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", maxWidth: 760, margin: "0 auto", width: "100%" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 24px",
          borderBottom: "1px solid var(--calm-ink-10)",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
          <span className="body-micro" style={{ color: "var(--calm-ink-40)" }}>
            Session {sessionNumber}{dateLine ? ` · ${dateLine}` : ""}
          </span>
          <span style={{ fontSize: 13, color: "var(--calm-forest)", marginTop: 4, display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span
              aria-hidden
              style={{ width: 6, height: 6, borderRadius: 999, background: "var(--calm-forest)", display: "inline-block" }}
            />
            {memoryCount === 0 ? "Aura is getting to know you" : `Aura remembers ${memoryCount} ${memoryCount === 1 ? "thing" : "things"} about you`}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ModeBar active={activeMode} onChange={persistMode} />
          <button
            type="button"
            onClick={() => {
              setWrappingUp(true);
              // Close the conversation so Aura writes her note, then reset
              // the inactivity ladder. No session content is emailed.
              if (sessionId) {
                fetch(`/api/sessions/${sessionId}/close`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}", keepalive: true })
                  .then(() => setSessionId(null))
                  .catch(() => {});
              }
              fetch("/api/email/track", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ kind: "session-ended" }),
              }).catch(() => {});
            }}
            className="btn-ghost"
            style={{ height: 36, fontSize: 13 }}
            disabled={messages.length < 2}
            title="Wrap up the session"
          >
            Wrap up
          </button>
        </div>
      </div>


      {crisisTier > 0 && (
        <CrisisBanner tier={crisisTier} country={profile.culture?.countryOfResidence} onDismiss={() => setCrisisTier(0)} />
      )}

      {notice && (
        <div role="status" style={{ margin: "12px 24px 0", padding: "10px 14px", borderRadius: 10, background: "var(--calm-mist)", fontSize: 13, color: "var(--calm-ink-70)", display: "flex", justifyContent: "space-between", gap: 12 }}>
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="btn-ghost" style={{ height: 24, fontSize: 12, padding: "0 8px" }}>Dismiss</button>
        </div>
      )}

      <div ref={threadRef} className="subtle-scroll" style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
        {messages.map((m, i) => (
          <motion.div
            key={i}
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            style={{
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                background: m.role === "user" ? "var(--calm-white)" : "var(--calm-mist)",
                border: "1px solid var(--calm-ink-10)",
                borderRadius: 12,
                padding: "14px 18px",
                maxWidth: "82%",
                fontSize: 16,
                lineHeight: 1.7,
                color: "var(--calm-ink)",
                whiteSpace: "pre-wrap",
              }}
            >
              {m.content || (streaming && i === messages.length - 1 ? "…" : "")}
            </div>
          </motion.div>
        ))}
      </div>

      <div style={{ padding: 16, borderTop: "1px solid var(--calm-ink-10)", background: "var(--calm-white)" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", maxWidth: 760, margin: "0 auto" }}>
          <textarea
            ref={taRef}
            className="input"
            placeholder="Take your time."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKey}
            rows={1}
            style={{ resize: "none", minHeight: 48, maxHeight: 160 }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || streaming}
            className="btn-primary"
            style={{ height: 48 }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
