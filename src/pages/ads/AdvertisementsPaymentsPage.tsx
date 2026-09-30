import { useState, type ReactNode } from 'react'
import { Banknote, CircleDollarSign, Download, Eye, Megaphone, TimerReset } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { Card } from '@/components/ui/Card'
import { Table, type Column } from '@/components/ui/Table'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { LoadingState } from '@/components/ui/Spinner'
import { Avatar } from '@/components/shared/Avatar'
import {
  AdvertisementPaymentStatusBadge,
  StoreTypeBadge,
  SubscriptionStatusBadge,
} from '@/components/shared/StatusBadge'
import { SearchInput } from '@/components/shared/SearchInput'
import { TableToolbar } from '@/components/shared/TableToolbar'
import { AD_PAYMENT_STATUS_OPTIONS } from '@/components/shared/filterOptions'
import { imageUrl } from '@/components/shared/getImageUrl'
import { useListParams } from '@/hooks/useListParams'
import { PAGE_SIZE } from '@/lib/constants'
import { formatDate, formatDurationLabel } from '@/lib/format'
import { formatCurrency, formatNumber } from '@/lib/utils'
import {
  useGetAdvertisementPaymentQuery,
  useGetAdvertisementPaymentsQuery,
} from '@/services/endpoints/advertisementsApi'
import type { AdvertisementPayment, StoreType } from '@/types/models'

function toStoreType(value?: string): StoreType {
  return value === 'service_store' || value === 'service' ? 'service' : 'product'
}

function storeLabel(payment: AdvertisementPayment) {
  return payment.store?.displayName || 'Unnamed store'
}

function cityLabel(city?: AdvertisementPayment['city']) {
  if (!city?.name) return ''
  return city.country ? `${city.name}, ${city.country}` : city.name
}

function DetailItem({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <p className="text-xs text-ink-400">{label}</p>
      <p className="mt-0.5 text-sm font-medium text-ink-900 break-all">{value || '—'}</p>
    </div>
  )
}

export default function AdvertisementsPaymentsPage() {
  const { search, setSearch, status, setStatus, page, setPage, params } = useListParams()
  const { data, isFetching } = useGetAdvertisementPaymentsQuery({ ...params, pageSize: PAGE_SIZE })
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const columns: Column<AdvertisementPayment>[] = [
    {
      key: 'seller',
      header: 'Seller',
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.seller?.name || 'Seller'} src={row.seller?.profileImage || undefined} size="sm" />
          <div>
            <p className="font-medium text-ink-900">{row.seller?.name || '—'}</p>
            <p className="text-xs text-ink-500">{row.seller?.email || '—'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'store',
      header: 'Store',
      render: (row) => (
        <div>
          <p className="font-medium text-ink-900">{storeLabel(row)}</p>
          {row.store?.storeType && <StoreTypeBadge type={toStoreType(row.store.storeType)} />}
        </div>
      ),
    },
    {
      key: 'package',
      header: 'Package',
      render: (row) => (
        <div>
          <p className="font-medium text-ink-900">{row.package?.name || '—'}</p>
          <p className="text-xs text-ink-500">{formatDurationLabel(row.package?.duration) || '—'}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      render: (row) => (
        <span className="font-medium text-ink-900">{formatCurrency(row.amountPaid)}</span>
      ),
    },
    {
      key: 'method',
      header: 'Method',
      render: (row) => <Badge tone="gray">{row.paymentMethod || '—'}</Badge>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <AdvertisementPaymentStatusBadge status={row.paymentStatus} />,
    },
    {
      key: 'date',
      header: 'Payment date',
      render: (row) => (row.paymentDate ? formatDate(row.paymentDate) : '—'),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <Button size="sm" variant="outline" onClick={() => setSelectedId(row.id)}>
            <Eye className="h-3.5 w-3.5" /> Details
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Advertisements Payment"
        description="Track advertisement package payments, trials, and invoices."
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total payments"
          value={data ? formatNumber(data.totalPayments) : '—'}
          icon={Banknote}
          loading={isFetching && !data}
        />
        <StatCard
          label="Total revenue"
          value={data ? formatCurrency(data.totalRevenue) : '—'}
          icon={CircleDollarSign}
          loading={isFetching && !data}
        />
        <StatCard
          label="Active ads"
          value={data ? formatNumber(data.activeAdsCount) : '—'}
          icon={Megaphone}
          loading={isFetching && !data}
        />
        <StatCard
          label="Trials"
          value={data ? formatNumber(data.trialCount) : '—'}
          icon={TimerReset}
          loading={isFetching && !data}
        />
      </div>

      <Card>
        <TableToolbar>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by seller, store or invoice…"
            className="w-full sm:max-w-xs"
          />
          <div className="w-full sm:w-44">
            <Select
              options={AD_PAYMENT_STATUS_OPTIONS}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            />
          </div>
        </TableToolbar>

        <Table
          columns={columns}
          rows={data?.items ?? []}
          rowKey={(row) => row.id}
          loading={isFetching}
          onRowClick={(row) => setSelectedId(row.id)}
          emptyTitle="No advertisement payments"
          emptyDescription="Payments will appear here once sellers buy or trial ad packages."
        />

        {data && (
          <Pagination page={page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} />
        )}
      </Card>

      <AdvertisementPaymentDetailsModal id={selectedId} onClose={() => setSelectedId(null)} />
    </div>
  )
}

function AdvertisementPaymentDetailsModal({
  id,
  onClose,
}: {
  id: string | null
  onClose: () => void
}) {
  const { data, isFetching } = useGetAdvertisementPaymentQuery(id ?? '', { skip: !id })
  const invoiceHref = imageUrl(data?.invoiceDownloadUrl || data?.invoiceUrl)

  return (
    <Modal
      open={Boolean(id)}
      onClose={onClose}
      title="Advertisement payment details"
      size="lg"
      footer={
        <>
          {invoiceHref && (
            <Button
              variant="outline"
              onClick={() => window.open(invoiceHref, '_blank', 'noopener,noreferrer')}
            >
              <Download className="h-4 w-4" /> Invoice
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </>
      }
    >
      {isFetching && !data ? (
        <LoadingState />
      ) : data ? (
        <div className="space-y-5">
          <div className="flex flex-col gap-4 rounded-lg border border-ink-100 bg-ink-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <Avatar
                name={data.seller?.name || 'Seller'}
                src={data.seller?.profileImage || undefined}
                size="lg"
              />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-ink-900">{data.seller?.name || 'Seller'}</h3>
                  {data.isTrial && <Badge tone="blue">Trial</Badge>}
                </div>
                <p className="text-xs text-ink-600">{data.seller?.email || '—'}</p>
                {data.seller?.phone && <p className="text-xs text-ink-500">Phone: {data.seller.phone}</p>}
              </div>
            </div>
            <AdvertisementPaymentStatusBadge status={data.paymentStatus} />
          </div>

          <div className="rounded-lg border border-ink-100 p-4">
            <p className="mb-3 text-sm font-medium text-ink-800">Store</p>
            <div className="flex items-start gap-3">
              <Avatar name={storeLabel(data)} src={data.store?.logo || undefined} size="md" />
              <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
                <DetailItem label="Store name" value={storeLabel(data)} />
                <DetailItem
                  label="Type"
                  value={data.store?.storeType ? <StoreTypeBadge type={toStoreType(data.store.storeType)} /> : '—'}
                />
                <DetailItem label="Email" value={data.store?.email} />
                <DetailItem label="Phone" value={data.store?.phone} />
                {data.store?.address && <DetailItem label="Address" value={data.store.address} />}
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-ink-100 p-4">
            <p className="mb-3 text-sm font-medium text-ink-800">Payment</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DetailItem label="Amount paid" value={formatCurrency(data.amountPaid)} />
              <DetailItem label="Method" value={data.paymentMethod} />
              <DetailItem label="Transaction ID" value={data.trxId} />
              <DetailItem label="Invoice number" value={data.invoiceNumber} />
              <DetailItem
                label="Payment date"
                value={data.paymentDate ? formatDate(data.paymentDate) : '—'}
              />
              <DetailItem label="Ad submitted" value={data.isAdSubmitted ? 'Yes' : 'No'} />
              <DetailItem label="City" value={cityLabel(data.city)} />
              <DetailItem label="Position" value={data.position != null ? String(data.position) : '—'} />
            </div>
          </div>

          <div className="rounded-lg border border-ink-100 p-4">
            <p className="mb-3 text-sm font-medium text-ink-800">Package & subscription</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <DetailItem label="Package" value={data.package?.name} />
              <DetailItem label="Duration" value={formatDurationLabel(data.package?.duration)} />
              <DetailItem
                label="Package price"
                value={data.package?.price != null ? formatCurrency(data.package.price) : '—'}
              />
              <DetailItem
                label="Subscription"
                value={
                  data.subscription?.status ? (
                    <SubscriptionStatusBadge status={data.subscription.status} />
                  ) : (
                    '—'
                  )
                }
              />
              <DetailItem
                label="Expires"
                value={data.subscription?.expiresAt ? formatDate(data.subscription.expiresAt) : '—'}
              />
              <DetailItem
                label="Remaining days"
                value={
                  data.subscription?.remainingDays != null ? String(data.subscription.remainingDays) : '—'
                }
              />
            </div>
          </div>
        </div>
      ) : (
        <p className="text-sm text-ink-500">Payment details could not be loaded.</p>
      )}
    </Modal>
  )
}
