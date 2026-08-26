import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, DollarSign, Store, Users } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { LoadingState } from '@/components/ui/Spinner'
import { Table, type Column } from '@/components/ui/Table'
import { SubscriptionStatusBadge, StoreTypeBadge } from '@/components/shared/StatusBadge'
import { RevenueChart } from '@/components/dashboard/components/RevenueChart'
import { StoreTypeChart } from '@/components/dashboard/components/StoreTypeChart'
import { YEAR_OPTIONS } from '@/components/shared/filterOptions'
import { useGetDashboardOverviewQuery } from '@/services/endpoints/statsApi'
import { useGetSubscriptionsQuery } from '@/services/endpoints/billingApi'
import { formatCurrency, formatNumber } from '@/lib/utils'
import { ROUTES } from '@/constants/routes'
import type { Subscription } from '@/types/models'

export default function DashboardPage() {
  const navigate = useNavigate()
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString())
  const { data: overview, isLoading: overviewLoading } = useGetDashboardOverviewQuery({ year: selectedYear })
  const { data: subs } = useGetSubscriptionsQuery({ page: 1 })

  const cards = overview?.cards
  const revenueChart = overview?.revenueChart ?? []
  const storeTypesSplit = overview?.storeTypesSplit

  const recentColumns: Column<Subscription>[] = [
    { key: 'store', header: 'Store', render: (s) => <span className="font-medium text-ink-900">{s.storeName}</span> },
    { key: 'type', header: 'Type', render: (s) => <StoreTypeBadge type={s.storeType || 'product'} /> },
    { key: 'plan', header: 'Plan', render: (s) => s.planName },
    { key: 'amount', header: 'Amount', align: 'right', render: (s) => formatCurrency(s.amount) },
    { key: 'status', header: 'Status', render: (s) => <SubscriptionStatusBadge status={s.status} /> },
  ]

  return (
    <div>
      <PageHeader title="Dashboard" description="Marketplace performance at a glance." />

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Users"
          value={cards ? formatNumber(cards.totalUsers) : '—'}
          icon={Users}
          loading={overviewLoading}
        />
        <StatCard
          label="Total Stores"
          value={cards ? formatNumber(cards.totalStores) : '—'}
          icon={Store}
          loading={overviewLoading}
        />
        <StatCard
          label="Active Subscriptions"
          value={cards ? formatNumber(cards.activeSubscriptions) : '—'}
          icon={CreditCard}
          loading={overviewLoading}
        />
        <StatCard
          label="MRR"
          value={cards ? formatCurrency(cards.mrr) : '—'}
          icon={DollarSign}
          loading={overviewLoading}
        />
      </div>

      {/* Charts */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Revenue"
            description="Subscription revenue over the last 12 months"
            action={
              <div className="w-28">
                <Select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  options={YEAR_OPTIONS}
                  className="h-9 py-1 text-xs"
                />
              </div>
            }
          />
          <CardBody>
            {overviewLoading || !overview ? <LoadingState /> : <RevenueChart data={revenueChart} />}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Store Types" description="Product vs service split" />
          <CardBody>
            {overviewLoading || !overview ? <LoadingState /> : <StoreTypeChart split={storeTypesSplit} />}
          </CardBody>
        </Card>
      </div>

      {/* Recent subscriptions */}
      <Card className="mt-6">
        <CardHeader
          title="Recent Subscriptions"
          description="Latest store subscriptions"
          action={
            <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.subscriptions)}>
              View all
            </Button>
          }
        />
        <Table
          columns={recentColumns}
          rows={subs?.items?.slice(0, 6) ?? []}
          rowKey={(s) => s.id}
          loading={!subs}
        />
      </Card>
    </div>
  )
}
