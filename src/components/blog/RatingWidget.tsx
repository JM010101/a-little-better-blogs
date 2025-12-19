'use client'

import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'

interface RatingWidgetProps {
  postId: string
  averageRating?: number
  ratingCount?: number
  userRating?: number
  readonly?: boolean
  compact?: boolean
}

export function RatingWidget({
  postId,
  averageRating = 0,
  ratingCount = 0,
  userRating,
  readonly = false,
  compact = false,
}: RatingWidgetProps) {
  const [hoveredRating, setHoveredRating] = useState(0)
  const [currentRating, setCurrentRating] = useState(userRating || 0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setCurrentRating(userRating || 0)
  }, [userRating])

  const handleRating = async (rating: number) => {
    if (readonly || isSubmitting) return

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/posts/${postId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rating }),
      })

      if (response.ok) {
        setCurrentRating(rating)
        // Reload page to update average rating
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to submit rating:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const displayRating = hoveredRating || currentRating || Math.round(averageRating)

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= displayRating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
        {averageRating > 0 && (
          <span className="text-sm text-gray-600 ml-2">
            {averageRating.toFixed(1)} ({ratingCount})
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleRating(star)}
            onMouseEnter={() => !readonly && setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            disabled={readonly || isSubmitting}
            className={`transition-colors ${
              readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'
            }`}
          >
            <Star
              className={`w-6 h-6 ${
                star <= displayRating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
      {averageRating > 0 && (
        <div className="text-sm text-gray-600">
          {averageRating.toFixed(1)} out of 5 ({ratingCount} {ratingCount === 1 ? 'rating' : 'ratings'})
        </div>
      )}
      {currentRating > 0 && !readonly && (
        <div className="text-xs text-gray-500">
          You rated this {currentRating} {currentRating === 1 ? 'star' : 'stars'}
        </div>
      )}
    </div>
  )
}
