import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import type { BlogPost } from '../types'

function readingTime(contentText: string | undefined): number {
  if (!contentText) return 1
  const words = contentText.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(words / 200))
}

function SkeletonCard() {
  return (
    <div className="border border-theme rounded-xl p-6 animate-pulse">
      <div className="h-6 bg-white/10 rounded w-3/4 mb-3" />
      <div className="h-4 bg-white/5 rounded w-1/3" />
    </div>
  )
}

export default function BlogListPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPosts() {
      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
      if (data) setPosts(data as BlogPost[])
      setLoading(false)
    }
    fetchPosts()
  }, [])

  return (
    <div className="min-h-screen bg-theme text-theme">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8">Writing</h1>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : posts.length === 0 ? (
          <p className="text-theme-subtle text-center py-16">No posts yet.</p>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => {
              const mins = readingTime(post.content_text)
              const date = post.published_at
                ? new Date(post.published_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })
                : ''
              return (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="block border border-theme rounded-xl p-6 hover:border-white/30 hover:bg-white/5 transition-all group"
                >
                  <h2 className="text-xl font-semibold text-theme group-hover:text-neutral-100 mb-2 leading-snug">
                    {post.title}
                  </h2>
                  <div className="flex items-center gap-3 text-sm text-theme-subtle">
                    {date && <span>{date}</span>}
                    <span>·</span>
                    <span>{mins} min read</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
