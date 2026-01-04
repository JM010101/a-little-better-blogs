import { createServerSupabaseClient } from '@/lib/supabase'
import Link from 'next/link'
import { MessageSquare, CheckCircle, XCircle, Trash2 } from 'lucide-react'
import { CommentActions } from '@/components/admin/CommentActions'

interface AdminCommentsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function AdminCommentsPage({ searchParams }: AdminCommentsPageProps) {
  const supabase = await createServerSupabaseClient()
  const params = await searchParams
  
  const status = typeof params.status === 'string' ? params.status : 'all'
  const page = typeof params.page === 'string' ? parseInt(params.page) : 1
  const limit = 20
  const offset = (page - 1) * limit

  let query = supabase
    .from('blog_comments')
    .select(`
      *,
      post:blog_posts(id, title, slug)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status === 'approved') {
    query = query.eq('approved', true)
  } else if (status === 'pending') {
    query = query.eq('approved', false)
  }

  const { data: comments, error, count } = await query

  if (error) {
    return (
      <div className="text-red-600">
        Error loading comments: {error.message}
      </div>
    )
  }

  const totalPages = Math.ceil((count || 0) / limit)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Comments</h1>
        <p className="text-gray-600 mt-2">Moderate and manage comments</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex gap-2">
          <Link
            href="/admin/comments"
            className={`px-4 py-2 rounded-lg transition-colors ${
              status === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({count || 0})
          </Link>
          <Link
            href="/admin/comments?status=approved"
            className={`px-4 py-2 rounded-lg transition-colors ${
              status === 'approved'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Approved
          </Link>
          <Link
            href="/admin/comments?status=pending"
            className={`px-4 py-2 rounded-lg transition-colors ${
              status === 'pending'
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending
          </Link>
        </div>
      </div>

      {/* Comments List */}
      <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
        {comments && comments.length > 0 ? (
          comments.map((comment: any) => (
            <div key={comment.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-gray-900">
                      {comment.author_name || comment.author?.name || 'Anonymous'}
                    </span>
                    <span className="text-sm text-gray-500">
                      on{' '}
                      <Link
                        href={`/posts/${comment.post?.slug}`}
                        className="text-primary-600 hover:text-primary-700"
                      >
                        {comment.post?.title}
                      </Link>
                    </span>
                  </div>
                  <p className="text-gray-700 mb-3">{comment.content}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{new Date(comment.created_at).toLocaleString()}</span>
                    <span className={`px-2 py-1 rounded text-xs ${
                      comment.approved
                        ? 'bg-green-100 text-green-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {comment.approved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  <CommentActions commentId={comment.id} approved={comment.approved} />
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-500">
            No comments found
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white rounded-lg shadow px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {offset + 1} to {Math.min(offset + limit, count || 0)} of {count || 0} comments
          </div>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/admin/comments?page=${page - 1}${status !== 'all' ? `&status=${status}` : ''}`}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/comments?page=${page + 1}${status !== 'all' ? `&status=${status}` : ''}`}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

