import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X, Lock, Sun, Moon } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useTheme } from '../../context/ThemeContext'

const navLinks = [
  { to: '/photos', label: 'Photos' },
  { to: '/blog', label: 'Blog' },
  { to: '/projects', label: 'Projects' },
  { to: '/about', label: 'About' },
]

export default function Navigation() {
  const { user } = useAuth()
  const { theme, toggle } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    // Outer nav: full width, fixed, but doesn't block clicks outside the pill
    <nav
      className="fixed top-3 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none"
      role="navigation"
      aria-label="Main navigation"
    >
      {/* Floating pill */}
      <div
        className="relative pointer-events-auto flex items-center justify-between h-12 px-5 rounded-2xl backdrop-blur-xl border border-theme shadow-sm transition-colors duration-200 w-full max-w-2xl"
        style={{ backgroundColor: 'var(--nav-bg)' }}
      >
        {/* Logo */}
        <NavLink
          to="/"
          className="text-theme text-sm font-light tracking-widest uppercase hover:text-theme-muted transition-colors"
          onClick={() => setMenuOpen(false)}
        >
          sandy.photography
        </NavLink>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `text-sm transition-colors ${
                  isActive ? 'text-theme font-medium' : 'text-theme-muted hover:text-theme'
                }`
              }
            >
              {label}
            </NavLink>
          ))}

          {user && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `text-sm flex items-center gap-1 transition-colors ${
                  isActive ? 'text-theme font-medium' : 'text-theme-muted hover:text-theme'
                }`
              }
            >
              <Lock size={13} />
              Admin
            </NavLink>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="text-theme-muted hover:text-theme transition-colors"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>

        {/* Mobile: theme + hamburger */}
        <div className="md:hidden flex items-center gap-1">
          <button
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="flex items-center justify-center w-10 h-10 text-theme-muted hover:text-theme transition-colors"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <button
            className="flex items-center justify-center w-10 h-10 text-theme-muted hover:text-theme transition-colors"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile dropdown — drops below the pill */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              key="mobile-menu"
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="absolute top-full mt-2 left-0 right-0 rounded-2xl border border-theme backdrop-blur-xl overflow-hidden shadow-sm"
              style={{ backgroundColor: 'var(--nav-bg)' }}
            >
              <div className="flex flex-col px-3 py-2 gap-0.5">
                {navLinks.map(({ to, label }) => (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={() => setMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center min-h-[44px] text-sm px-3 rounded-xl transition-colors ${
                        isActive ? 'text-theme font-medium' : 'text-theme-muted hover:text-theme'
                      }`
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
                      `flex items-center gap-2 min-h-[44px] text-sm px-3 rounded-xl transition-colors ${
                        isActive ? 'text-theme font-medium' : 'text-theme-muted hover:text-theme'
                      }`
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

      </div>{/* end pill */}
    </nav>
  )
}
