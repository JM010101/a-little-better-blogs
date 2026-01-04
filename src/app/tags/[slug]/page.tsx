import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { PostCard } from '@/components/blog/PostCard'

export default async function TagPage({ params }: { params: Promise<{ slug: string }> }) {
  const supabase = await createServerSupabaseClient()
  const { slug } = await params
  
  const { data: tag } = await supabase
    .from('blog_tags')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!tag) {
    notFound()
  }

  let posts: any[] = []
  const { data: postTags } = await supabase
    .from('blog_post_tags')
    .select('post_id')
    .eq('tag_id', tag.id)

    if (postTags && postTags.length > 0) {
      const postIds = postTags.map(pt => pt.post_id)
      const { data: postsData } = await supabase
        .from('blog_posts')
        .select(`
          *,
          author:blog_authors(*),
          categories:blog_post_categories(blog_categories(*)),
          tags:blog_post_tags(blog_tags(*))
        `)
        .in('id', postIds)
        .eq('published', true)
        .order('published_at', { ascending: false })
      
      posts = postsData || []
    }
  }

  return (
    <div className="container-custom py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">#{tag.name}</h1>
        <p className="text-gray-500 mt-2">{posts.length} {posts.length === 1 ? 'post' : 'posts'}</p>
      </div>

      {posts.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post: any) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No posts with this tag yet.</p>
        </div>
      )}
    </div>
  )
}
