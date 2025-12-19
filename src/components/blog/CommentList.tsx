'use client'

import { useEffect, useState } from 'react'
import { BlogComment } from '@/types/blog'
import { formatRelativeTime } from '@/lib/utils'
import { CommentForm } from './CommentForm'

interface CommentListProps {
  postId: string
}

export function CommentList({ postId }: CommentListProps) {
  const [comments, setComments] = useState<BlogComment[]>([])
  const [loading, setLoading] = useState(true)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  useEffect(() => {
    fetchComments()
  }, [postId])

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data.comments || [])
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReplySuccess = () => {
    setReplyingTo(null)
    fetchComments()
  }

  if (loading) {
    return <div className="text-gray-600">Loading comments...</div>
  }

  if (comments.length === 0) {
    return <div className="text-gray-600">No comments yet. Be the first to comment!</div>
  }

  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          postId={postId}
          replyingTo={replyingTo}
          onReplyClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
          onReplySuccess={handleReplySuccess}
        />
      ))}
    </div>
  )
}

interface CommentItemProps {
  comment: BlogComment
  postId: string
  replyingTo: string | null
  onReplyClick: () => void
  onReplySuccess: () => void
}

function CommentItem({ comment, postId, replyingTo, onReplyClick, onReplySuccess }: CommentItemProps) {
  return (
    <div className="border-l-2 border-gray-200 pl-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="font-semibold text-gray-900">
            {comment.author?.name || comment.author_name || 'Anonymous'}
          </div>
          <div className="text-sm text-gray-500">
            {formatRelativeTime(comment.created_at)}
          </div>
        </div>
        <button
          onClick={onReplyClick}
          className="text-sm text-primary-600 hover:text-primary-700"
        >
          Reply
        </button>
      </div>
      <div className="text-gray-700 mb-4 whitespace-pre-wrap">{comment.content}</div>
      
      {replyingTo === comment.id && (
        <div className="ml-4 mb-4">
          <CommentForm postId={postId} parentId={comment.id} onSuccess={onReplySuccess} />
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-4 mt-4 space-y-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              replyingTo={replyingTo}
              onReplyClick={onReplyClick}
              onReplySuccess={onReplySuccess}
            />
          ))}
        </div>
      )}
    </div>
  )
}
