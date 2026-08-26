import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useSocketEvents } from '@/hooks/useSocketEvents'

/** App shell: persistent sidebar + topbar with a routed content outlet and global real-time socket events. */
export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Mount socket listeners globally across all dashboard pages
  useSocketEvents()

  return (
    <div className="min-h-screen bg-ink-50">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:pl-72">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="mx-auto p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
