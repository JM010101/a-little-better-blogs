'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  Bold, 
  Italic, 
  Underline, 
  Heading1, 
  Heading2, 
  Heading3,
  List,
  ListOrdered,
  Link,
  Image as ImageIcon,
  Code,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Type
} from 'lucide-react'
import { ImageUpload } from './ImageUpload'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onImageUpload?: (url: string) => void
}

export function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = 'Start writing...',
  onImageUpload 
}: RichTextEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showFontPicker, setShowFontPicker] = useState(false)
  const [showFontFamilyPicker, setShowFontFamilyPicker] = useState(false)

  const insertText = (before: string, after: string = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = value.substring(start, end)
    const textBefore = value.substring(0, start)
    const textAfter = value.substring(end)

    let newText = ''
    if (selectedText) {
      newText = textBefore + before + selectedText + after + textAfter
    } else {
      newText = textBefore + before + after + textAfter
    }

    onChange(newText)
    
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + before.length + selectedText.length + after.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const textBefore = value.substring(0, start)
    const textAfter = value.substring(start)

    onChange(textBefore + text + textAfter)
    
    setTimeout(() => {
      textarea.focus()
      const newCursorPos = start + text.length
      textarea.setSelectionRange(newCursorPos, newCursorPos)
    }, 0)
  }

  const handleFormat = (format: string) => {
    switch (format) {
      case 'bold':
        insertText('**', '**')
        break
      case 'italic':
        insertText('*', '*')
        break
      case 'underline':
        insertText('<u>', '</u>')
        break
      case 'h1':
        insertText('# ', '')
        break
      case 'h2':
        insertText('## ', '')
        break
      case 'h3':
        insertText('### ', '')
        break
      case 'ul':
        insertText('- ', '')
        break
      case 'ol':
        insertText('1. ', '')
        break
      case 'code':
        insertText('`', '`')
        break
      case 'codeblock':
        insertText('```\n', '\n```')
        break
      case 'quote':
        insertText('> ', '')
        break
      case 'align-left':
        insertText('<div style="text-align: left">', '</div>')
        break
      case 'align-center':
        insertText('<div style="text-align: center">', '</div>')
        break
      case 'align-right':
        insertText('<div style="text-align: right">', '</div>')
        break
      case 'link':
        const textarea = textareaRef.current
        if (!textarea) return
        
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const selectedText = value.substring(start, end)
        const linkText = selectedText || 'Link Text'
        const url = prompt('Enter URL:', 'https://')
        if (url) {
          const textBefore = value.substring(0, start)
          const textAfter = value.substring(end)
          const linkMarkdown = `[${linkText}](${url})`
          onChange(textBefore + linkMarkdown + textAfter)
          setTimeout(() => {
            textarea.focus()
            const newPos = start + linkMarkdown.length
            textarea.setSelectionRange(newPos, newPos)
          }, 0)
        }
        break
    }
  }

  const handleImageInsert = (url: string) => {
    insertAtCursor(`![Image](${url})\n`)
    setShowImageUpload(false)
    if (onImageUpload) {
      onImageUpload(url)
    }
  }

  const handleColorChange = (color: string) => {
    insertText(`<span style="color: ${color}">`, '</span>')
    setShowColorPicker(false)
  }

  const handleFontSize = (size: string) => {
    insertText(`<span style="font-size: ${size}">`, '</span>')
    setShowFontPicker(false)
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showColorPicker || showFontPicker || showFontFamilyPicker) {
        const target = event.target as HTMLElement
        if (!target.closest('.relative')) {
          setShowColorPicker(false)
          setShowFontPicker(false)
          setShowFontFamilyPicker(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showColorPicker, showFontPicker, showFontFamilyPicker])

  const colors = [
    { name: 'Black', value: '#000000' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#10b981' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Gray', value: '#6b7280' },
  ]

  const fontSizes = [
    { name: 'Small', value: '0.875rem' },
    { name: 'Normal', value: '1rem' },
    { name: 'Large', value: '1.25rem' },
    { name: 'XL', value: '1.5rem' },
    { name: '2XL', value: '2rem' },
  ]

  const fontFamilies = [
    { name: 'Default', value: 'inherit' },
    { name: 'Arial', value: 'Arial, sans-serif' },
    { name: 'Georgia', value: 'Georgia, serif' },
    { name: 'Times New Roman', value: '"Times New Roman", serif' },
    { name: 'Courier New', value: '"Courier New", monospace' },
    { name: 'Verdana', value: 'Verdana, sans-serif' },
    { name: 'Helvetica', value: 'Helvetica, sans-serif' },
  ]

  const handleFontFamily = (family: string) => {
    insertText(`<span style="font-family: ${family}">`, '</span>')
    setShowFontFamilyPicker(false)
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex flex-wrap items-center gap-1">
        {/* Text Formatting */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
          <button
            type="button"
            onClick={() => handleFormat('bold')}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleFormat('italic')}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleFormat('underline')}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="Underline"
          >
            <Underline className="w-4 h-4" />
          </button>
        </div>

        {/* Headings */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
          <button
            type="button"
            onClick={() => handleFormat('h1')}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="Heading 1"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleFormat('h2')}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="Heading 2"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleFormat('h3')}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="Heading 3"
          >
            <Heading3 className="w-4 h-4" />
          </button>
        </div>

        {/* Lists */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
          <button
            type="button"
            onClick={() => handleFormat('ul')}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleFormat('ol')}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="Numbered List"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
        </div>

        {/* Other */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
          <button
            type="button"
            onClick={() => handleFormat('quote')}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="Quote"
          >
            <Quote className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleFormat('code')}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="Inline Code"
          >
            <Code className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleFormat('codeblock')}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="Code Block"
          >
            <Code className="w-4 h-4" />
          </button>
        </div>

        {/* Alignment */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
          <button
            type="button"
            onClick={() => handleFormat('align-left')}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleFormat('align-center')}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleFormat('align-right')}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </button>
        </div>

        {/* Links & Images */}
        <div className="flex items-center gap-1 border-r border-gray-300 pr-2 mr-2">
          <button
            type="button"
            onClick={() => handleFormat('link')}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="Insert Link"
          >
            <Link className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowImageUpload(!showImageUpload)}
            className={`p-2 hover:bg-gray-200 rounded transition-colors ${showImageUpload ? 'bg-gray-300' : ''}`}
            title="Insert Image"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Font Size */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowFontPicker(!showFontPicker)
              setShowFontFamilyPicker(false)
            }}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="Font Size"
          >
            <Type className="w-4 h-4" />
          </button>
          {showFontPicker && (
            <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 min-w-[120px]">
              {fontSizes.map((size) => (
                <button
                  key={size.value}
                  type="button"
                  onClick={() => handleFontSize(size.value)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                >
                  {size.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Font Family */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setShowFontFamilyPicker(!showFontFamilyPicker)
              setShowFontPicker(false)
            }}
            className="p-2 hover:bg-gray-200 rounded transition-colors text-xs font-semibold"
            title="Font Family"
          >
            Aa
          </button>
          {showFontFamilyPicker && (
            <div className="absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 min-w-[180px]">
              {fontFamilies.map((font) => (
                <button
                  key={font.value}
                  type="button"
                  onClick={() => handleFontFamily(font.value)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                  style={{ fontFamily: font.value }}
                >
                  {font.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Text Color */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="p-2 hover:bg-gray-200 rounded transition-colors"
            title="Text Color"
          >
            <Palette className="w-4 h-4" />
          </button>
          {showColorPicker && (
            <div className="absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 p-2">
              <div className="grid grid-cols-4 gap-2">
                {colors.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => handleColorChange(color.value)}
                    className="w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-500 transition-colors"
                    style={{ backgroundColor: color.value }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Upload */}
      {showImageUpload && (
        <div className="p-4 border-b border-gray-300 bg-gray-50">
          <ImageUpload
            onUploadComplete={handleImageInsert}
            onRemove={() => setShowImageUpload(false)}
          />
        </div>
      )}

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={20}
        className="w-full px-4 py-3 border-0 focus:outline-none focus:ring-0 font-mono text-sm resize-y min-h-[400px]"
        required
      />

      {/* Help Text */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-300">
        <p className="text-xs text-gray-500">
          Supports Markdown syntax. Use toolbar buttons or type Markdown directly.
        </p>
      </div>
    </div>
  )
}

