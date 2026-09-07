import { ConditionPageTemplate } from "@/components/seo/ConditionPage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "AI Therapist for Depression | Stay Visible to Yourself",
  description:
    "AI therapy designed for depression. Calm Therapist holds the record so you don't have to, surfaces patterns you can't see, and keeps you visible to yourself.",
  path: "/for/depression",
});

export default function DepressionPage() {
  return (
    <ConditionPageTemplate
      slug="depression"
      condition="Depression"
      h1="AI therapy for depression — when getting up is the hardest part."
      feeling={[
        "Depression is not sadness. It is the absence of energy where energy used to be. It is the shower that takes three days. It is the friend's text you saw, meant to reply to, and never did.",
        "Depression is the thing that makes the things that would help you feel impossible to do. It is recursive. Knowing what helps doesn't help.",
        "Most therapy products ask you to track your mood, set goals, and stay engaged. None of those things work when you can't get out of bed. They become another way to feel like a failure.",
      ]}
      whyFails="Standard AI tools treat depression like a productivity problem. They build streak counters, daily check-ins, and quiz-style mood tracking. People with depression know exactly what these things do — they create another surface on which to disappoint yourself. Worse, they have no longitudinal memory. Every time you come back after a hard week, you start over. The disappearance is invisible to them. Calm Therapist is designed differently: there is no streak system, the journal works whether or not you wrote anything, and the agent remembers you across the gaps. That's the part that matters."
      ctFeatures={[
        { title: "No streaks. No guilt.", body: "Calm Therapist does not punish absence. The journal still works whether you wrote three lines or nothing. Coming back is the only thing that matters.", href: "/features/journal" },
        { title: "Memory across the gaps", body: "Depression makes you disappear from your own life. Calm Therapist holds your record while you're gone. When you return, your context is intact.", href: "/features/chat" },
        { title: "Monthly Reflect", body: "Depression makes you doubt that anything has changed. The Monthly Reflect shows you, in your own words, what actually shifted.", href: "/features/reflect" },
      ]}
      modeLinks={[
        { href: "/features/chat", label: "Chat Agent" },
        { href: "/features/journal", label: "Weekly Journal" },
        { href: "/features/reflect", label: "Monthly Reflect" },
      ]}
      moments={[
        { title: "Somewhere to think out loud", text: "Not therapy vocabulary, not a form. A place to put the thought down and have it heard back, at any hour." },
        { title: "Coming back after three weeks", text: "No streak lost, no explanation owed. Aura remembers where you were and picks up there." },
        { title: "Reading your own words back", text: "When you are sure nothing has changed, your own sentences from a month ago can say otherwise." },
      ]}
      faqs={[
        { q: "I can't keep up with apps. Will this be different?", a: "Calm Therapist has no streak system. There is no shame in coming back after weeks away. The agent remembers, and meets you where you are." },
        { q: "Is it safe if I'm having dark thoughts?", a: "Calm Therapist's Crisis Safe protocol activates automatically when language indicates suicidal ideation or self-harm. It will not minimise. It will surface verified resources for your region." },
        { q: "How is this different from a journaling app?", a: "Journaling apps are passive. Calm Therapist actively reads what you write across all modes and reflects patterns back to you in plain language." },
        { q: "Can I share what I have worked on with a therapist?", a: "Yes. Your record is yours to read and tell them about. Many people bring the patterns Aura has named into their sessions." },
        { q: "Does it work in languages other than English?", a: "Yes. Aura works in English, Urdu, Hindi, Arabic, Spanish, and French, and switches when you do, mid-sentence." },
      ]}
      related={[
        { href: "/for/anxiety", label: "For Anxiety" },
        { href: "/for/grief", label: "For Grief" },
        { href: "/blog/men-therapy-stigma", label: "Men, therapy, and the stigma we're done with" },
      ]}
    />
  );
}
