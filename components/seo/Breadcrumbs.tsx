import Link from "next/link";

/** Visible breadcrumbs that match the BreadcrumbList schema on the page. */
export function Breadcrumbs({ items }: { items: { name: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" style={{ fontSize: 13, color: "var(--calm-ink-40)", marginBottom: 20 }}>
      <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexWrap: "wrap", gap: 6 }}>
        {items.map((it, i) => (
          <li key={`${it.name}-${i}`} style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {it.href ? <Link href={it.href} style={{ color: "var(--calm-forest)" }}>{it.name}</Link> : <span aria-current="page">{it.name}</span>}
            {i < items.length - 1 && <span aria-hidden>›</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
