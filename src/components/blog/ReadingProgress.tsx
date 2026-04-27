import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export default function ReadingProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    function handleScroll() {
      const scrollY = window.scrollY
      const docHeight = document.documentElement.scrollHeight
      const viewportHeight = window.innerHeight
      const total = docHeight - viewportHeight
      if (total <= 0) {
        setProgress(1)
        return
      }
      setProgress(Math.min(1, scrollY / total))
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div
      className="fixed top-16 left-0 right-0 z-40 h-[2px] bg-white/10"
      role="progressbar"
      aria-label="Reading progress"
      aria-valuenow={Math.round(progress * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <motion.div
        className="h-full bg-white"
        style={{ transformOrigin: 'left' }}
        animate={{ scaleX: progress }}
        transition={{ duration: 0.1, ease: 'linear' }}
      />
    </div>
  )
}
