import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardHeader } from '@/components/ui/Card'
import { Table, type Column } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Switch } from '@/components/ui/Switch'
import { Modal } from '@/components/ui/Modal'
import { Tabs } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { StoreTypeBadge } from '@/components/shared/StatusBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { toast } from '@/components/ui/Toast'
import { CategoryDetailsModal } from './CategoryDetailsModal'
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
import { useSearchParams } from 'react-router-dom'

const TYPE_TABS: Option[] = [
  { label: 'Product', value: 'product' },
  { label: 'Service', value: 'service' },
]

const TYPE_OPTIONS: Option<StoreType>[] = [
  { label: 'Product', value: 'product' },
  { label: 'Service', value: 'service' },
]

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

  // Filter categories by type query parameter: /categories?type=product or /categories?type=service
  const { data: categories, isLoading } = useGetCategoriesQuery({ type })
  const [toggleCategory] = useToggleCategoryMutation()
  const [deleteCategory, { isLoading: deleting }] = useDeleteCategoryMutation()

  const [viewingId, setViewingId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Category | null>(null)
  const [creating, setCreating] = useState(false)
  const [parentForSubcategory, setParentForSubcategory] = useState<Category | null>(null)
  const [toDelete, setToDelete] = useState<Category | null>(null)

  // Top-level categories for the selected tab
  const rows = useMemo(() => {
    return (categories ?? []).filter((c) => c.type === type && (!c.parentId || c.parentId === null))
  }, [categories, type])

  // Count subcategories for each parent
  const subCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const c of categories ?? []) {
      if (c.parentId) {
        counts[c.parentId] = (counts[c.parentId] || 0) + 1
      }
    }
    return counts
  }, [categories])

  // Top-level categories available to be parents
  const availableParents = useMemo(() => {
    return (categories ?? []).filter((c) => !c.parentId && c.type === type)
  }, [categories, type])

  const handleToggle = async (c: Category, isActive: boolean) => {
    try {
      await toggleCategory({ id: c.id, isActive }).unwrap()
      toast.success(`“${c.name}” ${isActive ? 'activated' : 'deactivated'}.`)
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || 'Failed to update category status.')
    }
  }

  const handleConfirmDelete = async () => {
    if (!toDelete) return
    const isSub = Boolean(toDelete.parentId)
    try {
      await deleteCategory(toDelete.id).unwrap()
      toast.success(`${isSub ? 'Subcategory' : 'Category'} “${toDelete.name}” deleted successfully.`)
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || 'Failed to delete category.')
    } finally {
      setToDelete(null)
    }
  }

  const columns: Column<Category>[] = [
    {
      key: 'name',
      header: 'Category',
      render: (c) => {
        const subCount = subCategoryCounts[c.id] || (c.subCategories?.length ?? 0)
        return (
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-ink-900">{c.name}</p>
              {subCount > 0 && (
                <Badge tone="gray" className="text-[11px]">
                  {subCount} {subCount === 1 ? 'subcategory' : 'subcategories'}
                </Badge>
              )}
            </div>
            {c.description && <p className="text-xs text-ink-500 line-clamp-1">{c.description}</p>}
          </div>
        )
      },
    },
    { key: 'type', header: 'Type', render: (c) => <StoreTypeBadge type={c.type} /> },
    {
      key: 'count',
      header: 'Listings',
      align: 'right',
      render: (c: any) =>
        c.listingsCount ?? c.listingCount ?? c.listings ?? c.totalListings ?? c.count ?? 0,
    },
    {
      key: 'active',
      header: 'Active',
      align: 'center',
      render: (c) => (
        <Switch
          checked={c.isActive}
          onChange={(isActive) => handleToggle(c, isActive)}
          label={`Toggle ${c.name}`}
        />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (c) => (
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="outline" onClick={() => setViewingId(c.id)}>
            <Eye className="h-3.5 w-3.5" /> Details
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setParentForSubcategory(null)
              setEditing(c)
            }}
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setToDelete(c)}
            className="text-red-600 hover:bg-red-50"
          >
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
        description="Taxonomy for product and service listings with parent and subcategory hierarchies."
        actions={
          <Button
            onClick={() => {
              setParentForSubcategory(null)
              setEditing(null)
              setCreating(true)
            }}
          >
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
          onRowClick={(c) => setViewingId(c.id)}
          emptyTitle="No categories"
          emptyDescription={`Add your first category for ${type === 'product' ? 'products' : 'services'}.`}
        />
      </Card>

      <CategoryDetailsModal
        open={Boolean(viewingId)}
        categoryId={viewingId}
        onClose={() => setViewingId(null)}
        onEditCategory={(c) => {
          setParentForSubcategory(null)
          setEditing(c)
        }}
        onAddSubCategory={(parent) => {
          setParentForSubcategory(parent)
          setEditing(null)
          setCreating(true)
        }}
        onEditSubCategory={(sub) => {
          const parent = categories?.find((c) => c.id === sub.parentId) || null
          setParentForSubcategory(parent)
          setEditing(sub)
        }}
        onDeleteCategory={(c) => setToDelete(c)}
      />

      <CategoryFormModal
        open={creating || Boolean(editing)}
        category={editing}
        defaultType={type}
        parentCategory={parentForSubcategory}
        availableParents={availableParents}
        onClose={() => {
          setCreating(false)
          setEditing(null)
          setParentForSubcategory(null)
        }}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title={`Delete “${toDelete?.name}” ${toDelete?.parentId ? 'subcategory' : 'category'}?`}
        description="Listings in this category won’t be deleted, but they’ll need re-categorizing."
        confirmLabel="Delete"
        tone="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  )
}

function CategoryFormModal({
  open,
  category,
  defaultType,
  parentCategory,
  availableParents = [],
  onClose,
}: {
  open: boolean
  category: Category | null
  defaultType: StoreType
  parentCategory?: Category | null
  availableParents?: Category[]
  onClose: () => void
}) {
  const [createCategory, { isLoading: creating }] = useCreateCategoryMutation()
  const [updateCategory, { isLoading: updating }] = useUpdateCategoryMutation()

  const [form, setForm] = useState<CategoryInput>({
    name: '',
    description: '',
    type: defaultType,
    parentId: parentCategory?.id || null,
    status: 'active',
  })

  useEffect(() => {
    if (!open) return
    if (category) {
      setForm({
        name: category.name,
        description: category.description || '',
        type: category.type,
        parentId: category.parentId || null,
        status: category.status || (category.isActive ? 'active' : 'inactive'),
      })
    } else if (parentCategory) {
      setForm({
        name: '',
        description: '',
        type: parentCategory.type,
        parentId: parentCategory.id,
        status: 'active',
      })
    } else {
      setForm({
        name: '',
        description: '',
        type: defaultType,
        parentId: null,
        status: 'active',
      })
    }
  }, [open, category, defaultType, parentCategory])

  const isSubcategory = Boolean(form.parentId || parentCategory || category?.parentId)
  const isParentLocked = Boolean(parentCategory) || Boolean(category?.parentId)

  const parentOptions: Option<string>[] = useMemo(() => {
    const opts: Option<string>[] = [{ label: 'None (Top-level category)', value: '' }]
    const filtered = availableParents.filter(
      (p) => (!category || p.id !== category.id) && p.type === form.type,
    )
    for (const p of filtered) {
      opts.push({ label: p.name, value: p.id })
    }
    return opts
  }, [availableParents, category, form.type])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      toast.error('Category name is required.')
      return
    }

    const payload: CategoryInput = {
      name: form.name.trim(),
      description: form.description?.trim() || '',
      type: form.type,
      status: form.status,
      parentId: form.parentId || undefined,
    }

    try {
      if (category) {
        await updateCategory({ id: category.id, ...payload }).unwrap()
        toast.success(`Category “${payload.name}” updated successfully.`)
      } else {
        await createCategory(payload).unwrap()
        toast.success(
          payload.parentId
            ? `Subcategory “${payload.name}” created successfully.`
            : `Category “${payload.name}” created successfully.`,
        )
      }
      onClose()
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || 'Failed to save category.')
    }
  }

  const saving = creating || updating
  const title = category
    ? `Edit · ${category.name}`
    : isSubcategory
    ? 'New subcategory'
    : 'New category'

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={
        isSubcategory
          ? 'Subcategories are nested under a parent category.'
          : 'Define a new taxonomy category for product or service listings.'
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" form="category-form" loading={saving}>
            {category ? 'Save changes' : isSubcategory ? 'Create subcategory' : 'Create category'}
          </Button>
        </>
      }
    >
      <form id="category-form" onSubmit={handleSubmit} className="space-y-4">
        {parentCategory && (
          <div className="rounded-lg border border-brand-200 bg-brand-50/60 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-700">
              Parent Category
            </p>
            <p className="mt-0.5 text-sm font-bold text-brand-900">{parentCategory.name}</p>
          </div>
        )}

        {!isParentLocked && (
          <Select
            label="Parent category (Optional)"
            options={parentOptions}
            value={form.parentId || ''}
            onChange={(e) => {
              const nextParentId = e.target.value || null
              const matched = availableParents.find((p) => p.id === nextParentId)
              setForm((f) => ({
                ...f,
                parentId: nextParentId,
                type: matched ? matched.type : f.type,
              }))
            }}
          />
        )}

        <Input
          label="Name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder={
            isSubcategory ? 'Subcategory name (e.g. Laptops)' : 'Category name (e.g. Electronics)'
          }
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
          disabled={Boolean(form.parentId) || Boolean(parentCategory)}
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
