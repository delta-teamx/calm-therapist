/**
 * "Support the creator" line.
 *
 * Supporting on Ko-fi is what opens voice and circles, so this says that
 * plainly rather than describing itself as a pure tip. The actual unlock
 * happens in the dashboard dialog, which knows the account; this is only
 * the public-facing invitation. Renders nothing when NEXT_PUBLIC_KOFI_URL
 * is unset.
 */
export function SupportLink({
  variant = "inline",
  style,
}: {
  variant?: "inline" | "card" | "footer";
  style?: React.CSSProperties;
}) {
  const url = process.env.NEXT_PUBLIC_KOFI_URL;
  if (!url) return null;

  if (variant === "footer") {
    return (
      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.7, ...style }}>
        Chat with Aura is free, always. Voice and circles open when you{" "}
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: "white", textDecoration: "underline" }}>
          support the work
        </a>
        .
      </p>
    );
  }

  if (variant === "card") {
    return (
      <div
        className="card"
        style={{
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 10,
          background: "var(--calm-mist)",
          border: "1px solid var(--calm-forest-20)",
          ...style,
        }}
      >
        <p className="body-micro" style={{ color: "var(--calm-forest)" }}>Chat is free, always</p>
        <p style={{ fontSize: 15, lineHeight: 1.7, color: "var(--calm-ink-70)", margin: 0 }}>
          Voice and circles run on metered providers, so they open when you support the work, from
          $5. Sign in first — the unlock happens inside your dashboard, where we can put the
          minutes on your account.
        </p>
        <a href={url} target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{ alignSelf: "flex-start" }}>
          See the Ko-fi page
        </a>
      </div>
    );
  }

  return (
    <p style={{ fontSize: 13, color: "var(--calm-ink-40)", ...style }}>
      Chat is free, always. Voice and circles open from $5 —{" "}
      <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--calm-forest)" }}>
        support the work
      </a>
      .
    </p>
  );
}
