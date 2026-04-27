import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const [searchParams] = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/admin'

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}${redirectTo}`,
      },
    })

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setMagicLinkSent(true)
    }
  }

  async function handleGitHub() {
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: `${window.location.origin}${redirectTo}`,
      },
    })

    if (error) {
      setLoading(false)
      setError(error.message)
    }
    // On success, browser is redirected by Supabase — no need to navigate manually
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo / title */}
        <div className="mb-8 text-center">
          <h1 className="text-white text-2xl font-light tracking-widest uppercase">
            sandy.photography
          </h1>
          <p className="mt-2 text-neutral-500 text-sm">Admin sign in</p>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 space-y-6">
          {magicLinkSent ? (
            <div className="text-center space-y-2">
              <p className="text-white text-sm">Check your email for a login link</p>
              <p className="text-neutral-500 text-xs">
                Didn't get it?{' '}
                <button
                  onClick={() => setMagicLinkSent(false)}
                  className="text-neutral-300 underline underline-offset-2"
                >
                  Try again
                </button>
              </p>
            </div>
          ) : (
            <>
              {/* Magic link form */}
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-neutral-400 text-xs mb-2 tracking-wide uppercase">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-4 py-3 text-white text-sm placeholder-neutral-600 focus:outline-none focus:border-neutral-500 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-white text-black rounded-lg py-3 text-sm font-medium hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Sending…' : 'Send magic link'}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-neutral-800" />
                <span className="text-neutral-600 text-xs">or</span>
                <div className="flex-1 h-px bg-neutral-800" />
              </div>

              {/* GitHub OAuth */}
              <button
                onClick={handleGitHub}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-neutral-800 border border-neutral-700 text-white rounded-lg py-3 text-sm hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <GitHubIcon />
                Continue with GitHub
              </button>
            </>
          )}

          {/* Error */}
          {error && (
            <p className="text-red-400 text-xs text-center">{error}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.335-1.755-1.335-1.755-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}
