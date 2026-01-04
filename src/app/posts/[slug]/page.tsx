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
  
  const { data: post } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (!post) {
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
  
  const { data: post, error } = await supabase
    .from('blog_posts')
    .select(`
      *,
      author:blog_authors(*),
      categories:blog_post_categories(blog_categories(*)),
      tags:blog_post_tags(blog_tags(*))
    `)
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (error || !post) {
    notFound()
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
