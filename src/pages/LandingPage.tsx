import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { Photo } from '../types'
import PhotoCard from '../components/photos/PhotoCard'
import PhotoViewer from '../components/photos/PhotoViewer'

function fadeUpVariant(delay: number) {
  return {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6, delay, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } },
  }
}

export default function LandingPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)

  useEffect(() => {
    async function fetchPhotos() {
      const { data } = await supabase
        .from('photos')
        .select('*')
        .order('upload_date', { ascending: false })
        .limit(6)
      if (data) setPhotos(data as Photo[])
    }
    fetchPhotos()
  }, [])

  const handlePhotoClick = useCallback(
    (photo: Photo) => {
      const idx = photos.findIndex((p) => p.id === photo.id)
      if (idx !== -1) setViewerIndex(idx)
    },
    [photos]
  )

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
        <motion.h1
          className="text-5xl sm:text-7xl font-bold tracking-tight mb-4"
          {...fadeUpVariant(0)}
        >
          Sandy Patil
        </motion.h1>
        <motion.p
          className="text-xl sm:text-2xl text-neutral-400 mb-10"
          {...fadeUpVariant(0.2)}
        >
          Photographer &amp; Developer
        </motion.p>
        <motion.div
          className="flex flex-wrap justify-center gap-4"
          {...fadeUpVariant(0.4)}
        >
          <Link to="/photos"
            className="px-5 py-2.5 bg-white text-black rounded-full text-sm font-medium hover:bg-neutral-200 transition-colors">
            Photos
          </Link>
          <Link to="/blog"
            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium transition-colors">
            Writing
          </Link>
          <Link to="/projects"
            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium transition-colors">
            Projects
          </Link>
          <Link to="/about"
            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium transition-colors">
            About
          </Link>
        </motion.div>
      </section>

      {/* Featured photos */}
      {photos.length > 0 && (
        <section className="max-w-screen-xl mx-auto px-4 pb-16" aria-label="Featured photos">
          <motion.div
            className="flex items-center justify-between mb-6"
            {...fadeUpVariant(0.6)}
          >
            <h2 className="text-xl font-semibold">Recent Photos</h2>
            <Link to="/photos" className="flex items-center gap-1 text-sm text-neutral-400 hover:text-white transition-colors">
              View all <ArrowRight size={14} />
            </Link>
          </motion.div>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
            {...fadeUpVariant(0.7)}
          >
            {photos.map((photo) => (
              <PhotoCard key={photo.id} photo={photo} onClick={handlePhotoClick} />
            ))}
          </motion.div>
        </section>
      )}

      {/* Entry point cards */}
      <section className="max-w-screen-xl mx-auto px-4 pb-20">
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          {...fadeUpVariant(0.8)}
        >
          {[
            { to: '/blog', label: 'Writing', desc: 'Thoughts on photography, code, and life.' },
            { to: '/projects', label: 'Projects', desc: 'Software I\'ve built and shipped.' },
            { to: '/about', label: 'About', desc: 'A bit about who I am.' },
          ].map(({ to, label, desc }) => (
            <Link key={to} to={to}
              className="group border border-white/10 rounded-xl p-6 hover:border-white/30 hover:bg-white/5 transition-all">
              <h3 className="text-white font-semibold text-lg mb-1 group-hover:text-neutral-100">{label}</h3>
              <p className="text-neutral-500 text-sm">{desc}</p>
            </Link>
          ))}
        </motion.div>
      </section>

      {viewerIndex !== null && (
        <PhotoViewer
          photos={photos}
          currentIndex={viewerIndex}
          onClose={() => setViewerIndex(null)}
          onNavigate={setViewerIndex}
        />
      )}
    </div>
  )
}
