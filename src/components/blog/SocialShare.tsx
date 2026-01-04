'use client'

import { Twitter, Facebook, Linkedin, Link as LinkIcon, Share2 } from 'lucide-react'
import { useState } from 'react'

interface SocialShareProps {
  url: string
  title: string
  description?: string
}

export function SocialShare({ url, title, description }: SocialShareProps) {
  const [copied, setCopied] = useState(false)

  const shareUrl = typeof window !== 'undefined' ? window.location.origin + url : url
  const encodedUrl = encodeURIComponent(shareUrl)
  const encodedTitle = encodeURIComponent(title)
  const encodedDescription = encodeURIComponent(description || '')

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url: shareUrl,
        })
      } catch (error) {
        // User cancelled or error occurred
      }
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600 mr-2">Share:</span>
      
      <a
        href={shareLinks.twitter}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 text-gray-600 hover:text-blue-400 transition-colors"
        aria-label="Share on Twitter"
      >
        <Twitter className="w-5 h-5" />
      </a>
      
      <a
        href={shareLinks.facebook}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
        aria-label="Share on Facebook"
      >
        <Facebook className="w-5 h-5" />
      </a>
      
      <a
        href={shareLinks.linkedin}
        target="_blank"
        rel="noopener noreferrer"
        className="p-2 text-gray-600 hover:text-blue-700 transition-colors"
        aria-label="Share on LinkedIn"
      >
        <Linkedin className="w-5 h-5" />
      </a>

      <button
        onClick={handleCopy}
        className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
        aria-label="Copy link"
        title="Copy link"
      >
        <LinkIcon className="w-5 h-5" />
      </button>

      {navigator.share && (
        <button
          onClick={handleShare}
          className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
          aria-label="Share"
          title="Share"
        >
          <Share2 className="w-5 h-5" />
        </button>
      )}

      {copied && (
        <span className="text-sm text-green-600 ml-2">Copied!</span>
      )}
    </div>
  )
}

