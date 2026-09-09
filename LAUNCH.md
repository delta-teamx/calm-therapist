# Launch checklist

Everything needed to take Calm Therapist live, in the order it has to happen.
Deployment mechanics live in `DEPLOY.md`; this file is about accounts, keys,
and the go/no-go list.

---

## 1. The accounts you need

Six services. Four are required to launch; two are optional but cheap.

| # | Service | Required? | What breaks without it | Cost |
|---|---|---|---|---|
| 1 | **OpenAI** | **Yes** | Aura falls back to a canned mock stream. Chat, session notes, journal reads, the monthly reflection and the second-pass safety classifier all run here. | Usage-based |
| 2 | **Supabase** (Postgres) | **Yes** | Every account, memory, mood, journal entry, voice balance and support pass lives only in the memory of one server process and is lost on restart. | Free tier is enough to start |
| 3 | **Render** | **Yes** | Nowhere to run the backend. | Free tier sleeps; $7/mo keeps it warm |
| 4 | **Netlify** | **Yes** | Nowhere to serve the public site. | Free |
| 5 | **ElevenLabs** | For voice only | The voice agent cannot start a call. Chat is unaffected. | ~$0.081/min all-in |
| 6 | **Ko-fi** | For unlocks only | Nobody can open voice or circles. | Free plan takes 5% |
| 7 | **Resend** | Recommended | Emails are written to the log instead of sent: no verification mail, no password reset, no circle invitations. | Free to 3k/mo |
| 8 | **Google Cloud** (OAuth) | Optional | "Continue with Google" disappears; email sign-up still works. | Free |
| 9 | **Plausible** or similar | Optional | No analytics. | ~$9/mo |

---

## 2. Every environment variable, by service

`.env.example` is the authoritative list and carries a comment on each one.
This is the same list grouped by where you get the value.

### Required — the app refuses to serve in production without these

```
AUTH_SECRET              32+ random chars. Generate: openssl rand -base64 32
DATABASE_URL             Supabase pooled URL, port 6543, ?pgbouncer=true
DATABASE_DIRECT_URL      Supabase direct URL, port 5432. Migrations use this.
ADMIN_EMAIL              The one account allowed into /admin
ADMIN_INITIAL_PASSWORD   12+ chars. Change it after first sign-in.
```

### OpenAI

```
OPENAI_API_KEY           platform.openai.com -> API keys
AURA_MODEL               defaults to gpt-5.4-mini
SAFETY_MODEL             defaults to gpt-5.4-mini
CRISIS_LLM_PASS          1 (default). Leave on: it is the second safety pass.
```

### ElevenLabs — voice

```
ELEVENLABS_API_KEY               elevenlabs.io -> Profile -> API key
NEXT_PUBLIC_ELEVENLABS_AGENT_ID  Conversational AI -> your agent -> id
```

The agent must exist and be configured before voice works. Minutes are read
back from ElevenLabs server-side after each call; the browser never reports
its own usage.

### Ko-fi — the unlock

```
NEXT_PUBLIC_KOFI_URL      Your public page, e.g. https://ko-fi.com/yourname
KOFI_VERIFICATION_TOKEN   Ko-fi -> Settings -> API -> Verification token
```

Then, in Ko-fi's API settings, set the **webhook URL** to:

```
https://<your-render-service>.onrender.com/api/kofi/webhook
```

Point it at Render directly rather than through the public domain: it skips
the Netlify proxy hop, and Ko-fi retries a non-200 forever.

**Without `KOFI_VERIFICATION_TOKEN` the webhook returns 503 and refuses every
request.** That is deliberate — an open payment webhook is worse than a broken
one.

### Supabase

```
DATABASE_URL / DATABASE_DIRECT_URL   Project Settings -> Database
```

Turn Row Level Security **on** with no policies on the app tables. The app
connects as the database owner through Prisma and never uses the Supabase
client, so RLS-on closes the public REST API to the anon key and costs the app
nothing.

### Resend — email

```
RESEND_API_KEY    resend.com -> API keys
EMAIL_FROM        e.g. "Aura at Calm Therapist <hello@yourdomain.com>"
EMAIL_REPLY_TO    a real inbox you read
CRON_SECRET       openssl rand -hex 24. Without it /api/cron/emails is public.
```

The sending domain has to be verified in Resend (SPF + DKIM) or mail goes to
spam.

### Google OAuth — optional

```
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URI     <NEXT_PUBLIC_APP_URL>/api/auth/google/callback
```

The redirect URI must be registered in Google Cloud, character for character.

### The free tier and the support tiers

```
FREE_CHAT_MESSAGES_PER_DAY   120   fair-use cap on free chat, not a paywall
FREE_JOURNAL_READS_PER_WEEK  3     LLM-backed journal reads
FOUNDING_MEMBER_CAP          150   badge only; grants no access
MIN_SUPPORT_USD              3
SUPPORT_MINUTES_COFFEE       15    at $3
SUPPORT_MINUTES_SUPPORTER    60    at $10
SUPPORT_MINUTES_PATRON       150   at $25
SUPPORT_MINUTES_FOUNDER      300   at $50
```

`tests/support.test.ts` asserts every tier stays above cost at $0.081/min with
8% payment fees. If you raise the minutes, that test tells you when a tier
starts losing money.

### Site and SEO

```
NEXT_PUBLIC_APP_URL                    the public address, no trailing slash
NEXT_PUBLIC_BRAND_NAME
NEXT_PUBLIC_CIRCLES_OPEN_AT            member count that opens circles
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION   Search Console
NEXT_PUBLIC_BING_SITE_VERIFICATION     Bing Webmaster Tools
INDEXNOW_KEY                           any 32-char hex; pings Bing on deploy
NEXT_PUBLIC_PLAUSIBLE_DOMAIN           optional analytics
NEXT_PUBLIC_CONTENT_UPDATED            ISO date; feeds `dateModified` in schema
```

### Stripe

Stripe is **not** on the unlock path. The keys remain in `.env.example` for the
older top-up route; leave them blank and nothing Stripe-related renders.

---

## 3. How the unlock actually works

```
member opens voice or circles
        |
        v
  UnlockDialog  ── gate 1 ──>  POST /api/feedback
        |                      any rating, high or low, opens the gate.
        |                      publicConsent is a separate opt-in tick and is
        |                      never required.
        |
        └─ gate 2 ──> GET /api/unlock issues a single-use code (AURA-XXXXXX)
                      member pastes it into the Ko-fi message and pays
                              |
                              v
                      Ko-fi POSTs /api/kofi/webhook
                      (form-urlencoded, one `data` field holding a JSON string)
                              |
                      token compared in constant time
                      deduped on message_id (the table's primary key)
                      code matched -> SupportPass created
                                   -> minutes added to VoiceQuota.balanceSec
                                   -> code consumed, never reusable
```

If the member forgets the code, `POST /api/unlock/claim` matches an unclaimed
payment by Ko-fi transaction id or by the email they paid with. That route is
rate limited to 8 attempts an hour per account.

Minutes are **owned**, not rented: `balanceSec` never resets on a monthly
rollover. Circles access is a time-boxed flag; supporting again extends the
end date rather than replacing it.

---

## 4. Before you switch it on

- [ ] `npm run typecheck` — clean
- [ ] `npm test` — 81 tests green
- [ ] `npm run build` — succeeds
- [ ] Migrations applied: `npm run db:migrate` against `DATABASE_DIRECT_URL`
- [ ] `/api/health` returns `db: ok`
- [ ] Sign up with a real email, confirm the verification mail arrives
- [ ] Send a message to Aura; confirm the reply streams and a memory is written
- [ ] Type a crisis phrase; confirm the hotline for your country appears
- [ ] Open the unlock dialog: leave a 1-star review; confirm the gate opens anyway
- [ ] Send yourself $3 on Ko-fi with the code in the message
- [ ] Confirm the pass appears in Settings and voice minutes land on the account
- [ ] Send the same webhook twice (Ko-fi's "test" button) and confirm no double grant
- [ ] `/admin` loads for `ADMIN_EMAIL` and for nobody else
- [ ] Submit the sitemap in Google Search Console and Bing Webmaster Tools

---

## 5. Two decisions still open

**Ko-fi's terms.** Ko-fi's creator-terms template says donations "are not
payments for goods or services and do not entitle the donor to any tangible or
intangible benefits beyond personal satisfaction." Unlocking a feature in
exchange for a plain tip sits badly against that. The fix inside Ko-fi is to
sell a **Shop item, Pay What You Want, minimum $3, digital** rather than take a
tip — the webhook already handles Shop orders, since it reads `amount` and
`message` the same way. Also check Ko-fi's "Contributor" setting, which is
reported to default ON for new creators and takes an extra 5% of tips.

**Stripe would be better for this.** Payment Links cost 2.9% + $0.30 with no
platform fee (versus Ko-fi's 5% plus processor), sign their webhooks with HMAC
and a replay window, and carry `client_reference_id` — which removes the claim
code entirely, because the payment arrives already tied to the account. The
code is structured so a Stripe source would be a second `source` value on
`SupportPass`, not a rewrite. Worth doing if the Ko-fi friction shows up in the
numbers.
