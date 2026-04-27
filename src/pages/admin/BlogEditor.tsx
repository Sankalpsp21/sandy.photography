import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import {
  Bold, Italic, Code, List, ListOrdered, Quote, Heading1, Heading2, Heading3,
  Link2, Image as ImageIcon, Terminal, X, CheckCircle, AlertCircle,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { slugify } from '../../lib/utils'
import type { BlogPost } from '../../types'

const AUTOSAVE_INTERVAL = 30_000

function draftKey(id: string | undefined) {
  return `blog-draft:${id ?? 'new'}`
}

interface Toast {
  type: 'success' | 'error'
  message: string
}

export default function BlogEditor() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(!!id)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<Toast | null>(null)
  const [showRestoreBanner, setShowRestoreBanner] = useState(false)
  const [draftRestored, setDraftRestored] = useState(false)

  const autosaveRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
      Image,
    ],
    content: '',
    onBlur: () => {
      saveDraftToLocalStorage()
    },
  })

  function saveDraftToLocalStorage() {
    if (!editor) return
    const content = editor.getJSON()
    const draft = { title, slug, content }
    localStorage.setItem(draftKey(id), JSON.stringify(draft))
  }

  // Load existing post if editing
  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    async function fetchPost() {
      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('id', id)
        .single()
      if (data) {
        const p = data as BlogPost
        setPost(p)
        setTitle(p.title)
        setSlug(p.slug)
        setSlugManuallyEdited(true)
        if (editor) {
          editor.commands.setContent(p.content as object)
        }
      }
      setLoading(false)
    }
    fetchPost()
  }, [id, editor])

  // Check for draft in localStorage (only for new posts)
  useEffect(() => {
    if (id || draftRestored || loading) return
    const saved = localStorage.getItem(draftKey(undefined))
    if (saved) {
      setShowRestoreBanner(true)
    }
  }, [id, draftRestored, loading])

  // Auto-generate slug from title
  useEffect(() => {
    if (!slugManuallyEdited) {
      setSlug(slugify(title))
    }
  }, [title, slugManuallyEdited])

  // Autosave interval
  useEffect(() => {
    autosaveRef.current = setInterval(() => {
      saveDraftToLocalStorage()
    }, AUTOSAVE_INTERVAL)
    return () => {
      if (autosaveRef.current) clearInterval(autosaveRef.current)
    }
  })

  function showToast(type: 'success' | 'error', message: string) {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  function handleRestoreDraft() {
    const saved = localStorage.getItem(draftKey(undefined))
    if (!saved || !editor) return
    try {
      const draft = JSON.parse(saved) as { title: string; slug: string; content: object }
      setTitle(draft.title)
      setSlug(draft.slug)
      setSlugManuallyEdited(true)
      editor.commands.setContent(draft.content)
    } catch {
      // ignore
    }
    setShowRestoreBanner(false)
    setDraftRestored(true)
  }

  function handleDismissRestore() {
    setShowRestoreBanner(false)
  }

  async function handleSave(publish: boolean) {
    if (!editor) return
    setSaving(true)
    try {
      const content = editor.getJSON()
      const contentText = editor.getText()
      const now = new Date().toISOString()

      const payload: Partial<BlogPost> & { content: object; content_text: string } = {
        title,
        slug,
        content,
        content_text: contentText,
        status: publish ? 'published' : 'draft',
        updated_at: now,
      }

      if (publish && !post?.published_at) {
        payload.published_at = now
      } else if (publish && post?.published_at) {
        payload.published_at = post.published_at
      }

      let savedPost: BlogPost | null = null

      if (id) {
        const { data, error } = await supabase
          .from('blog_posts')
          .update(payload)
          .eq('id', id)
          .select()
          .single()
        if (error) throw error
        savedPost = data as BlogPost
      } else {
        const { data, error } = await supabase
          .from('blog_posts')
          .insert({ ...payload, created_at: now })
          .select()
          .single()
        if (error) throw error
        savedPost = data as BlogPost
        // Clear draft from localStorage
        localStorage.removeItem(draftKey(undefined))
      }

      if (publish && savedPost) {
        navigate(`/blog/${savedPost.slug}`)
      } else {
        showToast('success', 'Draft saved')
        if (savedPost && !id) {
          navigate(`/admin/blog/${savedPost.id}/edit`, { replace: true })
        }
      }
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  function handleLinkInsert() {
    const url = window.prompt('Enter URL:')
    if (!url || !editor) return
    editor.chain().focus().setLink({ href: url }).run()
  }

  function handleImageInsert() {
    const url = window.prompt('Enter image URL:')
    if (!url || !editor) return
    editor.chain().focus().setImage({ src: url }).run()
  }

  const ToolbarButton = useCallback(
    ({
      onClick,
      active,
      title: btnTitle,
      children,
    }: {
      onClick: () => void
      active?: boolean
      title: string
      children: React.ReactNode
    }) => (
      <button
        type="button"
        onClick={onClick}
        title={btnTitle}
        aria-label={btnTitle}
        className={`p-1.5 rounded transition-colors ${
          active
            ? 'bg-white/20 text-white'
            : 'text-neutral-400 hover:text-white hover:bg-white/10'
        }`}
      >
        {children}
      </button>
    ),
    []
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <div className="text-neutral-400">Loading…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm ${
            toast.type === 'success'
              ? 'bg-green-900/80 text-green-200 border border-green-700'
              : 'bg-red-900/80 text-red-200 border border-red-700'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {toast.message}
        </div>
      )}

      {/* Restore draft banner */}
      {showRestoreBanner && (
        <div className="bg-yellow-900/60 border-b border-yellow-700/50 px-4 py-3 flex items-center justify-between text-sm text-yellow-200">
          <span>You have an unsaved draft. Restore it?</span>
          <div className="flex gap-2">
            <button
              onClick={handleRestoreDraft}
              className="px-3 py-1 bg-yellow-700 hover:bg-yellow-600 rounded text-white transition-colors"
            >
              Restore draft
            </button>
            <button
              onClick={handleDismissRestore}
              className="p-1 hover:text-white transition-colors"
              aria-label="Dismiss"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header actions */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-semibold text-neutral-300">
            {id ? 'Edit Post' : 'New Post'}
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => handleSave(false)}
              disabled={saving}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              Save Draft
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving}
              className="px-4 py-2 bg-white hover:bg-neutral-200 text-black rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >
              Publish
            </button>
          </div>
        </div>

        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full bg-transparent text-4xl font-bold text-white placeholder-neutral-600 outline-none border-none mb-2 resize-none"
        />

        {/* Slug */}
        <div className="flex items-center gap-2 mb-6 text-sm text-neutral-500">
          <span>slug:</span>
          <input
            type="text"
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value)
              setSlugManuallyEdited(true)
            }}
            className="bg-transparent text-neutral-400 outline-none border-b border-neutral-700 focus:border-neutral-400 transition-colors px-1 py-0.5 flex-1 min-w-0"
          />
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap gap-0.5 mb-2 p-2 bg-white/5 rounded-lg border border-white/10">
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
            active={editor?.isActive('heading', { level: 1 })}
            title="Heading 1"
          >
            <Heading1 size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor?.isActive('heading', { level: 2 })}
            title="Heading 2"
          >
            <Heading2 size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor?.isActive('heading', { level: 3 })}
            title="Heading 3"
          >
            <Heading3 size={16} />
          </ToolbarButton>
          <div className="w-px bg-white/10 mx-1" />
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleBold().run()}
            active={editor?.isActive('bold')}
            title="Bold"
          >
            <Bold size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            active={editor?.isActive('italic')}
            title="Italic"
          >
            <Italic size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleCode().run()}
            active={editor?.isActive('code')}
            title="Inline Code"
          >
            <Code size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
            active={editor?.isActive('codeBlock')}
            title="Code Block"
          >
            <Terminal size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            active={editor?.isActive('blockquote')}
            title="Blockquote"
          >
            <Quote size={16} />
          </ToolbarButton>
          <div className="w-px bg-white/10 mx-1" />
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            active={editor?.isActive('bulletList')}
            title="Bullet List"
          >
            <List size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            active={editor?.isActive('orderedList')}
            title="Ordered List"
          >
            <ListOrdered size={16} />
          </ToolbarButton>
          <div className="w-px bg-white/10 mx-1" />
          <ToolbarButton onClick={handleLinkInsert} active={editor?.isActive('link')} title="Link">
            <Link2 size={16} />
          </ToolbarButton>
          <ToolbarButton onClick={handleImageInsert} title="Image">
            <ImageIcon size={16} />
          </ToolbarButton>
        </div>

        {/* Editor */}
        <div className="min-h-[400px] bg-white/5 rounded-lg border border-white/10 p-4">
          <EditorContent
            editor={editor}
            className="prose prose-invert prose-sm max-w-none focus:outline-none [&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-[360px]"
          />
        </div>

        {/* Word count */}
        {editor && (
          <div className="mt-2 text-xs text-neutral-600 text-right">
            {editor.getText().trim().split(/\s+/).filter(Boolean).length} words
          </div>
        )}
      </div>
    </div>
  )
}
