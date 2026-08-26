import { useState } from 'react'
import { Eye, XCircle, Store, CheckCircle2, Tag } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Table, type Column } from '@/components/ui/Table'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/shared/Avatar'
import { SubscriptionStatusBadge, StoreTypeBadge } from '@/components/shared/StatusBadge'
import { SearchInput } from '@/components/shared/SearchInput'
import { TableToolbar } from '@/components/shared/TableToolbar'
import { SUBSCRIPTION_STATUS_OPTIONS } from '@/components/shared/filterOptions'
import { useListParams } from '@/hooks/useListParams'
import { useGetSubscriptionsQuery, useCancelSubscriptionMutation, useGetPlansQuery } from '@/services/endpoints/billingApi'
import { formatCurrency } from '@/lib/utils'
import { formatDate } from '@/lib/format'
import type { Subscription } from '@/types/models'
import type { Option } from '@/types/common.types'

function capitalizeWords(str?: string): string {
  if (!str) return ''
  return str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export default function SubscriptionsPage() {
  const { search, setSearch, status, setStatus, page, setPage, params } = useListParams()
  const [plan, setPlan] = useState('all')
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null)

  const { data, isFetching } = useGetSubscriptionsQuery({ ...params, plan })
  const { data: plans } = useGetPlansQuery()
  const [cancel, { isLoading: canceling }] = useCancelSubscriptionMutation()

  const planOptions: Option[] = [
    { label: 'All plans', value: 'all' },
    ...(plans ?? []).map((p) => ({ label: capitalizeWords(p.name), value: p.id || p.name })),
  ]

  const columns: Column<Subscription>[] = [
    {
      key: 'store',
      header: 'Store (Subscriber)',
      render: (s) => {
        const storeName = s.store?.displayName || s.storeName || 'Store'
        const ownerName = s.userId?.name || s.ownerName || 'Subscriber'
        const ownerEmail = s.userId?.email
        const avatarSrc = s.store?.logo || s.userId?.profileImage

        return (
          <div className="flex items-center gap-3">
            <Avatar name={storeName} src={avatarSrc} size="sm" />
            <div>
              <p className="font-medium text-ink-900">{storeName}</p>
              <p className="text-xs text-ink-500">
                Owner: {ownerName} {ownerEmail ? `(${ownerEmail})` : ''}
              </p>
            </div>
          </div>
        )
      },
    },
    {
      key: 'type',
      header: 'Store Type',
      render: (s) => <StoreTypeBadge type={s.storeType || 'product'} />,
    },
    {
      key: 'plan',
      header: 'Plan / Package',
      render: (s) => (
        <div>
          <p className="font-medium text-ink-900">
            {capitalizeWords(s.packageId?.name || s.planName || '')}
          </p>
          {(s.packageType || s.packageId?.packageType) && (
            <span className="inline-block text-[11px] font-medium text-ink-500 capitalize">
              {(s.packageType || s.packageId?.packageType)?.replace('_', ' ')}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount Paid',
      align: 'right',
      render: (s) => (
        <div>
          <span className="font-medium text-ink-900">
            {formatCurrency(s.amountPaid ?? s.amount)}
          </span>
          <span className="text-xs text-ink-400">
            /{s.interval === 'monthly' ? 'mo' : s.interval === 'yearly' ? 'yr' : s.interval}
          </span>
        </div>
      ),
    },
    {
      key: 'renews',
      header: 'Expires At',
      render: (s) => (
        <span className="text-sm text-ink-700">
          {s.expiresAt || s.currentPeriodEnd ? formatDate((s.expiresAt || s.currentPeriodEnd)!) : 'N/A'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (s) => <SubscriptionStatusBadge status={s.status} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (s) => (
        <div className="flex items-center justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => setSelectedSub(s)}>
            <Eye className="h-3.5 w-3.5" /> Details
          </Button>
          {(s.status === 'active' || s.status === 'trialing') && (
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
              disabled={canceling}
              onClick={() => cancel(s.id)}
            >
              <XCircle className="h-3.5 w-3.5" /> Cancel
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div>
      <PageHeader
        title="Subscriber Users & Subscriptions"
        description="Overview of active market sellers, store subscription packages, payment history, and subscriber details."
      />

      <Card>
        <TableToolbar>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by store, user name or email…"
            className="w-full sm:max-w-xs"
          />
          <div className="flex w-full gap-2 sm:w-auto">
            <div className="w-full sm:w-44">
              <Select options={planOptions} value={plan} onChange={(e) => setPlan(e.target.value)} />
            </div>
            <div className="w-full sm:w-44">
              <Select
                options={SUBSCRIPTION_STATUS_OPTIONS}
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              />
            </div>
          </div>
        </TableToolbar>

        <Table
          columns={columns}
          rows={data?.items ?? []}
          rowKey={(s) => s.id}
          loading={isFetching}
          emptyTitle="No subscriptions found"
        />

        {data && (
          <Pagination page={page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} />
        )}
      </Card>

      {/* Subscription Detail Modal */}
      {selectedSub && (
        <Modal
          open={!!selectedSub}
          onClose={() => setSelectedSub(null)}
          title="Subscriber Subscription Details"
          size="lg"
        >
          <div className="space-y-6">
            {/* Subscriber / User Card */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-lg bg-ink-50 p-4 border border-ink-100">
              <div className="flex items-center gap-3">
                <Avatar
                  name={selectedSub.userId?.name || selectedSub.ownerName || 'Subscriber'}
                  src={selectedSub.userId?.profileImage || selectedSub.store?.logo}
                  size="lg"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-ink-900">
                      {selectedSub.userId?.name || selectedSub.ownerName}
                    </h3>
                    <Badge tone="gray">Subscriber</Badge>
                  </div>
                  {selectedSub.userId?.email && (
                    <p className="text-xs text-ink-600">{selectedSub.userId.email}</p>
                  )}
                  {selectedSub.userId?.phone && (
                    <p className="text-xs text-ink-500">Phone: {selectedSub.userId.phone}</p>
                  )}
                </div>
              </div>
              <SubscriptionStatusBadge status={selectedSub.status} />
            </div>

            {/* Store Information */}
            <div className="rounded-lg border border-ink-100 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-ink-100 pb-2">
                <span className="flex items-center gap-2 font-medium text-ink-900 text-sm">
                  <Store className="h-4 w-4 text-ink-500" /> Associated Store
                </span>
                <StoreTypeBadge type={selectedSub.storeType || 'product'} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-ink-400">Store Name:</span>{' '}
                  <span className="font-medium text-ink-900">
                    {selectedSub.store?.displayName || selectedSub.storeName}
                  </span>
                </div>
                {selectedSub.store?.city && (
                  <div>
                    <span className="text-ink-400">City / Location:</span>{' '}
                    <span className="font-medium text-ink-900">
                      {selectedSub.store.city}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Package & Billing Info */}
            <div className="rounded-lg border border-ink-100 p-4 space-y-3">
              <div className="flex items-center justify-between border-b border-ink-100 pb-2">
                <span className="flex items-center gap-2 font-medium text-ink-900 text-sm">
                  <Tag className="h-4 w-4 text-ink-500" /> Package & Billing Details
                </span>
                <span className="text-sm font-semibold text-brand-600">
                  {formatCurrency(selectedSub.amountPaid ?? selectedSub.amount)}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-ink-400">Package Name:</span>{' '}
                  <span className="font-medium text-ink-900">
                    {capitalizeWords(selectedSub.packageId?.name || selectedSub.planName || '')}
                  </span>
                </div>
                <div>
                  <span className="text-ink-400">Package Type:</span>{' '}
                  <span className="font-medium text-ink-900 capitalize">
                    {(selectedSub.packageType || selectedSub.packageId?.packageType)?.replace('_', ' ') || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-ink-400">Duration / Interval:</span>{' '}
                  <span className="font-medium text-ink-900">
                    {selectedSub.packageId?.duration || selectedSub.interval}
                  </span>
                </div>
                <div>
                  <span className="text-ink-400">Listing Limit:</span>{' '}
                  <span className="font-medium text-ink-900">
                    {selectedSub.packageId?.isUnlimitedListings
                      ? 'Unlimited'
                      : selectedSub.packageId?.listingLimit ?? 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-ink-400">Created At:</span>{' '}
                  <span className="font-medium text-ink-900">
                    {selectedSub.createdAt || selectedSub.startDate
                      ? formatDate((selectedSub.createdAt || selectedSub.startDate)!)
                      : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-ink-400">Expires At:</span>{' '}
                  <span className="font-medium text-ink-900">
                    {selectedSub.expiresAt || selectedSub.currentPeriodEnd
                      ? formatDate((selectedSub.expiresAt || selectedSub.currentPeriodEnd)!)
                      : 'N/A'}
                  </span>
                </div>
              </div>

              {selectedSub.packageId?.features && selectedSub.packageId.features.length > 0 && (
                <div className="pt-2 border-t border-ink-100">
                  <span className="text-xs text-ink-400 block mb-1.5">Package Features:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedSub.packageId.features.map((feat: string, idx: number) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 rounded bg-ink-50 px-2 py-0.5 text-[11px] text-ink-700 border border-ink-100"
                      >
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        {feat}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
