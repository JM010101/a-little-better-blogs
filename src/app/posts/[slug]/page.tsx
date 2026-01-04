import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase'
import { PostContent } from '@/components/blog/PostContent'
import { RatingWidget } from '@/components/blog/RatingWidget'
import { CommentForm } from '@/components/blog/CommentForm'
import { CommentList } from '@/components/blog/CommentList'
import { RelatedPosts } from '@/components/blog/RelatedPosts'
import { StructuredData } from '@/components/blog/StructuredData'
import { SocialShare } from '@/components/blog/SocialShare'
import { formatDate } from '@/lib/utils'
import type { Metadata } from 'next'

// Enable ISR - revalidate every hour
export const revalidate = 3600

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const supabase = await createServerSupabaseClient()
  const { slug } = await params
  
  // Get current user to check if they're the author
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .single()

  // If post doesn't exist, or is unpublished and user is not the author, return empty metadata
  if (!post || (!post.published && post.author_id !== user?.id)) {
    return {}
  }

  return {
    title: post.title,
    description: post.excerpt || post.content.substring(0, 200),
    openGraph: {
      title: post.title,
      description: post.excerpt || post.content.substring(0, 200),
      type: 'article',
      publishedTime: post.published_at || post.created_at,
      modifiedTime: post.updated_at,
      authors: [post.author?.name || 'Anonymous'],
    },
  }
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const supabase = await createServerSupabaseClient()
  const { slug } = await params
  
  // Get current user to check if they're the author
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  
  if (userError) {
    console.error('Error getting user:', userError)
  }
  
  // Fetch post without published filter first
  const { data: post, error } = await supabase
    .from('blog_posts')
    .select(`
      *,
      author:blog_authors(*),
      categories:blog_post_categories(blog_categories(*)),
      tags:blog_post_tags(blog_tags(*))
    `)
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('Error fetching post:', error)
    console.error('Slug:', slug)
    console.error('User:', user?.id)
    console.error('Error code:', error.code)
    console.error('Error message:', error.message)
    notFound()
  }

  if (!post) {
    console.error('Post not found for slug:', slug)
    notFound()
  }
  
  // If post is unpublished, only allow the author to view it
  if (!post.published) {
    if (!user || post.author_id !== user.id) {
      console.error('Unauthorized access attempt:', {
        postPublished: post.published,
        userId: user?.id,
        authorId: post.author_id,
        slug
      })
      notFound()
    }
  }

  // Get ratings
  const { data: ratings } = await supabase
    .from('blog_ratings')
    .select('rating, user_id')
    .eq('post_id', post.id)

  let averageRating = 0
  let ratingCount = 0
  let userRating: number | undefined

  if (ratings && ratings.length > 0) {
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0)
    averageRating = sum / ratings.length
    ratingCount = ratings.length
    
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const userRatingData = ratings.find(r => r.user_id === user.id)
      userRating = userRatingData?.rating
    }
  }

  const categories = post.categories || []
  const tags = post.tags || []

  return (
    <article className="container-custom py-12">
      <StructuredData post={post} />
      <div className="max-w-4xl mx-auto">
        {/* Draft Banner */}
        {!post.published && (
          <div className="mb-6 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">This post is a draft</p>
                <p className="text-sm">Only you can see this post. Publish it to make it visible to everyone.</p>
              </div>
              <Link
                href={`/posts/${post.slug}/edit`}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                Edit Post
              </Link>
            </div>
          </div>
        )}
        
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-gray-600">
          <Link href="/" className="hover:text-primary-600">Home</Link>
          <span className="mx-2">/</span>
          <Link href="/posts" className="hover:text-primary-600">Posts</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-900">{post.title}</span>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{post.title}</h1>
          
          {post.excerpt && (
            <p className="text-xl text-gray-600 mb-6">{post.excerpt}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
            <div className="flex items-center gap-2">
              {post.author?.avatar_url && (
                <img
                  src={post.author.avatar_url}
                  alt={post.author.name || 'Author'}
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div>
                <Link href={`/authors/${post.author_id}`} className="font-semibold hover:text-primary-600">
                  {post.author?.name || 'Anonymous'}
                </Link>
                <div>{formatDate(post.published_at || post.created_at)}</div>
              </div>
            </div>
            <span>•</span>
            <span>{post.reading_time} min read</span>
            {post.views > 0 && (
              <>
                <span>•</span>
                <span>{post.views} views</span>
              </>
            )}
          </div>

          {/* Categories and Tags */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.map((cat: any) => (
                <Link
                  key={cat.id}
                  href={`/categories/${cat.slug}`}
                  className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm hover:bg-primary-200 transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          )}

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {tags.map((tag: any) => (
                <Link
                  key={tag.id}
                  href={`/tags/${tag.slug}`}
                  className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-gray-200 transition-colors"
                >
                  #{tag.name}
                </Link>
              ))}
            </div>
          )}

          {/* Rating */}
          <div className="mb-4">
            <RatingWidget
              postId={post.id}
              averageRating={averageRating}
              ratingCount={ratingCount}
              userRating={userRating}
            />
          </div>

          {/* Social Share */}
          <div className="mb-8">
            <SocialShare
              url={`/posts/${post.slug}`}
              title={post.title}
              description={post.excerpt || undefined}
            />
          </div>
        </header>

        {/* Content */}
        <div className="prose prose-lg max-w-none mb-12">
          <PostContent content={post.content} />
        </div>

        {/* Comments Section */}
        <section className="border-t border-gray-200 pt-8 mb-12">
          <h2 className="text-2xl font-bold mb-6">Comments</h2>
          <CommentForm postId={post.id} />
          <CommentList postId={post.id} />
        </section>

        {/* Related Posts */}
        <RelatedPosts postId={post.id} categories={categories} tags={tags} />
      </div>
    </article>
  )
}
