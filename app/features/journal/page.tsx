import { FeaturePageTemplate } from "@/components/seo/FeaturePage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Weekly Journal | Patterns You Couldn't See | Calm Therapist",
  description:
    "AI-powered weekly journaling that reads back to you what you didn't notice. Calm Therapist's Weekly Journal turns scattered sessions into a coherent story.",
  path: "/features/journal",
});

export default function JournalModePage() {
  return (
    <FeaturePageTemplate
      slug="journal"
      label="Weekly Journal"
      oneLiner="A private space to track your week. Calm Therapist surfaces patterns you didn't notice."
      problem={{
        title: "You can't see your own pattern.",
        body:
          "When you're inside a week, the week looks like noise. From outside, it looks like a pattern. Calm Therapist sits outside the week, with all your sessions in view, and shows you what you said.",
      }}
      steps={[
        { title: "Write briefly", body: "Three lines is enough. The week doesn't need a thesis." },
        { title: "Calm Therapist reviews", body: "It cross-references your sessions, mood check-ins, and journal entries." },
        { title: "Read what you missed", body: "A 3-paragraph weekly read of patterns you wouldn't have caught yourself." },
      ]}
      who={[
        { title: "If you've journaled before", body: "You know writing helps. Calm Therapist gives you the analyst you were missing." },
        { title: "If you've never journaled", body: "Three lines is the rule. Calm Therapist does the thinking." },
        { title: "If you forget how the week went", body: "By Sunday, Monday's argument has vanished. The journal holds what your memory let go." },
      ]}
      related={[
        { href: "/features/reflect", label: "Monthly Reflect" },
        { href: "/features/chat", label: "Chat Agent" },
        { href: "/for/burnout", label: "For Burnout" },
      ]}
      body={[
        "Most therapy apps treat journaling as a feature. Calm Therapist treats it as the connective tissue. Every chat and voice session is automatically pulled into the weekly journal — you don't have to remember anything to use it.",
        "The Weekly Journal is the only place where Calm Therapist will surface emotional themes proactively. You'll see a pattern named — gently, in your own words back to you. Sometimes that's the first time you've seen it.",
        "Your journal is yours. You can edit it and delete any entry. Calm Therapist will never publish, share, or train on what you write here. That promise is the foundation of why journaling works in the first place.",
        "Used together with the Monthly Reflect, the journal becomes a longitudinal record — not of \"progress\", but of presence. Calm Therapist isn't here to make you better. It's here to make you visible to yourself.",
      ]}
    />
  );
}
