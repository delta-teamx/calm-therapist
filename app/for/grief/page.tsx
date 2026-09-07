import { ConditionPageTemplate } from "@/components/seo/ConditionPage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "AI Therapist for Grief | Take As Long As It Takes",
  description:
    "AI therapy for grief that doesn't time-box you. Calm Therapist remembers who you lost, names the anniversaries, and holds the long arc of grief.",
  path: "/for/grief",
});

export default function GriefPage() {
  return (
    <ConditionPageTemplate
      slug="grief"
      condition="Grief"
      h1="AI therapy for grief — loss takes as long as it takes."
      feeling={[
        "Grief is not five stages. It is a weather system you live inside, sometimes for years. It is fine on Tuesday and unbearable on Thursday for no reason. It is forgetting they're gone, and remembering, in the same five seconds.",
        "Grief is also the secondary loss — the friends who stopped calling, the role you used to play in the family, the version of you that existed when they were still here.",
        "Most apps treat grief as something to \"work through.\" That framing is part of the harm. Calm Therapist does not try to move you past anything. It sits with the weather, on the days you need it.",
      ]}
      whyFails="Generic AI therapy products forget that you lost someone. By session three they no longer reference your loss, and asking you to repeat the story of how someone died is a form of cruelty. They also fail at anniversaries — birthdays, death dates, holidays — which are the moments where grief intensifies and most people fall through the cracks. Calm Therapist holds onto these dates and meets you on them, not in a scripted way, but in a remembering way."
      ctFeatures={[
        { title: "It remembers who you lost", body: "You don't have to retell. Calm Therapist holds the name, the relationship, and the date, and references them naturally only when relevant.", href: "/features/chat" },
        { title: "Anniversary awareness", body: "On the days that matter — death dates, birthdays, holidays — Calm Therapist proactively checks in.", href: "/features/reflect" },
        { title: "Voice when words fail", body: "Grief makes typing impossible. The voice agent is there for the worst days.", href: "/features/voice" },
      ]}
      modeLinks={[
        { href: "/features/voice", label: "Voice Agent" },
        { href: "/features/journal", label: "Weekly Journal" },
        { href: "/features/reflect", label: "Monthly Reflect" },
      ]}
      moments={[
        { title: "Being remembered in week six", text: "What you said about your father in week one is still there. You do not have to introduce him again." },
        { title: "The anniversary", text: "A question the right size on the day you were dreading. Not too big, not too small, and only if you want it." },
        { title: "2am, walking", text: "When you cannot face talking to anyone, voice with Aura is a way to say it out loud without anyone else in the room." },
      ]}
      faqs={[
        { q: "How does Calm Therapist handle anniversaries?", a: "When you mention a date — a death date, a birthday, a wedding anniversary — Calm Therapist stores it. On those days, it proactively checks in, gently. You can turn this off any time." },
        { q: "Is it weird to use AI for grief?", a: "Many people use journals. Calm Therapist is a smarter journal — one that remembers and reflects back. It is not a replacement for human grief support; it is a companion alongside it." },
        { q: "Will it forget who I lost?", a: "No. Memory is the architecture. Calm Therapist holds the name, the relationship, and the small details you mentioned in passing." },
        { q: "Can I delete it all if I want a fresh start?", a: "Yes. You own your data. You can delete it all in one click." },
        { q: "Is it culturally sensitive about death?", a: "Calm Therapist is built for users across cultures. It does not impose a Western model of grief. It listens to your framing, not its own." },
      ]}
      related={[
        { href: "/for/depression", label: "For Depression" },
        { href: "/for/relationships", label: "For Relationships" },
        { href: "/blog/ai-therapy-privacy", label: "Who owns your mental health data?" },
      ]}
    />
  );
}
