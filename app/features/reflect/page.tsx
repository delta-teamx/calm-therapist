import { FeaturePageTemplate } from "@/components/seo/FeaturePage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Monthly Reflect | Real Progress, Not Performance | Calm Therapist",
  description:
    "Monthly Reflect by Calm Therapist gives you a real summary of your inner life across the month. See your shift, your themes, and your own quotes back to you.",
  path: "/features/reflect",
});

export default function ReflectModePage() {
  return (
    <FeaturePageTemplate
      slug="reflect"
      label="Monthly Reflect"
      oneLiner="Every month, a summary of your growth. Real progress, not performance."
      problem={{
        title: "Therapy without retrospection is just venting.",
        body:
          "Most AI tools leak everything you say. Monthly Reflect catches it. It returns to you in a coherent form — themes, shifts, and the words you said yourself.",
      }}
      steps={[
        { title: "End of month trigger", body: "Calm Therapist generates the reflection without you asking." },
        { title: "Three sections", body: "What came up most. Where you shifted. Quotes you said about yourself." },
        { title: "Set focus for next month", body: "One sentence. Calm Therapist orients itself around it." },
      ]}
      who={[
        { title: "If you can't remember the month", body: "Most people can't. The Reflect surfaces what you'd already forgotten." },
        { title: "If you want a real change signal", body: "Mood check-ins are noisy. Themes over a month are real." },
        { title: "If you've doubted you've grown", body: "Your own words back to you, in italics, will tell you the truth." },
      ]}
      related={[
        { href: "/features/journal", label: "Weekly Journal" },
        { href: "/features/chat", label: "Chat Agent" },
        { href: "/for/depression", label: "For Depression" },
      ]}
      body={[
        "Monthly Reflect is the slowest, most patient mode in Calm Therapist. It is the mode you don't need every week, but the one that, looking back, you'll be glad existed. It compresses 30 days of voice, chat, and journal data into a coherent retrospective — not as a dashboard, but as a piece of writing.",
        "The most powerful section of the reflect is \"What you said about yourself.\" It pulls direct quotes from your sessions — your exact words, in italics, organized chronologically. People often see themselves clearly for the first time when they read this section.",
        "There is no scoring. There are no points. There is no streak. Calm Therapist refuses gamification because gamification destroys the work. The reflect is contemplative by design.",
        "At the end of the reflect, Calm Therapist asks you for one sentence: a focus for next month. That sentence becomes the lens for the month ahead. Calm Therapist references it in chat, in voice, in your weekly journal. The reflect is the only mode where Calm Therapist proactively reaches out to you — once a month, when you're ready.",
      ]}
    />
  );
}
