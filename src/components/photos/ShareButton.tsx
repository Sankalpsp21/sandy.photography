import { useState } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Share2, Copy, Mail, MessageSquare, Twitter } from 'lucide-react'
import { useShare } from '../../hooks/useShare'

interface ShareButtonProps {
  title: string
  url: string
  text?: string
}

export default function ShareButton({ title, url, text }: ShareButtonProps) {
  const { share, canUseNativeShare } = useShare({ title, url, text })
  const [copied, setCopied] = useState(false)

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const el = document.createElement('textarea')
      el.value = url
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
  const emailUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`
  const smsUrl = `sms:?body=${encodeURIComponent(`${title} ${url}`)}`

  if (canUseNativeShare) {
    return (
      <button
        onClick={share}
        aria-label="Share"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-white/10 hover:bg-white/20 text-theme transition-colors min-w-[44px] min-h-[44px]"
      >
        <Share2 size={16} />
        <span>Share</span>
      </button>
    )
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          aria-label="Share"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-white/10 hover:bg-white/20 text-theme transition-colors min-w-[44px] min-h-[44px]"
        >
          <Share2 size={16} />
          <span>Share</span>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-[100] min-w-[180px] bg-theme-subtle border border-theme rounded-lg shadow-xl p-1 text-sm text-theme"
          sideOffset={8}
          align="end"
        >
          <DropdownMenu.Item
            className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer hover:bg-white/10 outline-none"
            onSelect={handleCopyLink}
          >
            <Copy size={14} />
            {copied ? 'Copied!' : 'Copy link'}
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer hover:bg-white/10 outline-none"
            asChild
          >
            <a href={emailUrl} target="_blank" rel="noopener noreferrer">
              <Mail size={14} />
              Share via Email
            </a>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer hover:bg-white/10 outline-none"
            asChild
          >
            <a href={twitterUrl} target="_blank" rel="noopener noreferrer">
              <Twitter size={14} />
              Share via Twitter/X
            </a>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className="flex items-center gap-2 px-3 py-2 rounded cursor-pointer hover:bg-white/10 outline-none"
            asChild
          >
            <a href={smsUrl}>
              <MessageSquare size={14} />
              Share via Messages
            </a>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
