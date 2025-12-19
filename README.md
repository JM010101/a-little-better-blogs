# A Little Better Blog

Blog subdomain application for A Little Better platform, deployed at `blogs.a-little-better.com`.

## Features

- **Post Management**: Create, edit, and publish blog posts with Markdown support
- **Comments**: Nested comment system with moderation support
- **Ratings**: 5-star rating system for posts
- **Categories & Tags**: Organize posts with categories and tags
- **Search**: Full-text search across posts
- **Author Profiles**: Author pages with bio and social links
- **Related Posts**: Algorithm-based related post suggestions
- **SEO**: Sitemap, robots.txt, structured data, and RSS feed
- **Analytics**: Google Analytics integration

## Setup

1. **Install dependencies:**
   ```bash
   cd blog
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Update `.env.local` with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_GA_ID=your_google_analytics_id (optional)
   ```

3. **Set up database:**
   
   Run the SQL script from `scripts/setup-database.js` in your Supabase SQL Editor, then:
   ```bash
   npm run setup
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

   The blog will be available at `http://localhost:3000`

## Database Schema

The blog uses the following Supabase tables:
- `blog_posts` - Blog posts
- `blog_categories` - Post categories
- `blog_tags` - Post tags
- `blog_post_categories` - Many-to-many relationship between posts and categories
- `blog_post_tags` - Many-to-many relationship between posts and tags
- `blog_comments` - Post comments with nested replies
- `blog_ratings` - Post ratings (1-5 stars)
- `blog_authors` - Author profiles

All tables have Row Level Security (RLS) policies enabled.

## Deployment

This app is configured to deploy to `blogs.a-little-better.com` on Vercel.

1. Create a new Vercel project for the blog
2. Set the root directory to `blog/`
3. Configure environment variables in Vercel dashboard
4. Set up the subdomain `blogs.a-little-better.com` in Vercel project settings

## Project Structure

```
blog/
├── src/
│   ├── app/              # Next.js app router pages
│   │   ├── api/         # API routes
│   │   ├── posts/       # Post pages
│   │   ├── categories/  # Category pages
│   │   ├── tags/        # Tag pages
│   │   └── authors/     # Author pages
│   ├── components/      # React components
│   │   ├── blog/        # Blog-specific components
│   │   ├── ui/          # UI components
│   │   └── analytics/   # Analytics components
│   ├── lib/             # Utility functions
│   └── types/           # TypeScript types
├── scripts/             # Setup scripts
└── public/              # Static assets
```

## API Routes

- `GET /api/posts` - List posts with filters
- `POST /api/posts` - Create a new post
- `GET /api/posts/[id]` - Get a single post
- `PUT /api/posts/[id]` - Update a post
- `DELETE /api/posts/[id]` - Delete a post
- `GET /api/posts/[id]/comments` - Get post comments
- `POST /api/posts/[id]/comments` - Create a comment
- `POST /api/posts/[id]/rate` - Rate a post
- `GET /api/categories` - List categories
- `GET /api/tags` - List tags
- `GET /api/search` - Search posts

## Authentication

The blog uses Supabase Auth. Users must be authenticated to:
- Create posts
- Edit their own posts
- Rate posts
- Post comments (anonymous comments are also supported)

## License

Private - A Little Better
