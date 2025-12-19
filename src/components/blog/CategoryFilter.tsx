import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function CategoryFilter({ currentCategory }: { currentCategory?: string }) {
  const supabase = await createServerSupabaseClient()
  
  const { data: categories } = await supabase
    .from('blog_categories')
    .select('*')
    .order('name', { ascending: true })

  if (!categories || categories.length === 0) {
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold mb-4">Categories</h3>
      <ul className="space-y-2">
        <li>
          <Link
            href="/posts"
            className={`block px-3 py-2 rounded-lg transition-colors ${
              !currentCategory
                ? 'bg-primary-100 text-primary-700 font-semibold'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            All Categories
          </Link>
        </li>
        {categories.map((category) => (
          <li key={category.id}>
            <Link
              href={`/categories/${category.slug}`}
              className={`block px-3 py-2 rounded-lg transition-colors ${
                currentCategory === category.slug
                  ? 'bg-primary-100 text-primary-700 font-semibold'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
