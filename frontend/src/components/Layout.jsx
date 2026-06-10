import { Link, Outlet, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, FileText, ClipboardList } from 'lucide-react'

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/people', icon: Users, label: 'People' },
  { to: '/report', icon: FileText, label: 'Reports' },
]

export default function Layout() {
  const loc = useLocation()
  return (
    <div className="flex h-screen">
      <aside className="w-56 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="h-14 flex items-center px-5 border-b border-gray-100">
          <h1 className="text-sm font-semibold tracking-tight text-gray-700">1:1 Facilitator</h1>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {nav.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors
                ${loc.pathname === to || (to !== '/' && loc.pathname.startsWith(to))
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
