import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import type { BlogPost } from '../../types'
import ReadingProgress from './ReadingProgress'
import KudosButton from '../photos/KudosButton'
import ShareButton from '../photos/ShareButton'

interface BlogPostLayoutProps {
  post: BlogPost
}

function readingTime(contentText: string | undefined): number {
  if (!contentText) return 1
  const words = contentText.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

export default function BlogPostLayout({ post }: BlogPostLayoutProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: true }),
      Image,
    ],
    content: post.content as object,
    editable: false,
  })

  const mins = readingTime(post.content_text)
  const publishedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : ''
  const updatedDate = post.updated_at
    ? new Date(post.updated_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : ''
  const showUpdated =
    post.updated_at &&
    post.published_at &&
    new Date(post.updated_at).toDateString() !== new Date(post.published_at).toDateString()

  const shareUrl = `${window.location.origin}/blog/${post.slug}`

  return (
    <>
      <ReadingProgress />
      <article className="max-w-[680px] mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold text-theme leading-tight mb-4">{post.title}</h1>
        <div className="flex flex-wrap items-center gap-2 text-theme-muted text-sm mb-10">
          {publishedDate && <span>{publishedDate}</span>}
          <span>·</span>
          <span>{mins} min read</span>
          {showUpdated && (
            <>
              <span>·</span>
              <span>Updated {updatedDate}</span>
            </>
          )}
        </div>

        <div className="prose prose-invert prose-neutral max-w-none">
          <EditorContent editor={editor} />
        </div>

        <div className="flex items-center gap-3 mt-12 pt-8 border-t border-theme">
          <KudosButton itemId={post.id} itemType="blog_post" initialCount={0} />
          <ShareButton title={post.title} url={shareUrl} />
        </div>
      </article>
    </>
  )
}
