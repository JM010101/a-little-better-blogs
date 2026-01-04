import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { PostEditor } from '@/components/blog/PostEditor'

export default async function EditPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const supabase = await createServerSupabaseClient()
  
  // Get user from session (more reliable for SSR)
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user

  if (!user) {
    redirect('/login')
  }

  const { slug } = await params

  const { data: post } = await supabase
    .from('blog_posts')
    .select(`
      *,
      categories:blog_post_categories(blog_categories(*)),
      tags:blog_post_tags(blog_tags(*))
    `)
    .eq('slug', slug)
    .single()

  if (!post || post.author_id !== user.id) {
    notFound()
  }

  return (
    <div className="container-custom py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Edit Post</h1>
        <PostEditor post={post} />
      </div>
    </div>
  )
}
