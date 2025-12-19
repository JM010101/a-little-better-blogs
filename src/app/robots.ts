import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/create', '/posts/*/edit'],
    },
    sitemap: 'https://blogs.a-little-better.com/sitemap.xml',
  }
}
