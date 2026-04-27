-- Migration: 002_rls_policies
-- Enables Row Level Security and creates access policies for all tables.
--
-- Public visitors: SELECT only (published blog posts only)
-- Authenticated admin: full access to all tables

-- ============================================================
-- photos
-- ============================================================
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "photos_public_read"
  ON photos FOR SELECT
  USING (true);

CREATE POLICY "photos_admin_insert"
  ON photos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "photos_admin_update"
  ON photos FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "photos_admin_delete"
  ON photos FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================================
-- series
-- ============================================================
ALTER TABLE series ENABLE ROW LEVEL SECURITY;

CREATE POLICY "series_public_read"
  ON series FOR SELECT
  USING (true);

CREATE POLICY "series_admin_insert"
  ON series FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "series_admin_update"
  ON series FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "series_admin_delete"
  ON series FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================================
-- series_photos
-- ============================================================
ALTER TABLE series_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "series_photos_public_read"
  ON series_photos FOR SELECT
  USING (true);

CREATE POLICY "series_photos_admin_insert"
  ON series_photos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "series_photos_admin_update"
  ON series_photos FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "series_photos_admin_delete"
  ON series_photos FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================================
-- blog_posts
-- ============================================================
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Visitors see only published posts
CREATE POLICY "blog_posts_public_read_published"
  ON blog_posts FOR SELECT
  USING (status = 'published');

-- Admin can read all posts (drafts + published)
CREATE POLICY "blog_posts_admin_read_all"
  ON blog_posts FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "blog_posts_admin_insert"
  ON blog_posts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "blog_posts_admin_update"
  ON blog_posts FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "blog_posts_admin_delete"
  ON blog_posts FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================================
-- projects
-- ============================================================
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "projects_public_read"
  ON projects FOR SELECT
  USING (true);

CREATE POLICY "projects_admin_insert"
  ON projects FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "projects_admin_update"
  ON projects FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "projects_admin_delete"
  ON projects FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================================
-- kudos
-- ============================================================
ALTER TABLE kudos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "kudos_public_read"
  ON kudos FOR SELECT
  USING (true);

-- Direct writes are blocked for visitors; increments go through the
-- increment_kudos SECURITY DEFINER RPC function (see 003_kudos_rpc.sql).
CREATE POLICY "kudos_admin_insert"
  ON kudos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "kudos_admin_update"
  ON kudos FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "kudos_admin_delete"
  ON kudos FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================================
-- about
-- ============================================================
ALTER TABLE about ENABLE ROW LEVEL SECURITY;

CREATE POLICY "about_public_read"
  ON about FOR SELECT
  USING (true);

CREATE POLICY "about_admin_insert"
  ON about FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "about_admin_update"
  ON about FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "about_admin_delete"
  ON about FOR DELETE
  USING (auth.role() = 'authenticated');
