import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import Image from 'next/image'
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics'
import { AuthButton } from '@/components/AuthButton'
import { HeaderSearch } from '@/components/blog/HeaderSearch'
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
                <Link href="/" className="hover:opacity-80 transition-opacity">
                  <Image
                    src="/src/blog-logo.png"
                    alt="A Little Better Blog"
                    width={120}
                    height={60}
                    className="object-contain h-auto"
                    priority
                  />
                </Link>
                <div className="flex items-center gap-4">
                  <HeaderSearch />
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
