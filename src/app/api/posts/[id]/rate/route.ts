import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { rating } = body

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Check if rating already exists
    const { data: existingRating, error: checkError } = await supabase
      .from('blog_ratings')
      .select('id')
      .eq('post_id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (checkError) {
      throw new Error(`Failed to check existing rating: ${checkError.message}`)
    }

    if (existingRating) {
      // Update existing rating
      const { data: updatedRating, error: updateError } = await supabase
        .from('blog_ratings')
        .update({ rating, updated_at: new Date().toISOString() })
        .eq('id', existingRating.id)
        .select()
        .single()

      if (updateError) {
        throw new Error(`Failed to update rating: ${updateError.message}`)
      }
      return NextResponse.json({ rating: updatedRating })
    } else {
      // Create new rating
      const { data: newRating, error: insertError } = await supabase
        .from('blog_ratings')
        .insert({
          post_id: id,
          user_id: user.id,
          rating,
        })
        .select()
        .single()

      if (insertError) {
        throw new Error(`Failed to create rating: ${insertError.message}`)
      }
      return NextResponse.json({ rating: newRating }, { status: 201 })
    }
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
