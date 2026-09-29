import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  Check,
  CheckCheck,
  Loader2,
  LogOut,
  Menu,
  Search,
  Trash2,
} from 'lucide-react'
import { formatDistanceToNow, parseISO } from 'date-fns'
import { Avatar } from '@/components/shared/Avatar'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'
import { toast } from '@/components/ui/Toast'
import {
  useGetNotificationsQuery,
  useReadAllNotificationsMutation,
  useMarkNotificationAsReadMutation,
  useDeleteNotificationMutation,
  useDeleteAllNotificationsMutation,
} from '@/services/endpoints/notificationApi'

function formatTimeAgo(isoString?: string) {
  if (!isoString) return ''
  try {
    const date = parseISO(isoString)
    return formatDistanceToNow(date, { addSuffix: true })
  } catch {
    return ''
  }
}

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  const { data: notifData, isLoading: notifLoading } = useGetNotificationsQuery(
    { limit: 20 },
    { pollingInterval: 30000 },
  )

  const [readAllNotifications, { isLoading: isReadingAll }] =
    useReadAllNotificationsMutation()
  const [markNotificationAsRead] = useMarkNotificationAsReadMutation()
  const [deleteNotification] = useDeleteNotificationMutation()
  const [deleteAllNotifications, { isLoading: isDeletingAll }] =
    useDeleteAllNotificationsMutation()

  const notifications = notifData?.notifications || []
  const unreadCount =
    notifData?.unreadCount ?? notifications.filter((n) => !n.read).length

  const handleLogout = () => {
    logout()
    navigate(ROUTES.login)
  }

  const handleReadAll = async () => {
    try {
      await readAllNotifications().unwrap()
      toast.success('All notifications marked as read')
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to mark notifications as read')
    }
  }

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    try {
      await markNotificationAsRead(id).unwrap()
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to mark notification as read')
    }
  }

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await deleteNotification(id).unwrap()
      toast.success('Notification deleted')
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete notification')
    }
  }

  const handleDeleteAll = async () => {
    if (!window.confirm('Are you sure you want to delete all notifications?')) return
    try {
      await deleteAllNotifications().unwrap()
      toast.success('All notifications deleted')
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete notifications')
    }
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
            className="relative rounded-lg p-2 text-ink-700 hover:bg-ink-100 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-80 sm:w-96 animate-fade-in rounded-lg border border-ink-100 bg-white shadow-dropdown overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-ink-100 px-4 py-2.5 bg-ink-50/50">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-ink-900">Notifications</p>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[11px] font-semibold text-brand-700">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleReadAll}
                        disabled={isReadingAll}
                        className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50 disabled:opacity-50 transition-colors"
                        title="Mark all as read"
                      >
                        {isReadingAll ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <CheckCheck className="h-3.5 w-3.5" />
                        )}
                        <span>Read all</span>
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={handleDeleteAll}
                        disabled={isDeletingAll}
                        className="inline-flex items-center gap-1 rounded p-1 text-xs font-medium text-ink-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 transition-colors"
                        title="Clear all notifications"
                      >
                        {isDeletingAll ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Body */}
                <div className="max-h-96 overflow-y-auto divide-y divide-ink-100">
                  {notifLoading && notifications.length === 0 ? (
                    <div className="flex items-center justify-center py-10">
                      <Loader2 className="h-6 w-6 animate-spin text-ink-400" />
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-10 text-center">
                      <p className="text-sm font-medium text-ink-700">You’re all caught up 🎉</p>
                      <p className="mt-1 text-xs text-ink-400">No notifications to display right now.</p>
                    </div>
                  ) : (
                    notifications.map((item) => {
                      const isUnread = !item.read
                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            if (isUnread) handleMarkAsRead(item.id)
                          }}
                          className={cn(
                            'group relative flex cursor-pointer items-start gap-3 p-3.5 transition-colors hover:bg-ink-50/80',
                            isUnread ? 'bg-brand-50/30' : 'bg-white',
                          )}
                        >
                          <div
                            className={cn(
                              'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                              isUnread ? 'bg-brand-100 text-brand-700' : 'bg-ink-100 text-ink-500',
                            )}
                          >
                            <Bell className="h-4 w-4" />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1">
                              <p
                                className={cn(
                                  'text-xs truncate',
                                  isUnread ? 'font-semibold text-ink-900' : 'font-medium text-ink-700',
                                )}
                              >
                                {item.title}
                              </p>
                              {isUnread && (
                                <span className="h-2 w-2 shrink-0 rounded-full bg-brand-600" />
                              )}
                            </div>
                            <p className="mt-0.5 text-xs text-ink-600 line-clamp-2">
                              {item.text}
                            </p>
                            <div className="mt-1.5 flex items-center justify-between">
                              <span className="text-[11px] text-ink-400">
                                {formatTimeAgo(item.createdAt)}
                              </span>

                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {isUnread && (
                                  <button
                                    onClick={(e) => handleMarkAsRead(item.id, e)}
                                    title="Mark as read"
                                    className="rounded p-1 text-ink-400 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => handleDelete(item.id, e)}
                                  title="Delete notification"
                                  className="rounded p-1 text-ink-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
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
