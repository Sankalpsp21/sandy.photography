import { useEffect, useState, useRef } from 'react'
import { Plus, Trash2, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type { AboutContent, KudosItem } from '../../types'

interface Toast {
  type: 'success' | 'error'
  message: string
}

export default function AboutEditor() {
  const [aboutId, setAboutId] = useState<string | null>(null)
  const [bio, setBio] = useState('')
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('')
  const [links, setLinks] = useState<KudosItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function fetchAbout() {
      const { data } = await supabase.from('about').select('*').limit(1).single()
      if (data) {
        const a = data as AboutContent
        setAboutId(a.id)
        setBio(a.bio ?? '')
        setProfilePhotoUrl(a.profile_photo_url ?? '')
        setLinks(Array.isArray(a.links) ? a.links : [])
      }
      setLoading(false)
    }
    fetchAbout()
  }, [])

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token

      const res = await fetch(`${supabaseUrl}/functions/v1/sign-cloudinary-upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ folder: 'sandy-photography/about' }),
      })
      if (!res.ok) throw new Error('Failed to get upload signature')
      const sign = await res.json() as { signature: string; timestamp: number; cloudName: string; apiKey: string; folder: string }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('api_key', sign.apiKey)
      formData.append('timestamp', String(sign.timestamp))
      formData.append('signature', sign.signature)
      formData.append('folder', sign.folder)

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${sign.cloudName}/image/upload`, {
        method: 'POST',
        body: formData,
      })
      if (!uploadRes.ok) throw new Error('Upload failed')
      const result = await uploadRes.json() as { secure_url: string }
      setProfilePhotoUrl(result.secure_url)
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function addLink() {
    setLinks([...links, { label: '', url: '' }])
  }

  function updateLink(index: number, field: 'label' | 'url', value: string) {
    const updated = [...links]
    updated[index] = { ...updated[index], [field]: value }
    setLinks(updated)
  }

  function removeLink(index: number) {
    setLinks(links.filter((_, i) => i !== index))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload = {
        bio,
        profile_photo_url: profilePhotoUrl || null,
        links: links.filter((l) => l.label.trim() || l.url.trim()),
        updated_at: new Date().toISOString(),
      }
      if (aboutId) {
        const { error } = await supabase.from('about').update(payload).eq('id', aboutId)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('about').insert(payload).select().single()
        if (error) throw error
        if (data) setAboutId((data as AboutContent).id)
      }
      showToast('success', 'Saved successfully')
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <div className="text-neutral-400">Loading…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm ${
          toast.type === 'success' ? 'bg-green-900/80 text-green-200 border border-green-700' : 'bg-red-900/80 text-red-200 border border-red-700'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.message}
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Edit About</h1>
          <button onClick={handleSave} disabled={saving}
            className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-neutral-200 transition-colors disabled:opacity-50">
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>

        <div className="space-y-6">
          {/* Profile photo */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Profile Photo</label>
            {profilePhotoUrl && (
              <img src={profilePhotoUrl} alt="Profile" className="w-24 h-24 rounded-full object-cover mb-3 border border-white/10" />
            )}
            <div className="flex items-center gap-3">
              <input
                type="text"
                value={profilePhotoUrl}
                onChange={(e) => setProfilePhotoUrl(e.target.value)}
                placeholder="Photo URL"
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white/30 transition-colors"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {uploading ? 'Uploading…' : 'Upload'}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={6}
              placeholder="Write a short bio…"
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white/30 transition-colors resize-none"
            />
          </div>

          {/* Links */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-neutral-300">Links</label>
              <button onClick={addLink}
                className="flex items-center gap-1 text-xs text-neutral-400 hover:text-white transition-colors">
                <Plus size={12} />Add link
              </button>
            </div>
            <div className="space-y-2">
              {links.map((link, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={link.label}
                    onChange={(e) => updateLink(i, 'label', e.target.value)}
                    placeholder="Label"
                    className="w-1/3 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white/30 transition-colors"
                  />
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) => updateLink(i, 'url', e.target.value)}
                    placeholder="https://..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-white/30 transition-colors"
                  />
                  <button onClick={() => removeLink(i)}
                    className="p-2 text-neutral-500 hover:text-red-400 transition-colors" aria-label="Remove link">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {links.length === 0 && (
                <p className="text-neutral-600 text-sm">No links yet. Click "Add link" to add one.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
