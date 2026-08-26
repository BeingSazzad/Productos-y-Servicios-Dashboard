import { useEffect, useState, type FormEvent } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Modal } from '@/components/ui/Modal'
import { LoadingState } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { toast } from '@/components/ui/Toast'
import {
  useGetFaqsQuery,
  useCreateFaqMutation,
  useUpdateFaqMutation,
  useDeleteFaqMutation,
  type FaqInput,
} from '@/services/endpoints/cmsApi'
import type { Faq } from '@/types/models'

const emptyFaq: FaqInput = {
  question: '',
  answer: '',
}

export default function FaqsPage() {
  const { data: faqs, isLoading } = useGetFaqsQuery()
  const [deleteFaq, { isLoading: deleting }] = useDeleteFaqMutation()

  const [editing, setEditing] = useState<Faq | null>(null)
  const [creating, setCreating] = useState(false)
  const [toDelete, setToDelete] = useState<Faq | null>(null)

  const handleConfirmDelete = async () => {
    if (!toDelete) return
    try {
      await deleteFaq(toDelete.id).unwrap()
      toast.success(`FAQ deleted successfully!`)
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || 'Failed to delete FAQ.')
    } finally {
      setToDelete(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="FAQs"
        description="Help-center questions and answers displayed in the mobile app."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New FAQ
          </Button>
        }
      />

      {isLoading || !faqs ? (
        <LoadingState />
      ) : faqs.length === 0 ? (
        <Card>
          <EmptyState
            title="No FAQs yet"
            description="Add your first help-center question and answer."
            action={
              <Button onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" /> New FAQ
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-3">
          {faqs.map((faq) => (
            <FaqRow
              key={faq.id}
              faq={faq}
              onEdit={() => setEditing(faq)}
              onDelete={() => setToDelete(faq)}
            />
          ))}
        </div>
      )}

      <FaqFormModal
        open={creating || Boolean(editing)}
        faq={editing}
        onClose={() => {
          setCreating(false)
          setEditing(null)
        }}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete this FAQ?"
        description={toDelete?.question}
        confirmLabel="Delete FAQ"
        tone="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  )
}

function FaqRow({
  faq,
  onEdit,
  onDelete,
}: {
  faq: Faq
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <Card>
      <CardBody className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-semibold text-ink-900 text-base">{faq.question}</h3>
          <p className="mt-1.5 text-sm text-ink-600 leading-relaxed whitespace-pre-line">
            {faq.answer}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onDelete}
            className="text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}

function FaqFormModal({
  open,
  faq,
  onClose,
}: {
  open: boolean
  faq: Faq | null
  onClose: () => void
}) {
  const [createFaq, { isLoading: creating }] = useCreateFaqMutation()
  const [updateFaq, { isLoading: updating }] = useUpdateFaqMutation()
  const [form, setForm] = useState<FaqInput>(emptyFaq)

  useEffect(() => {
    if (!open) return
    if (faq) {
      setForm({
        question: faq.question || '',
        answer: faq.answer || '',
      })
    } else {
      setForm(emptyFaq)
    }
  }, [open, faq])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    try {
      if (faq) {
        await updateFaq({ id: faq.id, ...form }).unwrap()
        toast.success('FAQ updated successfully!')
      } else {
        await createFaq(form).unwrap()
        toast.success('FAQ created successfully!')
      }
      onClose()
    } catch (err: any) {
      toast.error(
        err?.data?.message || err?.message || 'Failed to save FAQ. Please try again.',
      )
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={faq ? 'Edit FAQ' : 'New FAQ'}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={creating || updating}>
            Cancel
          </Button>
          <Button type="submit" form="faq-form" loading={creating || updating}>
            {faq ? 'Save changes' : 'Create FAQ'}
          </Button>
        </>
      }
    >
      <form id="faq-form" onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Question"
          value={form.question}
          onChange={(e) => setForm((f) => ({ ...f, question: e.target.value }))}
          placeholder="e.g. How do product returns work?"
          required
        />
        <Textarea
          label="Answer"
          value={form.answer}
          onChange={(e) => setForm((f) => ({ ...f, answer: e.target.value }))}
          rows={4}
          placeholder="Enter the detailed answer here..."
          required
        />
      </form>
    </Modal>
  )
}
