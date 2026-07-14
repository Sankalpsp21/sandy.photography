import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Project } from '../types'
import ProjectCard from '../components/projects/ProjectCard'

function SkeletonCard() {
  return (
    <div className="bg-white/5 border border-theme rounded-xl p-5 animate-pulse">
      <div className="h-5 bg-white/10 rounded w-2/3 mb-3" />
      <div className="h-4 bg-white/5 rounded w-full mb-2" />
      <div className="h-4 bg-white/5 rounded w-4/5" />
    </div>
  )
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchProjects() {
      const { data } = await supabase
        .from('projects')
        .select('*')
        .order('position', { ascending: true })
      if (data) setProjects(data as Project[])
      setLoading(false)
    }
    fetchProjects()
  }, [])

  return (
    <div className="min-h-screen bg-theme text-theme">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Projects</h1>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : projects.length === 0 ? (
          <p className="text-theme-subtle text-center py-16">No projects yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
