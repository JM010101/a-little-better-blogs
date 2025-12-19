import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  
  const { data: posts } = await supabase
    .from('blog_posts')
    .select(`
      *,
      author:blog_authors(*)
    `)
    .eq('published', true)
    .order('published_at', { ascending: false })
    .limit(20)

  const baseUrl = 'https://blogs.a-little-better.com'
  const siteTitle = 'A Little Better Blog'
  const siteDescription = 'Read articles, share insights, and join the conversation on continuous improvement.'

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${siteTitle}</title>
    <link>${baseUrl}</link>
    <description>${siteDescription}</description>
    <language>en-US</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    ${posts?.map((post) => {
      const postUrl = `${baseUrl}/posts/${post.slug}`
      const pubDate = new Date(post.published_at || post.created_at).toUTCString()
      const description = post.excerpt || post.content.substring(0, 200) + '...'
      
      return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${postUrl}</link>
      <guid>${postUrl}</guid>
      <description><![CDATA[${description}]]></description>
      <pubDate>${pubDate}</pubDate>
      <author>${post.author?.email || 'noreply@a-little-better.com'} (${post.author?.name || 'Anonymous'})</author>
    </item>`
    }).join('') || ''}
  </channel>
</rss>`

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/xml',
    },
  })
}
