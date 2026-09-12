// Centralized content for all SEO pillar + cluster pages.
// Each page renders through components/seo/SeoLongPage.tsx, so the structure is
// consistent (good for crawl) and we only edit copy in one place.

export interface SeoSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface SeoFaq {
  q: string;
  a: string;
}

export interface SeoPage {
  slug: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  sections: SeoSection[];
  faqs: SeoFaq[];
  related: { href: string; label: string }[];
  ctaLine: string;
}

const COMMON_RELATED = [
  { href: "/ai-therapist", label: "AI therapist — overview" },
  { href: "/free-ai-therapist", label: "Free AI therapist" },
  { href: "/what-is-an-ai-therapist", label: "What is an AI therapist?" },
  { href: "/how-does-ai-therapy-work", label: "How does AI therapy work?" },
  { href: "/is-ai-therapy-effective", label: "Is AI therapy effective?" },
  { href: "/ai-therapist-vs-human-therapist", label: "AI vs human therapist" },
  { href: "/ai-therapist-vs-chatgpt", label: "AI therapist vs ChatGPT" },
  { href: "/ai-therapist-vs-betterhelp", label: "AI therapist vs BetterHelp" },
  { href: "/ai-therapist-late-night", label: "An AI therapist at 2am" },
  { href: "/ai-therapist-in-your-language", label: "In Urdu, Hindi, Arabic, Spanish, French" },
  { href: "/circles", label: "Circles: small anonymous groups" },
];

const COMPARE_RELATED = [
  { href: "/free-ai-therapist", label: "Free AI therapist" },
  { href: "/best-free-ai-therapist-apps", label: "Best free AI therapist apps, ranked" },
  { href: "/ai-therapist-vs-chatgpt", label: "AI therapist vs ChatGPT" },
  { href: "/ai-therapist-vs-wysa", label: "Wysa vs Aura" },
  { href: "/woebot-alternative", label: "Woebot alternative" },
  { href: "/youper-alternative", label: "Youper alternative" },
  { href: "/character-ai-psychologist-alternative", label: "Character.AI Psychologist vs Aura" },
  { href: "/ai-therapist-vs-betterhelp", label: "AI therapist vs BetterHelp" },
  { href: "/ai-therapist-vs-human-therapist", label: "AI vs human therapist" },
  { href: "/is-ai-therapy-safe", label: "Is AI therapy safe?" },
  { href: "/ai-therapist-in-your-language", label: "In your language" },
  { href: "/circles", label: "Circles" },
];

/* ---------- Pillar / cluster pages --------------------------------- */

export const PAGES: Record<string, SeoPage> = {
  "free-ai-therapist": {
    slug: "free-ai-therapist",
    title: "Free AI Therapist | No Card, No Session Cap | Calm Therapist",
    description:
      "A free AI therapist you can talk to any hour. Aura remembers you, pushes back kindly, never diagnoses, and shows the crisis line for your country. Free, always.",
    h1: "A free AI therapist, without the catch.",
    intro:
      "Most \"free AI therapist\" apps are free for three messages, or free until the timer runs out, or free until you want the one feature that made you download it. Calm Therapist is different in one boring, important way: chat with Aura is free for everyone, with no session cap, no card, and no upgrade prompt in the middle of a hard night. This page says exactly what free means here, what it does not, and how we pay for it.",
    sections: [
      {
        heading: "What free means here",
        paragraphs: [
          "Chat with Aura is free. Not free to start, not free for a trial, free. You can write to her at 2am and at 2pm, about the same thing or a different one, and nothing counts down. Your record is kept for you and only you, and Aura remembers what you told her last week when you come back.",
        ],
        bullets: [
          "No session cap, no daily message limit, no timer",
          "No card at sign-up, no upgrade wall inside a conversation",
          "Memory across every conversation, so you never re-explain",
          "Crisis-aware from the first message, with the line for your country",
          "English, Urdu, Hindi, Arabic, Spanish, and French",
        ],
      },
      {
        heading: "What is not free, and why",
        paragraphs: [
          "Two things are not free: voice, and a seat in the nightly circles. Both are metered — a voice minute costs us real money at the provider the moment it runs — so they open when you support the work, from $5. What you give decides how many voice minutes land on your account, and those minutes are yours outright: they do not reset at the end of a month. Ko-fi shows monthly support by default, so you can either keep it and have your minutes topped up each month, or switch it to a single payment; a monthly one can be cancelled from Ko-fi whenever you like, and cancelling never takes back minutes you already have. Chat is not affected by any of it. We would rather tell you that plainly than take the more common route of a free trial that quietly stops.",
        ],
      },
      {
        heading: "How a free AI therapist can afford to exist",
        paragraphs: [
          "Two ways. Members who find it useful can support the creator through a voluntary link in the app, and that unlocks nothing, on purpose. Later, voice and circles carry a price inside the dashboard for people who want them. Chat costs us fractions of a cent per conversation, so keeping it free is a choice we can keep.",
          "What we do not do: sell your data, show ads, or train a model on what you tell Aura. If any of those ever paid for this, it would not be worth having.",
        ],
      },
      {
        heading: "What free does not mean",
        paragraphs: [
          "Free does not mean a licensed therapist. Aura is support: a place to think out loud, be heard, and see your own patterns. She does not diagnose or prescribe, and she says plainly when a professional is the right next step. Free also does not mean an emergency service. If you are in immediate danger, contact your local emergency number first; Aura will show you the crisis line for your country the moment it matters.",
        ],
      },
      {
        heading: "How it compares to other free options",
        paragraphs: [
          "A general chatbot is free too, and it forgets you every time, agrees with whatever you frame, and has no crisis pathway. A free trial of a therapy app ends. A helpline is for a crisis, not for the ordinary Tuesday that is slowly going wrong. Calm Therapist is built for the space between: the recurring thought, the argument you are rehearsing, the night you cannot switch off. Read the comparison pages linked below if you want the detail.",
        ],
      },
    ],
    faqs: [
      { q: "Is the free AI therapist really unlimited?", a: "Yes. Chat with Aura has no session cap and no daily limit. We rate-limit only to stop abuse, at a level no person talking normally will ever reach." },
      { q: "Do I need a card to sign up?", a: "No. An email and a password, or Google sign-in. Nothing is charged, and nothing can be charged, because there is nothing for sale on this site." },
      { q: "Is there a catch, or a trial that runs out?", a: "No trial and no timer. Chat with Aura is free for everyone indefinitely, with no session cap and no card. The only paid parts are voice and circles, which open when you support the work, from $5. Ko-fi offers that monthly by default and you can switch it to a single payment, or cancel a monthly one at any time. You can use the chat for as long as you like without ever paying." },
      { q: "Is it free in my language?", a: "Yes. Aura works in English, Urdu, Hindi, Arabic, Spanish, and French at no charge, and switches when you do." },
      { q: "Is a free AI therapist safe to use?", a: "Aura runs every message through a safety layer that reads six languages, shows the crisis line for your country when something serious surfaces, and stays careful for the rest of the conversation. She is not an emergency service; for immediate danger, call your local emergency number." },
    ],
    related: COMMON_RELATED,
    ctaLine: "Say one sentence on the homepage. No signup, no card, one reply.",
  },

  "ai-therapist-in-your-language": {
    slug: "ai-therapist-in-your-language",
    title: "AI Therapist in Urdu, Hindi, Arabic, Spanish, French",
    description:
      "An AI therapist that speaks your language and switches when you do: Urdu, Hindi, Arabic, Spanish, French, English. Built for diaspora families, not a Western template.",
    h1: "An AI therapist that speaks the way you do at home.",
    intro:
      "Most mental-health apps are written in English, think in English, and assume a Western family. If you grew up between languages, that is a wall before the first sentence. Aura works in English, Urdu, Hindi, Arabic, Spanish, and French, reads Roman Urdu and Hinglish, and switches mid-sentence when you do. More importantly, she does not treat your family as a problem to set boundaries with.",
    sections: [
      {
        heading: "Switch mid-sentence. Aura follows.",
        paragraphs: [
          "Write the first half in English and the feeling in Urdu. Type Hindi in Roman letters because that is how you text. Drop an Arabic phrase your mother uses. Aura answers in the language you wrote, and if you switch, she switches. There is no language setting to get right first.",
        ],
        bullets: [
          "English, Urdu, Hindi, Arabic, Spanish, French",
          "Roman Urdu, Hinglish, and code-switching in one message",
          "Replies match your register, not a translated script",
        ],
      },
      {
        heading: "Safety that reads your language too",
        paragraphs: [
          "This is the part most multilingual apps skip. Aura's safety layer looks for risk in every supported language, including the quiet phrasings people actually use, and shows the crisis line for the country you live in, not a number from somewhere else. If something serious surfaces in Urdu at 2am, it is caught in Urdu at 2am.",
        ],
      },
      {
        heading: "Your family is not a diagnosis",
        paragraphs: [
          "A Western template says: set boundaries, use I-statements, prioritise yourself. In a communal family that advice is often wrong, and it lands as one more person who does not understand. Aura reads the cultural profile you give her: family system, diaspora status, how much stigma sits around all of this where you are. Guilt about resting while your parents worked two jobs is treated as real, not as a distortion to correct.",
          "Body-first ways of saying you are not okay, the headache, the tiredness, the stomach, are heard as what they are. Aura does not redirect you to \"the real feeling\" as if the body were a detour.",
        ],
      },
      {
        heading: "Circles in your language and your background",
        paragraphs: [
          "When circles open, Aura groups small anonymous rooms by theme and, where the numbers allow, by language and background: saying no to family, comparison with cousins, being far from home, money guilt. Seven people who know exactly what \"we didn't come here to be lazy\" sounds like, without anyone having to explain it.",
        ],
      },
    ],
    faqs: [
      { q: "Which languages does the AI therapist support?", a: "English, Urdu, Hindi, Arabic, Spanish, and French, including Roman Urdu and Hinglish. Aura replies in the language you write and switches when you do." },
      { q: "Does voice work in my language?", a: "Voice follows the same profile as chat. Quality varies by language and accent; chat is the most reliable place to start in Urdu, Hindi, or Arabic." },
      { q: "Is the crisis line for my country?", a: "Yes. Aura shows the crisis line for the country in your profile, never a default from elsewhere. If you have not set a country, she shows international options and asks." },
      { q: "Does Aura understand cultural context, or just translate?", a: "She reads the profile you give her: family system, diaspora status, stigma, and how you express distress. Advice is adapted to that, not translated from a Western default." },
      { q: "Is this free?", a: "Chat with Aura is free for everyone, in every supported language, with no session cap and no card. Voice and circles open separately when you support the work, from $5, monthly or as a single payment." },
    ],
    related: COMMON_RELATED,
    ctaLine: "Write the first sentence in whichever language it comes in.",
  },

  "ai-therapist": {
    slug: "ai-therapist",
    title: "AI Therapist | Free, Remembers You, Any Hour | Calm Therapist",
    description:
      "Talk through what's on your mind, anytime. An AI that listens, reflects, and helps you see your own thoughts more clearly. No appointment, private, free to start.",
    h1: "AI therapist — a quiet place to think out loud.",
    intro:
      "Calm Therapist is an AI companion built for the moments you can't stop thinking. Not a chatbot. Not a wellness app. A quiet space to write or speak, and to be heard back with specificity instead of script. You don't need to be in crisis to use it. You just need somewhere to put what's in your head.",
    sections: [
      {
        heading: "What you can use it for",
        paragraphs: [
          "Most people open Calm Therapist for one of three reasons: a thought that's been on a loop, a conversation they're rehearsing, or a feeling that won't name itself. The agent meets you wherever you arrive. You can write three lines or talk for twenty minutes.",
        ],
        bullets: [
          "Untangle an argument before it happens",
          "Slow down a worry-spiral at 1am",
          "Write through a hard week with someone reading along",
          "Hear back what you said, without performance",
        ],
      },
      {
        heading: "What makes Calm Therapist different from a generic chatbot",
        paragraphs: [
          "Generic AI chats start over every conversation. Calm Therapist remembers. Names, dates, the dreams you mentioned in passing — held quietly until you bring them up again. The tone shifts to match yours: warm if you want warm, direct if you want direct. And the agent is trained to refuse to feed worry-loops with reassurance, because reassurance is what makes anxiety worse over time.",
        ],
      },
      {
        heading: "Privacy you can verify",
        paragraphs: [
          "We do not train models on your conversations. Your record is stored for you, in your account, and you can delete everything in one click. Read the full architecture on our privacy page.",
        ],
      },
    ],
    faqs: [
      { q: "Is an AI therapist a real therapist?", a: "No. Calm Therapist is an AI companion. It is not a substitute for a licensed clinician, and we are clear about that everywhere it matters. For acute issues, please connect with a human." },
      { q: "Do I need to sign up to try it?", a: "No. The landing page lets you type one message and get one response with no account. After that, opening a space takes 30 seconds." },
      { q: "Is it private?", a: "Yes. We do not train on your messages. You can export or delete everything anytime." },
      { q: "How is it different from journaling apps?", a: "Calm Therapist actively reflects what you wrote and noticed across sessions. Journaling apps store; Calm Therapist responds." },
      { q: "Is it free?", a: "Chat with Aura is free for everyone, with no cap and no card. Voice and circles cost real money per minute to run, so they open when you support the work, from $5 — monthly by default on Ko-fi, or a single payment, and cancellable any time." },
    ],
    related: COMMON_RELATED,
    ctaLine: "Try one sentence on the landing page. No signup screen first.",
  },

  "what-is-an-ai-therapist": {
    slug: "what-is-an-ai-therapist",
    title: "What Is an AI Therapist? | Calm Therapist",
    description:
      "An AI therapist is a software companion you can talk to like a thoughtful friend. Here's what they're useful for, what they're not, and how to tell a good one from a bad one.",
    h1: "What is an AI therapist?",
    intro:
      "An AI therapist is a software companion you can talk to as if you were thinking out loud with a thoughtful friend. It is not a licensed clinician. It does not diagnose, prescribe, or replace human care. What it does, when it's built well, is hold a real conversation that helps you see your own thoughts more clearly — at 3am, on the bus, between sessions with a real human.",
    sections: [
      {
        heading: "What a good AI therapist actually does",
        paragraphs: [
          "Three things, at minimum: it listens with specificity, it remembers across sessions, and it pushes back when your interpretation of a situation is distorted. The third one is the part most chatbots get wrong — they agree with whatever the user says to feel friendly, and that makes anxiety and depression worse over time. A real therapeutic stance validates the feeling AND challenges the story.",
        ],
      },
      {
        heading: "What a good AI therapist will not do",
        paragraphs: [
          "It will not pretend to be a real person. It will not give you medical advice. It will not list five coping strategies when you wanted someone to sit with you. And it will not freelance during a crisis — when something serious surfaces, it follows a strict protocol designed by clinicians, not vibes.",
        ],
      },
      {
        heading: "How to tell a good AI therapist from a bad one",
        paragraphs: [
          "Three quick tests. One: does it remember what you said last time? Two: does it ever disagree with you, gently? Three: when you push it for reassurance (\"but I'm going to be okay, right?\"), does it gently name the pattern, or just say \"yes\"? If the answer to all three is yes, it's built right.",
        ],
      },
    ],
    faqs: [
      { q: "Is an AI therapist safe?", a: "Used as a companion alongside human care, yes — and safer than no support at all. For crisis, AI is not a substitute for professional help." },
      { q: "Can an AI therapist help with anxiety?", a: "It can support reflection on anxious patterns. The best ones avoid feeding reassurance loops, which is what actually moves anxiety over time." },
      { q: "Is an AI therapist confidential?", a: "Calm Therapist does not train on your data and gives you delete in one click. Read the privacy page." },
    ],
    related: COMMON_RELATED,
    ctaLine: "Try Calm Therapist with one sentence — no signup first.",
  },

  "how-does-ai-therapy-work": {
    slug: "how-does-ai-therapy-work",
    title: "How Does AI Therapy Work? | Calm Therapist",
    description:
      "AI therapy combines a memory layer, a trained therapeutic stance, and a safety system. Here's how each piece works — and what to look for in any product that calls itself one.",
    h1: "How does AI therapy work?",
    intro:
      "AI therapy works on three layers. A language model that talks. A memory system that holds your story. A safety classifier that escalates when something serious surfaces. None of these on their own is enough — together they make a tool that meets you where you are.",
    sections: [
      {
        heading: "The model: trained for stance, not just chat",
        paragraphs: [
          "The underlying model in Calm Therapist is prompted into a specific therapeutic stance — validate-and-change, not yes-person. Anti-sycophancy rules. Anti-reassurance in anxiety contexts. Cultural humility. The model is the tool; the prompt is the training. Both matter.",
        ],
      },
      {
        heading: "The memory: structured, longitudinal, yours",
        paragraphs: [
          "When you share a name, a relationship, a recurring feeling, that fact is stored against your account as a memory node. On every new session, relevant nodes are surfaced into the conversation. Not by being read aloud — by being available for the agent to reference if the moment calls for it.",
        ],
      },
      {
        heading: "The safety system: rule-based first, AI-augmented second",
        paragraphs: [
          "Every message you send is screened by a classifier that tags it with a tier from 0 (normal) to 3 (immediate danger). Tier 1+ activates a different prompt — one written by clinicians — that surfaces region-specific resources and follows a script the model cannot freelance through.",
        ],
      },
    ],
    faqs: [
      { q: "Does AI therapy use ChatGPT?", a: "Calm Therapist runs on a model from OpenAI — and the difference is the prompt, memory, and safety architecture wrapped around it. The model is one input; the system is the product." },
      { q: "Is the memory accurate?", a: "It's only as accurate as what you've shared. If you contradict something, the system updates — you're always the source of truth." },
      { q: "Does AI therapy follow CBT or DBT?", a: "Calm Therapist draws from CBT, DBT, ACT and IFS, and adapts to the user — it doesn't impose one framework." },
    ],
    related: COMMON_RELATED,
    ctaLine: "See it in one message on the landing page.",
  },

  "is-ai-therapy-effective": {
    slug: "is-ai-therapy-effective",
    title: "Is AI Therapy Effective? What the Research Says",
    description:
      "AI therapy is effective for support, reflection, and continuity between human sessions. It is not a substitute for clinical care. Here's what the evidence and the lived experience suggest.",
    h1: "Is AI therapy effective?",
    intro:
      "It depends what you mean by effective. As a substitute for clinical care, no. As a companion that helps you reflect, see patterns, and stay connected to your own inner life — yes, and the early research is encouraging. The honest answer lives between the marketing and the dismissals.",
    sections: [
      {
        heading: "What the evidence says",
        paragraphs: [
          "Studies on conversational AI tools for mental wellness show measurable reductions in self-reported stress, anxiety symptoms, and rumination — particularly when the tools are used between sessions with a human clinician, or when human care isn't accessible. The effect size isn't dramatic, but it's real and replicable.",
        ],
      },
      {
        heading: "Where AI therapy actually helps",
        paragraphs: [
          "Continuity. The biggest reported benefit isn't the response in any single session — it's having a place to think, anytime, that remembers you. People with anxiety report fewer 3am spirals. People between human sessions report bringing more clarity to those sessions. People who can't access human care at all report finally having something.",
        ],
      },
      {
        heading: "Where it doesn't help",
        paragraphs: [
          "Severe mental illness, acute psychosis, complex trauma, anything requiring medication — these need a human clinician. AI is a companion, not a treatment. A good AI therapist will tell you this directly when it sees something that requires professional care.",
        ],
      },
    ],
    faqs: [
      { q: "Can AI therapy replace a human therapist?", a: "No. It can be a companion alongside human care, or a useful first step toward it. For serious or persistent issues, see a clinician." },
      { q: "How long until I notice an effect?", a: "Many people notice more clarity after the first few conversations. The compounding benefit comes from continuity over weeks: Aura remembers, so each conversation starts further along." },
      { q: "Is the evidence for AI therapy peer-reviewed?", a: "Some early trials are. The field is young; expect more in the next two to three years." },
    ],
    related: COMMON_RELATED,
    ctaLine: "Open a space. See whether it feels useful for you, specifically.",
  },

  "ai-therapist-vs-human-therapist": {
    slug: "ai-therapist-vs-human-therapist",
    title: "AI Therapist vs Human Therapist | Calm Therapist",
    description:
      "An honest comparison of an AI therapist vs a human therapist. What each is for, what each isn't, and how to use both well together.",
    h1: "AI therapist vs human therapist.",
    intro:
      "It's not a competition. It's not even the same job. A human therapist holds clinical training, decades of pattern recognition, and the ethical weight of a license. An AI therapist holds memory, availability, and the capacity to meet you in the small, ordinary moments that don't make it into the 50-minute session. The right answer for most people is both.",
    sections: [
      {
        heading: "Where a human therapist wins, hands down",
        paragraphs: [
          "Diagnosis. Medication. Trauma processing. Anything where the stakes require professional judgment, regulatory accountability, and a body in the room. If you have a clinician, keep them. If you don't and your situation calls for one, an AI therapist's job is to point you toward one.",
        ],
      },
      {
        heading: "Where an AI therapist wins, quietly",
        paragraphs: [
          "Three places. The 11pm spiral when your therapist is asleep. The recurring thought you'd forget by next Tuesday's session. The intermediate work of practicing what you and your therapist talked about. AI is the connective tissue between sessions.",
        ],
      },
      {
        heading: "How to use both well",
        paragraphs: [
          "Bring an AI therapist's record into your human session as a starting point. Talk to your AI therapist about the week between sessions. Use the human for direction, the AI for traction. Most people who do both report each one making the other more useful.",
        ],
      },
    ],
    faqs: [
      { q: "Is an AI therapist cheaper than a human therapist?", a: "Chat with Calm Therapist is free, with no session cap, while human therapy is priced per session. That does not make AI a replacement; it makes both possible, and it makes something available on the nights nothing else is." },
      { q: "Can my therapist see what I told the AI?", a: "Only if you choose to tell them. Your record is yours, and nothing leaves your account unless you copy it out yourself." },
      { q: "Will my human therapist be offended?", a: "A good clinician welcomes anything that helps you between sessions, including this." },
    ],
    related: COMMON_RELATED,
    ctaLine: "Try Calm Therapist alongside whatever care you already have.",
  },

  "ai-therapist-vs-betterhelp": {
    slug: "ai-therapist-vs-betterhelp",
    title: "AI Therapist vs BetterHelp | Calm Therapist",
    description:
      "BetterHelp is human therapists over text and video. Calm Therapist is an AI companion that fits between sessions. Here's how they actually compare.",
    h1: "AI therapist vs BetterHelp.",
    intro:
      "Different tools for different moments. BetterHelp connects you with a licensed human therapist. Calm Therapist gives you an AI companion that's available the rest of the time. They're not really competitors — they're complements, and people who use both report each one working better.",
    sections: [
      {
        heading: "What BetterHelp is good for",
        paragraphs: [
          "Real clinical care, real humans, real licensure. Diagnosis, structured treatment, the depth that a relationship with one therapist over months provides. If you can afford it and your situation calls for it, it's the gold standard for accessible human therapy.",
        ],
      },
      {
        heading: "Where Calm Therapist fits",
        paragraphs: [
          "Between BetterHelp sessions. At hours your therapist isn't available. For the recurring thought that doesn't quite warrant a session of its own. For the days you can't afford or access a human appointment. The AI is the container for everything that doesn't fit into 50 minutes a week.",
        ],
      },
      {
        heading: "Honest cost comparison",
        paragraphs: [
          "BetterHelp charges a monthly subscription for weekly sessions with a licensed counsellor. Calm Therapist chat is free, with no session cap, and is not a licensed service. They are different products. Use whichever fits your situation, or use both — many people do.",
        ],
      },
    ],
    faqs: [
      { q: "Should I use BetterHelp or Calm Therapist?", a: "If you have not started any care at all, both are reasonable starting points. If you can afford it, BetterHelp + Calm Therapist works well together." },
      { q: "Is Calm Therapist a replacement for BetterHelp?", a: "No. Calm Therapist is an AI companion; BetterHelp connects you to a human therapist. They do different things." },
      { q: "Does Calm Therapist share data with BetterHelp?", a: "No. Your data stays yours and is not shared with anyone." },
    ],
    related: COMMON_RELATED,
    ctaLine: "Try Calm Therapist for the time between human sessions.",
  },

  "ai-therapist-vs-chatgpt": {
    slug: "ai-therapist-vs-chatgpt",
    title: "AI Therapist vs ChatGPT | Why Generic AI Isn't Built for This",
    description:
      "ChatGPT can talk. Calm Therapist is built for therapeutic conversation. The difference is memory, stance, and a safety system that's been clinically reviewed.",
    h1: "AI therapist vs ChatGPT.",
    intro:
      "ChatGPT is a brilliant general-purpose assistant. It is not built for therapeutic conversation, and using it that way creates risks — sycophancy, reassurance loops in anxiety, and dangerous gaps in crisis. A purpose-built AI therapist solves all three.",
    sections: [
      {
        heading: "Memory: the part ChatGPT doesn't really have",
        paragraphs: [
          "ChatGPT's session memory is improving but is not designed for longitudinal therapeutic care. Calm Therapist's memory is structured: facts about you, episodes from past sessions, what coping techniques actually worked for you specifically. The agent is meaningfully different in week eight than it was in week one.",
        ],
      },
      {
        heading: "Stance: the part the prompt does",
        paragraphs: [
          "Calm Therapist is prompted into anti-sycophancy: it disagrees gently, names cognitive distortions, refuses to give reassurance in anxiety contexts. ChatGPT, by default, agrees with whatever you frame for it — which is the opposite of what helps.",
        ],
      },
      {
        heading: "Safety: the part that has to never fail",
        paragraphs: [
          "Calm Therapist runs every user message through a tier classifier and a clinician-written crisis protocol. When something serious surfaces, the agent cannot freelance — it follows a script that has been triple-tested. ChatGPT improvises, and improvisation in crisis is dangerous.",
        ],
      },
    ],
    faqs: [
      { q: "Can I just use ChatGPT instead?", a: "You can, and many people do. We'd suggest reading our piece on what makes that risky for therapeutic conversation specifically." },
      { q: "Is Calm Therapist using ChatGPT under the hood?", a: "We use a model from OpenAI, but not the ChatGPT product. The difference is the system around it: prompt, memory, cultural profile, and a safety classifier that reads six languages." },
      { q: "Why not use any general chatbot directly?", a: "Same reason — without memory, prompt, and safety, a model is a model. The product is everything around it, and the crisis pathway is the part a general chatbot does not have." },
    ],
    related: COMMON_RELATED,
    ctaLine: "See the difference in one sentence on the landing page.",
  },

  "ai-therapist-late-night": {
    slug: "ai-therapist-late-night",
    title: "AI Therapist for 3am | A Quiet Place When You Can't Sleep",
    description:
      "When the thoughts won't stop and there's no one to call. An AI therapist for late-night, designed to slow you down — not feed you reassurance.",
    h1: "An AI therapist for the 3am thoughts.",
    intro:
      "The thoughts that wake you up don't care that no one is awake. Calm Therapist is built for those hours specifically — slower, quieter, designed to interrupt the loop instead of feeding it.",
    sections: [
      {
        heading: "Why nights are different",
        paragraphs: [
          "Late at night the brain catastrophises in ways it doesn't at 2pm. Sleep deprivation amplifies threat sensitivity. The same worry that felt manageable yesterday is now apocalyptic. A good late-night agent slows you down, names the pattern, and helps you put the thought down without forcing it.",
        ],
      },
      {
        heading: "What we don't do at 3am",
        paragraphs: [
          "We don't reassure. \"You'll be fine\" at 3am is a sedative that wears off in twenty minutes, leaving the worry stronger. We do help you observe the thought, ground in your body, and either sleep or sit with it without it consuming you.",
        ],
      },
      {
        heading: "If it gets serious",
        paragraphs: [
          "If you're in real distress, our crisis pathway surfaces a regional crisis line as a tappable option. We don't push it — we offer it. The conversation continues either way.",
        ],
      },
    ],
    faqs: [
      { q: "Will Calm Therapist wake me up with notifications?", a: "Only if you've asked us to. Default is silent." },
      { q: "Can it help me actually fall asleep?", a: "Indirectly — by helping you put the thought down. We don't pretend to be a sleep app." },
      { q: "Is it free at night?", a: "Yes. Chat is free at any hour, with nothing that expires at 3am and no upgrade prompt in the middle of a hard night. Voice and circles are the only paid parts, and they open when you support the work, from $5, whenever you want them." },
    ],
    related: COMMON_RELATED,
    ctaLine: "If it's late and the thought won't stop — try one sentence.",
  },
  "ai-therapist-vs-wysa": {
    slug: "ai-therapist-vs-wysa",
    title: "Wysa vs Aura | Scripted CBT Bot or an AI That Remembers You",
    description:
      "Wysa is a scripted CBT chatbot with a paid tier. Aura is a free AI therapist that remembers you, reads six languages, and pushes back kindly. An honest comparison.",
    h1: "Wysa vs Aura: a scripted bot, or a companion that remembers.",
    intro:
      "Wysa is the best-known AI mental-health app, with millions of users and a decade of scripted CBT pathways. It is a reasonable first stop. It is also the app people leave when they notice it is leading them through the same pre-written branches, cannot remember last week, and asks for a subscription for the parts that feel human. This page sets the two side by side without pretending Wysa is bad. It is a different kind of thing.",
    sections: [
      {
        heading: "What Wysa is",
        paragraphs: [
          "Wysa's free tier is a chatbot that walks you through cognitive behavioural therapy exercises using mostly pre-populated responses. It works best when you tap its buttons. Its premium tier, roughly a yearly subscription or a monthly fee depending on your country, adds more tools and the option of a human coach. Its bot speaks several languages including Hindi; Urdu is offered only through the human coaches.",
          "In 2026 Common Sense Media rated Wysa unacceptable for teenagers, and its Trustpilot reviews repeatedly name the same two gaps: no memory between sessions, and a scripted loop that repeats the same prompts.",
        ],
      },
      {
        heading: "What Aura is",
        paragraphs: [
          "Aura is a free AI therapist built on a general language model with a written therapeutic stance rather than a decision tree. She remembers your name, your sister's name, the argument from last Tuesday, and what helped before. She replies in two or three sentences, asks one question at most, and pushes back when you are being unfair to yourself. Chat is free for everyone with no session cap. Voice and circles open when you support the work, from $5.",
        ],
        bullets: [
          "Memory across every conversation, on any device",
          "Free chat with no message limit and no card",
          "English, Urdu, Hindi, Arabic, Spanish, French, including Roman Urdu and Hinglish, with the safety layer reading all six",
          "A crisis pathway that shows the line for your country and stays careful for the rest of the conversation",
          "Anonymous nightly circles hosted by Aura, opening at 50 members",
        ],
      },
      {
        heading: "Where Wysa is stronger",
        paragraphs: [
          "Wysa has published research, a human coaching option, enterprise deals with employers and health systems, and years of safety engineering including a multilingual safety benchmark. If you want a structured CBT course with a coach behind it and your employer pays, Wysa is a sensible choice. Aura is not a course and does not sell coaching.",
        ],
      },
      {
        heading: "Where Aura is stronger",
        paragraphs: [
          "Continuity, conversation, and cost. Aura is built around being remembered, which is the single most common complaint about Wysa and every other app. She talks like a person, not a menu. And chat is free without a timer or an upgrade wall inside a hard night. For Urdu, Hindi, and Arabic speakers, Aura answers in the language you write, bot to person, not through a coach you have to pay for.",
        ],
      },
      {
        heading: "The honest limits of both",
        paragraphs: [
          "Neither is a licensed therapist. Neither should be your only support in a crisis. Both will tell you so. Aura is newer, with fewer published outcomes; Wysa is older, with a structure some people find comforting and others find robotic. Try one message with Aura on the homepage and see which kind of conversation you want.",
        ],
      },
    ],
    faqs: [
      { q: "Is Wysa free?", a: "Wysa's core scripted chatbot is free. The premium tools and human coaching are paid. Aura's chat is free with no cap; voice and circles open when you support the work, from $5, monthly or as a single payment." },
      { q: "Does Wysa remember previous conversations?", a: "Not in the way people expect. Reviews consistently cite missing memory. Aura stores your profile and memories on the server and carries them into every conversation." },
      { q: "Does Wysa work in Urdu?", a: "Wysa's bot does not; Urdu is available only via its human coaches. Aura replies in Urdu, including Roman Urdu, directly." },
      { q: "Which is safer?", a: "Both have crisis detection. Aura runs a two-layer safety check in six languages before every reply and attaches the crisis line for your country. Wysa was rated unacceptable for teens by Common Sense Media in 2026; Aura is for adults." },
      { q: "Can I use both?", a: "Yes. Some people use Wysa's exercises and talk to Aura about what came up. There is no lock-in on Aura's side." },
    ],
    related: COMPARE_RELATED,
    ctaLine: "One sentence to Aura, no signup. Then decide.",
  },

  "woebot-alternative": {
    slug: "woebot-alternative",
    title: "Woebot Shut Down | A Free AI Therapist Alternative That Remembers You",
    description:
      "Woebot closed its consumer app on 30 June 2025. If you used it, Aura is a free alternative: chat with no cap, memory across sessions, six languages, and a crisis-aware safety layer.",
    h1: "Woebot is gone. Here is where to go next.",
    intro:
      "Woebot's consumer app closed on 30 June 2025, and its users were asked to export their data before it disappeared. Its founder said the regulators had not kept pace with the technology. If Woebot was your nightly check-in, this page is for you: what it did well, what to look for in a replacement, and how Aura compares.",
    sections: [
      {
        heading: "What Woebot got right",
        paragraphs: [
          "Woebot was one of the first products to prove, in a randomised trial, that a text chatbot could reduce depressive symptoms in two weeks. It was warm, brief, structured, and it showed up every day. Most of what worked was not the CBT content; it was the sense of being checked on. Any replacement should keep that.",
        ],
      },
      {
        heading: "What to look for in a replacement",
        bullets: [
          "Memory: does it remember what you said yesterday, or start from zero",
          "A real free tier: free until the timer runs out is not free",
          "Crisis handling: what happens when you say something serious, and whether it shows the right line for your country",
          "Your language: whether it reads Urdu, Hindi, Arabic, Spanish, or French, not just English",
          "Honesty: whether it tells you it is not a therapist and when to see one",
        ],
        paragraphs: [
          "Several apps Woebot users moved to in 2025 have since closed or paywalled. Youper announced its shutdown for September 2026. Ash, free through 2025, is introducing subscriptions. Choose something built to stay free at the chat level.",
        ],
      },
      {
        heading: "How Aura compares",
        paragraphs: [
          "Aura keeps the daily-companion shape and adds what Woebot never had: memory across sessions, a conversational voice rather than a scripted one, six languages with a safety layer that reads all of them, and anonymous nightly circles with other people carrying the same thing. Chat with Aura is free for everyone with no session cap. She is not a course; she is the friend who happens to know how to listen, and who tells you kindly when a professional is the right next step.",
        ],
      },
      {
        heading: "Moving over",
        paragraphs: [
          "There is nothing to import. Tell Aura what you want her to know in the first conversation, or add memories yourself from your space. She will carry them from then on. If you kept your Woebot export, the parts worth keeping are the patterns you noticed, not the transcripts.",
        ],
      },
    ],
    faqs: [
      { q: "Why did Woebot shut down?", a: "Woebot Health closed its consumer app on 30 June 2025 and refocused on enterprise and clinical work. Its founder cited regulation lagging behind the technology." },
      { q: "Is Aura like Woebot?", a: "In shape, yes: short, daily, text-first. In substance, Aura is conversational rather than scripted, remembers you, and works in six languages." },
      { q: "Is Aura free?", a: "Chat is free for everyone with no cap and no card. Voice and circles open when you support the work, from $5." },
      { q: "Can I bring my Woebot data?", a: "There is no importer. Tell Aura what matters in your first conversation, or add memories from your space." },
      { q: "Is Aura safe in a crisis?", a: "Aura runs a two-layer safety check before every reply, shows the crisis line for your country, and stays careful for the rest of the conversation. She is not an emergency service." },
    ],
    related: COMPARE_RELATED,
    ctaLine: "Start with one sentence. No account needed for the first reply.",
  },

  "youper-alternative": {
    slug: "youper-alternative",
    title: "Youper Shutting Down | A Free AI Therapist Alternative With Memory",
    description:
      "Youper closes on 30 September 2026. Its users cited paywalls mid-conversation, no memory, and English only. Aura is a free alternative that remembers you in six languages.",
    h1: "Youper is closing. What its users were missing anyway.",
    intro:
      "Youper announced it will shut down on 30 September 2026. Before that, its reviews had settled on three complaints: it asked about your problems and then asked for money, it forgot previous conversations and repeated questions, and it only spoke English. If you are looking for where to go, start with those three, because they are exactly what a replacement should fix.",
    sections: [
      {
        heading: "The three complaints, and how Aura answers them",
        paragraphs: [
          "Paywall mid-conversation: Aura's chat is free for everyone with no session cap and no upgrade prompt inside a conversation, ever. Voice and circles are the only things that carry a price, they are asked for in your dashboard rather than sprung on you at a hard moment, and cancelling monthly support never claws back the voice minutes you already have.",
          "No memory: Aura stores your profile and memories on the server and reads them before every reply. She does not re-ask what you told her last week.",
          "English only: Aura works in English, Urdu, Hindi, Arabic, Spanish, and French, including Roman Urdu and Hinglish, and switches mid-sentence when you do.",
        ],
      },
      {
        heading: "What Youper did well",
        paragraphs: [
          "Youper's mood tracking and short guided exercises were genuinely useful to many people, and its clinical framing was careful. Aura is more conversation than tracker; if the tracker was the part you used, a dedicated mood app may suit you better alongside Aura.",
        ],
      },
      {
        heading: "Before you pick anything",
        bullets: [
          "Check whether chat is free without a timer",
          "Ask it about something you told it yesterday",
          "Say something in your language and see whether it answers in kind",
          "Read what it says about crisis, and whether the line it shows is for your country",
        ],
        paragraphs: [
          "Aura passes all four on the homepage before you sign up.",
        ],
      },
    ],
    faqs: [
      { q: "When does Youper shut down?", a: "Youper has announced a closing date of 30 September 2026." },
      { q: "Is Aura a paid app?", a: "No. Chat is free, always, with no session cap. Voice and circles open when you support the work, from $5 — monthly or a single payment, your choice, cancellable any time, and never asked for inside a conversation." },
      { q: "Does Aura remember me?", a: "Yes. Profile, goals, and memories are stored on the server and used in every reply." },
      { q: "Does Aura track mood?", a: "There is a daily check-in in the dashboard. Aura is primarily a conversation, not a tracker." },
      { q: "Is there an Android or iPhone app?", a: "Aura is a web app that installs to your home screen from the browser. Store apps come once members have rated the product." },
    ],
    related: COMPARE_RELATED,
    ctaLine: "Try the four tests on the homepage, free.",
  },

  "character-ai-psychologist-alternative": {
    slug: "character-ai-psychologist-alternative",
    title: "Character.AI Psychologist vs Aura | A Free AI Therapist Built for Support",
    description:
      "Tens of millions of messages go to Character.AI's Psychologist bot. It has no memory of you, no crisis pathway, and no safety layer. Aura is free, remembers you, and is built for this.",
    h1: "Character.AI's Psychologist bot, and what it cannot do.",
    intro:
      "The Psychologist character on Character.AI has received tens of millions of messages, most from people under thirty, many at night. It is a role-play character written by a user, not a support tool, and in January 2026 Character.AI and Google settled lawsuits brought by families of teenagers. If you have used it, you already know why: it is there, it is free, and it answers. This page is about what it does not do, and what a tool built for the same moment looks like.",
    sections: [
      {
        heading: "What a role-play character is",
        paragraphs: [
          "Character.AI characters are personas defined by a short description. The Psychologist bot plays a psychologist. It has no therapeutic stance, no safety layer, no memory of you beyond the current chat, and no idea what country you are in. It will happily agree with whatever you frame, because agreeing is what keeps a role-play going.",
        ],
      },
      {
        heading: "What Aura does differently",
        bullets: [
          "Every message passes a two-layer safety check in six languages before Aura replies; serious moments bring up the crisis line for your country",
          "Aura remembers you across conversations and devices",
          "She follows written talking rules: short turns, one question, no diagnosis, no medication advice, and she disagrees when you are being unfair to yourself",
          "She tells you plainly what she is: support, not a substitute for a professional",
          "Chat is free with no cap, and there are no personas to switch between",
        ],
      },
      {
        heading: "For people under 18",
        paragraphs: [
          "Aura is for adults. If you are under 18 and struggling, please talk to a trusted adult or use a youth line in your country. We say this because the alternative, a role-play bot that does not know your age or your risk, is exactly what the lawsuits were about.",
        ],
      },
    ],
    faqs: [
      { q: "Is the Character.AI Psychologist a real psychologist?", a: "No. It is a user-written role-play character. It has no credentials, no safety pathway, and no memory of you between chats." },
      { q: "Is Aura a real therapist?", a: "No. Aura is an AI companion built for support, with a safety layer and written rules. She is not a substitute for a licensed professional and says so." },
      { q: "Does Aura remember me like a character does?", a: "Better. Characters forget you when the chat ends. Aura stores your profile and memories and reads them every time." },
      { q: "Is Aura free like Character.AI?", a: "Chat with Aura is free for everyone with no session cap." },
      { q: "Can I use Aura at 16?", a: "Aura is for adults. Please use a youth line in your country or talk to a trusted adult." },
    ],
    related: COMPARE_RELATED,
    ctaLine: "One honest sentence to Aura, no persona required.",
  },

  "best-free-ai-therapist-apps": {
    slug: "best-free-ai-therapist-apps",
    title: "Best Free AI Therapist Apps in 2026, Honestly Ranked",
    description:
      "Which AI therapist apps are actually free in 2026, which paywall you mid-conversation, which remember you, and which handle a crisis. Wysa, Ash, Abby, Pi, Wellzy, and Aura compared.",
    h1: "The free AI therapist apps of 2026, honestly ranked.",
    intro:
      "Most lists of free AI therapist apps are written by the apps. This one is written by one of them, so read it knowing that, and check the claims. We rank on four things people actually care about after the first week: is it still free, does it remember you, what does it do when you say something serious, and does it speak your language.",
    sections: [
      {
        heading: "The short version",
        bullets: [
          "Aura: chat free with no cap; memory; six languages with a safety layer reading all of them; circles. Newest, fewest published outcomes.",
          "Pi: free and unlimited; warm; some memory; no crisis pathway or safety layer; a general companion, not a support tool.",
          "Wysa: free scripted CBT; premium for tools and coaches; languages including Hindi; weak memory; rated unacceptable for teens in 2026.",
          "Ash: free through 2025 with session memory; subscriptions arriving; English only; explicitly not for crisis.",
          "Abby: tight free message caps; monthly subscription; no continuity between sessions; Modern Standard Arabic only.",
          "Wellzy: free daily conversations; monthly premium; little public detail on memory or safety.",
        ],
      },
      {
        heading: "What free means on each",
        paragraphs: [
          "The word covers three different things. Free forever at the chat level, which is Aura and Pi. Free with a scripted core and paid extras, which is Wysa and Wellzy. Free until a cap or a trial ends, which is Abby, and increasingly Ash. The second and third are fine as long as they say so before you are three messages into a hard night. The complaint that fills app-store reviews is the paywall that appears mid-conversation.",
        ],
      },
      {
        heading: "Memory, the thing everyone wants",
        paragraphs: [
          "The most-cited frustration across reviews of every app is being forgotten. Only a few products claim memory across sessions and fewer deliver it. Aura stores your profile and memories on the server and reads them before every reply; ChatGPT has memory but no therapeutic rules or crisis pathway; Ash claims session memory; Abby and Youper reviews say no.",
        ],
      },
      {
        heading: "Crisis handling",
        paragraphs: [
          "Ask each app what happens when you say something serious. Ash says it is not designed for crisis. Pi and role-play characters have no pathway. Wysa detects risk in its free tier. Aura runs a regex and model check in six languages before every reply, shows the crisis line for your country, and stays careful for the rest of the conversation. None of them is an emergency service, and the honest ones say so.",
        ],
      },
      {
        heading: "Languages",
        paragraphs: [
          "Wysa's bot speaks several languages including Hindi. Abby offers Modern Standard Arabic rather than dialect. Ash and Youper are English only. Aura works in English, Urdu, Hindi, Arabic, Spanish, and French, including Roman Urdu and Hinglish, with the safety layer reading all six, which no other consumer app currently claims.",
        ],
      },
      {
        heading: "Who should pick what",
        paragraphs: [
          "A structured CBT course with a coach and an employer paying: Wysa. A warm general companion with no support claims: Pi. Conversation that remembers you, free, in your language, with a safety net: Aura. Whatever you pick, use it alongside people, not instead of them.",
        ],
      },
    ],
    faqs: [
      { q: "Which AI therapist apps are completely free?", a: "At the chat level, Aura and Pi. Most others are free with caps, trials, or a scripted core and paid extras." },
      { q: "Which AI therapist app has memory?", a: "Aura stores memories on the server and uses them every reply. ChatGPT has memory without therapeutic rules. Ash claims session memory. Most others do not." },
      { q: "Which is safest in a crisis?", a: "Look for a product that checks every message, shows the crisis line for your country, and says plainly it is not an emergency service. Aura does all three. Several apps state they are not designed for crisis." },
      { q: "Which apps work in Urdu, Hindi, or Arabic?", a: "Wysa's bot has Hindi. Abby has Modern Standard Arabic. Aura has Urdu, Hindi, Arabic, Spanish, French, and English, including Roman Urdu and Hinglish." },
      { q: "Is this list biased?", a: "It is written by Aura's team, and we have said so. Every claim about another product comes from its own site or public reviews as of September 2026; tell us if one is out of date." },
    ],
    related: COMPARE_RELATED,
    ctaLine: "Run the four tests on Aura first. It costs one sentence.",
  },

  "is-ai-therapy-safe": {
    slug: "is-ai-therapy-safe",
    title: "Is AI Therapy Safe? What the Laws, the APA, and the Research Say",
    description:
      "AI therapy is safe when the product checks every message for risk, never diagnoses, shows real crisis lines, and tells you what it is. Here is what the APA, state laws, and Stanford found, and how Aura is built.",
    h1: "Is AI therapy safe? It depends entirely on how it is built.",
    intro:
      "The honest answer is that some of it is and some of it is not, and the difference is engineering, not marketing. Stanford researchers found chatbots that answered a question about tall bridges instead of noticing suicide risk. The American Psychological Association advised in 2025 that generative AI should not be used for psychotherapy, diagnosis, or crisis support. Illinois, Nevada, Utah, California, New York, and Tennessee have passed laws about it. This page explains what the concerns are, what the rules say, and what a safe design looks like, using Aura as the worked example.",
    sections: [
      {
        heading: "The four documented failures",
        bullets: [
          "Sycophancy: agreeing with whatever you frame, including harmful beliefs. Stanford found this in most messages inside delusional conversations.",
          "Missed crisis: not recognising risk, or handing over a hotline from the wrong country, or none at all.",
          "Forgetting: starting from zero each time, so nothing accumulates and nothing is noticed.",
          "Pretending: implying a licence, a diagnosis, or confidentiality that does not exist.",
        ],
      },
      {
        heading: "What the laws now require",
        paragraphs: [
          "Illinois prohibits providing or advertising therapy through AI without a licensed professional involved. Nevada bars AI that represents itself as professional mental-health care. Utah requires disclosure that you are talking to an AI, at first use and after a break. California requires non-human disclosure and crisis protocols, with protections for minors. New York requires detection of suicidal ideation. The common thread: say what you are, detect risk, and never claim to be a clinician. Aura is built to that thread, and we do not market her as therapy in the legal sense anywhere in the product.",
        ],
      },
      {
        heading: "What a safe design looks like",
        bullets: [
          "Every message is checked for risk before a reply is written, in the language it was written in",
          "The check has two layers: a fast rules layer and a model layer that can only raise the alarm, never lower it",
          "A serious moment stays in view for the rest of the conversation, however the next message reads",
          "The crisis line shown is for the country you live in",
          "No diagnosis, no medication advice, no method talk, enforced by rules and checked after every reply",
          "Plain disclosure: an AI, support, not a substitute for care, and when to see a professional",
        ],
        paragraphs: [
          "That is Aura's design, and every item on the list is enforced in code, not just written in a policy. The detail is on the crisis safety page.",
        ],
      },
      {
        heading: "What AI support is good for, and not for",
        paragraphs: [
          "Good for: the 2am thought, the argument you are rehearsing, being heard between appointments, noticing patterns over weeks, a first step for people who would never book a session. Not for: a diagnosis, a medication decision, an emergency, or replacing a clinician when one is needed. Aura says the second list out loud when it applies.",
        ],
      },
      {
        heading: "Your data",
        paragraphs: [
          "The other safety question is privacy. Independent reviews have found most mental-health apps sell or share data. Aura stores your conversations for you, in your account, uses them only so she can remember you, never sells them, never trains a model on them, and lets you delete everything in one click.",
        ],
      },
    ],
    faqs: [
      { q: "Is AI therapy safe?", a: "It can be, when the product checks every message for risk, shows real crisis lines, never diagnoses, and tells you what it is. Products without those are not. Aura has all four, enforced in code." },
      { q: "Is AI therapy legal?", a: "Using AI support is legal everywhere. Several US states restrict providers from offering or advertising AI as therapy without a licensed professional. Aura is offered as support, not therapy, and does not diagnose or treat." },
      { q: "What does the APA say?", a: "The APA's 2025 advisory says generative AI should not be used for psychotherapy, diagnosis, or crisis support, and should be an adjunct to care. Aura's design follows that: support, not treatment." },
      { q: "What happens if I say something serious to Aura?", a: "She slows down, stays with you, shows the crisis line for your country, and follows a written script. If you are in immediate danger, contact your local emergency number first." },
      { q: "Is my conversation private?", a: "Stored in your account, used only so Aura can remember you, never sold or used for training, deletable in one click. Aura is not a licensed clinician, so legal privilege does not apply." },
    ],
    related: COMPARE_RELATED,
    ctaLine: "See the safety layer work: say one honest sentence on the homepage.",
  },
};

/* ---------- Glossary entries (semantic SEO) ------------------------ */

export const GLOSSARY: Record<string, SeoPage> = {
  "cognitive-distortions": {
    slug: "cognitive-distortions",
    title: "Cognitive Distortions: A Plain-English Guide",
    description:
      "Cognitive distortions are the small ways your mind tells you a half-true story. Catastrophizing, mind-reading, all-or-nothing — what they are, and how to notice them.",
    h1: "Cognitive distortions, in plain English.",
    intro:
      "A cognitive distortion is a small, repeatable pattern your mind uses to tell itself a half-true story. They're not personal failings. They're shortcuts that everyone runs, sometimes more loudly than other times. Naming them is most of the work.",
    sections: [
      {
        heading: "The most common ones, in the wild",
        paragraphs: [],
        bullets: [
          "All-or-nothing thinking — \"I'm a failure\" instead of \"I had a hard week.\"",
          "Catastrophizing — assuming the worst-case is the only case.",
          "Mind-reading — believing you know what others are thinking.",
          "Fortune-telling — treating a prediction as a fact.",
          "Personalizing — taking responsibility for things that aren't yours.",
          "Should statements — telling yourself what you should be doing, feeling, becoming.",
          "Discounting the positive — letting evidence to the contrary count for nothing.",
        ],
      },
      {
        heading: "How Calm Therapist treats them",
        paragraphs: [
          "When the agent notices one of these patterns in your message, it gently names it and invites you to look at it from a different angle. It does not lecture you or list distortions in a wall of text. It picks one and asks one question.",
        ],
      },
    ],
    faqs: [
      { q: "Are cognitive distortions a diagnosis?", a: "No — they're a CBT framework for patterns of thought that anyone can notice and change." },
      { q: "Can I get rid of them?", a: "Not really. The goal is to notice them in time to put them down." },
    ],
    related: [
      { href: "/glossary/rumination", label: "Rumination" },
      { href: "/glossary/self-reflection", label: "Self-reflection" },
      { href: "/ai-therapist", label: "AI therapist" },
    ],
    ctaLine: "Try noticing one in your own thinking — type it on the landing page.",
  },

  rumination: {
    slug: "rumination",
    title: "Rumination: Why Going in Circles Hurts More Than It Helps",
    description:
      "Rumination is repeated, passive thinking about what's wrong. It feels productive. It isn't. Here's what it is, why it sticks, and what shifts it.",
    h1: "Rumination — going in circles.",
    intro:
      "Rumination is repeated, passive thinking about what's wrong, why it's wrong, and what it means about you. It feels like working on the problem. It isn't. It's the same loop, dressed up in slightly different words each time.",
    sections: [
      {
        heading: "Why ruminating feels productive",
        paragraphs: [
          "Because it engages the same neural circuitry as actual problem-solving without the costly business of trying things. The brain reads activity as progress. Hours pass, nothing changes externally, but it felt like work.",
        ],
      },
      {
        heading: "What actually shifts a rumination loop",
        paragraphs: [
          "Modality switch. If you're stuck in your head, the way out is rarely through more thought. It's a body, a place, an action — even small. A walk. A different room. Naming what you can see. The agent in Calm Therapist is trained to interrupt loops, not feed them.",
        ],
      },
    ],
    faqs: [
      { q: "Is rumination the same as worry?", a: "Closely related but distinct. Worry tends to be future-oriented and what-if; rumination is past- or self-oriented and why-am-I." },
      { q: "Can rumination be helpful?", a: "Brief, focused reflection helps. The loop without an exit is what hurts." },
    ],
    related: [
      { href: "/glossary/cognitive-distortions", label: "Cognitive distortions" },
      { href: "/glossary/self-reflection", label: "Self-reflection" },
      { href: "/ai-therapist", label: "AI therapist" },
    ],
    ctaLine: "If you're in a loop, try one sentence — see if naming it helps.",
  },

  "self-reflection": {
    slug: "self-reflection",
    title: "Self-Reflection: The Skill, Not the Aesthetic",
    description:
      "Self-reflection is the deliberate, kind, slightly uncomfortable practice of looking at your own thoughts. Here's what it is, what it isn't, and why it works.",
    h1: "Self-reflection, the skill.",
    intro:
      "Self-reflection is not journaling pretty thoughts. It is the deliberate, kind, slightly uncomfortable practice of looking at your own thoughts as if they belonged to someone you loved. Done well, it's the most reliable lever you have.",
    sections: [
      {
        heading: "Reflection vs. rumination",
        paragraphs: [
          "Rumination loops without exit. Reflection has a question and a destination. The question is: what am I actually feeling, and what is the story underneath the feeling? The destination is: a slightly clearer picture of yourself than you started with.",
        ],
      },
      {
        heading: "Why it works",
        paragraphs: [
          "The act of putting an internal experience into language changes the experience. The same thought, written or spoken, becomes more handle-able. Calm Therapist is built around this — it's not a feed of advice, it's a place to think out loud.",
        ],
      },
    ],
    faqs: [
      { q: "Is reflection the same as therapy?", a: "No. Therapy includes reflection but adds a clinical relationship and structured methods. Reflection on its own is a daily skill." },
      { q: "How often should I reflect?", a: "Often enough that the patterns become visible. Once or twice a week is enough for most people." },
    ],
    related: [
      { href: "/glossary/rumination", label: "Rumination" },
      { href: "/glossary/cognitive-distortions", label: "Cognitive distortions" },
      { href: "/ai-therapist", label: "AI therapist" },
    ],
    ctaLine: "Try one sentence of reflection on the landing page.",
  },
};

export const ALL_PAGE_SLUGS = [
  ...Object.keys(PAGES),
  ...Object.keys(GLOSSARY).map((s) => `glossary/${s}`),
];
