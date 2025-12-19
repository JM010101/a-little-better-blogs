import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase'
import { PostEditor } from '@/components/blog/PostEditor'

export default async function CreatePostPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="container-custom py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Create New Post</h1>
        <PostEditor />
      </div>
    </div>
  )
}
