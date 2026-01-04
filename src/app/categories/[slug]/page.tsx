import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { PostCard } from '@/components/blog/PostCard'

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const supabase = await createServerSupabaseClient()
  const { slug } = await params
  
  const { data: category } = await supabase
    .from('blog_categories')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!category) {
    notFound()
  }

  let posts: any[] = []
  const { data: postCategories } = await supabase
    .from('blog_post_categories')
    .select('post_id')
    .eq('category_id', category.id)

  if (postCategories && postCategories.length > 0) {
    const postIds = postCategories.map(pc => pc.post_id)
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

  return (
    <div className="container-custom py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{category.name}</h1>
        {category.description && (
          <p className="text-gray-600 text-lg">{category.description}</p>
        )}
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
          <p className="text-gray-600 text-lg">No posts in this category yet.</p>
        </div>
      )}
    </div>
  )
}
