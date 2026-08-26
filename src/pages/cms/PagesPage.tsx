import { useEffect, useState, type FormEvent } from 'react'
import { Pencil } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Table, type Column } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { Modal } from '@/components/ui/Modal'
import { ContentStatusBadge } from '@/components/shared/StatusBadge'
import { toast } from '@/components/ui/Toast'
import {
  useGetContentPagesQuery,
  useUpdateContentPageMutation,
} from '@/services/endpoints/cmsApi'
import { formatDate } from '@/lib/format'
import type { ContentPage, ContentStatus } from '@/types/models'
import type { Option } from '@/types/common.types'

const STATUS_OPTIONS: Option<ContentStatus>[] = [
  { label: 'Published', value: 'published' },
  { label: 'Draft', value: 'draft' },
]

export default function PagesPage() {
  const { data: pages, isLoading } = useGetContentPagesQuery()
  const [editing, setEditing] = useState<ContentPage | null>(null)

  const columns: Column<ContentPage>[] = [
    {
      key: 'title',
      header: 'Page',
      render: (p) => <span className="font-medium text-ink-900">{p.title}</span>,
    },

    {
      key: 'status',
      header: 'Status',
      render: (p) => <ContentStatusBadge status={p.status} />,
    },
    {
      key: 'updated',
      header: 'Last updated',
      render: (p) => formatDate(p.updatedAt),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (p) => (
        <Button size="sm" variant="outline" onClick={() => setEditing(p)}>
          <Pencil className="h-3.5 w-3.5" /> Edit
        </Button>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Content Pages"
        description="Legal and informational pages (Terms, Privacy, About, Guidelines…) surfaced in the app."
      />

      <Card>
        <Table
          columns={columns}
          rows={pages ?? []}
          rowKey={(p) => p.id}
          loading={isLoading}
          onRowClick={(p) => setEditing(p)}
        />
      </Card>

      <EditPageModal page={editing} onClose={() => setEditing(null)} />
    </div>
  )
}

function EditPageModal({ page, onClose }: { page: ContentPage | null; onClose: () => void }) {
  const [updatePage, { isLoading: saving }] = useUpdateContentPageMutation()
  const [form, setForm] = useState({ title: '', status: 'published' as ContentStatus, content: '' })

  // Re-seed the form whenever a different page is opened.
  useEffect(() => {
    if (page) {
      setForm({ title: page.title, status: page.status || 'published', content: page.content })
    }
  }, [page])

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!page) return
    const ruleType = page.type || page.id
    try {
      await updatePage({
        id: page.id,
        type: ruleType,
        title: form.title,
        content: form.content,
        status: form.status,
      }).unwrap()
      toast.success(`Page "${page.title}" updated successfully!`)
      onClose()
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || `Failed to update page "${page.title}".`)
    }
  }

  return (
    <Modal
      open={Boolean(page)}
      onClose={onClose}
      title={`Edit · ${page?.title ?? ''}`}
      description="Changes go live in the app once saved."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="edit-page-form" loading={saving}>
            Save changes
          </Button>
        </>
      }
    >
      <form id="edit-page-form" onSubmit={handleSave} className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            required
            disabled
          />
          <Select
            label="Status"
            options={STATUS_OPTIONS}
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as ContentStatus }))}
          />
        </div>
        <RichTextEditor
          label="Content"
          value={form.content}
          onChange={(content) => setForm((f) => ({ ...f, content }))}
          placeholder="Write the page content…"
        />
      </form>
    </Modal>
  )
}
