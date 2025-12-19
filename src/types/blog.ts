export interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  author_id: string
  featured: boolean
  published: boolean
  published_at: string | null
  reading_time: number
  views: number
  created_at: string
  updated_at: string
  author?: BlogAuthor
  categories?: BlogCategory[]
  tags?: BlogTag[]
  comments?: BlogComment[]
  average_rating?: number
  rating_count?: number
  user_rating?: number
}

export interface BlogCategory {
  id: string
  name: string
  slug: string
  description: string | null
  created_at: string
}

export interface BlogTag {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface BlogComment {
  id: string
  post_id: string
  author_id: string | null
  author_name: string | null
  author_email: string | null
  content: string
  parent_id: string | null
  approved: boolean
  created_at: string
  updated_at: string
  author?: BlogAuthor
  replies?: BlogComment[]
}

export interface BlogRating {
  id: string
  post_id: string
  user_id: string
  rating: number
  created_at: string
  updated_at: string
}

export interface BlogAuthor {
  user_id: string
  bio: string | null
  avatar_url: string | null
  social_links: Record<string, string> | null
  email?: string
  name?: string
  post_count?: number
}

export interface PostFilters {
  category?: string
  tag?: string
  author?: string
  featured?: boolean
  search?: string
  page?: number
  limit?: number
}
