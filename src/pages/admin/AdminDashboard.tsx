import { Link } from 'react-router-dom'
import { Camera, PenLine, Layers, Briefcase, User, ArrowRight, LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const cards = [
  {
    to: '/admin/upload',
    icon: Camera,
    title: 'Upload Photos',
    desc: 'Add new photos to your portfolio',
  },
  {
    to: '/admin/blog/new',
    icon: PenLine,
    title: 'New Blog Post',
    desc: 'Write and publish a new post',
  },
  {
    to: '/admin/series',
    icon: Layers,
    title: 'Manage Series',
    desc: 'Curate photo series and collections',
  },
  {
    to: '/admin/projects',
    icon: Briefcase,
    title: 'Manage Projects',
    desc: 'Add or edit your project showcase',
  },
  {
    to: '/admin/about',
    icon: User,
    title: 'Edit About',
    desc: 'Update your bio, photo, and links',
  },
]

export default function AdminDashboard() {
  const { signOut } = useAuth()

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-bold">Welcome back, Sandy</h1>
            <p className="text-neutral-500 text-sm mt-1">What would you like to do today?</p>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors"
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map(({ to, icon: Icon, title, desc }) => (
            <Link
              key={to}
              to={to}
              className="group flex items-start gap-4 bg-white/5 border border-white/10 rounded-xl p-5 hover:border-white/25 hover:bg-white/8 transition-all"
            >
              <div className="p-2.5 bg-white/10 rounded-lg group-hover:bg-white/15 transition-colors flex-shrink-0">
                <Icon size={20} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-white font-semibold text-sm mb-0.5">{title}</h2>
                <p className="text-neutral-500 text-xs leading-relaxed">{desc}</p>
              </div>
              <ArrowRight size={16} className="text-neutral-600 group-hover:text-neutral-400 transition-colors flex-shrink-0 mt-0.5" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
