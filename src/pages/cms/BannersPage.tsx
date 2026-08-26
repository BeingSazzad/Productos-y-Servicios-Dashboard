import { useEffect, useState, type FormEvent } from 'react'
import { Image as ImageIcon, Pencil, Plus, Trash2, Upload } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Switch } from '@/components/ui/Switch'
import { Modal } from '@/components/ui/Modal'
import { LoadingState } from '@/components/ui/Spinner'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { imageUrl } from '@/components/shared/getImageUrl'
import { toast } from '@/components/ui/Toast'
import {
  useGetBannersQuery,
  useToggleBannerMutation,
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useDeleteBannerMutation,
  type BannerInput,
} from '@/services/endpoints/cmsApi'
import { formatDate } from '@/lib/format'
import type { Banner } from '@/types/models'

export default function BannersPage() {
  const { data: banners, isLoading } = useGetBannersQuery()
  const [toggleBanner, { isLoading: toggling }] = useToggleBannerMutation()
  const [deleteBanner, { isLoading: deleting }] = useDeleteBannerMutation()

  const [editing, setEditing] = useState<Banner | null>(null)
  const [creating, setCreating] = useState(false)
  const [toDelete, setToDelete] = useState<Banner | null>(null)
  const [toToggleStatus, setToToggleStatus] = useState<{
    banner: Banner
    targetStatus: boolean
  } | null>(null)

  const handleConfirmToggleStatus = async () => {
    if (!toToggleStatus) return
    const { banner, targetStatus } = toToggleStatus
    try {
      await toggleBanner({ id: banner.id, isActive: targetStatus }).unwrap()
      toast.success(
        `Banner "${banner.name || banner.title}" set to ${
          targetStatus ? 'active' : 'inactive'
        } successfully!`,
      )
    } catch (err: any) {
      toast.error(
        err?.data?.message || err?.message || 'Failed to update banner status. Please try again.',
      )
    } finally {
      setToToggleStatus(null)
    }
  }

  const handleConfirmDelete = async () => {
    if (!toDelete) return
    try {
      await deleteBanner(toDelete.id).unwrap()
      toast.success(
        `Banner "${toDelete.name || toDelete.title}" deleted successfully!`,
      )
    } catch (err: any) {
      toast.error(err?.data?.message || err?.message || 'Failed to delete banner.')
    } finally {
      setToDelete(null)
    }
  }

  return (
    <div>
      <PageHeader
        title="Banners"
        description="Manage app promotional banners, descriptions, status, and banner graphics."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New banner
          </Button>
        }
      />

      {isLoading || !banners ? (
        <LoadingState />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {banners.map((banner) => (
            <BannerCard
              key={banner.id}
              banner={banner}
              onToggleRequest={(b, targetStatus) =>
                setToToggleStatus({ banner: b, targetStatus })
              }
              onEdit={() => setEditing(banner)}
              onDelete={() => setToDelete(banner)}
            />
          ))}
        </div>
      )}

      <BannerFormModal
        open={creating || Boolean(editing)}
        banner={editing}
        onClose={() => {
          setCreating(false)
          setEditing(null)
        }}
      />

      {/* Status Toggle Confirmation Modal */}
      <ConfirmDialog
        open={Boolean(toToggleStatus)}
        title={`Change status to ${toToggleStatus?.targetStatus ? 'Active' : 'Inactive'}?`}
        description={`Are you sure you want to change the status of "${
          toToggleStatus?.banner.name || toToggleStatus?.banner.title
        }" to ${toToggleStatus?.targetStatus ? 'active' : 'inactive'}?`}
        confirmLabel={`Set to ${toToggleStatus?.targetStatus ? 'Active' : 'Inactive'}`}
        tone={toToggleStatus?.targetStatus ? 'primary' : 'danger'}
        loading={toggling}
        onConfirm={handleConfirmToggleStatus}
        onClose={() => setToToggleStatus(null)}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={Boolean(toDelete)}
        title={`Delete “${toDelete?.name || toDelete?.title}” banner?`}
        description="This action will permanently delete the promotional banner graphic."
        confirmLabel="Delete banner"
        tone="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  )
}

function BannerCard({
  banner,
  onToggleRequest,
  onEdit,
  onDelete,
}: {
  banner: Banner
  onToggleRequest: (banner: Banner, targetStatus: boolean) => void
  onEdit: () => void
  onDelete: () => void
}) {
  const bannerSrc = imageUrl(banner.image || banner.imageUrl)
  const displayName = banner.name || banner.title

  return (
    <Card className="overflow-hidden">
      <div className="flex h-36 items-center justify-center bg-ink-100 text-white relative">
        {bannerSrc ? (
          <img src={bannerSrc} alt={displayName} className="h-full w-full object-cover" />
        ) : (
          <div className="flex flex-col items-center justify-center text-ink-400">
            <ImageIcon className="h-8 w-8 opacity-70" />
            <span className="text-xs mt-1">No Image</span>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge tone={banner.isActive ? 'green' : 'gray'}>
            {banner.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>
      <CardBody>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-semibold text-ink-900">{displayName}</h3>
            {banner.description && (
              <p className="mt-1 text-xs text-ink-600 line-clamp-2">{banner.description}</p>
            )}
          </div>
          <Switch
            checked={banner.isActive}
            onChange={(checked) => onToggleRequest(banner, checked)}
            label={`Toggle ${displayName}`}
          />
        </div>
        {banner.createdAt && (
          <p className="mt-3 text-xs text-ink-400">
            Created: {formatDate(banner.createdAt)}
          </p>
        )}
        <div className="mt-3 flex justify-end gap-2 border-t border-ink-100 pt-3">
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

function BannerFormModal({
  open,
  banner,
  onClose,
}: {
  open: boolean
  banner: Banner | null
  onClose: () => void
}) {
  const [createBanner, { isLoading: creating }] = useCreateBannerMutation()
  const [updateBanner, { isLoading: updating }] = useUpdateBannerMutation()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')

  useEffect(() => {
    if (!open) return
    if (banner) {
      setName(banner.name || banner.title || '')
      setDescription(banner.description || '')
      setImageFile(null)
      setPreviewUrl(imageUrl(banner.image || banner.imageUrl) || '')
    } else {
      setName('')
      setDescription('')
      setImageFile(null)
      setPreviewUrl('')
    }
  }, [open, banner])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const payload: BannerInput = {
      name,
      title: name,
      description,
      imageFile,
    }

    try {
      if (banner) {
        await updateBanner({ id: banner.id, ...payload }).unwrap()
        toast.success(`Banner "${name}" updated successfully!`)
      } else {
        await createBanner(payload).unwrap()
        toast.success(`Banner "${name}" created successfully!`)
      }
      onClose()
    } catch (err: any) {
      toast.error(
        err?.data?.message || err?.message || 'Failed to save banner. Please check details and try again.',
      )
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={banner ? `Edit Banner · ${banner.name || banner.title}` : 'New Promotional Banner'}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={creating || updating}>
            Cancel
          </Button>
          <Button type="submit" form="banner-form" loading={creating || updating}>
            {banner ? 'Save changes' : 'Create banner'}
          </Button>
        </>
      }
    >
      <form id="banner-form" onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Banner Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Summer Festival Special"
          required
        />

        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Enter banner details or promo text…"
        />

        {/* Image File Uploader with Live Preview */}
        <div>
          <label className="block text-sm font-medium text-ink-700 mb-1.5">
            Banner Graphic (Image File)
          </label>
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-ink-200 p-4 text-center hover:border-brand-500 transition-colors bg-ink-50/50">
            {previewUrl ? (
              <div className="relative w-full h-36 rounded-md overflow-hidden mb-3 border border-ink-200">
                <img
                  src={previewUrl}
                  alt="Banner preview"
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center py-2 text-ink-500">
                <Upload className="h-8 w-8 mb-2 text-ink-400" />
                <span className="text-xs font-medium">Click to upload banner image</span>
                <span className="text-[11px] text-ink-400 mt-0.5">PNG, JPG, WEBP up to 5MB</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="text-xs text-ink-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 cursor-pointer w-full"
            />
          </div>
        </div>
      </form>
    </Modal>
  )
}
