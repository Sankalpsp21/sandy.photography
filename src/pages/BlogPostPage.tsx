import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { BlogPost } from '../types'
import BlogPostLayout from '../components/blog/BlogPostLayout'

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!slug) return
    async function fetchPost() {
      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single()
      if (data) {
        setPost(data as BlogPost)
      } else {
        setNotFound(true)
      }
      setLoading(false)
    }
    fetchPost()
  }, [slug])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-neutral-400">Loading…</div>
      </div>
    )
  }

  if (notFound || !post) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-neutral-400">Post not found.</p>
        <Link to="/blog" className="text-white underline hover:text-neutral-300 transition-colors">
          ← Back to Writing
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <BlogPostLayout post={post} />
    </div>
  )
}
