'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { BlogPost } from '@/types/blog'
import { ImageUpload } from './ImageUpload'
import { ImageIcon } from 'lucide-react'

interface PostEditorProps {
  post?: BlogPost
}

export function PostEditor({ post }: PostEditorProps) {
  const router = useRouter()
  const [title, setTitle] = useState(post?.title || '')
  const [content, setContent] = useState(post?.content || '')
  const [excerpt, setExcerpt] = useState(post?.excerpt || '')
  const [categories, setCategories] = useState<string[]>(
    post?.categories?.map((c: any) => c.name) || []
  )
  const [tags, setTags] = useState<string[]>(
    post?.tags?.map((t: any) => t.name) || []
  )
  const [featured, setFeatured] = useState(post?.featured || false)
  const [published, setPublished] = useState(post?.published || false)
  const [categoryInput, setCategoryInput] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showImageUpload, setShowImageUpload] = useState(false)

  const handleAddCategory = () => {
    if (categoryInput.trim() && !categories.includes(categoryInput.trim())) {
      setCategories([...categories, categoryInput.trim()])
      setCategoryInput('')
    }
  }

  const handleRemoveCategory = (category: string) => {
    setCategories(categories.filter(c => c !== category))
  }

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !content.trim()) {
      alert('Title and content are required')
      return
    }

    setIsSubmitting(true)
    try {
      const url = post ? `/api/posts/${post.id}` : '/api/posts'
      const method = post ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          content,
          excerpt,
          categories,
          tags,
          featured,
          published,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        router.push(`/posts/${data.post.slug}`)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save post')
      }
    } catch (error) {
      console.error('Failed to save post:', error)
      alert('Failed to save post. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="title" className="block text-sm font-semibold mb-2">
          Title *
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          required
        />
      </div>

      <div>
        <label htmlFor="excerpt" className="block text-sm font-semibold mb-2">
          Excerpt
        </label>
        <textarea
          id="excerpt"
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          placeholder="Brief summary of your post..."
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="content" className="block text-sm font-semibold">
            Content * (Markdown supported)
          </label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowImageUpload(!showImageUpload)}
            className="flex items-center gap-2"
          >
            <ImageIcon className="w-4 h-4" />
            {showImageUpload ? 'Hide' : 'Insert Image'}
          </Button>
        </div>
        
        {showImageUpload && (
          <div className="mb-4 p-4 border border-gray-300 rounded-lg bg-gray-50">
            <ImageUpload
              onUploadComplete={(url) => {
                const textarea = document.getElementById('content') as HTMLTextAreaElement
                if (textarea) {
                  const cursorPos = textarea.selectionStart
                  const textBefore = content.substring(0, cursorPos)
                  const textAfter = content.substring(cursorPos)
                  const imageMarkdown = `![Image](${url})\n`
                  setContent(textBefore + imageMarkdown + textAfter)
                  setShowImageUpload(false)
                  // Set cursor position after inserted text
                  setTimeout(() => {
                    textarea.focus()
                    textarea.setSelectionRange(cursorPos + imageMarkdown.length, cursorPos + imageMarkdown.length)
                  }, 0)
                }
              }}
            />
          </div>
        )}
        
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={20}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono text-sm"
          required
        />
        <p className="text-sm text-gray-500 mt-1">
          Supports Markdown syntax. Use # for headings, ** for bold, * for italic, etc.
        </p>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Categories</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={categoryInput}
            onChange={(e) => setCategoryInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddCategory()
              }
            }}
            placeholder="Add category"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <Button type="button" onClick={handleAddCategory}>
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <span
              key={cat}
              className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm flex items-center gap-2"
            >
              {cat}
              <button
                type="button"
                onClick={() => handleRemoveCategory(cat)}
                className="hover:text-primary-900"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Tags</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleAddTag()
              }
            }}
            placeholder="Add tag"
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
          <Button type="button" onClick={handleAddTag}>
            Add
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm flex items-center gap-2"
            >
              #{tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-gray-900"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={featured}
            onChange={(e) => setFeatured(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm font-semibold">Featured</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm font-semibold">Published</span>
        </label>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : post ? 'Update Post' : 'Create Post'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
