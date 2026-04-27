# Deployment Plan — sandy.photography

This document covers everything you need to go from the local codebase to a live site at `sandy.photography`, plus a developer reference for customizing the layout and appearance.

---

## Part 1: Third-Party Accounts to Create

Before touching any config, create accounts on these three platforms. All have generous free tiers that cover a personal site.

### 1.1 Supabase (database + auth + edge functions)

1. Go to [app.supabase.com](https://app.supabase.com) and sign up
2. Click "New project", give it a name (e.g. `sandy-photography`), choose a region close to you, set a database password (save it somewhere)
3. Wait ~2 minutes for the project to provision
4. Go to **Project Settings → API** and copy:
   - `Project URL` → this is your `VITE_SUPABASE_URL`
   - `anon public` key → this is your `VITE_SUPABASE_ANON_KEY`

### 1.2 Cloudinary (image storage + CDN)

1. Go to [cloudinary.com](https://cloudinary.com) and sign up for a free account
2. From the dashboard, copy:
   - `Cloud name` → this is your `VITE_CLOUDINARY_CLOUD_NAME`
3. Go to **Settings → Access Keys** and copy:
   - `API Key` → this is your `CLOUDINARY_API_KEY` (Edge Function secret)
   - `API Secret` → this is your `CLOUDINARY_API_SECRET` (Edge Function secret)
4. Go to **Settings → Upload** and make sure unsigned uploads are disabled (the app uses signed uploads via the Edge Function)

### 1.3 Vercel (hosting)

1. Go to [vercel.com](https://vercel.com) and sign up (use GitHub OAuth for easiest setup)
2. You'll connect your repo here in Part 3

---

## Part 2: Database Setup (Supabase)

Run the three SQL migration files in order. You can do this two ways:

### Option A — Supabase Dashboard (easiest, no CLI needed)

1. In your Supabase project, go to **SQL Editor**
2. Click "New query"
3. Paste the contents of `supabase/migrations/001_initial_schema.sql` and click **Run**
4. Repeat for `002_rls_policies.sql`
5. Repeat for `003_kudos_rpc.sql`

### Option B — Supabase CLI

```bash
npm install -g supabase
supabase login
supabase link --project-ref <your-project-ref>   # found in Project Settings → General
supabase db push
```

### What the migrations create

- `photos` — all photo metadata, EXIF data, Cloudinary IDs
- `series` + `series_photos` — photo collections with ordering
- `blog_posts` — Tiptap JSON content, draft/published status
- `projects` — project cards with tags and links
- `kudos` — aggregate clap counts for photos and blog posts
- `about` — your bio, profile photo URL, and links
- Row Level Security policies — public read on everything, admin-only writes
- `increment_kudos` RPC function — lets anonymous visitors clap without direct DB write access

### Enable Realtime (optional but recommended)

In Supabase dashboard → **Database → Replication**, enable the `photos` table for realtime. This makes newly uploaded photos appear in the grid without a page reload.

---

## Part 3: Deploy to Vercel

### 3.1 Push code to GitHub

```bash
cd sandy-photography
git init
git add .
git commit -m "feat: initial sandy.photography build"
# create a new repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/sandy-photography.git
git push -u origin main
```

### 3.2 Import to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository" and select your repo
3. Vercel auto-detects Vite. Confirm these settings:
   - Framework: **Vite**
   - Build command: `vite build`
   - Output directory: `dist`
4. Before clicking Deploy, go to **Environment Variables** and add:

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `VITE_CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name |

5. Click **Deploy**. First deploy takes ~1 minute.

### 3.3 Connect your custom domain

1. In your Vercel project → **Settings → Domains**
2. Click "Add Domain" and type `sandy.photography`
3. Vercel will show you DNS records to add. You'll need two:
   - An **A record** pointing `@` to Vercel's IP (shown on screen)
   - A **CNAME record** pointing `www` to `cname.vercel-dns.com`
4. Log in to wherever you bought the domain (Namecheap, Google Domains, Cloudflare, etc.) and add those DNS records
5. DNS propagation takes 5–30 minutes. Vercel auto-provisions a TLS certificate once it verifies.
6. Add `www.sandy.photography` as a second domain in Vercel and set it to redirect to `sandy.photography`

---

## Part 4: Supabase Edge Function Setup

The photo upload flow uses a Supabase Edge Function to generate signed Cloudinary upload URLs server-side (so your API secret never reaches the browser).

### 4.1 Deploy the Edge Function

```bash
# Install Supabase CLI if you haven't
npm install -g supabase

# Login and link
supabase login
supabase link --project-ref <your-project-ref>

# Deploy the function
supabase functions deploy sign-cloudinary-upload
```

### 4.2 Set Edge Function secrets

These are server-side only — never put them in `.env` files or Vite variables.

```bash
supabase secrets set CLOUDINARY_API_SECRET=your-api-secret
supabase secrets set CLOUDINARY_API_KEY=your-api-key
supabase secrets set CLOUDINARY_CLOUD_NAME=your-cloud-name
```

You can also set these in the Supabase dashboard under **Project Settings → Edge Functions → Secrets**.

---

## Part 5: Auth Setup

The site uses Supabase Auth with magic link email and GitHub OAuth.

### 5.1 Configure allowed redirect URLs

In Supabase dashboard → **Authentication → URL Configuration**:
- Site URL: `https://sandy.photography`
- Redirect URLs: add `https://sandy.photography/**` and `http://localhost:5173/**` (for local dev)

### 5.2 Enable GitHub OAuth (optional)

1. Go to [github.com/settings/developers](https://github.com/settings/developers) → New OAuth App
2. Homepage URL: `https://sandy.photography`
3. Callback URL: `https://<your-project-ref>.supabase.co/auth/v1/callback`
4. Copy the Client ID and Client Secret
5. In Supabase → **Authentication → Providers → GitHub**, paste them in and enable

### 5.3 First login

Navigate to `https://sandy.photography/login`, enter your email, and click "Send magic link". Check your email and click the link. You're now the admin.

---

## Part 6: Local Development

```bash
cd sandy-photography
cp .env.example .env.local
# fill in your values in .env.local

npm install
npm run dev
# site runs at http://localhost:5173
```

To run tests:
```bash
npm test
```

---

## Part 7: Development Summary & Customization Guide

This section is a reference for when you want to change how things look or work.

### Tech stack at a glance

| What | Tool | Where to change it |
|---|---|---|
| UI framework | React + Vite | `vite.config.ts` |
| Routing | React Router v7 | `src/App.tsx` |
| Styling | Tailwind CSS v3 | `tailwind.config.js`, `src/index.css` |
| UI primitives | Radix UI | individual component files |
| Animations | Framer Motion | individual component files |
| Blog editor | Tiptap | `src/pages/admin/BlogEditor.tsx` |
| Database + auth | Supabase | `src/lib/supabase.ts` |
| Image CDN | Cloudinary | `src/lib/cloudinary.ts` |
| EXIF extraction | exifr | `src/lib/exif.ts` |
| Hosting | Vercel | `vercel.json` |

---

### Customizing the design

#### Colors and dark theme

The entire site uses Tailwind's neutral palette on a black background. The key classes used throughout:

- Background: `bg-black` (pages), `bg-neutral-900` (cards/panels), `bg-neutral-950` (admin pages)
- Text: `text-white` (primary), `text-neutral-400` (secondary), `text-neutral-500` (muted)
- Borders: `border-white/10` (subtle), `border-neutral-700` (admin forms)
- Hover states: `hover:bg-white/20`, `hover:border-white/30`

To change the accent color (currently white), search for `bg-blue-600` (used on admin action buttons) and `bg-white text-black` (used on primary CTAs) and replace with your preferred color.

#### Liquid Glass navigation

The nav bar's frosted glass effect is in `src/components/layout/Navigation.tsx`:
```
backdrop-blur-md bg-black/40 border-b border-white/10
```
Adjust `bg-black/40` to change opacity, or `backdrop-blur-md` to `backdrop-blur-sm`/`backdrop-blur-lg` for less/more blur.

#### Typography

Blog posts use `@tailwindcss/typography` via the `prose prose-invert prose-neutral` classes in `src/components/blog/BlogPostLayout.tsx`. To customize font sizes, line height, or heading styles, extend the typography config in `tailwind.config.js`:
```js
theme: {
  extend: {
    typography: {
      DEFAULT: { css: { /* your overrides */ } }
    }
  }
}
```

#### Page transitions

Framer Motion page transitions are in `src/components/layout/PageTransition.tsx`. The current animation is a subtle fade + upward slide. To change it, edit the `initial`, `animate`, and `exit` props.

#### Landing page hero

`src/pages/LandingPage.tsx` — the hero section has Sandy's name, tagline, and nav links. The staggered entrance animation delays are controlled by the `fadeUpVariant(delay)` helper at the top of the file. The featured photos grid fetches the 6 most recent photos — change `.limit(6)` to show more or fewer.

---

### Customizing the photo grid

The masonry layout is in `src/hooks/usePhotoGrid.ts`. Column counts:
- `< 640px` → 1 column
- `640–1023px` → 2 columns
- `1024–1279px` → 3 columns
- `≥ 1280px` → 4 columns

To change these breakpoints, edit the `useColumnCount` function. The gap between photos is controlled by `gap-2` in `src/components/photos/PhotoGrid.tsx`.

The hover description overlay on photo cards is in `src/components/photos/PhotoCard.tsx` — look for the `group-hover:opacity-100` div at the bottom.

---

### Customizing the photo viewer

`src/components/photos/PhotoViewer.tsx` is the full-screen lightbox. Key areas:

- Metadata panel width: `w-full md:w-80 lg:w-96` on the `<aside>` element
- Metadata panel background: `bg-white/5 backdrop-blur-md border-l border-white/10`
- Fullscreen mode: toggled by the F key or the maximize button — the `fullscreen` state controls which layout renders
- EXIF display: the camera settings block is inside the `showExif` conditional — add or remove fields here

---

### Customizing the blog

- Reading layout max width: `max-w-[680px]` in `src/components/blog/BlogPostLayout.tsx` — change to `max-w-[720px]` or `max-w-[800px]` for wider posts
- Reading progress bar color: `bg-white` in `src/components/blog/ReadingProgress.tsx` — change to any color
- Blog list card style: `src/pages/BlogListPage.tsx` — each post is a `<Link>` with border/hover styles

---

### Customizing the about page

`src/pages/AboutPage.tsx` — the name "Sandy Patil" is hardcoded as a fallback. The bio, profile photo, and links all come from the `about` table in Supabase, editable at `/admin/about`.

---

### Adding new pages or routes

1. Create a new component in `src/pages/`
2. Add the route in `src/App.tsx` inside the `<Route element={<RootLayout />}>` block (or outside it if you don't want the nav)
3. Add a link to it in `src/components/layout/Navigation.tsx` if it should appear in the nav

---

### Cloudinary image transformations

All Cloudinary URLs are built in `src/lib/cloudinary.ts`. The current transforms:

- Grid thumbnails: `f_auto,q_auto,w_800,dpr_1` — increase width for higher-res grid images
- Blur placeholder: `f_auto,q_1,w_40,e_blur:1000` — the tiny blurred preview shown while loading
- Full resolution (viewer): `f_auto,q_auto` — Cloudinary picks the best format (AVIF → WebP → JPEG)
- Download: `fl_attachment` — forces browser download of original

To serve JPEG XL where supported, add `f_jxl` as a preferred format. Note: Cloudinary's `f_auto` already serves AVIF to browsers that support it.

---

### Environment variables reference

| Variable | Where | Purpose |
|---|---|---|
| `VITE_SUPABASE_URL` | `.env.local` + Vercel | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `.env.local` + Vercel | Supabase public anon key (safe to expose) |
| `VITE_CLOUDINARY_CLOUD_NAME` | `.env.local` + Vercel | Cloudinary cloud name (safe to expose) |
| `CLOUDINARY_API_SECRET` | Supabase Edge Function secrets only | Signs upload requests — never in browser |
| `CLOUDINARY_API_KEY` | Supabase Edge Function secrets only | Cloudinary API key |
| `CLOUDINARY_CLOUD_NAME` | Supabase Edge Function secrets only | Cloudinary cloud name (server copy) |

---

### File structure reference

```
sandy-photography/
  src/
    App.tsx                          # All routes + layout shell
    components/
      layout/
        Navigation.tsx               # Top nav bar (Liquid Glass)
        PageTransition.tsx           # Framer Motion page wrapper
      photos/
        PhotoCard.tsx                # Grid thumbnail + hover overlay
        PhotoGrid.tsx                # Masonry grid + Realtime
        PhotoViewer.tsx              # Full-screen lightbox
        KudosButton.tsx              # 👏 clap button
        ShareButton.tsx              # Native share / fallback dropdown
      blog/
        BlogPostLayout.tsx           # Medium-style reading layout
        ReadingProgress.tsx          # Scroll progress bar
      series/
        SeriesCard.tsx               # Series preview card
      projects/
        ProjectCard.tsx              # Project card
      admin/
        UploadZone.tsx               # Drag-and-drop upload area
        ProtectedRoute.tsx           # Auth guard
    pages/
      LandingPage.tsx                # / — hero + featured photos
      PhotosPage.tsx                 # /photos — grid + filter + search
      AllSeriesPage.tsx              # /series — all series grid
      SeriesPage.tsx                 # /series/:slug — series detail
      CameraBrowsePage.tsx           # /cameras/:make/:model
      LensBrowsePage.tsx             # /lenses/:make/:model
      BlogListPage.tsx               # /blog — post listing
      BlogPostPage.tsx               # /blog/:slug — post reading
      ProjectsPage.tsx               # /projects
      AboutPage.tsx                  # /about
      LoginPage.tsx                  # /login
      admin/
        AdminDashboard.tsx           # /admin
        PhotoUploader.tsx            # /admin/upload
        BlogEditor.tsx               # /admin/blog/new + /admin/blog/:id/edit
        SeriesManager.tsx            # /admin/series
        ProjectsManager.tsx          # /admin/projects
        AboutEditor.tsx              # /admin/about
    hooks/
      useAuth.ts                     # Session + signOut
      usePhotoGrid.ts                # Masonry column layout
      useKudos.ts                    # Clap logic + localStorage cap
      useShare.ts                    # Web Share API detection
    lib/
      supabase.ts                    # Supabase client
      cloudinary.ts                  # URL builder helpers
      exif.ts                        # EXIF extraction + focal length calc
      upload.ts                      # Full upload flow
      utils.ts                       # slugify()
    types/
      index.ts                       # TypeScript interfaces
  supabase/
    migrations/
      001_initial_schema.sql         # All tables
      002_rls_policies.sql           # Row Level Security
      003_kudos_rpc.sql              # increment_kudos function
    functions/
      sign-cloudinary-upload/
        index.ts                     # Deno Edge Function
    README.md                        # Supabase setup instructions
  vercel.json                        # SPA rewrite rule
  .env.example                       # Environment variable template
  tailwind.config.js                 # Tailwind + typography plugin
```
