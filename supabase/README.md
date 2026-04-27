# Supabase Setup

This directory contains SQL migrations for the sandy.photography Supabase project.

## Migrations

| File | Description |
|---|---|
| `001_initial_schema.sql` | Creates all tables: `photos`, `series`, `series_photos`, `blog_posts`, `projects`, `kudos`, `about` |
| `002_rls_policies.sql` | Enables Row Level Security and creates access policies |
| `003_kudos_rpc.sql` | Creates the `increment_kudos` SECURITY DEFINER RPC function |

## Applying Migrations

### Option A — Supabase CLI (recommended)

1. Install the CLI: `npm install -g supabase`
2. Log in: `supabase login`
3. Link your project: `supabase link --project-ref <your-project-ref>`
4. Push all migrations: `supabase db push`

Or run a single file manually:
```bash
supabase db execute --file supabase/migrations/001_initial_schema.sql
```

### Option B — SQL Editor in the Supabase Dashboard

1. Open your project at [app.supabase.com](https://app.supabase.com)
2. Go to **SQL Editor**
3. Paste and run each migration file in order:
   - `001_initial_schema.sql`
   - `002_rls_policies.sql`
   - `003_kudos_rpc.sql`

## Required Environment Variables

### Frontend (Vite — safe to expose)

Set these in `.env.local` for local development and in Vercel project settings for production:

```
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_CLOUDINARY_CLOUD_NAME=<your-cloudinary-cloud-name>
```

### Supabase Edge Functions (server-side secrets — never expose to the browser)

Set these via the Supabase Dashboard under **Project Settings → Edge Functions → Secrets**, or with the CLI:

```bash
supabase secrets set CLOUDINARY_API_SECRET=<your-cloudinary-api-secret>
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

## Setting Up the Cloudinary Edge Function Secret

The `sign-cloudinary-upload` Edge Function uses `CLOUDINARY_API_SECRET` to generate signed upload URLs. To configure it:

1. Get your API secret from the [Cloudinary Console](https://console.cloudinary.com) under **Settings → Access Keys**.
2. Add it as a Supabase Edge Function secret (see above).
3. The secret is only accessible inside the Edge Function runtime — it never reaches the browser.

> The Cloudinary API secret and Supabase service role key must **never** be added to `.env` files committed to the repository or exposed as `VITE_*` variables.
