import { createServerSupabaseClient } from '@/lib/supabase'
import { PostCard } from './PostCard'

interface RelatedPostsProps {
  postId: string
  categories: any[]
  tags: any[]
}

export async function RelatedPosts({ postId, categories, tags }: RelatedPostsProps) {
  const supabase = await createServerSupabaseClient()
  
  // Find related posts by categories or tags
  const categoryIds = categories.map((c: any) => c.id)
  const tagIds = tags.map((t: any) => t.id)

  let relatedPosts: any[] = []

  if (categoryIds.length > 0) {
    // Get posts by category IDs
    const { data: postCategories } = await supabase
      .from('blog_post_categories')
      .select('post_id')
      .in('category_id', categoryIds)

    if (postCategories && postCategories.length > 0) {
      const relatedPostIds = postCategories
        .map((pc: any) => pc.post_id)
        .filter((id: string) => id !== postId)
        .slice(0, 3)

      if (relatedPostIds.length > 0) {
        const { data: postsByCategory } = await supabase
          .from('blog_posts')
          .select(`
            *,
            author:blog_authors(*),
            categories:blog_post_categories(blog_categories(*)),
            tags:blog_post_tags(blog_tags(*))
          `)
          .in('id', relatedPostIds)
          .eq('published', true)
          .order('published_at', { ascending: false })

        if (postsByCategory) {
          relatedPosts = [...relatedPosts, ...postsByCategory]
        }
      }
    }
  }

  if (tagIds.length > 0 && relatedPosts.length < 3) {
    // Get posts by tag IDs
    const { data: postTags } = await supabase
      .from('blog_post_tags')
      .select('post_id')
      .in('tag_id', tagIds)

    if (postTags && postTags.length > 0) {
      const existingIds = new Set(relatedPosts.map((p: any) => p.id))
      const relatedPostIds = postTags
        .map((pt: any) => pt.post_id)
        .filter((id: string) => id !== postId && !existingIds.has(id))
        .slice(0, 3 - relatedPosts.length)

      if (relatedPostIds.length > 0) {
        const { data: postsByTag } = await supabase
          .from('blog_posts')
          .select(`
            *,
            author:blog_authors(*),
            categories:blog_post_categories(blog_categories(*)),
            tags:blog_post_tags(blog_tags(*))
          `)
          .in('id', relatedPostIds)
          .eq('published', true)
          .order('published_at', { ascending: false })

        if (postsByTag) {
          relatedPosts = [...relatedPosts, ...postsByTag]
        }
      }
    }
  }

  // If still not enough, get recent posts
  if (relatedPosts.length < 3) {
    const { data: recentPosts } = await supabase
      .from('blog_posts')
      .select(`
        *,
        author:blog_authors(*),
        categories:blog_post_categories(blog_categories(*)),
        tags:blog_post_tags(blog_tags(*))
      `)
      .eq('published', true)
      .neq('id', postId)
      .order('published_at', { ascending: false })
      .limit(3 - relatedPosts.length)

    if (recentPosts) {
      const existingIds = new Set(relatedPosts.map((p: any) => p.id))
      const newPosts = recentPosts.filter((p: any) => !existingIds.has(p.id))
      relatedPosts = [...relatedPosts, ...newPosts]
    }
  }

  if (relatedPosts.length === 0) {
    return null
  }

  return (
    <section className="border-t border-gray-200 pt-8">
      <h2 className="text-2xl font-bold mb-6">Related Posts</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {relatedPosts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  )
}
