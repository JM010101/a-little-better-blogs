'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CommentActionsProps {
  commentId: string
  approved: boolean
}

export function CommentActions({ commentId, approved }: CommentActionsProps) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState(approved)

  const handleApprove = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: true }),
      })

      if (response.ok) {
        setStatus(true)
      }
    } catch (error) {
      console.error('Failed to approve comment:', error)
      alert('Failed to approve comment')
    } finally {
      setLoading(false)
    }
  }

  const handleReject = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/comments/${commentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved: false }),
      })

      if (response.ok) {
        setStatus(false)
      }
    } catch (error) {
      console.error('Failed to reject comment:', error)
      alert('Failed to reject comment')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/comments/${commentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to delete comment:', error)
      alert('Failed to delete comment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {!status && (
        <Button
          size="sm"
          onClick={handleApprove}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="w-4 h-4 mr-1" />
          Approve
        </Button>
      )}
      {status && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleReject}
          disabled={loading}
        >
          <XCircle className="w-4 h-4 mr-1" />
          Reject
        </Button>
      )}
      <Button
        size="sm"
        variant="outline"
        onClick={handleDelete}
        disabled={loading}
        className="text-red-600 hover:text-red-700"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  )
}

