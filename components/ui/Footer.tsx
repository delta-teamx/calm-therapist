import { Style } from "@/components/ui/Style";
import Link from "next/link";
import { Logo } from "./Logo";
import { SupportLink } from "./SupportLink";
import { BRAND } from "@/lib/brand";

const productLinks = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/features/chat", label: "Chat, free forever" },
  { href: "/features/voice", label: "Voice" },
  { href: "/circles", label: "Circles" },
  { href: "/features/crisis", label: "Crisis safety" },
  { href: "/features", label: "All features" },
  { href: "/#pricing", label: "Founding members" },
];

const learnLinks = [
  { href: "/ai-therapist", label: "AI therapist" },
  { href: "/free-ai-therapist", label: "Free AI therapist" },
  { href: "/what-is-an-ai-therapist", label: "What is an AI therapist?" },
  { href: "/how-does-ai-therapy-work", label: "How AI therapy works" },
  { href: "/is-ai-therapy-effective", label: "Is AI therapy effective?" },
  { href: "/ai-therapist-vs-human-therapist", label: "AI vs human therapist" },
  { href: "/ai-therapist-vs-chatgpt", label: "AI therapist vs ChatGPT" },
  { href: "/ai-therapist-vs-betterhelp", label: "AI therapist vs BetterHelp" },
  { href: "/ai-therapist-vs-wysa", label: "Wysa vs Aura" },
  { href: "/best-free-ai-therapist-apps", label: "Best free AI therapist apps" },
  { href: "/is-ai-therapy-safe", label: "Is AI therapy safe?" },
  { href: "/ai-therapist-late-night", label: "An AI therapist at 2am" },
  { href: "/ai-therapist-in-your-language", label: "In your language" },
  { href: "/glossary", label: "Glossary" },
  { href: "/blog", label: "Blog" },
];

const forLinks = [
  { href: "/for/anxiety", label: "For anxiety" },
  { href: "/for/depression", label: "For depression" },
  { href: "/for/grief", label: "For grief" },
  { href: "/for/burnout", label: "For burnout" },
  { href: "/for/relationships", label: "For relationships" },
];

const companyLinks = [
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export function Footer() {
  return (
    <footer style={{ background: "var(--calm-ink)", color: "white", padding: "80px 24px 32px" }}>
      <div className="container">
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.3fr 1fr 1.1fr 1fr 0.8fr",
            gap: 48,
            marginBottom: 64,
          }}
          className="footer-grid"
        >
          <div>
            <Logo animated={false} />
            <p style={{ marginTop: 16, color: "rgba(255,255,255,0.6)", fontSize: 14, lineHeight: 1.7 }}>
              Backed by{" "}
              <a href="https://implenix.net" style={{ color: "white", textDecoration: "underline" }} target="_blank" rel="noopener noreferrer">
                Implenix.net
              </a>
            </p>
            <p style={{ marginTop: 24, color: "rgba(255,255,255,0.85)", fontSize: 14, fontStyle: "italic", maxWidth: 280 }}>
              Your data belongs to you. Always.
            </p>
            <SupportLink variant="footer" style={{ marginTop: 20, maxWidth: 300 }} />
          </div>

          <FooterColumn title="Product" links={productLinks} />
          <FooterColumn title="Learn" links={learnLinks} />
          <FooterColumn title="For" links={forLinks} />
          <FooterColumn title="Company" links={companyLinks} />
        </div>

        <div
          style={{
            paddingTop: 32,
            borderTop: "1px solid rgba(255,255,255,0.1)",
            display: "flex",
            justifyContent: "space-between",
            color: "rgba(255,255,255,0.5)",
            fontSize: 13,
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <span>© {new Date().getFullYear()} {BRAND.name}. Backed by {BRAND.parent.name}.</span>
          <span style={{ display: "flex", gap: 24 }}>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </span>
        </div>
      </div>

      <Style>{`
        @media (max-width: 768px) {
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</Style>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="body-micro" style={{ color: "rgba(255,255,255,0.5)", marginBottom: 16 }}>
        {title}
      </p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
        {links.map((l) => (
          <li key={l.href + l.label}>
            <Link
              href={l.href}
              style={{ color: "rgba(255,255,255,0.85)", fontSize: 14, transition: "color 0.2s ease" }}
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
