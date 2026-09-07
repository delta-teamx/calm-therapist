import type { Metadata } from "next";
import { BRAND } from "./brand";

const BASE_URL = BRAND.url;

interface PageMetaArgs {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
}

export function pageMetadata({ title, description, path, ogImage = "/og-image.png" }: PageMetaArgs): Metadata {
  const url = `${BASE_URL}${path}`;
  return {
    // Absolute: page titles already carry the brand, so the root template must not append it again.
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "Calm Therapist",
      images: [{ url: ogImage, width: 1200, height: 630 }],
      type: "website",
    },
    twitter: { card: "summary_large_image", title, description, images: [ogImage] },
  };
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND.name,
    url: BASE_URL,
    logo: `${BASE_URL}/og-image.png`,
    parentOrganization: { "@type": "Organization", name: BRAND.parent.name, url: BRAND.parent.url },
    sameAs: [BRAND.parent.url, ...(process.env.NEXT_PUBLIC_SOCIAL_URLS ?? "").split(",").map((s) => s.trim()).filter(Boolean)],
    description: BRAND.description,
  };
}

/** Names the site for sitelinks and the knowledge panel. */
export function webSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: BRAND.name,
    url: BASE_URL,
    inLanguage: ["en", "ur", "hi", "ar", "es", "fr"],
    publisher: { "@type": "Organization", name: BRAND.parent.name, url: BRAND.parent.url },
  };
}

/** Articles are published by the organisation, not a named person. */
export function authorSchema() {
  return { "@type": "Organization", name: BRAND.name, url: BASE_URL };
}

export function faqSchema(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function articleSchema(args: {
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  updatedAt?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: args.title,
    description: args.description,
    datePublished: args.publishedAt,
    dateModified: args.updatedAt ?? args.publishedAt,
    author: authorSchema(),
    publisher: {
      "@type": "Organization",
      name: BRAND.name,
      logo: { "@type": "ImageObject", url: `${BASE_URL}/og-image.png` },
    },
    image: [`${BASE_URL}/og-image.png`],
    inLanguage: "en",
    mainEntityOfPage: { "@type": "WebPage", "@id": `${BASE_URL}/blog/${args.slug}` },
  };
}

export function howToSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How ${BRAND.name} works`,
    step: [
      { "@type": "HowToStep", position: 1, name: "Say one sentence", text: "Try Aura on the homepage with no signup. One message, one reply." },
      { "@type": "HowToStep", position: 2, name: "Tell Aura who you are", text: "A five-minute onboarding: what is on your mind, how you want to be spoken to, your language and culture." },
      { "@type": "HowToStep", position: 3, name: "Chat or talk", text: "Chat is free, always. Voice when typing is too much. Aura remembers across both." },
      { "@type": "HowToStep", position: 4, name: "Sit in a circle", text: "Small anonymous rooms of people carrying the same thing, hosted by Aura, once circles open." },
    ],
  };
}

/** The product as a free web app, for rich results on "free AI therapist" queries. */
export function softwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: BRAND.name,
    applicationCategory: "HealthApplication",
    operatingSystem: "Web",
    url: BASE_URL,
    description: BRAND.description,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD", description: "Chat with Aura is free for everyone." },
    featureList: ["Free AI therapist chat", "Voice sessions", "Anonymous support circles", "Crisis-aware safety layer", "Memory across sessions", "English, Urdu, Hindi, Arabic, Spanish, French"],
    publisher: { "@type": "Organization", name: BRAND.parent.name, url: BRAND.parent.url },
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${BASE_URL}${it.path}`,
    })),
  };
}

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
