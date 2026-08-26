import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ArrowLeft, Image as ImageIcon, LifeBuoy, Send, X } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { LoadingState } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Avatar } from '@/components/shared/Avatar'
import { SearchInput } from '@/components/shared/SearchInput'
import { useDebounce } from '@/hooks/useDebounce'
import { useAuth } from '@/hooks/useAuth'
import { useSocketEvents } from '@/hooks/useSocketEvents'
import { imageUrl } from '@/components/shared/getImageUrl'
import {
  useGetChatsQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
  useMarkChatAsReadMutation,
} from '@/services/endpoints/supportApi'
import { formatRelative, formatMessageTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Chat, ChatParticipant, ChatMessage } from '@/types/models'

export default function SupportPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeId = searchParams.get('chatId') || null
  const [search, setSearch] = useState('')
  const [markChatAsRead] = useMarkChatAsReadMutation()

  useSocketEvents(activeId)

  const debouncedSearch = useDebounce(search)
  const { data: chatsList, isLoading } = useGetChatsQuery()
  const chats = chatsList ?? []

  const filteredChats = chats.filter((c) => {
    if (!debouncedSearch.trim()) return true
    const term = debouncedSearch.toLowerCase()
    const pName = c.participants?.some((p) => p.name?.toLowerCase().includes(term))
    const lastMsg = c.lastMessage?.text?.toLowerCase().includes(term)
    return pName || lastMsg
  })

  const activeChat = chats.find((c) => c.id === activeId || c._id === activeId) ?? null

  const handleSelectChat = (id: string) => {
    setSearchParams({ chatId: id }, { replace: true })
    markChatAsRead(id)
  }

  const handleBack = () => {
    setSearchParams({}, { replace: true })
  }

  return (
    <div>
      <PageHeader
        title="Customer Support & Chat"
        description="Live messaging and conversations with marketplace users, buyers, and sellers."
      />

      <div className="flex h-[calc(100vh-13rem)] overflow-hidden rounded-xl border border-ink-100 bg-white shadow-card">
        {/* Inbox List */}
        <div
          className={cn(
            'w-full flex-col border-r border-ink-100 lg:flex lg:w-80 xl:w-96',
            activeChat ? 'hidden lg:flex' : 'flex',
          )}
        >
          <div className="border-b border-ink-100 p-4">
            <SearchInput value={search} onChange={setSearch} placeholder="Search chats…" />
          </div>

          <div className="scrollbar-thin flex-1 overflow-y-auto">
            {isLoading ? (
              <LoadingState />
            ) : filteredChats.length === 0 ? (
              <EmptyState icon={LifeBuoy} title="No conversations" description="You're all caught up." />
            ) : (
              filteredChats.map((c) => {
                const targetId = c.id || c._id
                return (
                  <ChatRow
                    key={targetId}
                    chat={c}
                    active={targetId === activeId}
                    onClick={() => handleSelectChat(targetId)}
                  />
                )
              })
            )}
          </div>
        </div>

        {/* Conversation View */}
        <div className={cn('flex-1 flex-col', activeChat ? 'flex' : 'hidden lg:flex')}>
          {activeChat ? (
            <Conversation chat={activeChat} onBack={handleBack} />
          ) : (
            <div className="flex flex-1 items-center justify-center p-8">
              <EmptyState
                icon={LifeBuoy}
                title="Select a conversation"
                description="Choose a chat from the inbox to read and reply."
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ChatRow({ chat, active, onClick }: { chat: Chat; active: boolean; onClick: () => void }) {
  const counterparty =
    chat.participants?.find((p) => p.role !== 'super_admin' && p.role !== 'admin') ||
    chat.participants?.[0]

  const name = counterparty?.name || 'Customer'
  const lastMsgText = chat.lastMessage?.text || 'No messages yet'
  const time = chat.lastMessage?.createdAt || chat.updatedAt || chat.createdAt

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-3 border-b border-ink-50 p-4 text-left transition-colors hover:bg-ink-50',
        active && 'bg-brand-50/60',
      )}
    >
      <Avatar name={name} src={counterparty?.profileImage} size="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-medium text-ink-900">{name}</p>
          {time && <span className="shrink-0 text-xs text-ink-400">{formatRelative(time)}</span>}
        </div>
        <p className="truncate text-xs text-ink-500">{lastMsgText}</p>
        <div className="mt-1.5 flex items-center justify-between gap-2">
          {chat.communicationType && (
            <span className="inline-block rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-medium text-ink-700 capitalize">
              {chat.communicationType}
            </span>
          )}
          {Boolean(chat.unreadCount && chat.unreadCount > 0) && (
            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1.5 text-xs font-semibold text-white">
              {chat.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

function Conversation({ chat, onBack }: { chat: Chat; onBack: () => void }) {
  const { user } = useAuth()
  const chatId = chat.id || chat._id

  const [page, setPage] = useState(1)
  const [accumulatedMessages, setAccumulatedMessages] = useState<ChatMessage[]>([])

  const { data: pageData, isFetching } = useGetMessagesQuery({ chatId, page, limit: 20 })
  const [sendMessageApi, { isLoading: sending }] = useSendMessageMutation()
  const [markChatAsRead] = useMarkChatAsReadMutation()

  const [text, setText] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const oldScrollHeightRef = useRef<number>(0)
  const isInitialScrollRef = useRef<boolean>(true)

  const counterparty =
    chat.participants?.find((p) => p.role !== 'super_admin' && p.role !== 'admin') ||
    chat.participants?.[0]

  const customerName = counterparty?.name || 'Customer'
  const customerEmail = counterparty?.email || ''

  // Reset pagination state when active chat changes
  useEffect(() => {
    setPage(1)
    setAccumulatedMessages([])
    isInitialScrollRef.current = true
  }, [chatId])

  // Accumulate older/newer messages from paginated query responses
  useEffect(() => {
    if (pageData?.messages) {
      setAccumulatedMessages((prev) => {
        if (page === 1) {
          return pageData.messages
        }
        const map = new Map<string, ChatMessage>()
        pageData.messages.forEach((m) => map.set(String(m.id || m._id), m))
        prev.forEach((m) => {
          const id = String(m.id || m._id)
          if (!id.startsWith('optimistic_')) {
            map.set(id, m)
          }
        })

        const merged = Array.from(map.values())
        return merged.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        )
      })
    }
  }, [pageData, page])

  // Auto-scroll on initial load, preserve scroll position on older page load, and scroll down on new real-time message
  useEffect(() => {
    const container = scrollRef.current
    if (!container || accumulatedMessages.length === 0) return

    if (isInitialScrollRef.current) {
      container.scrollTo({ top: container.scrollHeight })
      isInitialScrollRef.current = false
    } else if (oldScrollHeightRef.current > 0) {
      const newScrollHeight = container.scrollHeight
      const diff = newScrollHeight - oldScrollHeightRef.current
      container.scrollTop = diff
      oldScrollHeightRef.current = 0
    } else {
      // New real-time message arrived or message sent
      const isNearBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight < 300

      if (isNearBottom) {
        container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' })
      }
    }
  }, [accumulatedMessages])

  // Mark chat as read via PATCH /chats/mark-chat-as-read/:id
  useEffect(() => {
    if (chatId) {
      markChatAsRead(chatId)
    }
  }, [chatId, markChatAsRead])

  // Handle scroll-up to load older page messages
  const handleScroll = () => {
    const container = scrollRef.current
    if (!container || isFetching || !pageData?.hasMore) return

    if (container.scrollTop <= 40) {
      oldScrollHeightRef.current = container.scrollHeight
      setPage((prev) => prev + 1)
    }
  }

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setSelectedFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  const removeFile = () => {
    setSelectedFile(null)
    setImagePreview(null)
  }

  const submit = async (e?: FormEvent) => {
    e?.preventDefault()
    const trimmed = text.trim()
    if (!trimmed && !selectedFile) return

    const currentText = trimmed
    const currentFile = selectedFile

    setText('')
    setSelectedFile(null)
    setImagePreview(null)

    await sendMessageApi({
      chatId,
      text: currentText,
      imageFile: currentFile,
    })

    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
      }
    }, 100)
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void submit()
    }
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-ink-100 p-4">
        <button onClick={onBack} className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 lg:hidden">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <Avatar name={customerName} src={counterparty?.profileImage} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-ink-900">{customerName}</p>
          {customerEmail && <p className="truncate text-xs text-ink-500">{customerEmail}</p>}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="scrollbar-thin flex-1 space-y-4 overflow-y-auto bg-ink-50/40 p-4"
      >
        {isFetching && page > 1 && (
          <div className="flex justify-center py-2">
            <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-ink-500 shadow-xs border border-ink-100 animate-pulse">
              Loading older messages…
            </span>
          </div>
        )}

        {isFetching && accumulatedMessages.length === 0 ? (
          <LoadingState />
        ) : (
          accumulatedMessages.map((m: ChatMessage) => {
            const senderObj = typeof m.sender === 'object' ? (m.sender as ChatParticipant) : null
            const senderId = senderObj ? String(senderObj._id || '') : String(m.sender || '')
            const senderRole = senderObj?.role || senderObj?.activeRole || ''
            const senderNameStr = senderObj?.name || ''

            const isAgent =
              senderId === 'me' ||
              m.sender === 'me' ||
              m.sender === 'agent' ||
              (user?.id && senderId === String(user.id)) ||
              (user?.email && senderObj?.email === user.email) ||
              senderRole === 'super_admin' ||
              senderRole === 'admin' ||
              senderNameStr.toLowerCase().includes('admin')

            const imgPath = m.image ? imageUrl(m.image) : ''
            const timeStr = formatMessageTime(m.createdAt)

            return (
              <div key={m.id || m._id} className={cn('flex items-end gap-2', isAgent ? 'justify-end' : 'justify-start')}>
                {!isAgent && (
                  <Avatar
                    name={customerName}
                    src={counterparty?.profileImage}
                    size="sm"
                    className="h-7 w-7 text-[10px] shrink-0 mb-0.5"
                  />
                )}

                <div className={cn('max-w-[75%]', isAgent ? 'text-right' : 'text-left')}>
                  <div
                    className={cn(
                      'inline-block rounded-2xl px-4 py-2.5 text-sm shadow-xs',
                      isAgent
                        ? 'bg-brand-600 text-white rounded-br-xs'
                        : 'bg-white text-ink-900 ring-1 ring-ink-100 rounded-bl-xs',
                    )}
                  >
                    {m.text && <p className="whitespace-pre-wrap leading-relaxed">{m.text}</p>}
                    {imgPath && (
                      <img
                        src={imgPath}
                        alt="Attachment"
                        className="mt-2 max-h-60 max-w-xs rounded-lg object-cover border border-black/10"
                      />
                    )}
                  </div>
                  {timeStr && (
                    <p className={cn('mt-0.5 px-1 text-[10px] text-ink-400', isAgent && 'text-right')}>
                      {timeStr}
                    </p>
                  )}
                </div>

                {isAgent && (
                  <Avatar
                    name={user?.name || 'Admin'}
                    src={user?.avatarUrl}
                    size="sm"
                    className="h-7 w-7 text-[10px] shrink-0 mb-0.5"
                  />
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Composer */}
      <form onSubmit={submit} className="border-t border-ink-100 p-3 space-y-2">
        {imagePreview && (
          <div className="relative inline-block">
            <img src={imagePreview} alt="Upload preview" className="h-16 w-16 rounded-lg object-cover border border-ink-200" />
            <button
              type="button"
              onClick={removeFile}
              className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink-900 text-white hover:bg-red-600"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <div className="flex items-end gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-ink-200 text-ink-500 hover:bg-ink-50 hover:text-ink-900"
            title="Attach image"
          >
            <ImageIcon className="h-5 w-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleFileChange}
          />

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Type your message… (Enter to send, Shift+Enter for new line)"
            className="scrollbar-thin max-h-32 min-h-[44px] flex-1 resize-none rounded-lg border border-ink-200 px-3 py-2.5 text-sm text-ink-900 placeholder:text-ink-300 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30"
          />
          <Button
            type="submit"
            loading={sending}
            disabled={!text.trim() && !selectedFile}
            className="h-11 shrink-0"
          >
            <Send className="h-4 w-4" /> Send
          </Button>
        </div>
      </form>
    </>
  )
}
