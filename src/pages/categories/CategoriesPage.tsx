import { useEffect, useState, type FormEvent } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Table, type Column } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Switch } from '@/components/ui/Switch'
import { Modal } from '@/components/ui/Modal'
import { Tabs } from '@/components/ui/Tabs'
import { StoreTypeBadge } from '@/components/shared/StatusBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import {
  useGetCategoriesQuery,
  useToggleCategoryMutation,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
  type CategoryInput,
} from '@/services/endpoints/categoriesApi'
import type { Category, StoreType } from '@/types/models'
import type { Option } from '@/types/common.types'

const TYPE_TABS: Option[] = [
  { label: 'Product', value: 'product' },
  { label: 'Service', value: 'service' },
]

const TYPE_OPTIONS: Option<StoreType>[] = [
  { label: 'Product', value: 'product' },
  { label: 'Service', value: 'service' },
]

import { useSearchParams } from 'react-router-dom'

export default function CategoriesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const typeParam = searchParams.get('type') || searchParams.get('tab') || 'product'
  const type = (['product', 'service'].includes(typeParam) ? typeParam : 'product') as StoreType

  const handleTypeChange = (newType: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      next.set('type', newType)
      return next
    })
  }

  const { data: categories, isLoading } = useGetCategoriesQuery()
  const [toggleCategory] = useToggleCategoryMutation()
  const [deleteCategory, { isLoading: deleting }] = useDeleteCategoryMutation()

  const [editing, setEditing] = useState<Category | null>(null)
  const [creating, setCreating] = useState(false)
  const [toDelete, setToDelete] = useState<Category | null>(null)

  const rows = (categories ?? []).filter((c) => c.type === type)

  const columns: Column<Category>[] = [
    {
      key: 'name',
      header: 'Category',
      render: (c) => (
        <div>
          <p className="font-medium text-ink-900">{c.name}</p>
          {c.description && <p className="text-xs text-ink-500 line-clamp-1">{c.description}</p>}
        </div>
      ),
    },
    { key: 'type', header: 'Type', render: (c) => <StoreTypeBadge type={c.type} /> },
    {
      key: 'count',
      header: 'Listings',
      align: 'right',
      render: (c: any) =>
        c.listingCount ?? c.listingsCount ?? c.listings ?? c.totalListings ?? c.count ?? 0,
    },
    {
      key: 'active',
      header: 'Active',
      align: 'center',
      render: (c) => (
        <Switch
          checked={c.isActive}
          onChange={(isActive) => toggleCategory({ id: c.id, isActive })}
          label={`Toggle ${c.name}`}
        />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (c) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => setEditing(c)}>
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setToDelete(c)} className="text-red-600 hover:bg-red-50">
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Taxonomy for product and service listings."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New category
          </Button>
        }
      />

      <Card>
        <CardHeader
          title="Manage categories"
          action={<Tabs value={type} onChange={handleTypeChange} options={TYPE_TABS} />}
        />
        <Table
          columns={columns}
          rows={rows}
          rowKey={(c) => c.id}
          loading={isLoading}
          emptyTitle="No categories"
          emptyDescription="Add your first category for this store type."
        />
      </Card>

      <CategoryFormModal
        open={creating || Boolean(editing)}
        category={editing}
        defaultType={type}
        onClose={() => {
          setCreating(false)
          setEditing(null)
        }}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={`Delete “${toDelete?.name}” category?`}
        description="Listings in this category won’t be deleted, but they’ll need re-categorizing."
        confirmLabel="Delete category"
        tone="danger"
        loading={deleting}
        onConfirm={async () => {
          if (toDelete) await deleteCategory(toDelete.id)
          setToDelete(null)
        }}
        onClose={() => setToDelete(null)}
      />
    </div>
  )
}

function CategoryFormModal({
  open,
  category,
  defaultType,
  onClose,
}: {
  open: boolean
  category: Category | null
  defaultType: StoreType
  onClose: () => void
}) {
  const [createCategory, { isLoading: creating }] = useCreateCategoryMutation()
  const [updateCategory, { isLoading: updating }] = useUpdateCategoryMutation()
  const [form, setForm] = useState<CategoryInput>({ name: '', description: '', type: defaultType, status: 'active' })

  useEffect(() => {
    if (!open) return
    setForm(
      category
        ? {
            name: category.name,
            description: category.description || '',
            type: category.type,
            status: category.status || (category.isActive ? 'active' : 'inactive'),
          }
        : { name: '', description: '', type: defaultType, status: 'active' },
    )
  }, [open, category, defaultType])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (category) await updateCategory({ id: category.id, ...form }).unwrap()
    else await createCategory(form).unwrap()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={category ? `Edit · ${category.name}` : 'New category'}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={creating || updating}>
            Cancel
          </Button>
          <Button type="submit" form="category-form" loading={creating || updating}>
            {category ? 'Save changes' : 'Create category'}
          </Button>
        </>
      }
    >
      <form id="category-form" onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Category name (e.g. Electronics)"
          required
        />
        <Input
          label="Description"
          value={form.description ?? ''}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          placeholder="Short category description..."
        />
        <Select
          label="Store type"
          options={TYPE_OPTIONS}
          value={form.type}
          onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as StoreType }))}
        />
        <label className="flex items-center gap-2 text-sm text-ink-700">
          <Switch
            checked={form.status === 'active'}
            onChange={(active) => setForm((f) => ({ ...f, status: active ? 'active' : 'inactive' }))}
            label="Active"
          />
          Active
        </label>
      </form>
    </Modal>
  )
}
