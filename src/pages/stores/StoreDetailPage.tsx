import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Ban, CheckCircle2, ShieldCheck, ShieldX, Star, ExternalLink } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Table, type Column } from '@/components/ui/Table'
import { LoadingState } from '@/components/ui/Spinner'
import { Avatar } from '@/components/shared/Avatar'
import { StatusBadge, StoreTypeBadge } from '@/components/shared/StatusBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import {
  useGetStoreQuery,
  useUpdateStoreStatusMutation,
  useVerifyStoreMutation,
} from '@/services/endpoints/storesApi'
import { formatCurrency } from '@/lib/utils'
import { formatDate } from '@/lib/format'
import type { Product, Service, StoreType } from '@/types/models'
import { imageUrl } from '@/components/shared/getImageUrl'

export default function StoreDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { data: storeDetail, isLoading } = useGetStoreQuery(id)
  const [updateStatus, { isLoading: updating }] = useUpdateStoreStatusMutation()
  const [verifyStore, { isLoading: verifying }] = useVerifyStoreMutation()
  const [confirmSuspend, setConfirmSuspend] = useState(false)

  const store: any = storeDetail?.store
  const products = storeDetail?.products ?? []
  const services = storeDetail?.services ?? []

  if (isLoading || !store) return <LoadingState />

  const storeId = store._id || store.id
  const storeName = store.displayName || store.name || 'Unnamed Store'
  const ownerName = typeof store.owner === 'object' ? store.owner?.name : (store.ownerName || '—')
  const logo = store.logo || store.logoUrl
  const categoryName = typeof store.categoryId === 'object' ? store.categoryId?.name : (store.category || 'General')
  const storeType: StoreType =
    store.storeType === 'service_store' || store.storeType === 'service' || store.type === 'service'
      ? 'service'
      : 'product'
  const isProductStore = storeType === 'product'
  const isSuspended = store.status === 'suspended'
  const isPending = store.status === 'pending' || store.status === 'under_review'

  const setStatus = async (status: 'active' | 'suspended' | 'rejected') => {
    await updateStatus({ id: storeId, status })
    setConfirmSuspend(false)
  }

  const toggleVerification = async () => {
    await verifyStore({ id: storeId, isVerified: !store.isVerified })
  }

  const productColumns: Column<Product>[] = [
    { key: 'title', header: 'Product', render: (p: any) => <span className="font-medium text-ink-900">{p.title || p.name}</span> },
    {
      key: 'category',
      header: 'Category',
      render: (p: any) => {
        const cat = typeof p.categoryId === 'object' ? p.categoryId?.name : (p.category || p.categoryId || categoryName || 'General')
        return <Badge tone="blue">{cat}</Badge>
      },
    },
    {
      key: 'price',
      header: 'Price',
      align: 'right',
      render: (p: any) => {
        const val = p.activePrice ?? p.price ?? p.originalPrice ?? 0
        return formatCurrency(val, p.currency)
      },
    },
    { key: 'status', header: 'Status', render: (p: any) => <StatusBadge status={p.status || 'active'} /> },
  ]

  const serviceColumns: Column<Service>[] = [
    { key: 'title', header: 'Service', render: (s: any) => <span className="font-medium text-ink-900">{s.title || s.name}</span> },
    {
      key: 'category',
      header: 'Category',
      render: (s: any) => {
        const cat = typeof s.categoryId === 'object' ? s.categoryId?.name : (s.category || s.categoryId || categoryName || 'General')
        return <Badge tone="purple">{cat}</Badge>
      },
    },
    {
      key: 'price',
      header: 'Rate',
      align: 'right',
      render: (s: any) => {
        const val = s.activePrice ?? s.price ?? s.originalPrice ?? 0
        const unit = s.pricingUnit || 'unit'
        return (
          <span>
            {formatCurrency(val, s.currency)}
            <span className="text-ink-400">/{unit}</span>
          </span>
        )
      },
    },
    { key: 'status', header: 'Status', render: (s: any) => <StatusBadge status={s.status || 'active'} /> },
  ]

  return (
    <div>
      <button
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-700"
      >
        <ArrowLeft className="h-4 w-4" /> Back to stores
      </button>

      <PageHeader
        title={storeName}
        description={`Owned by ${ownerName} · Created ${formatDate(store.createdAt)}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant={store.isVerified ? 'outline' : 'primary'}
              onClick={toggleVerification}
              loading={verifying}
            >
              {store.isVerified ? (
                <>
                  <ShieldX className="h-4 w-4" /> Unverify Identity
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" /> Verify Store Identity
                </>
              )}
            </Button>
            {isPending && (
              <Button onClick={() => setStatus('active')} loading={updating}>
                <CheckCircle2 className="h-4 w-4" /> Approve
              </Button>
            )}
            {isSuspended ? (
              <Button onClick={() => setStatus('active')} loading={updating}>
                <CheckCircle2 className="h-4 w-4" /> Reactivate
              </Button>
            ) : (
              <Button variant="danger" onClick={() => setConfirmSuspend(true)}>
                <Ban className="h-4 w-4" /> Suspend
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardBody className="flex flex-col items-center text-center">
            <Avatar name={storeName} src={logo} size="lg" className="h-20 w-20 text-xl" />
            <h3 className="mt-3 text-lg font-semibold text-ink-900">{storeName}</h3>
            <div className="mt-2 flex flex-wrap justify-center items-center gap-2">
              <StoreTypeBadge type={storeType} />
              <StatusBadge status={store.status} />
              {store.isVerified ? (
                <Badge tone="green">Verified Store</Badge>
              ) : (
                <Badge tone="amber">Unverified</Badge>
              )}
            </div>
            <div className="mt-3 flex items-center gap-1 text-sm text-ink-700">
              {(store.averageRating || store.rating) > 0 ? (
                <>
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {store.averageRating || store.rating} ({store.ratingCount || 0} reviews)
                </>
              ) : (
                <span className="text-ink-400">Not rated yet</span>
              )}
            </div>
          </CardBody>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader title="Store Information" />
          <CardBody className="grid grid-cols-1 sm:grid-cols-2 gap-y-4">
            <Detail label="Owner" value={ownerName} />
            <Detail label="Category" value={categoryName} />
            <Detail label="Email" value={store.email || '—'} />
            <Detail label="Phone" value={store.phone || '—'} />
            <Detail label="WhatsApp" value={store.whatsapp || '—'} />
            <Detail label="Address" value={store.streetAddress ? `${store.streetAddress}, ${store.city || ''}` : '—'} />
            <Detail label="Subscription plan" value={store.plan || store.planName || 'None'} />
            <Detail label="Listings count" value={String(store.listingCount || store.listings || (isProductStore ? products.length : services.length))} />
            <Detail label="Visitor count" value={String(store.visitorCount ?? 0)} />
            {store.description && (
              <div className="sm:col-span-2">
                <p className="text-xs text-ink-500">Description</p>
                <p className="mt-0.5 text-sm text-ink-700">{store.description}</p>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Identity Verification & Legal Documents Card */}
      {(store.documentType || store.businessLicenseNumber || store.tinNumber || store.documentFrontUrl || store.documentFront || store.tradeLicenseUrl || store.tradeLicense) && (
        <Card className="mt-4">
          <CardHeader
            title="Identity Verification & Legal Documents"
            description="Submitted business licenses and identification documents."
          />
          <CardBody>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <Detail label="Document Type" value={store.documentType?.toUpperCase() || '—'} />
              <Detail label="Business License No" value={store.businessLicenseNumber || '—'} />
              <Detail label="TIN Number" value={store.tinNumber || '—'} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(store.documentFrontUrl || store.documentFront) && (
                <DocumentPreview label="Document Front" url={store.documentFrontUrl || store.documentFront} />
              )}
              {(store.documentBackUrl || store.documentBack) && (
                <DocumentPreview label="Document Back" url={store.documentBackUrl || store.documentBack} />
              )}
              {(store.tradeLicenseUrl || store.tradeLicense) && (
                <DocumentPreview label="Trade License" url={store.tradeLicenseUrl || store.tradeLicense} />
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Vendor's listings */}
      <Card className="mt-4">
        <CardHeader
          title={isProductStore ? 'Products' : 'Services'}
          description={`Listings published by ${storeName}.`}
        />
        {isProductStore ? (
          <Table
            columns={productColumns}
            rows={products}
            rowKey={(p: any) => p.id || p._id}
            emptyTitle="No products found"
          />
        ) : (
          <Table
            columns={serviceColumns}
            rows={services}
            rowKey={(s: any) => s.id || s._id}
            emptyTitle="No services found"
          />
        )}
      </Card>

      <ConfirmDialog
        open={confirmSuspend}
        title="Suspend this store?"
        description="Listings will be hidden from the marketplace until reactivated."
        confirmLabel="Suspend store"
        tone="danger"
        loading={updating}
        onConfirm={() => setStatus('suspended')}
        onClose={() => setConfirmSuspend(false)}
      />
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-ink-500">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-ink-900">{value}</p>
    </div>
  )
}

function DocumentPreview({ label, url }: { label: string; url: string }) {
  const fullUrl = imageUrl(url)
  return (
    <div className="rounded-lg border border-ink-100 p-3 bg-ink-50/50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-ink-700">{label}</span>
        <a
          href={fullUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-brand-600 hover:text-brand-700 inline-flex items-center gap-1"
        >
          View full <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      <div className="relative aspect-video w-full overflow-hidden rounded bg-ink-100">
        <img src={fullUrl} alt={label} className="h-full w-full object-cover" />
      </div>
    </div>
  )
}
