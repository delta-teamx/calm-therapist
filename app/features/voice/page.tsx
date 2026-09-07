import { FeaturePageTemplate } from "@/components/seo/FeaturePage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Voice AI Therapist | Talk When Typing Is Too Much | Calm Therapist",
  description:
    "Voice-based AI therapy that listens, reflects, and remembers. Calm Therapist's voice agent is built for the moments you can't type — anxiety, exhaustion, grief, or just walking.",
  path: "/features/voice",
});

export default function VoiceModePage() {
  return (
    <FeaturePageTemplate
      slug="voice"
      label="Voice Agent"
      oneLiner="Talk. Calm Therapist listens, reflects, and responds — like a conversation, not a form."
      problem={{
        title: "When typing isn't possible.",
        body:
          "Anxiety makes typing feel like climbing stairs. Grief makes structure feel impossible. Most AI therapy tools only work if you have the bandwidth to write. The Voice Agent removes that requirement entirely.",
      }}
      steps={[
        { title: "Press to start", body: "Calm Therapist opens with your name and a soft question. No menus." },
        { title: "Just talk", body: "It listens at your pace. Pauses where a person would. Doesn't rush to fill the silence." },
        { title: "Stays in your record", body: "Every voice session feeds the same memory. What you said today shapes tomorrow." },
      ]}
      who={[
        { title: "When you're walking", body: "On a long walk, after work, before bed. Voice mode meets you wherever you are." },
        { title: "When you're crying", body: "Typing through tears is impossible. Speaking is sometimes easier. Calm Therapist holds that." },
        { title: "When you're driving home", body: "Hands-free. Eyes on the road. Mind on what you actually feel." },
      ]}
      related={[
        { href: "/features/chat", label: "Chat Agent" },
        { href: "/features/journal", label: "Weekly Journal" },
        { href: "/for/anxiety", label: "For Anxiety" },
      ]}
      body={[
        "The Voice Agent is the closest Calm Therapist gets to a real conversation. It uses ElevenLabs' Conversational AI for natural speech — not the robotic text-to-speech of older tools — and it pairs that voice with the same memory architecture that powers the chat agent. Whatever you said in your last voice session, your last chat session, or your last journal entry is present here.",
        "Voice unlocks something writing can't. People often say in voice what they would not type. The voice agent is calibrated for that: shorter responses, slower pacing, fewer questions, more space. It is not trying to be efficient. It is trying to be present.",
        "The agent's voice is calm and unhurried. If you've chosen a direct tone, the voice changes — clearer, more decisive. If you've chosen warmth, the voice sits longer in the silences. The match between tone and voice is built in.",
        "What it never does: it never asks you to repeat yourself, it never forgets your name, it never plays generic comfort music, and it never holds a conversation that contradicts what you've already shared. If you said two weeks ago that your mother is unwell, the voice agent knows.",
      ]}
    />
  );
}
