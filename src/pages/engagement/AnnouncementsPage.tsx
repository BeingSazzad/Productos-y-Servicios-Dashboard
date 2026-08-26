import { useState, type FormEvent } from 'react'
import { Megaphone, Plus, Send, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { Modal } from '@/components/ui/Modal'
import { LoadingState } from '@/components/ui/Spinner'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import {
  useGetAnnouncementsQuery,
  useCreateAnnouncementMutation,
  useDeleteAnnouncementMutation,
} from '@/services/endpoints/engagementApi'
import { formatNumber, stripHtml, formatDate } from '@/lib/utils'
import type { Announcement, AnnouncementAudience } from '@/types/models'
import type { Option } from '@/types/common.types'

const AUDIENCE_OPTIONS: Option<AnnouncementAudience>[] = [
  { label: 'Everyone', value: 'everyone' },
  { label: 'Buyers', value: 'buyers' },
  { label: 'All sellers', value: 'all_sellers' },
  { label: 'Product sellers', value: 'product_sellers' },
  { label: 'Service sellers', value: 'service_sellers' },
]

const statusTone: Record<string, BadgeTone> = {
  sent: 'green',
  scheduled: 'blue',
  draft: 'gray',
}

const audienceLabel: Record<string, string> = {
  everyone: 'Everyone',
  all: 'Everyone',
  buyers: 'Buyers',
  all_sellers: 'All sellers',
  sellers: 'All sellers',
  product_sellers: 'Product sellers',
  service_sellers: 'Service sellers',
}

export default function AnnouncementsPage() {
  const { data, isLoading } = useGetAnnouncementsQuery()
  const [createAnnouncement, { isLoading: sending }] = useCreateAnnouncementMutation()
  const [deleteAnnouncement, { isLoading: deleting }] = useDeleteAnnouncementMutation()

  const [open, setOpen] = useState(false)
  const [toDelete, setToDelete] = useState<Announcement | null>(null)
  const [form, setForm] = useState({
    title: '',
    message: '',
    audience: 'everyone' as AnnouncementAudience,
  })

  const announcements = data?.items || []

  const handleSend = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.title.trim() || !form.message.trim()) return
    await createAnnouncement({
      title: form.title,
      message: form.message,
      audience: form.audience,
    }).unwrap()
    setOpen(false)
    setForm({ title: '', message: '', audience: 'everyone' })
  }

  const handleDelete = async () => {
    if (!toDelete) return
    await deleteAnnouncement(toDelete.id).unwrap()
    setToDelete(null)
  }

  return (
    <div>
      <PageHeader
        title="Announcements"
        description="Broadcast push, email and in-app messages to your audience."
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> New announcement
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState />
      ) : announcements.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center text-ink-500">
            <Megaphone className="mx-auto h-8 w-8 text-ink-300" />
            <h3 className="mt-2 text-sm font-medium text-ink-900">No announcements yet</h3>
            <p className="mt-1 text-sm text-ink-500">Create your first broadcast announcement to notify users.</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => {
            const authorName = typeof a.createdBy === 'object' && a.createdBy?.name ? a.createdBy.name : null
            return (
              <Card key={a.id}>
                <CardBody className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <Megaphone className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-medium text-ink-900">{a.title}</h3>
                        <Badge tone={statusTone[a.status] || 'gray'}>{a.status}</Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setToDelete(a)}
                        className="text-red-600 hover:bg-red-50"
                        title="Delete announcement"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="mt-1 text-sm text-ink-600 line-clamp-3">{stripHtml(a.message || a.body || '')}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-ink-400">
                      <span>Audience: {audienceLabel[a.audience] || a.audience}</span>
                      {a.channel && <span>· Channel: {a.channel}</span>}
                      {authorName && <span>· Created by: {authorName}</span>}
                      {a.recipients ? <span>· {formatNumber(a.recipients)} recipients</span> : null}
                      <span>· {formatDate(a.sentAt || a.createdAt)}</span>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New announcement"
        description="Compose and send a message to your selected audience."
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={sending}>
              Cancel
            </Button>
            <Button type="submit" form="announcement-form" loading={sending}>
              <Send className="h-4 w-4" /> Send now
            </Button>
          </>
        }
      >
        <form id="announcement-form" onSubmit={handleSend} className="space-y-4">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            placeholder="Announcement title"
            required
          />
          <RichTextEditor
            label="Message"
            value={form.message}
            onChange={(message) => setForm((f) => ({ ...f, message }))}
            placeholder="Write your announcement…"
          />
          <Select
            label="Audience"
            options={AUDIENCE_OPTIONS}
            value={form.audience}
            onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value as AnnouncementAudience }))}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={`Delete announcement “${toDelete?.title}”?`}
        description="This action cannot be undone. The announcement record will be permanently deleted."
        confirmLabel="Delete announcement"
        tone="danger"
        loading={deleting}
        onConfirm={handleDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  )
}
