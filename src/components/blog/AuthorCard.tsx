import Link from 'next/link'
import { BlogAuthor } from '@/types/blog'

interface AuthorCardProps {
  author: BlogAuthor
}

export function AuthorCard({ author }: AuthorCardProps) {
  return (
    <Link href={`/authors/${author.user_id}`} className="block">
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-4">
          {author.avatar_url && (
            <img
              src={author.avatar_url}
              alt={author.name || 'Author'}
              className="w-16 h-16 rounded-full"
            />
          )}
          <div>
            <h3 className="font-bold text-lg">{author.name || 'Anonymous'}</h3>
            {author.bio && (
              <p className="text-gray-600 text-sm line-clamp-2">{author.bio}</p>
            )}
            {author.post_count !== undefined && (
              <p className="text-gray-500 text-xs mt-1">
                {author.post_count} {author.post_count === 1 ? 'post' : 'posts'}
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
