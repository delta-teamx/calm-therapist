import Script from "next/script";

/**
 * Cookieless analytics, on only when a domain is configured. Plausible sets no
 * cookies and stores no personal data, so no consent banner is needed.
 */
export function Analytics() {
  const domain = process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  if (!domain) return null;
  const host = process.env.NEXT_PUBLIC_PLAUSIBLE_HOST ?? "https://plausible.io";
  return <Script defer data-domain={domain} src={`${host}/js/script.outbound-links.js`} strategy="afterInteractive" />;
}
