'use client'

import { useState, FormEvent, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

interface SearchBarProps {
  initialValue?: string
  placeholder?: string
  showSuggestions?: boolean
}

export function SearchBar({ 
  initialValue = '', 
  placeholder = 'Search posts...',
  showSuggestions = false 
}: SearchBarProps) {
  const [query, setQuery] = useState(initialValue)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
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
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (showSuggestions && query.trim().length > 2) {
      // Fetch search suggestions (simplified - could be enhanced with dedicated endpoint)
      const timer = setTimeout(() => {
        fetch(`/api/search?q=${encodeURIComponent(query.trim())}&limit=5`)
          .then(res => res.json())
          .then(data => {
            if (data.posts) {
              const titles = data.posts.map((p: any) => p.title).slice(0, 5)
              setSuggestions(titles)
              setShowDropdown(titles.length > 0)
            }
          })
          .catch(() => {
            setSuggestions([])
            setShowDropdown(false)
          })
      }, 300)

      return () => clearTimeout(timer)
    } else {
      setSuggestions([])
      setShowDropdown(false)
    }
  }, [query, showSuggestions])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      setShowDropdown(false)
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    setShowDropdown(false)
    router.push(`/search?q=${encodeURIComponent(suggestion)}`)
  }

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowDropdown(true)
            }
          }}
          placeholder={placeholder}
          className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
        />
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
      </form>
      
      {showDropdown && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{suggestion}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
