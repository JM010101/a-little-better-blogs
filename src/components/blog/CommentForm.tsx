'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'

interface CommentFormProps {
  postId: string
  parentId?: string
  onSuccess?: () => void
}

export function CommentForm({ postId, parentId, onSuccess }: CommentFormProps) {
  const [content, setContent] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [authorEmail, setAuthorEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check if user is authenticated
    fetch('/api/auth/check')
      .then(res => res.json())
      .then(data => setIsAuthenticated(data.authenticated))
      .catch(() => setIsAuthenticated(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim()) return
    if (!isAuthenticated && (!authorName.trim() || !authorEmail.trim())) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          parent_id: parentId || null,
          author_name: isAuthenticated ? null : authorName,
          author_email: isAuthenticated ? null : authorEmail,
        }),
      })

      if (response.ok) {
        setContent('')
        setAuthorName('')
        setAuthorEmail('')
        if (onSuccess) {
          onSuccess()
        } else {
          window.location.reload()
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to submit comment')
      }
    } catch (error) {
      console.error('Failed to submit comment:', error)
      alert('Failed to submit comment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      {!isAuthenticated && (
        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <input
            type="text"
            placeholder="Your name"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            required={!isAuthenticated}
          />
          <input
            type="email"
            placeholder="Your email"
            value={authorEmail}
            onChange={(e) => setAuthorEmail(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            required={!isAuthenticated}
          />
        </div>
      )}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your comment..."
        rows={4}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 mb-4"
        required
      />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Post Comment'}
      </Button>
    </form>
  )
}
