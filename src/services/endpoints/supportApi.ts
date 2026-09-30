import { api } from '@/services/api'
import type { ID } from '@/types/common.types'
import type { Chat, ChatMessage, SupportTicket, SupportMessage } from '@/types/models'

export interface SendMessageRequest {
  chatId: ID
  text: string
  imageFile?: File | null
}

export interface PaginatedMessages {
  messages: ChatMessage[]
  page: number
  totalPage: number
  total: number
  hasMore: boolean
}

export interface GetMessagesParams {
  chatId: ID
  page?: number
  limit?: number
}

export const supportApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getChats: builder.query<Chat[], { searchTerm?: string } | void>({
      query: (arg) => {
        const searchTerm = arg?.searchTerm?.trim()
        return {
          url: '/chats',
          method: 'GET',
          params: searchTerm ? { searchTerm } : undefined,
        }
      },
      transformResponse: (response: any): Chat[] => {
        const chatsRaw = response?.data?.chats || response?.data || response || []
        const chatList = Array.isArray(chatsRaw) ? chatsRaw : []
        return chatList.map((c: any) => ({
          id: String(c._id || c.id || ''),
          _id: c._id || c.id,
          participants: Array.isArray(c.participants) ? c.participants : [],
          lastMessage: c.lastMessage || null,
          communicationType: c.communicationType,
          status: c.status || 'active',
          createdAt: c.createdAt,
          updatedAt: c.updatedAt,
          isRead: c.isRead,
          unreadCount: c.unreadCount ?? 0,
        }))
      },
      providesTags: ['SupportTicket'],
    }),

    getMessages: builder.query<PaginatedMessages, GetMessagesParams>({
      query: ({ chatId, page = 1, limit = 50 }) => ({
        url: `/messages/${chatId}`,
        method: 'GET',
        params: { page, limit },
      }),
      transformResponse: (response: any): PaginatedMessages => {
        const msgsRaw = response?.data?.messages || response?.data || response || []
        const msgList = Array.isArray(msgsRaw) ? msgsRaw : []
        const mapped = msgList.map((m: any) => ({
          id: String(m._id || m.id || ''),
          _id: m._id || m.id,
          chatId: String(m.chatId || ''),
          sender: m.sender || '',
          text: m.text || '',
          image: m.image || '',
          read: Boolean(m.read),
          type: m.type || 'text',
          createdAt: m.createdAt || new Date().toISOString(),
          updatedAt: m.updatedAt,
        }))
        const sorted = mapped.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        )

        const meta = response?.meta || {}
        const page = meta.page ?? 1
        const totalPage = meta.totalPage ?? 1
        const total = meta.total ?? sorted.length

        return {
          messages: sorted,
          page,
          totalPage,
          total,
          hasMore: page < totalPage,
        }
      },
      providesTags: (_r, _e, { chatId }) => [{ type: 'SupportThread', id: chatId }],
    }),

    sendMessage: builder.mutation<ChatMessage, SendMessageRequest>({
      query: ({ chatId, text, imageFile }) => {
        const formData = new FormData()
        formData.append('data', JSON.stringify({ text }))
        if (imageFile) {
          formData.append('image', imageFile)
        }
        return {
          url: `/messages/send-message/${chatId}`,
          method: 'POST',
          body: formData,
        }
      },
      transformResponse: (response: any): ChatMessage => {
        const raw = response?.data || response
        const senderPayload = raw.sender
        const sender =
          typeof senderPayload === 'string'
            ? { _id: senderPayload, name: 'Super Admin', role: 'super_admin' }
            : senderPayload || { _id: 'me', name: 'Super Admin', role: 'super_admin' }

        return {
          id: String(raw._id || raw.id || ''),
          _id: raw._id || raw.id,
          chatId: String(raw.chatId || ''),
          sender,
          text: raw.text || '',
          image: raw.image || '',
          read: Boolean(raw.read),
          type: raw.type || 'text',
          createdAt: raw.createdAt || new Date().toISOString(),
          updatedAt: raw.updatedAt,
        }
      },
      async onQueryStarted({ chatId, text, imageFile }, { dispatch, queryFulfilled }) {
        const tempId = `optimistic_${Date.now()}`
        const previewUrl = imageFile ? URL.createObjectURL(imageFile) : undefined
        const patch = dispatch(
          supportApi.util.updateQueryData('getMessages', { chatId, page: 1, limit: 20 }, (draft) => {
            draft.messages.push({
              id: tempId,
              _id: tempId,
              chatId: String(chatId),
              sender: {
                _id: 'me',
                name: 'Super Admin',
                role: 'super_admin',
              },
              text,
              image: previewUrl,
              createdAt: new Date().toISOString(),
            })
          }),
        )
        try {
          const { data: realMsg } = await queryFulfilled
          dispatch(
            supportApi.util.updateQueryData('getMessages', { chatId, page: 1, limit: 20 }, (draft) => {
              const idx = draft.messages.findIndex((m) => String(m.id || m._id) === tempId)
              if (idx !== -1) {
                draft.messages[idx] = realMsg
              }
            }),
          )
        } catch {
          patch.undo()
        }
      },
      invalidatesTags: ['SupportTicket'],
    }),

    // Compatibility wrappers for existing SupportTicket / SupportThread calls
    getSupportTickets: builder.query<{ items: SupportTicket[]; total: number; page: number; pageSize: number }, any>({
      query: () => ({ url: '/chats', method: 'GET' }),
      transformResponse: (response: any) => {
        const chatsRaw = response?.data?.chats || response?.data || response || []
        const chatList = Array.isArray(chatsRaw) ? chatsRaw : []
        const items = chatList.map((c: any) => {
          const participant = c.participants?.[0]
          return {
            id: String(c._id || c.id || ''),
            customerName: participant?.name || 'Customer',
            customerEmail: participant?.email || '',
            subject: c.communicationType ? `Communication: ${c.communicationType}` : 'Customer Inquiry',
            status: c.status === 'active' ? 'open' : 'resolved',
            lastMessage: c.lastMessage?.text || '',
            lastMessageAt: c.lastMessage?.createdAt || c.updatedAt || new Date().toISOString(),
            unread: c.unreadCount ?? 0,
            messageCount: 1,
            createdAt: c.createdAt || new Date().toISOString(),
          } as SupportTicket
        })
        const meta = response?.meta || {}
        return {
          items,
          total: meta.total ?? items.length,
          page: meta.page ?? 1,
          pageSize: meta.limit ?? 10,
        }
      },
      providesTags: ['SupportTicket'],
    }),

    getSupportThread: builder.query<SupportMessage[], ID>({
      query: (chatId) => ({ url: `/messages/${chatId}`, method: 'GET' }),
      transformResponse: (response: any): SupportMessage[] => {
        const msgsRaw = response?.data?.messages || response?.data || response || []
        const msgList = Array.isArray(msgsRaw) ? msgsRaw : []
        const mapped = msgList.map((m: any) => {
          const senderName = typeof m.sender === 'object' ? m.sender?.name : ''
          const isAgent = senderName.toLowerCase().includes('admin') || m.sender === 'agent'
          return {
            id: String(m._id || m.id || ''),
            ticketId: String(m.chatId || ''),
            sender: isAgent ? 'agent' : 'customer',
            body: m.text || '',
            sentAt: m.createdAt || new Date().toISOString(),
          } as SupportMessage
        })
        return mapped.sort(
          (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
        )
      },
      providesTags: (_r, _e, chatId) => [{ type: 'SupportThread', id: chatId }],
    }),

    sendSupportReply: builder.mutation<SupportMessage, { ticketId: ID; body: string }>({
      query: ({ ticketId, body }) => {
        const formData = new FormData()
        formData.append('data', JSON.stringify({ text: body }))
        return {
          url: `/messages/send-message/${ticketId}`,
          method: 'POST',
          body: formData,
        }
      },
      transformResponse: (response: any): SupportMessage => {
        const raw = response?.data || response
        return {
          id: String(raw._id || raw.id || ''),
          ticketId: String(raw.chatId || ''),
          sender: 'agent',
          body: raw.text || '',
          sentAt: raw.createdAt || new Date().toISOString(),
        }
      },
      invalidatesTags: ['SupportTicket'],
    }),

    setSupportTicketStatus: builder.mutation<any, { id: ID; status: string }>({
      query: ({ id, status }) => ({
        url: `/chats/${id}`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['SupportTicket'],
    }),

    markChatAsRead: builder.mutation<any, ID>({
      query: (id) => ({
        url: `/chats/mark-chat-as-read/${id}`,
        method: 'PATCH',
      }),
      invalidatesTags: ['SupportTicket'],
    }),

    markSupportTicketRead: builder.mutation<any, ID>({
      query: (id) => ({
        url: `/chats/mark-chat-as-read/${id}`,
        method: 'PATCH',
      }),
      invalidatesTags: ['SupportTicket'],
    }),
  }),
})

export const {
  useGetChatsQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
  useGetSupportTicketsQuery,
  useGetSupportThreadQuery,
  useSendSupportReplyMutation,
  useSetSupportTicketStatusMutation,
  useMarkChatAsReadMutation,
  useMarkSupportTicketReadMutation,
} = supportApi
