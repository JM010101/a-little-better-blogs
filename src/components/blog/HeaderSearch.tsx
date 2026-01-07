'use client'

import { useState, FormEvent, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'

export function HeaderSearch() {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  useEffect(() => {
    if (query.trim().length > 2) {
      const timer = setTimeout(() => {
        setLoading(true)
        fetch(`/api/search?q=${encodeURIComponent(query.trim())}&limit=5`)
          .then(res => res.json())
          .then(data => {
            if (data.posts) {
              setSuggestions(data.posts)
              setIsOpen(true)
            } else {
              setSuggestions([])
            }
          })
          .catch(() => {
            setSuggestions([])
          })
          .finally(() => {
            setLoading(false)
          })
      }, 300)

      return () => clearTimeout(timer)
    } else {
      setSuggestions([])
      setIsOpen(false)
    }
  }, [query])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      setIsOpen(false)
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      setQuery('')
    }
  }

  const handleSuggestionClick = (post: any) => {
    setIsOpen(false)
    router.push(`/posts/${post.slug}`)
    setQuery('')
  }

  const handleClear = () => {
    setQuery('')
    setIsOpen(false)
    inputRef.current?.focus()
  }

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) {
                setIsOpen(true)
              }
            }}
            placeholder="Search posts..."
            className="w-64 px-4 py-2 pl-10 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>

      {isOpen && (suggestions.length > 0 || loading) && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-96 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto"
        >
          {loading ? (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              Searching...
            </div>
          ) : suggestions.length > 0 ? (
            <>
              {suggestions.map((post: any) => (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => handleSuggestionClick(post)}
                  className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-semibold text-sm text-gray-900 line-clamp-1">
                    {post.title}
                  </div>
                  {post.excerpt && (
                    <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {post.excerpt}
                    </div>
                  )}
                </button>
              ))}
              <div className="px-4 py-2 border-t border-gray-200 bg-gray-50">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View all results →
                </button>
              </div>
            </>
          ) : null}
        </div>
      )}
    </div>
  )
}

