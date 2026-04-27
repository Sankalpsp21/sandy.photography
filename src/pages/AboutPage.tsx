import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { AboutContent } from '../types'

export default function AboutPage() {
  const [about, setAbout] = useState<AboutContent | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAbout() {
      const { data } = await supabase
        .from('about')
        .select('*')
        .limit(1)
        .single()
      if (data) setAbout(data as AboutContent)
      setLoading(false)
    }
    fetchAbout()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-neutral-400">Loading…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-2xl mx-auto px-4 py-16">
        {!about ? (
          <p className="text-neutral-500 text-center py-16">
            About page coming soon.
          </p>
        ) : (
          <div className="space-y-8">
            {/* Profile photo */}
            {about.profile_photo_url && (
              <div className="flex justify-center">
                <img
                  src={about.profile_photo_url}
                  alt="Sandy Patil"
                  className="w-28 h-28 rounded-full object-cover border-2 border-white/10"
                />
              </div>
            )}

            {/* Name */}
            <div className="text-center">
              <h1 className="text-3xl font-bold text-white">Sandy Patil</h1>
            </div>

            {/* Bio */}
            {about.bio && (
              <div className="space-y-4">
                {about.bio.split('\n\n').map((para, i) => (
                  <p key={i} className="text-neutral-300 leading-relaxed">
                    {para}
                  </p>
                ))}
              </div>
            )}

            {/* Links */}
            {about.links && about.links.length > 0 && (
              <ul className="space-y-2">
                {about.links.map((link, i) => (
                  <li key={i}>
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white underline underline-offset-4 hover:text-neutral-300 transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
