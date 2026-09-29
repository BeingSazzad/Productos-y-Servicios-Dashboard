import { FolderTree, Pencil, Plus, Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Switch } from '@/components/ui/Switch'
import { LoadingState } from '@/components/ui/Spinner'
import { StoreTypeBadge } from '@/components/shared/StatusBadge'
import { toast } from '@/components/ui/Toast'
import { formatDate } from '@/lib/format'
import {
  useGetSingleCategoryQuery,
  useToggleCategoryMutation,
} from '@/services/endpoints/categoriesApi'
import type { Category } from '@/types/models'

export interface CategoryDetailsModalProps {
  open: boolean
  categoryId: string | null
  onClose: () => void
  onEditCategory: (category: Category) => void
  onAddSubCategory: (parent: Category) => void
  onEditSubCategory: (subCategory: Category) => void
  onDeleteCategory: (category: Category) => void
}

export function CategoryDetailsModal({
  open,
  categoryId,
  onClose,
  onEditCategory,
  onAddSubCategory,
  onEditSubCategory,
  onDeleteCategory,
}: CategoryDetailsModalProps) {
  const { data: category, isFetching } = useGetSingleCategoryQuery(categoryId!, {
    skip: !categoryId || !open,
  })
  const [toggleCategory] = useToggleCategoryMutation()

  if (!open) return null

  const handleSubToggle = async (sub: Category, isActive: boolean) => {
    try {
      await toggleCategory({ id: sub.id, isActive }).unwrap()
      toast.success(`“${sub.name}” ${isActive ? 'activated' : 'deactivated'}.`)
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || 'Failed to update subcategory status.')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={category?.name || 'Category details'}
      description="Category overview, listing metrics, and nested subcategories."
      size="xl"
      footer={
        <div className="flex w-full items-center justify-between">
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (category) onEditCategory(category)
            }}
            disabled={!category}
          >
            <Pencil className="h-3.5 w-3.5" /> Edit category
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      {isFetching ? (
        <LoadingState label="Loading category details…" />
      ) : !category ? (
        <div className="py-12 text-center text-sm text-ink-500">Category not found.</div>
      ) : (
        <div className="space-y-6">
          {/* Header Info Card */}
          <div className="rounded-xl border border-ink-100 bg-ink-50/50 p-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-semibold text-ink-900">{category.name}</h3>
                  <StoreTypeBadge type={category.type} />
                  <Badge tone={category.isActive ? 'green' : 'gray'}>
                    {category.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {category.description ? (
                  <p className="mt-1.5 text-sm text-ink-600">{category.description}</p>
                ) : (
                  <p className="mt-1.5 text-xs italic text-ink-400">No description provided</p>
                )}
              </div>
              <Button size="sm" onClick={() => onAddSubCategory(category)}>
                <Plus className="h-4 w-4" /> Add subcategory
              </Button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 border-t border-ink-100 pt-3 sm:grid-cols-4">
              <div>
                <p className="text-xs text-ink-400">Total Listings</p>
                <p className="mt-0.5 text-base font-semibold text-ink-900">
                  {category.listingsCount ?? category.listingCount ?? 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-ink-400">Subcategories</p>
                <p className="mt-0.5 text-base font-semibold text-ink-900">
                  {category.subCategories?.length ?? 0}
                </p>
              </div>
              <div>
                <p className="text-xs text-ink-400">Created</p>
                <p className="mt-0.5 text-sm font-medium text-ink-800">
                  {category.createdAt ? formatDate(category.createdAt) : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-ink-400">Last Updated</p>
                <p className="mt-0.5 text-sm font-medium text-ink-800">
                  {category.updatedAt ? formatDate(category.updatedAt) : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Subcategories Section */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderTree className="h-4 w-4 text-ink-500" />
                <h4 className="text-sm font-semibold text-ink-800">Subcategories</h4>
                <Badge tone="gray">{category.subCategories?.length ?? 0}</Badge>
              </div>
            </div>

            {!category.subCategories || category.subCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-ink-200 py-10 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-100 text-ink-400">
                  <FolderTree className="h-5 w-5" />
                </div>
                <p className="mt-3 text-sm font-medium text-ink-800">No subcategories yet</p>
                <p className="mt-1 max-w-sm text-xs text-ink-500">
                  Add subcategories to organize products or services under {category.name}.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-4"
                  onClick={() => onAddSubCategory(category)}
                >
                  <Plus className="h-3.5 w-3.5" /> Add first subcategory
                </Button>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-ink-100">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-ink-100 bg-ink-50/80 text-xs font-semibold uppercase tracking-wider text-ink-500">
                      <th className="px-4 py-3">Subcategory</th>
                      <th className="px-4 py-3">Listings</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink-100">
                    {category.subCategories.map((sub) => (
                      <tr key={sub.id} className="transition-colors hover:bg-ink-50/50">
                        <td className="px-4 py-3">
                          <p className="font-medium text-ink-900">{sub.name}</p>
                          {sub.description && (
                            <p className="text-xs text-ink-500 line-clamp-1">{sub.description}</p>
                          )}
                        </td>
                        <td className="px-4 py-3 text-ink-700">
                          {sub.listingsCount ?? sub.listingCount ?? 0}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Switch
                            checked={sub.isActive}
                            onChange={(isActive) => handleSubToggle(sub, isActive)}
                            label={`Toggle ${sub.name}`}
                          />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onEditSubCategory(sub)}
                              title="Edit subcategory"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => onDeleteCategory(sub)}
                              className="text-red-600 hover:bg-red-50"
                              title="Delete subcategory"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </Modal>
  )
}
