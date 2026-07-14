# Worklog — sandy.photography

## Session Overview

This session covered the full lifecycle of building and deploying `sandy.photography` — from initial concept through spec, implementation, deployment setup, and a round of bug fixes and UI polish.

---

## Phase 1: Spec & Design

### Requirements
Built a detailed requirements document covering 16 areas:
- Photography grid (masonry, native aspect ratios, blur-up placeholders)
- Photo detail view (full-screen lightbox, EXIF metadata, fullscreen mode)
- In-browser photo upload (drag-and-drop, EXIF extraction, Cloudinary)
- Photo series (collections with ordering, public series pages)
- Photo tags and filtering (`/photos/[tag]` URLs)
- Camera and lens browse pages (`/cameras/[make]/[model]`)
- Photo metadata (EXIF auto-extraction, 35mm equivalent focal length, manual override)
- Blog editor (Tiptap-based Notion-like editor, draft/publish flow)
- Blog reading (Medium-style layout, reading time, progress bar)
- Projects section
- Kudos (anonymous clapping, up to 50 per visitor, no login required)
- Share button (native OS share sheet on mobile/macOS, fallback dropdown)
- About page
- Landing page
- Auth (Supabase magic link + GitHub OAuth, admin-only)
- Responsive design (375px minimum, touch gestures, 44px tap targets)

Key additions during requirements refinement:
- Photo hover description overlay
- Glass.photo-style series with preview grids
- Camera/lens clickable links in photo viewer
- EXIF camera settings block with 35mm equivalent focal length
- Upload/edited dates displayed in viewer
- Fullscreen mode (F key) in photo viewer
- Apple Liquid Glass design language (backdrop-filter on nav/overlays)
- AVIF/JPEG XL as preferred delivery formats
- Kudos added to both photos and blog posts
- Share buttons on photos, series pages, and blog posts
- About page and landing page added
- Comments intentionally excluded

### Design Decisions
| Layer | Choice | Why |
|---|---|---|
| Frontend | React + Vite | User preference, fast HMR |
| Routing | React Router v7 | Nested layouts, config-based |
| Styling | Tailwind CSS + Radix UI | Utility-first, accessible primitives |
| Animations | Framer Motion | Page transitions, micro-interactions |
| Blog editor | Tiptap (ProseMirror) | Notion-like, headless, extensible |
| Database + Auth | Supabase | Postgres + RLS + Auth + Edge Functions |
| Image CDN | Cloudinary | Auto AVIF/WebP, responsive variants, EXIF API |
| Hosting | Vercel | Custom domain, zero-config Vite, preview deploys |
| EXIF extraction | exifr | Client-side, no server round-trip |

---

## Phase 2: Implementation (All 25 Tasks)

### Infrastructure (Tasks 1–5)
- Scaffolded Vite + React + TypeScript project with all dependencies
- Supabase SQL migrations: `photos`, `series`, `series_photos`, `blog_posts`, `projects`, `kudos`, `about` tables
- Row Level Security policies — public read, admin-only writes
- `increment_kudos` SECURITY DEFINER RPC function
- Supabase Edge Function `sign-cloudinary-upload` (SHA-1 signed, secrets never reach browser)
- `src/lib/cloudinary.ts` URL builder (responsive, blur placeholder, full-res, download)
- `src/lib/exif.ts` EXIF extraction + crop factor lookup + focal length equivalent calculation
- `src/lib/upload.ts` full upload flow (EXIF → sign → Cloudinary XHR → Supabase INSERT)
- `src/types/index.ts` TypeScript interfaces
- Vitest + React Testing Library + fast-check configured

### Auth & Layout (Tasks 3–4)
- `LoginPage` with magic link + GitHub OAuth, `?redirect=` preservation
- `ProtectedRoute` with session check, loading spinner, redirect to `/login`
- `useAuth` hook (session, signOut)
- `Navigation` — initially full-width, later redesigned to floating pill
- `PageTransition` — Framer Motion fade+slide wrapper
- `RootLayout` — nav + outlet shell

### Photo Features (Tasks 6–10)
- `usePhotoGrid` hook — shortest-column-first masonry algorithm, ResizeObserver
- `PhotoCard` — blur-up placeholder, lazy loading, hover description overlay
- `PhotoGrid` — Supabase fetch, Realtime subscription, masonry layout
- `PhotoViewer` — full-screen lightbox, EXIF panel, series/camera/lens links, fullscreen mode, keyboard nav, touch swipe
- `KudosButton` — 👏 animation, localStorage cap (50), optimistic RPC, rollback on error
- `ShareButton` — native Web Share API with fallback dropdown (copy, email, Twitter, Messages)
- `PhotosPage` — tag filter bar, search, URL-driven filtering

### Upload (Task 12)
- `UploadZone` — drag-and-drop, per-file type/size validation, descriptive errors
- `PhotoUploader` admin page — metadata form per file, progress bars, retry

### Series, Camera, Lens (Tasks 13–14)
- `SeriesManager` — create/edit/delete series, add/remove/reorder photos (up/down arrows)
- `SeriesCard` — 2×2 preview grid of first photos
- `AllSeriesPage` + `SeriesPage` — public series browsing with ShareButton
- `CameraBrowsePage` + `LensBrowsePage` — filter photos by camera/lens ILIKE

### Blog (Tasks 15–16)
- `BlogEditor` — Tiptap with H1–H3, bold, italic, code, blockquote, lists, links, images
- Auto-save to localStorage every 30s + on blur, restore draft banner
- Publish/Save Draft buttons with Supabase UPSERT
- `BlogListPage` — published posts sorted by date, reading time estimate
- `BlogPostPage` + `BlogPostLayout` — Medium-style 680px layout
- `ReadingProgress` — scroll-driven top bar (Framer Motion)
- `@tailwindcss/typography` for prose styling

### Content Pages (Tasks 17–20)
- `ProjectsPage` + `ProjectCard` + `ProjectsManager` admin CRUD
- `AboutPage` + `AboutEditor` (bio, profile photo via Cloudinary, links)
- `LandingPage` — hero with staggered Framer Motion entrance, featured photos grid, entry point cards
- `AdminDashboard` — navigation cards to all admin sections

### Polish (Tasks 22–24)
- Responsive audit: `overflow-x: hidden`, mobile single-column grid
- Touch swipe in PhotoViewer
- 44×44px tap targets on all mobile controls
- ARIA roles: `role="navigation"`, `role="dialog"`, `role="progressbar"` on ReadingProgress
- Meaningful `alt` text on all images
- Vercel SPA rewrite rule, `.env.example` documentation

---

## Phase 3: Deployment & Debugging

### Deployment setup
- Supabase project created, tables confirmed in dashboard
- **Security fix**: `.env.local` had service role key set as anon key — replaced with correct anon key
- GitHub OAuth configured (GitHub OAuth App → Supabase provider)
- Cloudinary account connected, cloud name corrected (`ydekzxhgrd` was wrong, fixed to `dekzxhgrd`)
- Supabase Edge Function deployed with Cloudinary secrets

### Bugs fixed
| Bug | Root Cause | Fix |
|---|---|---|
| Images partially load, viewer blank | `secure_url` not used — Cloudinary URLs rebuilt from wrong cloud name | Use `photo.secure_url` directly instead of reconstructing URLs |
| Upload form fields disabled immediately | `status: 'pending'` treated same as `'uploading'` in disabled condition | Only disable during `'uploading'` status |
| EXIF not pre-filling form | `exif.file === file` reference comparison fails across async closures | Added stable `id` per entry, match on `e.id === entryId` |
| EXIF returning empty `{}` | `exifr` `pick` array silently misses some camera tags | Removed `pick`, parse all EXIF segments (`tiff: true, exif: true`) |
| Film scans show no EXIF | Expected — scanned film has no embedded EXIF | Added "No EXIF data found" message for these files |
| Shutter speed shows as decimal | `0.0015625` not formatted | Added `formatShutterSpeed()` → displays as `1/640` |
| Cloudinary "Bad Request" | Stale signature timestamp when uploading multiple files | Fetch fresh signature per file, not once for whole batch |
| Mobile grid shows 3 columns | `usePhotoGrid` defaults to width `1280` before ResizeObserver fires | Initialize from `window.innerWidth` |

---

## Phase 4: UI/UX Changes

### Dark/Light mode
- Implemented with CSS custom properties (`--bg`, `--fg`, `--fg-muted`, `--border`, etc.) on `:root` and `html.dark`
- `ThemeContext` toggles `dark` class on `<html>`, persists to localStorage
- All public pages use token utility classes (`.bg-theme`, `.text-theme`, etc.) — no per-component dark variants
- Admin pages intentionally stay dark

### Photo grid
- Fixed to 3 columns desktop, 1 column mobile (< 640px)
- Removed all padding — grid is edge-to-edge horizontally
- Gap doubled from `gap-0.5` (2px) to `gap-1` (4px)
- Landing page photos also use edge-to-edge `PhotoGrid` component

### Floating navbar
- Replaced full-width fixed bar with a centered floating pill
- `backdrop-blur-xl`, rounded corners (`rounded-2xl`), subtle border, `shadow-sm`
- Floats 12px from top (`top-3`)
- Mobile dropdown expands below the pill with matching styling
- Sun/Moon theme toggle in nav

---

## Current State

The site is **fully functional locally** at `http://localhost:5173`:
- Photos upload, display in masonry grid, open in full-screen viewer with EXIF
- EXIF auto-extracts from Sony JPEGs (film scans show manual entry prompt)
- Auth works via GitHub OAuth
- All admin pages functional (upload, series, projects, about, blog editor)

### Still to do
- Push to GitHub and connect to Vercel
- Connect `sandy.photography` domain in Vercel
- Upgrade Cloudinary plan (free tier caps files at 10 MB; Sony A7 IV files are 12–20 MB)
- Update GitHub OAuth callback URL to production domain after Vercel deploy
- Add production URL to Supabase auth redirect allowlist

### Known environment notes
- Active project: `sandy.photography/` (not `sandy-photography/` — that's the original scaffold)
- Supabase project ref: `voofhweoeolcpwdfzbpz`
- Cloudinary cloud name: `dekzxhgrd`
- All env vars in `sandy.photography/.env.local`
