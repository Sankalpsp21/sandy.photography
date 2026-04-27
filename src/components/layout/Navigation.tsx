import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X, Lock } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const navLinks = [
  { to: '/photos', label: 'Photos' },
  { to: '/blog', label: 'Blog' },
  { to: '/projects', label: 'Projects' },
  { to: '/about', label: 'About' },
]

function linkClass(isActive: boolean) {
  return isActive
    ? 'text-white font-medium'
    : 'text-neutral-400 hover:text-white transition-colors'
}

export default function Navigation() {
  const { user } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-black/40 border-b border-white/10" role="navigation" aria-label="Main navigation">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <NavLink
          to="/"
          className="text-white text-sm font-light tracking-widest uppercase"
          onClick={() => setMenuOpen(false)}
        >
          sandy.photography
        </NavLink>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => `text-sm focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:rounded focus-visible:outline-none ${linkClass(isActive)}`}
            >
              {label}
            </NavLink>
          ))}
          {user && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `text-sm flex items-center gap-1 ${linkClass(isActive)}`
              }
            >
              <Lock size={13} />
              Admin
            </NavLink>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex items-center justify-center min-h-[44px] min-w-[44px] text-neutral-400 hover:text-white transition-colors"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            key="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="md:hidden border-t border-white/10 bg-black/60 backdrop-blur-md"
          >
            <div className="flex flex-col px-4 py-3 gap-1">
              {navLinks.map(({ to, label }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center min-h-[44px] text-sm px-2 rounded-lg ${linkClass(isActive)}`
                  }
                >
                  {label}
                </NavLink>
              ))}
              {user && (
                <NavLink
                  to="/admin"
                  onClick={() => setMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-2 min-h-[44px] text-sm px-2 rounded-lg ${linkClass(isActive)}`
                  }
                >
                  <Lock size={13} />
                  Admin
                </NavLink>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
