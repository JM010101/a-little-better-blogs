import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase'
import { PostCard } from '@/components/blog/PostCard'

export default async function HomePage() {
  const supabase = await createServerSupabaseClient()
  
  const { data: featuredPosts } = await supabase
    .from('blog_posts')
    .select(`
      *,
      author:blog_authors(*),
      categories:blog_post_categories(blog_categories(*)),
      tags:blog_post_tags(blog_tags(*))
    `)
    .eq('published', true)
    .eq('featured', true)
    .order('published_at', { ascending: false })
    .limit(3)

  const { data: recentPosts } = await supabase
    .from('blog_posts')
    .select(`
      *,
      author:blog_authors(*),
      categories:blog_post_categories(blog_categories(*)),
      tags:blog_post_tags(blog_tags(*))
    `)
    .eq('published', true)
    .order('published_at', { ascending: false })
    .limit(6)

  return (
    <div className="container-custom py-12">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Welcome to A Little Better Blog
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Discover insights, share knowledge, and join conversations about continuous improvement.
        </p>
      </div>

      {featuredPosts && featuredPosts.length > 0 && (
        <section className="mb-16">
          <h2 className="text-3xl font-bold mb-8">Featured Posts</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {featuredPosts.map((post: any) => (
              <PostCard key={post.id} post={post} featured />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold">Latest Posts</h2>
          <Link href="/posts" className="text-primary-600 hover:underline font-semibold">
            View All →
          </Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentPosts?.map((post: any) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      </section>
    </div>
  )
}
