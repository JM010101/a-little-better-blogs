import { createServerSupabaseClient } from '@/lib/supabase'
import Link from 'next/link'
import { PostCard } from '@/components/blog/PostCard'

export default async function CategoriesPage() {
  const supabase = await createServerSupabaseClient()

  const { data: categories, error } = await supabase
    .from('blog_categories')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    return (
      <div className="container-custom py-12">
        <div className="text-red-600">
          Error loading categories: {error.message}
        </div>
      </div>
    )
  }

  return (
    <div className="container-custom py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Categories</h1>
        <p className="text-gray-600 text-lg">
          Browse posts by category
        </p>
      </div>

      {categories && categories.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category: any) => {
            // Get post count for each category
            return (
              <Link
                key={category.id}
                href={`/categories/${category.slug}`}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow border border-gray-200"
              >
                <h2 className="text-2xl font-bold mb-2 text-gray-900">
                  {category.name}
                </h2>
                {category.description && (
                  <p className="text-gray-600 mb-4">{category.description}</p>
                )}
                <div className="text-sm text-primary-600 font-medium">
                  View posts →
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No categories yet.</p>
        </div>
      )}
    </div>
  )
}

