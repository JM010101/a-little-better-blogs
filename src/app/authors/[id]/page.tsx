import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { PostCard } from '@/components/blog/PostCard'

export default async function AuthorPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createServerSupabaseClient()
  const { id } = await params
  
  const { data: author } = await supabase
    .from('blog_authors')
    .select('*')
    .eq('user_id', id)
    .single()

  if (!author) {
    notFound()
  }

  // Get user info - Note: admin API requires service role key
  // For now, we'll use the author data from the blog_authors table
  
  const { data: posts } = await supabase
    .from('blog_posts')
    .select(`
      *,
      author:blog_authors(*),
      categories:blog_post_categories(blog_categories(*)),
      tags:blog_post_tags(blog_tags(*))
    `)
    .eq('author_id', id)
    .eq('published', true)
    .order('published_at', { ascending: false })

  return (
    <div className="container-custom py-12">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-start gap-6">
            {author.avatar_url && (
              <img
                src={author.avatar_url}
                alt={author.name || 'Author'}
                className="w-24 h-24 rounded-full"
              />
            )}
            <div className="flex-grow">
              <h1 className="text-3xl font-bold mb-2">
                {author.name || 'Anonymous'}
              </h1>
              {author.bio && (
                <p className="text-gray-600 mb-4">{author.bio}</p>
              )}
              {author.social_links && (
                <div className="flex gap-4">
                  {Object.entries(author.social_links).map(([platform, url]) => (
                    <a
                      key={platform}
                      href={url as string}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-700"
                    >
                      {platform}
                    </a>
                  ))}
                </div>
              )}
              <p className="text-gray-500 mt-4">
                {posts?.length || 0} {(posts?.length || 0) === 1 ? 'post' : 'posts'}
              </p>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-6">Posts by {author.name || 'this author'}</h2>

        {posts && posts.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post: any) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No posts by this author yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
