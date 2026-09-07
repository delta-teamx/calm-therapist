import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { FeelItFirst } from "@/components/landing/FeelItFirst";
import { AgentDemo } from "@/components/landing/AgentDemo";
import { ConditionPaths } from "@/components/landing/ConditionPaths";
import { ThreeWays } from "@/components/landing/ThreeWays";
import { HowAuraTalks } from "@/components/landing/HowAuraTalks";
import { SafetyBlock } from "@/components/landing/SafetyBlock";
import { Languages } from "@/components/landing/Languages";
import { HomeFaq } from "@/components/landing/HomeFaq";
import { PrivacyBlock } from "@/components/landing/Privacy";
import { Pricing } from "@/components/landing/Pricing";
import { FoundingStrip } from "@/components/landing/FoundingStrip";
import { CirclesSection } from "@/components/landing/CirclesSection";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { LeadPopupLazy } from "@/components/landing/LeadPopupLazy";
import { JsonLd, organizationSchema, softwareApplicationSchema, webSiteSchema } from "@/lib/seo";
import { BRAND } from "@/lib/brand";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: { absolute: `Free AI Therapist That Remembers You | ${BRAND.name}` },
  description: `Talk to Aura, a free AI therapist, any hour. Voice when typing is too much, anonymous circles when you want company, crisis-aware from the first message. English, Urdu, Hindi, Arabic, Spanish, French.`,
  alternates: { canonical: BRAND.url },
};

export default function HomePage() {
  return (
    <>
      <JsonLd data={organizationSchema()} />
      <JsonLd data={softwareApplicationSchema()} />
      <JsonLd data={webSiteSchema()} />
      <Navbar />
      <main>
        <FeelItFirst />
        <FoundingStrip />
        <ThreeWays />
        <HowAuraTalks />
        <AgentDemo />
        <CirclesSection />
        <SafetyBlock />
        <Languages />
        <ConditionPaths />
        <PrivacyBlock />
        <HomeFaq />
        <Pricing />
        <FinalCTA />
      </main>
      <Footer />
      <LeadPopupLazy />
    </>
  );
}
