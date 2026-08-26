import { NavLink } from 'react-router-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Logo } from '@/components/shared/Logo'
import { useGetSupportTicketsQuery } from '@/services/endpoints/supportApi'
import { NAV_SECTIONS, type NavItem } from './navigation'

interface SidebarProps {
  /** Mobile drawer open state. */
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { data: tickets } = useGetSupportTicketsQuery({ pageSize: 100 })
  const unreadTickets = (tickets?.items ?? []).filter((t) => t.unread > 0).length

  const badgeFor = (item: NavItem) => {
    if (item.badgeKey === 'support') return unreadTickets > 0 ? unreadTickets : null
    return null
  }

  return (
    <>
      {/* Mobile backdrop */}
      {open && <div className="fixed inset-0 z-30 bg-ink-900/40 lg:hidden" onClick={onClose} />}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-ink-100 bg-white transition-transform lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Brand */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-ink-100 px-5">
          <Logo />
          <button onClick={onClose} className="rounded-lg p-1 text-ink-500 hover:bg-ink-100 lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="scrollbar-thin flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-300">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const badge = badgeFor(item)
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={onClose}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-700 hover:bg-ink-50',
                        )
                      }
                    >
                      <item.icon className="h-[18px] w-[18px] shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {badge !== null && (
                        <Badge tone="red" className="px-1.5 py-0">
                          {badge}
                        </Badge>
                      )}
                    </NavLink>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  )
}
