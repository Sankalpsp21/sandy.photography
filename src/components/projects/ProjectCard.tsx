import { ExternalLink } from 'lucide-react'
import type { Project } from '../../types'

interface ProjectCardProps {
  project: Project
}

export default function ProjectCard({ project }: ProjectCardProps) {
  return (
    <div className="bg-white/5 border border-theme rounded-xl p-5 flex flex-col gap-3 hover:border-white/25 hover:bg-white/8 transition-all">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-white font-semibold text-lg leading-snug">{project.title}</h3>
        {project.url && (
          <a
            href={project.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${project.title}`}
            className="flex-shrink-0 p-1.5 rounded-lg text-theme-muted hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
            <ExternalLink size={16} />
          </a>
        )}
      </div>

      <p className="text-theme-muted text-sm line-clamp-2 leading-relaxed">{project.description}</p>

      {project.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-auto">
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs bg-white/10 text-theme-muted px-2 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
