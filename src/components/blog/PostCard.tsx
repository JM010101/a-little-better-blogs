'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { BlogPost } from '@/types/blog'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import { RatingWidget } from './RatingWidget'

interface PostCardProps {
  post: BlogPost
  featured?: boolean
}

export function PostCard({ post, featured = false }: PostCardProps) {
  const router = useRouter()
  const categories = post.categories || []
  const tags = post.tags || []
  const [relativeTime, setRelativeTime] = useState<string>('')

  useEffect(() => {
    // Calculate relative time on client only to avoid hydration mismatch
    setRelativeTime(formatRelativeTime(post.published_at || post.created_at))
    
    // Update every minute
    const interval = setInterval(() => {
      setRelativeTime(formatRelativeTime(post.published_at || post.created_at))
    }, 60000)

    return () => clearInterval(interval)
  }, [post.published_at, post.created_at])

  const handleCardClick = () => {
    router.push(`/posts/${post.slug}`)
  }

  return (
    <article 
      className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden cursor-pointer ${featured ? 'border-2 border-primary-500' : ''}`}
      onClick={handleCardClick}
    >
      <div className="p-6">
        {featured && (
          <span className="inline-block bg-primary-100 text-primary-700 text-xs font-semibold px-2 py-1 rounded mb-3">
            Featured
          </span>
        )}
        
        <h2 className={`font-bold mb-2 text-gray-900 hover:text-primary-600 transition-colors ${featured ? 'text-2xl' : 'text-xl'}`}>
          {post.title}
        </h2>

        {post.excerpt && (
          <p className="text-gray-600 mb-4 line-clamp-3">
            {post.excerpt}
          </p>
        )}

        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <span suppressHydrationWarning>{relativeTime || formatDate(post.published_at || post.created_at)}</span>
          <span>•</span>
          <span>{post.reading_time} min read</span>
          {post.views > 0 && (
            <>
              <span>•</span>
              <span>{post.views} views</span>
            </>
          )}
        </div>

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3" onClick={(e) => e.stopPropagation()}>
            {categories.slice(0, 3).map((cat: any) => (
              <Link
                key={cat.id}
                href={`/categories/${cat.slug}`}
                className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        )}

        {post.average_rating && (
          <div className="mb-3" onClick={(e) => e.stopPropagation()}>
            <RatingWidget
              postId={post.id}
              averageRating={post.average_rating}
              ratingCount={post.rating_count || 0}
              userRating={post.user_rating}
              readonly
              compact
            />
          </div>
        )}

        {post.author && (
          <div className="flex items-center gap-2 mt-4">
            {post.author.avatar_url && (
              <img
                src={post.author.avatar_url}
                alt={post.author.name || 'Author'}
                className="w-8 h-8 rounded-full"
              />
            )}
            <span className="text-sm text-gray-600">
              {post.author.name || 'Anonymous'}
            </span>
          </div>
        )}
      </div>
    </article>
  )
}
