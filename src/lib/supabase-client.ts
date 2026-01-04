import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Client-side Supabase client for use in client components
// Uses createBrowserClient to properly handle cookies for SSR
export const supabaseClient = createBrowserClient(supabaseUrl, supabaseKey)

