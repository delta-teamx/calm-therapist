"use client";

import { useConversation } from "@11labs/react";
import { useEffect, useRef, useState } from "react";
import type { UserProfile } from "@/lib/aura";

interface VoiceAgentProps {
  profile: UserProfile;
  /** Called after the server has recorded the session's real duration. */
  onSessionRecorded?: () => void;
  onSwitchToChat?: () => void;
}

interface TranscriptEntry {
  role: "user" | "agent";
  content: string;
  timestamp: string;
}

interface StartResponse {
  signedUrl?: string;
  sessionId?: string;
  overrides?: {
    agent?: { prompt?: { prompt: string }; firstMessage?: string };
    tts?: { voiceId?: string };
  };
  error?: string;
}

/**
 * The browser never starts a session on its own. It asks the server for a
 * signed URL; the server checks membership and minutes, composes Aura's
 * prompt, and mints the URL. After the call, the server reads the real
 * duration from ElevenLabs.
 */
export function VoiceAgent({ profile, onSessionRecorded, onSwitchToChat }: VoiceAgentProps) {
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const sessionIdRef = useRef<string | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const startedAtRef = useRef<string | null>(null);
  const transcriptRef2 = useRef<{ role: "agent" | "user"; content: string; timestamp: string }[]>([]);

  const conversation = useConversation({
    onConnect: () => setError(null),
    onDisconnect: () => {
      const sessionId = sessionIdRef.current;
      const conversationId = conversationIdRef.current;
      sessionIdRef.current = null;
      conversationIdRef.current = null;
      if (!sessionId || !conversationId) return;
      const turns = transcriptRef2.current.map((t) => ({ role: t.role === "agent" ? "assistant" : "user", content: t.content, at: t.timestamp }));
      const body = JSON.stringify({ sessionId, conversationId, transcript: turns, startedAt: startedAtRef.current });
      // Recording happens server-side from ElevenLabs' own record. Beacon
      // survives tab close; fetch covers the normal path and refreshes quota.
      if (typeof navigator.sendBeacon === "function") {
        navigator.sendBeacon("/api/voice/record", new Blob([body], { type: "application/json" }));
      }
      fetch("/api/voice/record", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true })
        .then(() => onSessionRecorded?.())
        .catch(() => {});
    },
    onMessage: ({ message, source }: { message: string; source: "user" | "ai" }) => {
      const turn = { role: (source === "ai" ? "agent" : "user") as "agent" | "user", content: message, timestamp: new Date().toISOString() };
      transcriptRef2.current = [...transcriptRef2.current, turn];
      setTranscript((prev) => [...prev, turn]);
    },
    onError: (err: unknown) => {
      console.error("ElevenLabs error:", err);
      setError("Couldn't connect to voice. You can try again or switch to chat.");
    },
  });

  const startSession = async () => {
    setIsRequesting(true);
    startedAtRef.current = new Date().toISOString();
    transcriptRef2.current = [];
    setError(null);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError("Microphone access is needed for voice mode.");
      setIsRequesting(false);
      return;
    }
    try {
      const res = await fetch("/api/elevenlabs-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });
      const data = (await res.json()) as StartResponse;
      if (!res.ok || !data.signedUrl) {
        setError(data.error ?? "Voice is not available right now.");
        return;
      }
      sessionIdRef.current = data.sessionId ?? null;
      // startSession resolves with the ElevenLabs conversation id.
      const conversationId = await conversation.startSession({ signedUrl: data.signedUrl, overrides: data.overrides });
      conversationIdRef.current = typeof conversationId === "string" ? conversationId : null;
    } catch (err) {
      console.error("Voice session failed", err);
      setError("Couldn't start the session. Try again in a moment.");
    } finally {
      setIsRequesting(false);
    }
  };

  const endSession = async () => {
    await conversation.endSession();
  };

  useEffect(() => {
    if (transcriptRef.current) transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
  }, [transcript]);

  const isConnected = conversation.status === "connected";
  const agentSpeaking = conversation.isSpeaking;
  const stateClass = !isConnected ? "idle" : agentSpeaking ? "speaking" : "listening";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 32, padding: "48px 24px", maxWidth: 720, margin: "0 auto" }}>
      <div className={`voice-waveform ${stateClass}`}>
        <div className="ring ring-1" />
        <div className="ring ring-2" />
        <div className="ring ring-3" />
        <div className="ring-core" />
      </div>

      <p className="body-micro" style={{ color: "var(--calm-ink-40)" }}>
        {!isConnected && "Ready"}
        {isConnected && !agentSpeaking && "Listening"}
        {isConnected && agentSpeaking && "Aura is speaking"}
      </p>

      {error && (
        <p style={{ color: "var(--calm-ink)", fontSize: 14, textAlign: "center", maxWidth: 480 }}>{error}</p>
      )}

      {transcript.length > 0 && (
        <div
          ref={transcriptRef}
          className="subtle-scroll"
          style={{ width: "100%", maxWidth: 560, maxHeight: 280, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12 }}
        >
          {transcript.map((entry, i) => (
            <div
              key={i}
              style={{
                alignSelf: entry.role === "user" ? "flex-end" : "flex-start",
                background: entry.role === "user" ? "var(--calm-white)" : "var(--calm-mist)",
                border: "1px solid var(--calm-ink-10)",
                borderRadius: 12,
                padding: "12px 16px",
                maxWidth: "82%",
                fontSize: 15,
                lineHeight: 1.6,
                color: "var(--calm-ink)",
              }}
            >
              {entry.content}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        {!isConnected ? (
          <button onClick={startSession} disabled={isRequesting} className="btn-primary" style={{ minWidth: 180 }}>
            {isRequesting ? "Connecting..." : "Start voice session"}
          </button>
        ) : (
          <button onClick={endSession} className="btn-ghost">End session</button>
        )}
        {onSwitchToChat && (
          <button onClick={onSwitchToChat} className="btn-ghost">Switch to chat</button>
        )}
      </div>
    </div>
  );
}
