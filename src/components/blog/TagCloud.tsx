import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function TagCloud() {
  const supabase = await createServerSupabaseClient()
  
  const { data: tags } = await supabase
    .from('blog_tags')
    .select('*')
    .order('name', { ascending: true })
    .limit(50)

  if (!tags || tags.length === 0) {
    return null
  }

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h3 className="text-xl font-bold mb-4">Popular Tags</h3>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <Link
            key={tag.id}
            href={`/tags/${tag.slug}`}
            className="bg-white text-gray-700 px-3 py-1 rounded-full text-sm hover:bg-primary-50 hover:text-primary-600 transition-colors border border-gray-200"
          >
            #{tag.name}
          </Link>
        ))}
      </div>
    </div>
  )
}
