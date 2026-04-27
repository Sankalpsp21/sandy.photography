# Requirements Document

## Introduction

sandy.photography is a personal website for Sankalp "Sandy" Patil that combines the best of glass.photo (photography portfolio) and Medium (blogging platform). The site replaces an existing Astro-based portfolio and is built with React. It emphasizes crisp, high-quality photo display in a masonry/grid layout, an in-browser rich-text blog editor, a projects showcase, and a clean Apple-inspired design using Framer Motion and Radix UI — fully responsive across desktop and mobile.

## Glossary

- **Website**: The sandy.photography React web application
- **Admin**: The authenticated site owner (Sandy) who can upload photos, write blog posts, and manage projects
- **Visitor**: An unauthenticated user browsing the public-facing site
- **Photo_Grid**: The masonry-style responsive grid component that displays photos at their native aspect ratios
- **Photo_Viewer**: The full-screen modal/lightbox that displays a single photo with metadata
- **Photo_Uploader**: The in-browser interface that allows the Admin to upload photos to cloud storage
- **Blog_Editor**: The Notion-like rich-text editor used by the Admin to compose and publish blog posts
- **Blog_Post**: A published article authored by the Admin, rendered in a Medium-style reading layout
- **Projects_Section**: The page section listing the Admin's personal and professional projects with links
- **Image_CDN**: The cloud image delivery service (e.g., Cloudinary or Cloudflare Images) responsible for storing, transforming, and serving photos at optimal quality and performance
- **Auth_Service**: The authentication provider (e.g., Clerk or NextAuth) that restricts admin-only actions
- **Navigation**: The top-level site navigation bar present on all pages
- **Kudos**: An anonymous clapping-hands interaction that Visitors can give to photos and blog posts, up to 50 claps per visitor per item, tracked by a persistent count
- **About_Page**: A clean, minimal page presenting Sandy's personal bio, photo, and links
- **Landing_Page**: The root page of the site that introduces Sandy and provides entry points to all major sections

---

## Requirements

### Requirement 1: Photography Grid Display

**User Story:** As a Visitor, I want to browse Sandy's photos in a beautiful masonry grid, so that I can appreciate the photography at a glance without distortion or cropping.

#### Acceptance Criteria

1. THE Photo_Grid SHALL display photos in a responsive masonry layout that preserves each photo's native aspect ratio without cropping or stretching.
2. WHEN the viewport width changes, THE Photo_Grid SHALL reflow columns so that the layout remains visually balanced on both desktop (3+ columns) and mobile (1–2 columns).
3. WHEN a photo is loading, THE Photo_Grid SHALL display a low-quality image placeholder (blur-up) in the correct aspect ratio to prevent layout shift.
4. THE Photo_Grid SHALL render photos using the Image_CDN's responsive image URLs so that the browser downloads the smallest sufficient resolution for the current viewport.
5. WHEN the Admin uploads a new photo, THE Photo_Grid SHALL include that photo in the grid without requiring a code deployment.

---

### Requirement 2: Photo Detail View

**User Story:** As a Visitor, I want to click on a photo and see it full-screen with metadata, so that I can appreciate the image at maximum quality and learn about how it was taken.

#### Acceptance Criteria

1. WHEN a Visitor clicks a photo in the Photo_Grid, THE Photo_Viewer SHALL open as a full-screen overlay displaying the photo at the highest available resolution.
2. WHILE the Photo_Viewer is open, THE Photo_Viewer SHALL display available EXIF metadata (camera model, lens, aperture, shutter speed, ISO, focal length) alongside the photo.
3. WHILE the Photo_Viewer is open, THE Photo_Viewer SHALL provide previous and next navigation controls to move between photos without closing the overlay.
4. WHEN a Visitor presses the Escape key or clicks outside the photo, THE Photo_Viewer SHALL close and return focus to the Photo_Grid.
5. IF EXIF metadata is unavailable for a photo, THEN THE Photo_Viewer SHALL display the photo without a metadata panel rather than showing empty fields.
6. WHEN a Visitor hovers over a photo in the Photo_Grid, THE Photo_Grid SHALL display a brief description overlay on that photo if a description is set for the photo.
7. WHILE the Photo_Viewer is open, THE Photo_Viewer SHALL display a share button that opens a share sheet with options: copy link, share via Messages, share via Email, and share via Twitter/X.
8. WHERE the native OS share sheet is available (mobile devices and macOS desktop), THE Photo_Viewer SHALL invoke the native OS share sheet instead of a custom share UI.
9. THE Photo_Viewer SHALL display a kudos button (clapping hands icon) showing the total kudos count for that photo; WHEN a Visitor clicks the kudos button, THE Website SHALL increment the count by one clap per click up to a maximum of 50 claps per visitor per photo, without requiring the Visitor to be logged in.
10. WHEN a Visitor clicks the kudos button on a photo, THE Website SHALL animate the button and update the displayed count immediately without a page reload.
11. THE Photo_Viewer SHALL provide a dedicated fullscreen mode that hides all UI chrome (navigation, metadata panel, controls) and displays the photo edge-to-edge at maximum resolution, toggled by a fullscreen button or the F key.
12. WHEN fullscreen mode is active, THE Photo_Viewer SHALL restore all UI chrome when the Visitor presses Escape, clicks the photo, or clicks a visible exit control.
11. WHILE the Photo_Viewer is open, THE Photo_Viewer SHALL provide a fullscreen toggle that removes all UI chrome (navigation, metadata panel, controls) and displays the photo edge-to-edge filling the entire viewport.
12. WHEN fullscreen mode is active, THE Photo_Viewer SHALL restore all UI chrome when the Visitor presses Escape, clicks the photo, or taps a visible exit control on mobile.

---

### Requirement 3: In-Browser Photo Upload

**User Story:** As an Admin, I want to upload photos directly from the website, so that I can add new photos to my portfolio without touching the source code or deployment pipeline.

#### Acceptance Criteria

1. WHEN an Admin is authenticated, THE Photo_Uploader SHALL be accessible from the admin dashboard.
2. WHEN an Admin selects one or more image files, THE Photo_Uploader SHALL upload them to the Image_CDN and persist their metadata (title, description, capture date, EXIF data) to the database.
3. WHILE an upload is in progress, THE Photo_Uploader SHALL display per-file upload progress indicators.
4. IF an uploaded file exceeds 50 MB or is not a supported image format (JPEG, PNG, HEIC, WebP, RAW), THEN THE Photo_Uploader SHALL reject the file and display a descriptive error message before any upload begins.
5. WHEN all uploads complete successfully, THE Photo_Uploader SHALL make the new photos immediately visible in the Photo_Grid without requiring a page reload.
6. THE Photo_Uploader SHALL preserve the original full-resolution file in the Image_CDN so that the Admin can download originals at any time.

---

### Requirement 4: Blog Post Creation and Editing

**User Story:** As an Admin, I want to write and publish blog posts using a rich-text editor in the browser, so that I can share my thoughts without editing source code.

#### Acceptance Criteria

1. WHEN an Admin is authenticated, THE Blog_Editor SHALL be accessible from the admin dashboard.
2. THE Blog_Editor SHALL support rich-text formatting including headings (H1–H3), bold, italic, inline code, code blocks, blockquotes, ordered lists, unordered lists, and hyperlinks.
3. THE Blog_Editor SHALL support embedding images inline within a blog post by URL or by uploading directly to the Image_CDN.
4. WHEN an Admin clicks "Publish", THE Blog_Editor SHALL save the post and make it immediately visible on the public blog listing page.
5. WHEN an Admin clicks "Save Draft", THE Blog_Editor SHALL save the post in a draft state that is not visible to Visitors.
6. WHEN an Admin edits a previously published Blog_Post and clicks "Publish", THE Blog_Editor SHALL update the live post with the new content.
7. IF the Admin's session expires while editing, THEN THE Blog_Editor SHALL preserve the unsaved content in local storage and restore it upon the Admin's next login.

---

### Requirement 5: Blog Post Reading Experience

**User Story:** As a Visitor, I want to read blog posts in a clean, distraction-free layout, so that I can focus on the content.

#### Acceptance Criteria

1. THE Website SHALL display a blog listing page showing all published Blog_Posts sorted by publication date, newest first.
2. WHEN a Visitor clicks a Blog_Post in the listing, THE Website SHALL navigate to a dedicated post page rendered in a Medium-style single-column reading layout with a maximum content width of 680px.
3. THE Blog_Post page SHALL display an estimated reading time calculated from the post's word count at 200 words per minute.
4. THE Blog_Post page SHALL display the publication date and last-updated date.
5. WHILE a Visitor scrolls a Blog_Post, THE Website SHALL display a reading progress indicator at the top of the viewport.
6. THE Blog_Post page SHALL display a share button that opens a share sheet with options: copy link, share via Messages, share via Email, and share via Twitter/X; WHERE the native OS share sheet is available, THE Website SHALL invoke it instead of a custom share UI.
7. THE Blog_Post page SHALL display a kudos button (clapping hands icon) showing the total kudos count; WHEN a Visitor clicks the kudos button, THE Website SHALL increment the count by one clap per click up to a maximum of 50 claps per visitor per post, without requiring the Visitor to be logged in.
8. WHEN a Visitor clicks the kudos button, THE Website SHALL animate the button and update the displayed count immediately without a page reload.

---

### Requirement 6: Projects Section

**User Story:** As a Visitor, I want to browse Sandy's projects, so that I can learn about the work and follow links to live demos or repositories.

#### Acceptance Criteria

1. THE Projects_Section SHALL display a grid of project cards, each containing a project title, short description, technology tags, and an external link.
2. WHEN a Visitor clicks a project card's link, THE Website SHALL open the destination URL in a new browser tab.
3. WHEN an Admin is authenticated, THE Website SHALL provide an interface to add, edit, or remove project entries without a code deployment.
4. THE Projects_Section SHALL be fully navigable using keyboard controls alone.

---

### Requirement 7: Site-Wide Navigation and Layout

**User Story:** As a Visitor, I want a consistent, minimal navigation experience across all sections of the site, so that I can move between photos, blog, and projects effortlessly.

#### Acceptance Criteria

1. THE Navigation SHALL include links to the Photos, Blog, and Projects sections and SHALL be present on every page.
2. WHEN the viewport width is below 768px, THE Navigation SHALL collapse into a mobile-friendly menu (hamburger or bottom tab bar).
3. THE Website SHALL apply smooth page transitions using Framer Motion when navigating between sections.
4. THE Website SHALL use a design system based on Radix UI primitives with a neutral, minimal color palette consistent with Apple's Human Interface Guidelines, incorporating translucent frosted-glass UI surfaces (via CSS backdrop-filter) to approximate Apple's Liquid Glass design language across overlays, navigation bars, and modal surfaces.
5. THE Website SHALL achieve a Lighthouse performance score of 90 or above on mobile.
6. THE Website SHALL be fully operable using keyboard navigation alone, with visible focus indicators on all interactive elements.

---

### Requirement 8: Image Storage and Delivery Performance

**User Story:** As a Visitor, I want photos to load quickly at full quality, so that I can enjoy the photography without waiting.

#### Acceptance Criteria

1. THE Image_CDN SHALL serve photos in AVIF format as the primary delivery format, with JPEG XL as a secondary option where supported, and WebP as a fallback, using browser-negotiated content delivery so each Visitor receives the best format their browser supports.
2. THE Image_CDN SHALL provide responsive image variants so that the Website requests the appropriate resolution for the Visitor's viewport and device pixel ratio.
3. THE Website SHALL lazy-load photos that are below the fold so that initial page load only fetches above-the-fold images.
4. THE Image_CDN SHALL deliver images via a global CDN edge network with a target time-to-first-byte of under 200ms for cached assets.
5. THE Website SHALL include width and height attributes (or aspect-ratio CSS) on all image elements to prevent cumulative layout shift (CLS).
6. THE Website SHALL use translucent, frosted-glass UI panels (via CSS backdrop-filter and Radix UI primitives) to approximate Apple's Liquid Glass design language across overlays, navigation, and modal surfaces.

---

### Requirement 9: Authentication and Admin Access

**User Story:** As an Admin, I want to securely log in to the site, so that only I can upload photos, write posts, and manage projects.

#### Acceptance Criteria

1. THE Auth_Service SHALL restrict access to all admin routes (upload, blog editor, project management) to authenticated Admin sessions only.
2. WHEN an unauthenticated user attempts to access an admin route, THE Website SHALL redirect them to the login page.
3. THE Auth_Service SHALL support login via a secure method (OAuth provider or magic link email) without requiring a username/password credential stored in the application database.
4. WHEN an Admin logs out, THE Auth_Service SHALL invalidate the session and redirect to the public home page.
5. IF an Admin session token expires, THEN THE Auth_Service SHALL require re-authentication before granting access to admin routes.

---

### Requirement 10: Responsive Design and Mobile Experience

**User Story:** As a Visitor on a mobile device, I want the site to look and function as well as on desktop, so that I can enjoy the photography and content on any device.

#### Acceptance Criteria

1. THE Website SHALL render all pages without horizontal scrolling on viewports as narrow as 375px.
2. THE Photo_Grid SHALL display a single-column layout on viewports below 640px and a two-column layout between 640px and 1024px.
3. THE Photo_Viewer SHALL support swipe gestures on touch devices to navigate between photos.
4. THE Blog_Editor SHALL be usable on tablet-sized viewports (768px and above).
5. ALL tap targets on mobile SHALL have a minimum size of 44×44 CSS pixels.

---

### Requirement 11: Photo Series

**User Story:** As a Visitor, I want to browse curated series of related photos, so that I can experience Sandy's work as intentional collections rather than individual images.

#### Acceptance Criteria

1. WHEN an Admin is authenticated, THE Website SHALL provide an interface to create a named Series with a title and description, and an ordered list of photos, without a code deployment.
2. THE Series_Page SHALL display the series title, description, number of photos, creation date, and last-updated date, followed by all photos in the series in a grid layout, at a URL of the form /series/[slug].
3. THE Series_Preview SHALL display a grid of the first few photos in the series rather than a single manually selected cover photo.
4. THE Website SHALL provide a public "All Series" browse page at /series displaying all series as cards, each showing the series preview photo grid, title, description, photo count, creation date, and last-updated date.
5. WHILE the Photo_Viewer is open for a photo that belongs to a Series, THE Photo_Viewer SHALL display the series name as a clickable link that navigates to the Series_Page.
6. WHEN an Admin is authenticated, THE Website SHALL provide an interface to add photos to a series, remove photos from a series, and reorder photos within a series without a code deployment.
7. THE Series_Page SHALL display a share button that opens a share sheet with options: copy link, share via Messages, share via Email, and share via Twitter/X.
8. WHERE the native OS share sheet is available (mobile devices and macOS desktop), THE Series_Page SHALL invoke the native OS share sheet instead of a custom share UI.

---

### Requirement 12: Photo Tags and Filtering

**User Story:** As a Visitor, I want to filter and search photos by tag or keyword, so that I can find photos that match my interests.

#### Acceptance Criteria

1. WHEN an Admin uploads or edits a photo, THE Photo_Uploader SHALL allow the Admin to optionally add one or more tags to the photo.
2. THE Website SHALL provide a public browse page at /photos displaying all photos in the masonry Photo_Grid.
3. WHEN a Visitor navigates to /photos/[tag], THE Photo_Grid SHALL display only photos that have the specified tag applied.
4. WHEN a Visitor navigates to /photos/[search-term], THE Website SHALL display photos whose tags or keywords match the search term.
5. WHEN a Visitor selects a tag filter on the /photos page, THE Photo_Grid SHALL update to show only matching photos without a full page reload.

---

### Requirement 13: Camera and Lens Browsing

**User Story:** As a Visitor, I want to browse photos by the camera or lens used to take them, so that I can explore Sandy's gear and see how different equipment affects the results.

#### Acceptance Criteria

1. THE Website SHALL store camera make/model and lens make/model for each photo, extracted automatically from EXIF data when available at upload time.
2. WHEN an Admin is authenticated, THE Website SHALL provide an interface to manually override or correct the camera make/model and lens make/model for any photo.
3. THE Website SHALL provide a public camera browse page at /cameras/[make]/[model] displaying all photos taken with the specified camera.
4. THE Website SHALL provide a public lens browse page at /lenses/[make]/[model] displaying all photos taken with the specified lens.
5. WHILE the Photo_Viewer is open, THE Photo_Viewer SHALL display the camera make/model and lens make/model as clickable links that navigate to the respective camera and lens browse pages.

---

### Requirement 14: Photo Metadata (Optional Fields)

**User Story:** As an Admin, I want to attach rich metadata to each photo, so that Visitors can learn the full context of how and when each image was captured.

#### Acceptance Criteria

1. WHEN an Admin uploads or edits a photo, THE Photo_Uploader SHALL allow the Admin to optionally provide: title, description, capture date, tags, series assignment, and manual camera/lens override.
2. WHEN a photo file is uploaded, THE Photo_Uploader SHALL automatically extract EXIF data (aperture, shutter speed, ISO, native focal length, camera model, lens model, and capture date) from the file when that data is available.
3. WHEN a crop-sensor camera is detected from EXIF data, THE Website SHALL calculate and display the 35mm equivalent focal length alongside the native focal length (e.g., "37mm (56mm eq.)").
4. WHEN both manually provided metadata and auto-extracted EXIF data exist for camera or lens fields, THE Photo_Uploader SHALL store the manually provided values and use them in place of the auto-extracted values.
5. THE Website SHALL record and display the upload date for each photo, and SHALL display the last-edited date if the photo metadata has been modified after upload.
6. WHILE the Photo_Viewer is open, THE Photo_Viewer SHALL display the full camera settings block — focal length (with equivalent if applicable), aperture, shutter speed, and ISO — when that data is available.
7. WHEN a Visitor hovers over a photo in the Photo_Grid, THE Photo_Grid SHALL display the photo's description as an overlay if a description has been set for that photo.

---

### Requirement 15: About Page

**User Story:** As a Visitor, I want to read about Sandy in a clean, personal page, so that I can understand who he is and what he does.

#### Acceptance Criteria

1. THE About_Page SHALL be accessible at /about and linked from the Navigation.
2. THE About_Page SHALL display a profile photo, Sandy's name, a bio paragraph, and optional links (e.g., social profiles, email, resume).
3. THE About_Page SHALL use a minimal single-column layout with generous whitespace, consistent with the overall site design language.
4. WHEN an Admin is authenticated, THE Website SHALL provide an interface to edit the bio text, profile photo, and links on the About_Page without a code deployment.
5. THE About_Page SHALL be fully responsive and render correctly on viewports as narrow as 375px.

---

### Requirement 16: Landing Page

**User Story:** As a Visitor arriving at the site for the first time, I want a welcoming landing page that introduces Sandy and guides me to the main sections, so that I immediately understand what the site is about.

#### Acceptance Criteria

1. THE Landing_Page SHALL be the root page of the site (/) and SHALL be the default destination for all Visitors.
2. THE Landing_Page SHALL display Sandy's name, a short tagline, and visual entry points to the Photos, Blog, Projects, and About sections.
3. THE Landing_Page SHALL feature a selection of recent or featured photos to immediately convey the photography focus of the site.
4. THE Landing_Page SHALL apply Framer Motion entrance animations to key elements on first load.
5. THE Landing_Page SHALL be fully responsive and render correctly on viewports as narrow as 375px.
