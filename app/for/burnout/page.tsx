import { ConditionPageTemplate } from "@/components/seo/ConditionPage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "AI Therapist for Burnout | Falling Apart Quietly | Calm Therapist",
  description:
    "AI therapy for burnout. Calm Therapist surfaces your patterns — sleep, work, weekends — and helps you see what you've been ignoring.",
  path: "/for/burnout",
});

export default function BurnoutPage() {
  return (
    <ConditionPageTemplate
      slug="burnout"
      condition="Burnout"
      h1="AI therapy for burnout — when the person who holds everything together is falling apart."
      feeling={[
        "Burnout is not stress. Burnout is the state you reach after stress has been the baseline for so long that your body stopped sounding the alarm. It looks like still showing up. It feels like nothing.",
        "Burnout is the slow erosion of the things that used to matter. The hobbies you don't do anymore. The friends you don't text. The food that no longer tastes like anything. The sleep that doesn't repair.",
        "It is also, often, invisible to the people around you. You're still high-functioning. You're still hitting deadlines. The crash, when it comes, looks like surprise to everyone — except to you, where it had been a long time coming.",
      ]}
      whyFails="Most AI tools treat burnout as a stress problem and offer breathing exercises. The breathing exercises are not the issue. The issue is that nobody has been watching the slow shape of your week. Calm Therapist is built to do exactly that — to track sleep mentions, work mentions, weekend mentions, and patterns over time. The point isn't fixing burnout in one session. The point is catching it earlier, by surfacing patterns that you cannot see from inside."
      ctFeatures={[
        { title: "Pattern over time", body: "The Weekly Journal cross-references your sessions and surfaces signals — sleep declining, work mentions increasing — before you'd notice yourself.", href: "/features/journal" },
        { title: "Structured tone for engineers and founders", body: "The clinical tone preference removes the hand-holding. Direct, evidence-based, fast.", href: "/features/chat" },
        { title: "Voice on the commute", body: "Burnout often crystallises on the drive home. Voice mode is the only therapy that meets you there.", href: "/features/voice" },
      ]}
      modeLinks={[
        { href: "/features/journal", label: "Weekly Journal" },
        { href: "/features/reflect", label: "Monthly Reflect" },
        { href: "/features/voice", label: "Voice Agent" },
      ]}
      moments={[
        { title: "The same argument, again", text: "Aura can notice that this is the twelfth time this year the same fight has come up, and ask what is underneath it instead of refereeing it." },
        { title: "The week that stopped making sense", text: "Sleep, meetings, weekends: patterns across weeks that are invisible from inside them. Aura holds the long view so you do not have to." },
        { title: "Catching the wall before you hit it", text: "You have been here before. This time the signs are named early, in your own words from a few weeks ago." },
      ]}
      faqs={[
        { q: "Is burnout a real thing or just stress?", a: "Burnout is a recognised occupational phenomenon (WHO ICD-11). Calm Therapist treats it as a longitudinal pattern, not a single moment." },
        { q: "Can it tell me when I'm heading there?", a: "It can surface patterns. The Weekly Journal cross-references everything you've said and shows you signals you wouldn't have noticed alone." },
        { q: "I'm too busy for an app. Will I keep up?", a: "Calm Therapist is built for inconsistent use. There are no streaks. Three messages this month is enough for the system to learn from." },
        { q: "Will my employer ever see my data?", a: "No. Your data is yours. Calm Therapist does not integrate with HR systems, does not share data with employers, and does not train on your conversations." },
        { q: "How direct is the direct tone preference?", a: "Direct mode skips comfort and goes to the insight. It is calibrated for users who find warmth distracting. You can switch any time." },
      ]}
      related={[
        { href: "/for/anxiety", label: "For Anxiety" },
        { href: "/for/relationships", label: "For Relationships" },
        { href: "/blog/men-therapy-stigma", label: "Men, therapy, and the stigma we're done with" },
      ]}
    />
  );
}
