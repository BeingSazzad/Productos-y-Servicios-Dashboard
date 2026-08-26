import { useEffect } from 'react'
import { getSocket } from '@/services/socket'
import { useAppDispatch } from '@/store/hooks'
import { supportApi } from '@/services/endpoints/supportApi'
import { useAuth } from '@/hooks/useAuth'
import { useGetProfileQuery } from '@/services/endpoints/authApi'

export function useSocketEvents(activeChatId?: string | null) {
  const { user } = useAuth()
  const { data: profile } = useGetProfileQuery()
  const dispatch = useAppDispatch()

  const userId = (profile as any)?._id || profile?.id || user?.id || (user as any)?._id

  useEffect(() => {
    const socket = getSocket()

    const handleNewChat = (_data: any) => {
      dispatch(supportApi.util.invalidateTags(['SupportTicket']))
    }

    const handleChatDeleted = (_data: any) => {
      dispatch(supportApi.util.invalidateTags(['SupportTicket']))
    }

    const handleNewMessage = (data: any) => {
      const msg = data?.message || data?.data || data
      if (!msg) return
      const chatId = String(msg?.chatId || msg?.chat || '')

      if (chatId) {
        dispatch(
          supportApi.util.updateQueryData('getMessages', { chatId, page: 1, limit: 20 }, (draft) => {
            const exists = draft.messages.some((m) => String(m.id || m._id) === String(msg._id || msg.id))
            if (!exists) {
              draft.messages.push({
                id: String(msg._id || msg.id || ''),
                _id: msg._id || msg.id,
                chatId,
                sender: msg.sender || '',
                text: msg.text || '',
                image: msg.image || '',
                read: Boolean(msg.read),
                type: msg.type || 'text',
                createdAt: msg.createdAt || new Date().toISOString(),
                updatedAt: msg.updatedAt,
              })
              draft.messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
            }
          }),
        )
      }

      dispatch(supportApi.util.invalidateTags(['SupportTicket', 'SupportThread']))
    }

    const handleUnreadCountUpdate = (_data: any) => {
      dispatch(supportApi.util.invalidateTags(['SupportTicket']))
    }

    const handleChatListUpdate = (_data: any) => {
      dispatch(supportApi.util.invalidateTags(['SupportTicket']))
    }

    const handleSyncOnConnect = () => {
      dispatch(supportApi.util.invalidateTags(['SupportTicket', 'SupportThread']))
    }

    const eventsToListen = [
      'newMessage',
      'message',
      'newChat',
      'chatDeletedForUser',
      'unreadCountUpdate',
      'chatListUpdate',
    ]

    if (userId) {
      eventsToListen.push(
        `newChat::${userId}`,
        `chatDeletedForUser::${userId}`,
        `newMessage::${userId}`,
        `unreadCountUpdate::${userId}`,
        `chatListUpdate::${userId}`,
      )
    }

    // Bind real-time event listeners
    eventsToListen.forEach((evt) => {
      if (evt.includes('newMessage') || evt === 'message') {
        socket.on(evt, handleNewMessage)
      } else if (evt.includes('newChat')) {
        socket.on(evt, handleNewChat)
      } else if (evt.includes('chatDeleted')) {
        socket.on(evt, handleChatDeleted)
      } else if (evt.includes('unreadCount')) {
        socket.on(evt, handleUnreadCountUpdate)
      } else if (evt.includes('chatList')) {
        socket.on(evt, handleChatListUpdate)
      }
    })

    // Reconnection & connection sync handlers
    socket.on('connect', handleSyncOnConnect)
    socket.on('reconnect', handleSyncOnConnect)

    // Continuous 15-second background polling heartbeat fallback
    const pollInterval = setInterval(() => {
      dispatch(supportApi.util.invalidateTags(['SupportTicket']))
    }, 15000)

    return () => {
      eventsToListen.forEach((evt) => {
        socket.off(evt)
      })
      socket.off('connect', handleSyncOnConnect)
      socket.off('reconnect', handleSyncOnConnect)
      clearInterval(pollInterval)
    }
  }, [userId, activeChatId, dispatch])
}
