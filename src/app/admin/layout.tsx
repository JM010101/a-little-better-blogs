import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createServerSupabaseClient } from '@/lib/supabase'
import { 
  LayoutDashboard, 
  FileText, 
  MessageSquare, 
  Users, 
  BarChart3,
  Settings,
  LogOut
} from 'lucide-react'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Check if user is admin (you can enhance this with role checking)
  // For now, we'll allow any authenticated user to access admin
  // In production, add proper role-based access control

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-screen sticky top-0">
          <div className="p-6">
            <Link href="/admin" className="text-2xl font-bold text-primary-600">
              Admin Panel
            </Link>
          </div>
          
          <nav className="px-4 space-y-2">
            <NavLink href="/admin" icon={<LayoutDashboard className="w-5 h-5" />}>
              Dashboard
            </NavLink>
            <NavLink href="/admin/posts" icon={<FileText className="w-5 h-5" />}>
              Posts
            </NavLink>
            <NavLink href="/admin/comments" icon={<MessageSquare className="w-5 h-5" />}>
              Comments
            </NavLink>
            <NavLink href="/admin/users" icon={<Users className="w-5 h-5" />}>
              Users
            </NavLink>
            <NavLink href="/admin/analytics" icon={<BarChart3 className="w-5 h-5" />}>
              Analytics
            </NavLink>
            <NavLink href="/admin/settings" icon={<Settings className="w-5 h-5" />}>
              Settings
            </NavLink>
          </nav>

          <div className="absolute bottom-0 w-full p-4 border-t border-gray-200">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Back to Site</span>
            </Link>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

function NavLink({ 
  href, 
  icon, 
  children 
}: { 
  href: string
  icon: React.ReactNode
  children: React.ReactNode 
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
    >
      {icon}
      <span>{children}</span>
    </Link>
  )
}

