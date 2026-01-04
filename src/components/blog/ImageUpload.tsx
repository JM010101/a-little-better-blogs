'use client'

import { useState, useRef, useEffect, DragEvent } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ImageUploadProps {
  onUploadComplete?: (url: string) => void
  onRemove?: () => void
  existingUrl?: string
  className?: string
}

export function ImageUpload({ 
  onUploadComplete, 
  onRemove, 
  existingUrl,
  className = '' 
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(existingUrl || null)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const data = await response.json()
      setPreview(data.url)
      
      if (onUploadComplete) {
        onUploadComplete(data.url)
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      alert(error.message || 'Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleDrag = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleRemove = async () => {
    if (preview && onRemove) {
      // Extract path from URL if needed
      try {
        const url = new URL(preview)
        const path = url.pathname.split('/blog-images/')[1]
        
        if (path) {
          await fetch(`/api/upload?path=${encodeURIComponent(`blog-images/${path}`)}`, {
            method: 'DELETE',
          })
        }
      } catch (error) {
        console.error('Failed to delete image:', error)
      }
      
      setPreview(null)
      onRemove()
    }
  }

  if (preview) {
    return (
      <div className={`relative ${className}`}>
        <img
          src={preview}
          alt="Upload preview"
          className="w-full h-48 object-cover rounded-lg border border-gray-300"
        />
        <button
          type="button"
          onClick={handleRemove}
          className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
          aria-label="Remove image"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        dragActive
          ? 'border-primary-500 bg-primary-50'
          : 'border-gray-300 hover:border-gray-400'
      } ${className}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
      
      <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-600 mb-2">
        Drag and drop an image here, or{' '}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-primary-600 hover:text-primary-700 underline"
        >
          browse
        </button>
      </p>
      <p className="text-sm text-gray-500">
        Supports JPEG, PNG, WebP, GIF (max 5MB)
      </p>
      
      {uploading && (
        <div className="mt-4">
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          <p className="text-sm text-gray-600 mt-2">Uploading...</p>
        </div>
      )}
    </div>
  )
}

interface ImageGalleryProps {
  onSelect?: (url: string) => void
}

export function ImageGallery({ onSelect }: ImageGalleryProps) {
  const [images, setImages] = useState<Array<{ url: string; name: string; path: string }>>([])
  const [loading, setLoading] = useState(true)

  const fetchImages = async () => {
    try {
      const response = await fetch('/api/upload')
      if (response.ok) {
        const data = await response.json()
        setImages(data.files || [])
      }
    } catch (error) {
      console.error('Failed to fetch images:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchImages()
  }, [])

  if (loading) {
    return <div className="text-gray-600">Loading images...</div>
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-8 text-gray-600">
        <p>No images uploaded yet.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {images.map((image) => (
        <div
          key={image.path}
          className="relative group cursor-pointer"
          onClick={() => onSelect?.(image.url)}
        >
          <img
            src={image.url}
            alt={image.name}
            className="w-full h-32 object-cover rounded-lg border border-gray-300 group-hover:border-primary-500 transition-colors"
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity rounded-lg flex items-center justify-center">
            <span className="text-white opacity-0 group-hover:opacity-100 text-sm">
              Select
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

