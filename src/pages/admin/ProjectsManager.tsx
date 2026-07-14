import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, X, Check } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { Project } from '../../types'

interface ProjectForm {
  title: string
  description: string
  tags: string
  url: string
}

const emptyForm: ProjectForm = { title: '', description: '', tags: '', url: '' }

export default function ProjectsManager() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<ProjectForm>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  async function fetchProjects() {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .order('position', { ascending: true })
    if (data) setProjects(data as Project[])
    setLoading(false)
  }

  useEffect(() => { fetchProjects() }, [])

  function startEdit(project: Project) {
    setEditingId(project.id)
    setShowCreate(false)
    setForm({
      title: project.title,
      description: project.description,
      tags: project.tags.join(', '),
      url: project.url ?? '',
    })
    setFormError(null)
  }

  function startCreate() {
    setEditingId(null)
    setShowCreate(true)
    setForm(emptyForm)
    setFormError(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setShowCreate(false)
    setForm(emptyForm)
    setFormError(null)
  }

  async function handleSave() {
    if (!form.title.trim() || !form.description.trim()) {
      setFormError('Title and description are required.')
      return
    }
    setSaving(true)
    setFormError(null)
    const tags = form.tags.split(',').map((t) => t.trim()).filter(Boolean)
    try {
      if (editingId) {
        const { error: err } = await supabase
          .from('projects')
          .update({ title: form.title, description: form.description, tags, url: form.url || null, updated_at: new Date().toISOString() })
          .eq('id', editingId)
        if (err) throw err
      } else {
        const maxPos = projects.length > 0 ? Math.max(...projects.map((p) => p.position)) + 1 : 0
        const { error: err } = await supabase.from('projects').insert({
          title: form.title, description: form.description, tags, url: form.url || null,
          position: maxPos, created_at: new Date().toISOString(),
        })
        if (err) throw err
      }
      await fetchProjects()
      cancelEdit()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm('Delete this project?')) return
    await supabase.from('projects').delete().eq('id', id)
    await fetchProjects()
  }

  async function handleReorder(index: number, direction: 'up' | 'down') {
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    if (swapIndex < 0 || swapIndex >= projects.length) return
    const a = projects[index]
    const b = projects[swapIndex]
    await supabase.from('projects').update({ position: b.position }).eq('id', a.id)
    await supabase.from('projects').update({ position: a.position }).eq('id', b.id)
    await fetchProjects()
  }

  function renderForm() {
    return (
      <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-4">
        <h3 className="text-white font-semibold mb-4">{editingId ? 'Edit Project' : 'New Project'}</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Title *</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white/30 transition-colors"
              placeholder="Project title" />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Description *</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3} className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white/30 transition-colors resize-none"
              placeholder="Short description" />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1">Tags (comma-separated)</label>
            <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white/30 transition-colors"
              placeholder="React, TypeScript" />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1">URL</label>
            <input type="url" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white/30 transition-colors"
              placeholder="https://..." />
          </div>
          {formError && <p className="text-red-400 text-sm">{formError}</p>}
          <div className="flex gap-2 pt-1">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50">
              <Check size={14} />{saving ? 'Saving…' : 'Save'}
            </button>
            <button onClick={cancelEdit}
              className="flex items-center gap-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors">
              <X size={14} />Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Manage Projects</h1>
          <button onClick={startCreate}
            className="flex items-center gap-1.5 px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors">
            <Plus size={16} />New Project
          </button>
        </div>

        {showCreate && renderForm()}

        {loading ? (
          <div className="text-neutral-400 text-sm">Loading…</div>
        ) : projects.length === 0 ? (
          <p className="text-neutral-500 text-center py-12">No projects yet.</p>
        ) : (
          <div className="space-y-3">
            {projects.map((project, index) => (
              <div key={project.id}>
                {editingId === project.id && renderForm()}
                {editingId !== project.id && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-start gap-3">
                    <div className="flex flex-col gap-1">
                      <button onClick={() => handleReorder(index, 'up')} disabled={index === 0}
                        className="p-1 text-neutral-500 hover:text-white disabled:opacity-20 transition-colors" aria-label="Move up">
                        <ChevronUp size={14} />
                      </button>
                      <button onClick={() => handleReorder(index, 'down')} disabled={index === projects.length - 1}
                        className="p-1 text-neutral-500 hover:text-white disabled:opacity-20 transition-colors" aria-label="Move down">
                        <ChevronDown size={14} />
                      </button>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-white font-medium">{project.title}</h3>
                          <p className="text-neutral-400 text-sm mt-0.5 line-clamp-1">{project.description}</p>
                          {project.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {project.tags.map((tag) => (
                                <span key={tag} className="text-xs bg-white/10 text-neutral-300 px-2 py-0.5 rounded-full">{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <button onClick={() => startEdit(project)}
                            className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded transition-colors" aria-label="Edit">
                            <Pencil size={14} />
                          </button>
                          <button onClick={() => handleDelete(project.id)}
                            className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors" aria-label="Delete">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
