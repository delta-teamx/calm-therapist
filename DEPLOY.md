# Deployment

Three services, one origin for the browser.

| Piece | Where | What it does |
|---|---|---|
| Public site | Netlify | Builds the Next.js app and serves the marketing pages, blog, sitemap, feed. |
| Backend | Render web service | The same Next.js app, run as Node. Handles `/api/*`, `/dashboard`, `/auth`, `/onboarding`, `/admin`. |
| Database | Supabase (project `calm-ai`) | Postgres. Schema applied and baselined for Prisma. |
| Email cron | Render cron job | Calls `/api/cron/emails` every five minutes with the shared secret. |

Netlify proxies the backend paths to Render with status 200 (see `netlify.toml`), so
the visitor's browser only ever talks to the public domain. Cookies set by Render
travel back through the proxy and are stored for the public domain.

## Render

1. Blueprints, New Blueprint Instance, pick this repo. It creates the web service and the cron job from `render.yaml`.
2. Set the blank variables:
   - `DATABASE_URL`: Supabase pooled URL, port 6543, with `?pgbouncer=true`.
   - `DATABASE_DIRECT_URL`: Supabase direct URL, port 5432. Migrations use this.
   - `NEXT_PUBLIC_APP_URL`: the public site address, for example `https://calm-therapist.netlify.app`.
   - `GOOGLE_REDIRECT_URI`: `<NEXT_PUBLIC_APP_URL>/api/auth/google/callback`. Register the same URL in Google Cloud.
   - `COOKIE_DOMAIN`: leave blank on a netlify.app address; set `.yourdomain.com` once the custom domain is live.
   - `ADMIN_EMAIL`, `ADMIN_INITIAL_PASSWORD` (12+ characters), `OPENAI_API_KEY`, ElevenLabs, Resend, Google, Ko-fi.
3. Deploy. The build runs `prisma migrate deploy` against `DATABASE_DIRECT_URL`; on the baselined Supabase database it is a no-op.
4. Check `https://calm-therapist.onrender.com/api/health` for `db: ok`.

If the service gets a different address than `calm-therapist.onrender.com`, update the
seven `to =` lines in `netlify.toml` and the cron URL in `render.yaml`.

## Netlify

1. Link the repo, production branch as agreed.
2. Variables: only the public ones matter here, because no backend code runs on Netlify:
   `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_BRAND_NAME`, `NEXT_PUBLIC_FOUNDING_CAP`,
   `NEXT_PUBLIC_CONTENT_UPDATED`, `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`,
   `NEXT_PUBLIC_BING_SITE_VERIFICATION`, `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`, `INDEXNOW_KEY`.
   Set `ALLOW_MEMORY_STORE=1` so the build never demands a database it does not use.
3. Build and deploy, Post processing: turn Pretty URLs off.
4. Deploy. Open the site: the homepage comes from Netlify, the hero demo call goes to Render through the proxy.

## Supabase

- Project settings, Database: the password for the two URLs above.
- Row Level Security is off on the app tables. The app connects as the database
  owner through Prisma and never uses the Supabase client, so turning RLS on with
  no policies is safe and closes the REST API to the anon key. Recommended.

## Custom domain

Point the domain at Netlify. Set `NEXT_PUBLIC_APP_URL` on both hosts and
`COOKIE_DOMAIN` on Render to `.yourdomain.com`. Google OAuth redirect URI changes
with it. Nothing else moves.
