import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, LogOut, Menu, Search } from 'lucide-react'
import { Avatar } from '@/components/shared/Avatar'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/constants/routes'

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate(ROUTES.login)
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-ink-100 bg-white/80 px-4 backdrop-blur lg:px-6">
      <button onClick={onMenuClick} className="rounded-lg p-2 text-ink-700 hover:bg-ink-100 lg:hidden">
        <Menu className="h-5 w-5" />
      </button>

      {/* Search */}
      <div className="relative hidden max-w-md flex-1 sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300" />
        <input
          placeholder="Search anything…"
          className="h-10 w-full rounded-lg border border-ink-200 bg-ink-50 pl-9 pr-3 text-sm placeholder:text-ink-300 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30"
        />
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen((o) => !o)}
            className="relative rounded-lg p-2 text-ink-700 hover:bg-ink-100"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
          </button>
          {notifOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-80 animate-fade-in rounded-lg border border-ink-100 bg-white shadow-dropdown">
                <div className="flex items-center justify-between border-b border-ink-100 px-4 py-2.5">
                  <p className="text-sm font-semibold text-ink-900">Notifications</p>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  <p className="px-4 py-8 text-center text-sm text-ink-500">You’re all caught up 🎉</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Profile menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-ink-100"
          >
            <Avatar name={user?.name ?? 'Admin'} src={user?.avatarUrl} size="sm" />
            <span className="hidden text-sm font-medium text-ink-900 sm:block">{user?.name}</span>
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-56 animate-fade-in rounded-lg border border-ink-100 bg-white p-1 shadow-dropdown">
                <div className="border-b border-ink-100 px-3 py-2">
                  <p className="text-sm font-medium text-ink-900">{user?.name}</p>
                  <p className="text-xs text-ink-500">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setMenuOpen(false)
                    navigate(ROUTES.settings)
                  }}
                  className="mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-ink-700 hover:bg-ink-100"
                >
                  Account settings
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
