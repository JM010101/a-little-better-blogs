import { BlogPost } from '@/types/blog'

interface StructuredDataProps {
  post: BlogPost
}

export function StructuredData({ post }: StructuredDataProps) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || post.content.substring(0, 200),
    image: post.featured_image || undefined,
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at,
    author: {
      '@type': 'Person',
      name: post.author?.name || 'Anonymous',
      url: post.author?.user_id ? `https://blogs.a-little-better.com/authors/${post.author.user_id}` : undefined,
    },
    publisher: {
      '@type': 'Organization',
      name: 'A Little Better',
      url: 'https://a-little-better.com',
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `https://blogs.a-little-better.com/posts/${post.slug}`,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}
