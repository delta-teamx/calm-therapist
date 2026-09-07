import { FeaturePageTemplate } from "@/components/seo/FeaturePage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Crisis Safety | How Aura Handles the Hard Nights | Calm Therapist",
  description:
    "When things get serious. Calm Therapist's Crisis Safe mode grounds you, surfaces verified crisis resources, and connects you to a real person within minutes.",
  path: "/features/crisis",
});

export default function CrisisModePage() {
  return (
    <FeaturePageTemplate
      slug="crisis"
      label="Crisis Safe"
      oneLiner="When things get serious. Immediate grounding, and a real human if needed."
      problem={{
        title: "Most AI fails when it matters most.",
        body:
          "Other AI therapy products have given dangerous responses to suicidal users. Some have ignored signals entirely. Calm Therapist treats crisis as the highest-priority mode and switches into it automatically when safety language appears.",
      }}
      steps={[
        { title: "Automatic detection", body: "Calm Therapist watches for crisis signals across every mode and escalates immediately." },
        { title: "Grounding first", body: "Before anything else, one short grounding question to establish present-moment safety." },
        { title: "Human backup", body: "If needed, Calm Therapist connects you to a verified crisis line for your region — and stays with you while you decide." },
      ]}
      who={[
        { title: "If you're not sure how serious it is", body: "Calm Therapist will not minimise you. It will not tell you you're fine when you're not." },
        { title: "If you've reached out before and been failed", body: "Crisis Safe was designed by reviewing exactly the failures that hurt people on other platforms." },
        { title: "If you want a real person", body: "Calm Therapist is not a replacement for human help. Crisis Safe makes the handoff fast." },
      ]}
      related={[
        { href: "/features/voice", label: "Voice Agent" },
        { href: "/features/chat", label: "Chat Agent" },
        { href: "/for/depression", label: "For Depression" },
      ]}
      body={[
        "Crisis Safe is the only mode in Calm Therapist that activates automatically. If your language indicates suicidal ideation, self-harm intent, or immediate danger, the system shifts. It does not pretend nothing happened. It does not change subject. It does not give you a hotline number and disappear.",
        "The protocol is specific: Calm Therapist acknowledges what you said, asks one grounding question, surfaces the verified crisis line for your country, and offers to stay with you while you make the call. If you've added a trusted contact in your settings, Calm Therapist will offer to help you reach them.",
        "Crisis Safe was built by reviewing real failures from other AI therapy products — products that minimised, deflected, or in the worst cases provided harmful information. Calm Therapist's crisis system is rule-based first and AI-augmented second, because the rules are the part that has to never fail.",
        "Calm Therapist is not a replacement for clinical care. If you are in immediate danger, call your local emergency number or visit the nearest emergency room. Crisis Safe is designed to bridge you to that help — never to substitute for it.",
      ]}
    />
  );
}
