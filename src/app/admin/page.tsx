import { createServerSupabaseClient } from '@/lib/supabase'
import Link from 'next/link'
import { 
  FileText, 
  MessageSquare, 
  Eye, 
  Star,
  TrendingUp,
  Clock
} from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = await createServerSupabaseClient()

  // Get statistics
  const [
    { count: totalPosts },
    { count: publishedPosts },
    { count: draftPosts },
    { count: totalComments },
    { count: pendingComments },
    { count: totalUsers },
  ] = await Promise.all([
    supabase.from('blog_posts').select('*', { count: 'exact', head: true }),
    supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('published', true),
    supabase.from('blog_posts').select('*', { count: 'exact', head: true }).eq('published', false),
    supabase.from('blog_comments').select('*', { count: 'exact', head: true }),
    supabase.from('blog_comments').select('*', { count: 'exact', head: true }).eq('approved', false),
    supabase.from('blog_authors').select('*', { count: 'exact', head: true }),
  ])

  // Get total views
  const { data: postsData } = await supabase
    .from('blog_posts')
    .select('views')
    .eq('published', true)

  const totalViews = postsData?.reduce((sum, post) => sum + (post.views || 0), 0) || 0

  // Get recent posts
  const { data: recentPosts } = await supabase
    .from('blog_posts')
    .select('id, title, published, published_at, views, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  // Get recent comments
  const { data: recentComments } = await supabase
    .from('blog_comments')
    .select('id, content, approved, created_at, author_name')
    .order('created_at', { ascending: false })
    .limit(5)

  const stats = [
    {
      name: 'Total Posts',
      value: totalPosts || 0,
      icon: FileText,
      color: 'bg-blue-500',
      href: '/admin/posts',
    },
    {
      name: 'Published',
      value: publishedPosts || 0,
      icon: FileText,
      color: 'bg-green-500',
      href: '/admin/posts?status=published',
    },
    {
      name: 'Drafts',
      value: draftPosts || 0,
      icon: Clock,
      color: 'bg-yellow-500',
      href: '/admin/posts?status=draft',
    },
    {
      name: 'Total Comments',
      value: totalComments || 0,
      icon: MessageSquare,
      color: 'bg-purple-500',
      href: '/admin/comments',
    },
    {
      name: 'Pending Comments',
      value: pendingComments || 0,
      icon: MessageSquare,
      color: 'bg-orange-500',
      href: '/admin/comments?status=pending',
    },
    {
      name: 'Total Views',
      value: totalViews.toLocaleString(),
      icon: Eye,
      color: 'bg-indigo-500',
    },
    {
      name: 'Total Users',
      value: totalUsers || 0,
      icon: TrendingUp,
      color: 'bg-pink-500',
      href: '/admin/users',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to the admin dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          const content = (
            <div className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.name}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          )

          if (stat.href) {
            return (
              <Link key={stat.name} href={stat.href}>
                {content}
              </Link>
            )
          }

          return <div key={stat.name}>{content}</div>
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Posts */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Posts</h2>
            <Link href="/admin/posts" className="text-sm text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {recentPosts && recentPosts.length > 0 ? (
              recentPosts.map((post: any) => (
                <div key={post.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex-1">
                    <Link
                      href={`/admin/posts/${post.id}`}
                      className="font-medium text-gray-900 hover:text-primary-600"
                    >
                      {post.title}
                    </Link>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                      <span className={`px-2 py-1 rounded text-xs ${
                        post.published 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {post.published ? 'Published' : 'Draft'}
                      </span>
                      <span>{post.views || 0} views</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No posts yet</p>
            )}
          </div>
        </div>

        {/* Recent Comments */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Recent Comments</h2>
            <Link href="/admin/comments" className="text-sm text-primary-600 hover:text-primary-700">
              View all
            </Link>
          </div>
          <div className="space-y-4">
            {recentComments && recentComments.length > 0 ? (
              recentComments.map((comment: any) => (
                <div key={comment.id} className="py-2 border-b border-gray-100 last:border-0">
                  <p className="text-sm text-gray-900 line-clamp-2">{comment.content}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>{comment.author_name || 'Anonymous'}</span>
                    <span className={`px-2 py-1 rounded ${
                      comment.approved 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-orange-100 text-orange-700'
                    }`}>
                      {comment.approved ? 'Approved' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No comments yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/create"
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Create New Post
          </Link>
          <Link
            href="/admin/comments?status=pending"
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Review Comments
          </Link>
          <Link
            href="/admin/analytics"
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            View Analytics
          </Link>
        </div>
      </div>
    </div>
  )
}

