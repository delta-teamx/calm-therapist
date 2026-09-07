import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";
import { RegisterServiceWorker } from "@/components/ui/RegisterServiceWorker";
import { BRAND } from "@/lib/brand";
import { Analytics } from "@/components/ui/Analytics";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-heading",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-body",
  display: "swap",
});

const BASE_URL = BRAND.url;

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  manifest: "/manifest.webmanifest",
  alternates: { types: { "application/rss+xml": [{ url: "/feed.xml", title: `${BRAND.name} blog` }] } },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION } : undefined,
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: BRAND.name },
  title: {
    default: `${BRAND.name} — Free AI Therapist That Remembers You`,
    template: `%s | ${BRAND.name}`,
  },
  description: BRAND.description,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: BRAND.name,
    title: `${BRAND.name} — Free AI Therapist That Remembers You`,
    description: BRAND.description,
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: BRAND.name,
    description: BRAND.tagline,
    images: ["/og-image.png"],
  },
  robots: { index: !process.env.CONTEXT || process.env.CONTEXT === "production", follow: true },
  icons: { icon: "/favicon.svg", apple: "/icons/icon-192.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${dmSans.variable}`}>
      <body>
        {children}
        <RegisterServiceWorker />
        <Analytics />
      </body>
    </html>
  );
}
