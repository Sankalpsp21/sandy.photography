import { motion, AnimatePresence } from 'framer-motion'
import { useKudos } from '../../hooks/useKudos'

interface KudosButtonProps {
  itemId: string
  itemType: 'photo' | 'blog_post'
  initialCount?: number
}

export default function KudosButton({ itemId, itemType, initialCount = 0 }: KudosButtonProps) {
  const { localCount, totalCount, canClap, clap } = useKudos(itemId, itemType, initialCount)

  const maxed = localCount >= 50

  return (
    <button
      onClick={clap}
      aria-label="Give kudos"
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors min-w-[44px] min-h-[44px] ${
        maxed
          ? 'bg-white/5 text-theme-subtle cursor-default'
          : 'bg-white/10 hover:bg-white/20 text-theme cursor-pointer'
      }`}
    >
      <motion.span
        key={localCount}
        initial={{ scale: 1 }}
        animate={canClap ? { scale: [1, 1.4, 1] } : { scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-base select-none"
        aria-hidden="true"
      >
        👏
      </motion.span>
      <AnimatePresence mode="wait">
        <motion.span
          key={totalCount}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.15 }}
        >
          {totalCount}
        </motion.span>
      </AnimatePresence>
    </button>
  )
}
