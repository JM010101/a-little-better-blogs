import { createServerSupabaseClient } from '@/lib/supabase'
import Link from 'next/link'
import { SearchParams } from 'next/navigation'
import { FileText, Edit, Trash2, Eye, CheckCircle, XCircle } from 'lucide-react'

interface AdminPostsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function AdminPostsPage({ searchParams }: AdminPostsPageProps) {
  const supabase = await createServerSupabaseClient()
  const params = await searchParams
  
  const status = typeof params.status === 'string' ? params.status : 'all'
  const search = typeof params.search === 'string' ? params.search : ''
  const page = typeof params.page === 'string' ? parseInt(params.page) : 1
  const limit = 20
  const offset = (page - 1) * limit

  let query = supabase
    .from('blog_posts')
    .select(`
      *,
      author:blog_authors(*)
    `, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status === 'published') {
    query = query.eq('published', true)
  } else if (status === 'draft') {
    query = query.eq('published', false)
  }

  if (search) {
    query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`)
  }

  const { data: posts, error, count } = await query

  if (error) {
    return (
      <div className="text-red-600">
        Error loading posts: {error.message}
      </div>
    )
  }

  const totalPages = Math.ceil((count || 0) / limit)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Posts</h1>
          <p className="text-gray-600 mt-2">Manage all blog posts</p>
        </div>
        <Link
          href="/create"
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Create New Post
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <Link
              href="/admin/posts"
              className={`px-4 py-2 rounded-lg transition-colors ${
                status === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({count || 0})
            </Link>
            <Link
              href="/admin/posts?status=published"
              className={`px-4 py-2 rounded-lg transition-colors ${
                status === 'published'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Published
            </Link>
            <Link
              href="/admin/posts?status=draft"
              className={`px-4 py-2 rounded-lg transition-colors ${
                status === 'draft'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Drafts
            </Link>
          </div>
        </div>
      </div>

      {/* Posts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Views
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {posts && posts.length > 0 ? (
                posts.map((post: any) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {post.title}
                      </div>
                      {post.excerpt && (
                        <div className="text-sm text-gray-500 mt-1 line-clamp-1">
                          {post.excerpt}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {post.author?.name || 'Unknown'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        post.published
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {post.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {post.views || 0}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(post.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        {post.published && (
                          <Link
                            href={`/posts/${post.slug}`}
                            target="_blank"
                            className="text-gray-600 hover:text-gray-900"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        )}
                        <Link
                          href={`/posts/${post.slug}/edit`}
                          className="text-primary-600 hover:text-primary-900"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No posts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <div className="text-sm text-gray-700">
              Showing {offset + 1} to {Math.min(offset + limit, count || 0)} of {count || 0} posts
            </div>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/admin/posts?page=${page - 1}${status !== 'all' ? `&status=${status}` : ''}`}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Previous
                </Link>
              )}
              {page < totalPages && (
                <Link
                  href={`/admin/posts?page=${page + 1}${status !== 'all' ? `&status=${status}` : ''}`}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

