import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics'
import { AuthButton } from '@/components/AuthButton'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Blog | A Little Better',
    template: '%s | A Little Better Blog'
  },
  description: 'Read articles, share insights, and join the conversation on continuous improvement.',
  metadataBase: new URL('https://blogs.a-little-better.com'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://blogs.a-little-better.com',
    title: 'Blog | A Little Better',
    description: 'Read articles, share insights, and join the conversation on continuous improvement.',
    siteName: 'A Little Better Blog',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <GoogleAnalytics />
      </head>
      <body className={inter.className}>
        <div className="min-h-screen bg-white flex flex-col">
          <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
            <nav className="container-custom py-4">
              <div className="flex items-center justify-between">
                <Link href="/" className="text-2xl font-bold text-primary-600">
                  A Little Better Blog
                </Link>
                <div className="flex items-center gap-6">
                  <Link href="/posts" className="text-gray-700 hover:text-primary-600 transition-colors">
                    Posts
                  </Link>
                  <Link href="/categories" className="text-gray-700 hover:text-primary-600 transition-colors">
                    Categories
                  </Link>
                  <Link href="/search" className="text-gray-700 hover:text-primary-600 transition-colors">
                    Search
                  </Link>
                  <Link href="/create" className="btn-primary">
                    Write Post
                  </Link>
                  <AuthButton />
                </div>
              </div>
            </nav>
          </header>
          <main className="flex-grow">
            {children}
          </main>
          <footer className="border-t border-gray-200 bg-gray-50 mt-auto">
            <div className="container-custom py-8">
              <div className="text-center text-gray-600">
                <p>&copy; {new Date().getFullYear()} A Little Better. All rights reserved.</p>
                <p className="mt-2">
                  <Link href="https://a-little-better.com" className="text-primary-600 hover:underline">
                    Visit Main Site
                  </Link>
                </p>
              </div>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
