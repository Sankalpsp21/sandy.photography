# Implementation Plan: sandy.photography

## Overview

Incremental implementation of the React + Vite photography portfolio and blog. Each task builds on the previous, wiring everything together at the end. TypeScript throughout. Supabase for data/auth, Cloudinary for images, Framer Motion + Radix UI + Tailwind for UI.

## Tasks

- [ ] 1. Project scaffold and core infrastructure
  - Initialize Vite + React + TypeScript project with Tailwind CSS, Radix UI, and Framer Motion
  - Configure React Router v7 with all route definitions from the design (public + admin routes)
  - Create `src/lib/supabase.ts` Supabase client using `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
  - Create `src/lib/cloudinary.ts` URL builder helpers for responsive, blur-placeholder, full-res, and download transforms
  - Create `src/lib/exif.ts` wrapping `exifr` with focal-length-equivalent calculation (native × crop factor)
  - Set up Vitest + React Testing Library + fast-check as dev dependencies
  - Create `vercel.json` with SPA fallback rewrite rule
  - _Requirements: 7.3, 7.4, 8.1, 9.1_

- [ ] 2. Supabase schema and RLS
  - [ ] 2.1 Write and apply SQL migration for all tables: `photos`, `series`, `series_photos`, `blog_posts`, `projects`, `kudos`, `about`
    - Include all columns, constraints, and default values from the design data models
    - _Requirements: 1.5, 3.2, 4.4, 6.3, 11.1, 13.1, 14.1_
  - [ ] 2.2 Write and apply RLS policies for all tables
    - Public read on `photos`, `series`, `series_photos`, `projects`, `about`, `kudos`
    - Published-only public read on `blog_posts`; admin reads all
    - Admin write on all tables using `auth.role() = 'authenticated'`
    - _Requirements: 9.1, 9.2_
  - [ ] 2.3 Create `increment_kudos` SECURITY DEFINER RPC function
    - Upsert into `kudos` table, return new aggregate count
    - _Requirements: 2.9, 5.7_

- [ ] 3. Authentication and protected routes
  - [ ] 3.1 Implement `LoginPage` with Supabase magic link and OAuth (GitHub) sign-in
    - Preserve `?redirect=` param so admin returns to original destination after auth
    - _Requirements: 9.3, 9.4, 9.5_
  - [ ] 3.2 Implement `ProtectedRoute` component that checks Supabase session and redirects to `/login` if unauthenticated
    - _Requirements: 9.1, 9.2_
  - [ ]* 3.3 Write unit tests for `ProtectedRoute` redirect behavior for unauthenticated users
    - _Requirements: 9.1, 9.2_

- [ ] 4. Layout, navigation, and page transitions
  - [ ] 4.1 Implement `Navigation` component with links to Photos, Blog, Projects, About, and admin entry point
    - Apply liquid glass style: `backdrop-filter: blur` + translucent background via Tailwind
    - Collapse to mobile menu (hamburger) below 768px with 44×44px tap targets
    - _Requirements: 7.1, 7.2, 7.4, 8.6, 10.5_
  - [ ] 4.2 Implement `PageTransition` Framer Motion wrapper applied to all route outlets
    - _Requirements: 7.3_
  - [ ] 4.3 Create root layout shell wiring `Navigation`, `PageTransition`, and all route components
    - _Requirements: 7.1_

- [ ] 5. Cloudinary URL builder and EXIF utilities
  - [ ] 5.1 Implement `cloudinary.ts` URL builder: responsive delivery, blur placeholder (q_1,w_40,e_blur:1000), full-res, and original download transforms
    - _Requirements: 8.1, 8.2, 1.4_
  - [ ]* 5.2 Write unit tests for `cloudinary.ts` URL builder output for specific transformation combinations
    - _Requirements: 8.1, 8.2_
  - [ ] 5.3 Implement `exif.ts`: `exifr` wrapper that extracts aperture, shutter, ISO, focal length, camera, lens, capture date; calculates 35mm equivalent focal length from crop factor lookup table
    - _Requirements: 14.2, 14.3_
  - [ ]* 5.4 Write unit tests for `exif.ts` focal length equivalent calculation with known crop factors
    - _Requirements: 14.3_
  - [ ]* 5.5 Write property test for focal length equivalent calculation
    - **Property 1: Focal length equivalent is always ≥ native focal length when crop factor ≥ 1**
    - **Validates: Requirements 14.3**

- [ ] 6. Photo grid and photo card
  - [ ] 6.1 Implement `usePhotoGrid` hook for masonry column layout calculations (3+ columns desktop, 2 columns 640–1024px, 1 column <640px)
    - _Requirements: 1.1, 1.2, 10.2_
  - [ ] 6.2 Implement `PhotoCard` component with blur-up placeholder, lazy loading, correct `width`/`height`/`aspect-ratio` attributes, and hover description overlay
    - Use Cloudinary blur URL as `src` and responsive URL as `data-src` with IntersectionObserver
    - _Requirements: 1.3, 1.4, 2.6, 8.3, 8.5, 14.7_
  - [ ] 6.3 Implement `PhotoGrid` masonry component composing `PhotoCard` instances, fetching from Supabase `photos` table
    - Subscribe to Supabase Realtime so new uploads appear without reload
    - _Requirements: 1.1, 1.2, 1.5, 3.5_
  - [ ]* 6.4 Write property test for masonry column assignment
    - **Property 2: Every photo is assigned to exactly one column and no photo is omitted**
    - **Validates: Requirements 1.1, 1.2**

- [ ] 7. Photo viewer lightbox
  - [ ] 7.1 Implement `PhotoViewer` full-screen overlay modal (Radix UI Dialog) with liquid glass backdrop
    - Display photo at full resolution via Cloudinary full-res URL
    - Show EXIF metadata panel (camera, lens, aperture, shutter, ISO, focal length with equivalent); hide panel entirely if no EXIF available
    - Prev/next navigation controls; close on Escape or outside click
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 14.6_
  - [ ] 7.2 Add fullscreen mode toggle (F key or button) that hides all UI chrome edge-to-edge; restore chrome on Escape, photo click, or exit control
    - _Requirements: 2.11, 2.12_
  - [ ] 7.3 Display series name as clickable link to `/series/[slug]` when photo belongs to a series
    - _Requirements: 11.5_
  - [ ] 7.4 Display camera make/model and lens make/model as clickable links to `/cameras/[make]/[model]` and `/lenses/[make]/[model]`
    - _Requirements: 13.5_
  - [ ]* 7.5 Write unit tests for `PhotoViewer` keyboard navigation (Escape closes, arrow keys navigate, F toggles fullscreen)
    - _Requirements: 2.3, 2.4, 2.11, 2.12_

- [ ] 8. Kudos button
  - [ ] 8.1 Implement `KudosButton` component with clapping-hands icon, animated increment, and displayed aggregate count
    - Read/write localStorage key `kudos:{item_type}:{item_id}` to enforce 50-clap cap per visitor
    - Call `increment_kudos` Supabase RPC; optimistic update with silent retry and rollback on persistent failure
    - _Requirements: 2.9, 2.10, 5.7, 5.8_
  - [ ] 8.2 Implement `useKudos` hook encapsulating localStorage cap logic and RPC call
    - _Requirements: 2.9, 5.7_
  - [ ]* 8.3 Write unit tests for `KudosButton` localStorage cap enforcement at 50 claps
    - _Requirements: 2.9, 5.7_
  - [ ]* 8.4 Write property test for kudos cap enforcement
    - **Property 3: Local clap count never exceeds 50 regardless of click count**
    - **Validates: Requirements 2.9, 5.7**

- [ ] 9. Share button
  - [ ] 9.1 Implement `ShareButton` component using Web Share API (`navigator.share`) when available; fall back to custom sheet with copy-link, Messages, Email, and Twitter/X options
    - _Requirements: 2.7, 2.8, 5.6, 11.7, 11.8_
  - [ ] 9.2 Implement `useShare` hook wrapping Web Share API detection and fallback logic
    - _Requirements: 2.7, 2.8_

- [ ] 10. Photos page with tag filtering and search
  - [ ] 10.1 Implement `PhotosPage` at `/photos` rendering `PhotoGrid` with all photos
    - _Requirements: 12.2_
  - [ ] 10.2 Add tag filter bar to `PhotosPage`; selecting a tag updates URL to `/photos/[tag]` and filters grid client-side without full reload
    - _Requirements: 12.3, 12.5_
  - [ ] 10.3 Add search input to `PhotosPage`; navigating to `/photos/[search-term]` filters photos by matching tags or keywords
    - _Requirements: 12.4_

- [ ] 11. Checkpoint — core photo browsing complete
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Photo upload (admin)
  - [ ] 12.1 Create Supabase Edge Function `sign-cloudinary-upload` that generates a signed Cloudinary upload URL using `CLOUDINARY_API_SECRET`; never expose secret to browser
    - _Requirements: 3.1, 3.2_
  - [ ] 12.2 Implement `UploadZone` drag-and-drop component with client-side validation (JPEG, PNG, HEIC, WebP, RAW; ≤ 50 MB); show descriptive per-file error on rejection
    - _Requirements: 3.4_
  - [ ] 12.3 Wire upload flow: extract EXIF with `exif.ts` → request signed URL from Edge Function → upload directly to Cloudinary → INSERT photo row into Supabase with all metadata
    - Show per-file progress indicators during upload
    - _Requirements: 3.2, 3.3, 3.5, 3.6, 14.2_
  - [ ] 12.4 Implement `PhotoUploader` admin page at `/admin/upload` composing `UploadZone` with metadata form (title, description, capture date, tags, series assignment, manual camera/lens override)
    - _Requirements: 3.1, 14.1, 14.4_
  - [ ]* 12.5 Write unit tests for `UploadZone` file validation (type and size rejection with correct error messages)
    - _Requirements: 3.4_

- [ ] 13. Photo series (admin + public)
  - [ ] 13.1 Implement `SeriesManager` admin page at `/admin/series` to create, edit, and delete series (title, description, slug); add/remove/reorder photos within a series
    - _Requirements: 11.1, 11.6_
  - [ ] 13.2 Implement `SeriesCard` component showing preview grid of first few photos, title, description, photo count, creation date, last-updated date
    - _Requirements: 11.3, 11.4_
  - [ ] 13.3 Implement `AllSeriesPage` at `/series` rendering a grid of `SeriesCard` components fetched from Supabase
    - _Requirements: 11.4_
  - [ ] 13.4 Implement `SeriesPage` at `/series/[slug]` showing series title, description, photo count, dates, photo grid, and `ShareButton`
    - _Requirements: 11.2, 11.7, 11.8_

- [ ] 14. Camera and lens browse pages
  - [ ] 14.1 Implement `CameraBrowsePage` at `/cameras/[make]/[model]` fetching and displaying all photos matching camera make/model in `PhotoGrid`
    - _Requirements: 13.3_
  - [ ] 14.2 Implement `LensBrowsePage` at `/lenses/[make]/[model]` fetching and displaying all photos matching lens make/model in `PhotoGrid`
    - _Requirements: 13.4_

- [ ] 15. Blog editor (admin)
  - [ ] 15.1 Implement `BlogEditor` Tiptap wrapper at `/admin/blog/new` and `/admin/blog/[id]/edit` supporting H1–H3, bold, italic, inline code, code blocks, blockquotes, ordered/unordered lists, hyperlinks, and inline image embeds (by URL or Cloudinary upload)
    - _Requirements: 4.1, 4.2, 4.3_
  - [ ] 15.2 Add autosave to `localStorage` every 30 seconds and on blur; restore on next admin login if session expired mid-edit
    - _Requirements: 4.7_
  - [ ] 15.3 Add Publish and Save Draft buttons; publish sets `status = 'published'` and `published_at`; draft sets `status = 'draft'`; editing a published post and publishing updates the live post
    - _Requirements: 4.4, 4.5, 4.6_
  - [ ]* 15.4 Write unit tests for `BlogEditor` draft persistence to/from localStorage and restoration after session expiry
    - _Requirements: 4.7_

- [ ] 16. Blog reading experience (public)
  - [ ] 16.1 Implement `BlogListPage` at `/blog` showing all published posts sorted newest-first (title, publication date, reading time estimate)
    - _Requirements: 5.1_
  - [ ] 16.2 Implement `BlogPostLayout` at `/blog/[slug]` with Medium-style single-column layout (max-width 680px), publication date, last-updated date, reading time (word count ÷ 200 wpm), `ReadingProgress` bar, `KudosButton`, and `ShareButton`
    - _Requirements: 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_
  - [ ] 16.3 Implement `ReadingProgress` component as a top-of-viewport progress bar driven by scroll position
    - _Requirements: 5.5_
  - [ ]* 16.4 Write unit tests for reading time calculation at 200 wpm
    - _Requirements: 5.3_
  - [ ]* 16.5 Write property test for reading time calculation
    - **Property 4: Reading time in minutes is always ceil(wordCount / 200) and is ≥ 1 for any non-empty post**
    - **Validates: Requirements 5.3**

- [ ] 17. Projects section (admin + public)
  - [ ] 17.1 Implement `ProjectsPage` at `/projects` rendering a grid of `ProjectCard` components (title, description, tech tags, external link opening in new tab); fully keyboard navigable
    - _Requirements: 6.1, 6.2, 6.4_
  - [ ] 17.2 Implement `ProjectsManager` admin page at `/admin/projects` to add, edit, reorder, and remove project entries
    - _Requirements: 6.3_

- [ ] 18. About page (admin + public)
  - [ ] 18.1 Implement `AboutPage` at `/about` with profile photo, name, bio, and optional links in a minimal single-column layout; fully responsive to 375px
    - _Requirements: 15.1, 15.2, 15.3, 15.5_
  - [ ] 18.2 Implement `AboutEditor` admin page at `/admin/about` to edit bio text, profile photo (Cloudinary upload), and links
    - _Requirements: 15.4_

- [ ] 19. Landing page
  - [ ] 19.1 Implement `LandingPage` at `/` with Sandy's name, tagline, and visual entry points to Photos, Blog, Projects, and About
    - Feature a selection of recent/featured photos using `PhotoCard` components
    - Apply Framer Motion entrance animations (staggered fade-in/slide-up) to key elements on first load
    - Fully responsive to 375px
    - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5_

- [ ] 20. Admin dashboard
  - [ ] 20.1 Implement `AdminDashboard` at `/admin` as a protected landing page with navigation cards to Upload, Blog, Series, Projects, and About editors
    - _Requirements: 3.1, 4.1, 6.3, 11.1_

- [ ] 21. Checkpoint — all features wired
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 22. Responsive design and mobile polish
  - [ ] 22.1 Audit all pages for horizontal scroll on 375px viewport; fix any overflow issues
    - _Requirements: 10.1, 15.5, 16.5_
  - [ ] 22.2 Implement swipe gesture navigation in `PhotoViewer` for touch devices (swipe left/right for prev/next)
    - _Requirements: 10.3_
  - [ ] 22.3 Verify all tap targets are ≥ 44×44 CSS pixels on mobile; fix any undersized targets
    - _Requirements: 10.5_
  - [ ] 22.4 Verify `BlogEditor` is usable on 768px+ tablet viewports
    - _Requirements: 10.4_

- [ ] 23. Accessibility and keyboard navigation
  - [ ] 23.1 Add visible focus indicators to all interactive elements; verify full keyboard operability across all pages and components
    - _Requirements: 7.6, 6.4_
  - [ ] 23.2 Ensure all `<img>` elements have meaningful `alt` text; verify ARIA roles on `PhotoViewer` dialog, `Navigation` landmark, and `ReadingProgress` region
    - _Requirements: 7.6_

- [ ] 24. Vercel deployment and environment configuration
  - [ ] 24.1 Add `vercel.json` with SPA rewrite rule (`/*` → `/index.html`) and configure build command (`vite build`) and output directory (`dist`)
    - _Requirements: (deployment)_
  - [ ] 24.2 Document required environment variables in `.env.example`: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_CLOUDINARY_CLOUD_NAME`; document Supabase Edge Function secrets: `CLOUDINARY_API_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`
    - _Requirements: (deployment)_

- [ ] 25. Final checkpoint — full integration
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests use fast-check with `numRuns: 100` minimum; each tagged `// Feature: sandy-photography-website, Property {N}: {text}`
- Cloudinary API secret and Supabase service role key must never reach the browser — Edge Function only
- Kudos visitor cap (50) is enforced client-side via localStorage; DB stores aggregate only
- Supabase Realtime subscription in `PhotoGrid` ensures new uploads appear without reload
