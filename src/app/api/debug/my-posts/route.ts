import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    
    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({
        error: 'Not authenticated',
        userError: userError?.message
      }, { status: 401 })
    }
    
    // Fetch all posts (both published and unpublished) for this user
    const { data: posts, error: postsError } = await supabase
      .from('blog_posts')
      .select('id, title, slug, published, author_id, created_at')
      .eq('author_id', user.id)
      .order('created_at', { ascending: false })
    
    return NextResponse.json({
      user: { id: user.id, email: user.email },
      posts: posts || [],
      postsError: postsError ? {
        code: postsError.code,
        message: postsError.message,
        details: postsError.details,
        hint: postsError.hint
      } : null
    })
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

