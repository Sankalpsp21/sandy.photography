-- Migration: 001_initial_schema
-- Creates all tables for sandy.photography

-- Photos table
CREATE TABLE photos (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cloudinary_id         TEXT NOT NULL UNIQUE,
  secure_url            TEXT NOT NULL,
  width                 INTEGER NOT NULL,
  height                INTEGER NOT NULL,
  title                 TEXT,
  description           TEXT,
  tags                  TEXT[] DEFAULT '{}',
  capture_date          TIMESTAMPTZ,
  upload_date           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ,
  -- EXIF (auto-extracted, overridable)
  camera_make           TEXT,
  camera_model          TEXT,
  lens_make             TEXT,
  lens_model            TEXT,
  aperture              TEXT,
  shutter_speed         TEXT,
  iso                   INTEGER,
  focal_length_native   NUMERIC,
  focal_length_equiv    NUMERIC,
  sensor_crop_factor    NUMERIC,
  -- Manual override flags
  camera_overridden     BOOLEAN NOT NULL DEFAULT FALSE,
  lens_overridden       BOOLEAN NOT NULL DEFAULT FALSE
);

-- Series table
CREATE TABLE series (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug        TEXT NOT NULL UNIQUE,
  title       TEXT NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ
);

-- Series-photos join table
CREATE TABLE series_photos (
  series_id   UUID NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  photo_id    UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  position    INTEGER NOT NULL,
  PRIMARY KEY (series_id, photo_id)
);

-- Blog posts table
CREATE TABLE blog_posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT NOT NULL UNIQUE,
  title         TEXT NOT NULL,
  content       JSONB NOT NULL,
  content_text  TEXT,
  status        TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at  TIMESTAMPTZ,
  updated_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Projects table
CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  tags        TEXT[] DEFAULT '{}',
  url         TEXT,
  position    INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ
);

-- Kudos table
CREATE TABLE kudos (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id   UUID NOT NULL,
  item_type TEXT NOT NULL CHECK (item_type IN ('photo', 'blog_post')),
  count     INTEGER NOT NULL DEFAULT 0,
  UNIQUE (item_id, item_type)
);

-- About table (single-row content)
CREATE TABLE about (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bio               TEXT NOT NULL,
  profile_photo_url TEXT,
  links             JSONB NOT NULL DEFAULT '[]',
  updated_at        TIMESTAMPTZ
);
