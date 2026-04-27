export interface Photo {
  id: string
  cloudinary_id: string
  secure_url: string
  width: number
  height: number
  title?: string
  description?: string
  tags: string[]
  capture_date?: string
  upload_date: string
  updated_at?: string
  // EXIF
  camera_make?: string
  camera_model?: string
  lens_make?: string
  lens_model?: string
  aperture?: string
  shutter_speed?: string
  iso?: number
  focal_length_native?: number
  focal_length_equiv?: number
  sensor_crop_factor?: number
  camera_overridden: boolean
  lens_overridden: boolean
}

export interface Series {
  id: string
  slug: string
  title: string
  description?: string
  created_at: string
  updated_at?: string
  photos?: Photo[]
}

export interface BlogPost {
  id: string
  slug: string
  title: string
  content: Record<string, unknown>
  content_text?: string
  status: 'draft' | 'published'
  published_at?: string
  updated_at?: string
  created_at: string
}

export interface Project {
  id: string
  title: string
  description: string
  tags: string[]
  url?: string
  position: number
  created_at: string
  updated_at?: string
}

export interface AboutContent {
  id: string
  bio: string
  profile_photo_url?: string
  links: KudosItem[]
  updated_at?: string
}

export interface KudosItem {
  label: string
  url: string
}

export interface Kudos {
  id: string
  item_id: string
  item_type: 'photo' | 'blog_post'
  count: number
}
