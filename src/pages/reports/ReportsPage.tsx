import { useState } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  ShieldAlert,
  Store as StoreIcon,
  User as UserIcon,
  XCircle,
  Image as ImageIcon,
  Check,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Table, type Column } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'
import { Badge, type BadgeTone } from '@/components/ui/Badge'
import { Avatar } from '@/components/shared/Avatar'
import { SearchInput } from '@/components/shared/SearchInput'
import { toast } from '@/components/ui/Toast'
import { imageUrl } from '@/components/shared/getImageUrl'
import { useDebounce } from '@/hooks/useDebounce'
import {
  useGetReportsQuery,
  useGetReportStatsQuery,
  useUpdateReportStatusMutation,
  type ReportItem,
  type ReportStatus,
  type ReportActionTaken,
} from '@/services/endpoints/reportsApi'
import { formatDistanceToNow, parseISO, format } from 'date-fns'

function formatReportDate(iso?: string) {
  if (!iso) return '—'
  try {
    const d = parseISO(iso)
    return format(d, 'MMM dd, yyyy · hh:mm a')
  } catch {
    return iso
  }
}

function formatRelativeTime(iso?: string) {
  if (!iso) return ''
  try {
    const d = parseISO(iso)
    return formatDistanceToNow(d, { addSuffix: true })
  } catch {
    return ''
  }
}

function formatReason(reason: string) {
  return reason
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

const statusToneMap: Record<ReportStatus, BadgeTone> = {
  pending: 'amber',
  under_review: 'blue',
  resolved: 'green',
  dismissed: 'gray',
}

const actionTakenLabels: Record<ReportActionTaken, string> = {
  none: 'None',
  other: 'Other',
  dismissed_no_violation: 'Dismissed (No Violation)',
  content_removed: 'Content Removed',
  user_blocked: 'User Blocked',
  warning_issued: 'Warning Issued',
  store_suspended: 'Store Suspended',
}

const actionTakenTones: Record<ReportActionTaken, BadgeTone> = {
  none: 'gray',
  other: 'purple',
  dismissed_no_violation: 'gray',
  content_removed: 'red',
  user_blocked: 'red',
  warning_issued: 'amber',
  store_suspended: 'red',
}

export default function ReportsPage() {
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search)

  const { data: stats, isLoading: statsLoading } = useGetReportStatsQuery()

  const { data: reportsData, isFetching: reportsFetching } = useGetReportsQuery({
    page,
    limit: 10,
    status: statusFilter,
    reportType: typeFilter,
    search: debouncedSearch,
  })

  const [updateReportStatus, { isLoading: isUpdating }] = useUpdateReportStatusMutation()

  // Modal State
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editStatus, setEditStatus] = useState<ReportStatus>('pending')
  const [editActionTaken, setEditActionTaken] = useState<ReportActionTaken>('none')
  const [editAdminNotes, setEditAdminNotes] = useState('')

  const handleOpenActionModal = (report: ReportItem) => {
    setSelectedReport(report)
    setEditStatus(report.status)
    setEditActionTaken(report.actionTaken || 'none')
    setEditAdminNotes(report.adminNotes || '')
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setSelectedReport(null)
  }

  const handleSaveReportStatus = async () => {
    if (!selectedReport) return

    try {
      await updateReportStatus({
        id: selectedReport.id,
        status: editStatus,
        actionTaken: editActionTaken,
        adminNotes: editAdminNotes.trim(),
      }).unwrap()

      toast.success('Report updated successfully')
      handleCloseModal()
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update report')
    }
  }

  const reports = reportsData?.reports || []
  const meta = reportsData?.meta || { page: 1, limit: 10, total: 0, totalPage: 1 }

  const columns: Column<ReportItem>[] = [
    {
      key: 'reporter',
      header: 'Reporter',
      render: (r) => (
        <div className="flex items-center gap-3">
          <Avatar
            name={r.reporterId?.name || 'User'}
            src={r.reporterId?.profileImage ? imageUrl(r.reporterId.profileImage) : undefined}
            size="sm"
          />
          <div className="min-w-0">
            <p className="font-medium text-ink-900 truncate">{r.reporterId?.name || 'Anonymous'}</p>
            <p className="text-xs text-ink-500 truncate">{r.reporterId?.email || r.reporterId?.phone || 'No contact'}</p>
            <span className="inline-block text-[11px] text-ink-400 capitalize">
              Role: {r.reporterId?.role || 'user'}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'target',
      header: 'Reported Target',
      render: (r) => {
        const isStore = r.reportType === 'store'
        const target = isStore ? r.targetStore : r.targetUser
        const name = target?.name || (isStore ? 'Unknown Store' : 'Unknown User')

        return (
          <div className="flex items-center gap-2.5">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                isStore ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
              }`}
            >
              {isStore ? <StoreIcon className="h-4 w-4" /> : <UserIcon className="h-4 w-4" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-ink-900 truncate">{name}</span>
                <Badge tone={isStore ? 'purple' : 'blue'} className="px-1.5 py-0 text-[10px]">
                  {r.reportType}
                </Badge>
              </div>
              <p className="text-xs text-ink-500 truncate">
                {isStore ? 'Store Listing' : (target as any)?.email || (target as any)?.phone || 'User account'}
              </p>
            </div>
          </div>
        )
      },
    },
    {
      key: 'reason',
      header: 'Reason & Description',
      render: (r) => (
        <div className="max-w-xs space-y-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 rounded bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800 border border-amber-200/60">
              <AlertTriangle className="h-3 w-3 text-amber-600" />
              {formatReason(r.reason)}
            </span>
            {r.images && r.images.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded bg-ink-100 px-1.5 py-0.5 text-[10px] font-medium text-ink-600">
                <ImageIcon className="h-3 w-3" />
                {r.images.length} {r.images.length === 1 ? 'image' : 'images'}
              </span>
            )}
          </div>
          <p className="text-xs text-ink-600 line-clamp-2 leading-relaxed">
            {r.description || 'No description provided.'}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (r) => (
        <Badge tone={statusToneMap[r.status] || 'gray'} className="capitalize">
          {r.status.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'actionTaken',
      header: 'Action Taken',
      render: (r) => {
        const action = r.actionTaken || 'none'
        return (
          <Badge tone={actionTakenTones[action] || 'gray'}>
            {actionTakenLabels[action] || action}
          </Badge>
        )
      },
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (r) => (
        <div>
          <p className="text-xs text-ink-900 font-medium">{formatRelativeTime(r.createdAt)}</p>
          <p className="text-[11px] text-ink-400">{format(parseISO(r.createdAt), 'MMM dd, yyyy')}</p>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (r) => (
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleOpenActionModal(r)}
            className="gap-1.5"
          >
            <ShieldAlert className="h-3.5 w-3.5 text-brand-600" />
            <span>Take Action</span>
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Moderation"
        description="Review reports submitted by marketplace buyers and sellers. Investigate policy violations and take enforcement actions."
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Card className="flex flex-col justify-between p-4 border border-ink-100 bg-white shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-500">Total Reports</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-100 text-ink-700">
              <FileText className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-ink-900">
            {statsLoading ? '…' : stats?.totalReports ?? 0}
          </p>
          <div className="mt-2 text-[11px] text-ink-400">
            {stats?.userReportsCount ?? 0} user · {stats?.storeReportsCount ?? 0} store
          </div>
        </Card>

        <Card className="flex flex-col justify-between p-4 border border-amber-200 bg-amber-50/30 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">Pending Review</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-amber-900">
            {statsLoading ? '…' : stats?.pendingReports ?? 0}
          </p>
          <div className="mt-2 text-[11px] text-amber-700 font-medium">Needs attention</div>
        </Card>

        <Card className="flex flex-col justify-between p-4 border border-blue-200 bg-blue-50/30 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-800">Under Review</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
              <Eye className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-blue-900">
            {statsLoading ? '…' : stats?.underReviewReports ?? 0}
          </p>
          <div className="mt-2 text-[11px] text-blue-700 font-medium">In investigation</div>
        </Card>

        <Card className="flex flex-col justify-between p-4 border border-emerald-200 bg-emerald-50/30 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800">Resolved</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-emerald-900">
            {statsLoading ? '…' : stats?.resolvedReports ?? 0}
          </p>
          <div className="mt-2 text-[11px] text-emerald-700 font-medium">Action finalized</div>
        </Card>

        <Card className="flex flex-col justify-between p-4 border border-ink-200 bg-ink-50/50 shadow-card col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-ink-600">Dismissed</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-200 text-ink-700">
              <XCircle className="h-4 w-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-ink-900">
            {statsLoading ? '…' : stats?.dismissedReports ?? 0}
          </p>
          <div className="mt-2 text-[11px] text-ink-500">No violation found</div>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border border-ink-100 bg-white shadow-card">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between border-b border-ink-100">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            <div className="w-full sm:w-72">
              <SearchInput
                value={search}
                onChange={(val) => {
                  setSearch(val)
                  setPage(1)
                }}
                placeholder="Search reports or reason…"
              />
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-44">
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
                options={[
                  { label: 'All Statuses', value: 'all' },
                  { label: 'Pending', value: 'pending' },
                  { label: 'Under Review', value: 'under_review' },
                  { label: 'Resolved', value: 'resolved' },
                  { label: 'Dismissed', value: 'dismissed' },
                ]}
              />
            </div>

            {/* Type Filter */}
            <div className="w-full sm:w-44">
              <Select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value)
                  setPage(1)
                }}
                options={[
                  { label: 'All Targets', value: 'all' },
                  { label: 'User Reports', value: 'user' },
                  { label: 'Store Reports', value: 'store' },
                ]}
              />
            </div>
          </div>

          <div className="text-xs text-ink-500">
            Showing <span className="font-semibold text-ink-900">{reports.length}</span> of{' '}
            <span className="font-semibold text-ink-900">{meta.total}</span> reports
          </div>
        </div>

        {/* Table */}
        <Table<ReportItem>
          columns={columns}
          rows={reports}
          rowKey={(r) => r.id}
          loading={reportsFetching}
          emptyTitle="No reports found"
          emptyDescription="No reports found matching your criteria."
          onRowClick={(item) => handleOpenActionModal(item)}
        />

        {/* Pagination */}
        <Pagination
          page={meta.page}
          pageSize={meta.limit}
          total={meta.total}
          onPageChange={setPage}
        />
      </Card>

      {/* Review & Take Action Modal */}
      {selectedReport && (
        <Modal
          open={modalOpen}
          onClose={handleCloseModal}
          size="lg"
          title={
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-brand-600" />
              <span>Review Report</span>
              <Badge tone={statusToneMap[selectedReport.status] || 'gray'} className="capitalize ml-2">
                {selectedReport.status.replace('_', ' ')}
              </Badge>
            </div>
          }
          description={`Report ID: ${selectedReport.id} · Submitted ${formatReportDate(selectedReport.createdAt)}`}
          footer={
            <div className="flex items-center justify-end gap-2.5">
              <Button variant="outline" onClick={handleCloseModal} disabled={isUpdating}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSaveReportStatus}
                loading={isUpdating}
                className="gap-1.5"
              >
                <Check className="h-4 w-4" />
                <span>Save Changes</span>
              </Button>
            </div>
          }
        >
          <div className="space-y-5 py-2">
            {/* Parties info cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Reporter Box */}
              <div className="rounded-lg border border-ink-100 bg-ink-50/60 p-3.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400">
                  Reporter Information
                </span>
                <div className="mt-2.5 flex items-center gap-3">
                  <Avatar
                    name={selectedReport.reporterId?.name || 'User'}
                    src={selectedReport.reporterId?.profileImage ? imageUrl(selectedReport.reporterId.profileImage) : undefined}
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="font-semibold text-ink-900 truncate">
                      {selectedReport.reporterId?.name || 'Anonymous'}
                    </p>
                    <p className="text-xs text-ink-600 truncate">{selectedReport.reporterId?.email || '—'}</p>
                    <p className="text-xs text-ink-400">{selectedReport.reporterId?.phone || 'No phone'}</p>
                  </div>
                </div>
              </div>

              {/* Reported Target Box */}
              <div className="rounded-lg border border-ink-100 bg-ink-50/60 p-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-ink-400">
                    Reported Target
                  </span>
                  <Badge tone={selectedReport.reportType === 'store' ? 'purple' : 'blue'}>
                    {selectedReport.reportType}
                  </Badge>
                </div>
                <div className="mt-2.5 flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                      selectedReport.reportType === 'store'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}
                  >
                    {selectedReport.reportType === 'store' ? (
                      <StoreIcon className="h-5 w-5" />
                    ) : (
                      <UserIcon className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-ink-900 truncate">
                      {selectedReport.reportType === 'store'
                        ? selectedReport.targetStore?.name || 'Unknown Store'
                        : selectedReport.targetUser?.name || 'Unknown User'}
                    </p>
                    <p className="text-xs text-ink-600 truncate">
                      {selectedReport.reportType === 'store'
                        ? 'Store Entity'
                        : selectedReport.targetUser?.email || selectedReport.targetUser?.phone || '—'}
                    </p>
                    <p className="text-xs text-ink-400">
                      ID: {selectedReport.reportType === 'store' ? selectedReport.targetStore?._id : selectedReport.targetUser?._id}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Violation Details */}
            <div className="rounded-lg border border-amber-200/80 bg-amber-50/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-amber-900 uppercase tracking-wider">
                  Reported Reason
                </span>
                <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                  {formatReason(selectedReport.reason)}
                </span>
              </div>
              <p className="mt-2 text-sm text-ink-800 leading-relaxed bg-white/70 p-3 rounded border border-amber-200/50">
                {selectedReport.description || 'No detailed description provided by the reporter.'}
              </p>

              {/* Attachments / Images */}
              {selectedReport.images && selectedReport.images.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs font-medium text-amber-900 mb-1.5">Submitted Evidence Images:</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedReport.images.map((img, idx) => (
                      <a
                        key={idx}
                        href={imageUrl(img)}
                        target="_blank"
                        rel="noreferrer"
                        className="group relative block h-20 w-20 overflow-hidden rounded-lg border border-amber-200 bg-white shadow-sm"
                      >
                        <img
                          src={imageUrl(img)}
                          alt={`Evidence ${idx + 1}`}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Admin Action Form */}
            <div className="space-y-4 rounded-lg border border-ink-200 bg-white p-4">
              <h4 className="text-sm font-semibold text-ink-900 flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-brand-600" />
                Moderation Action & Resolution
              </h4>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Select
                    label="Update Status"
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as ReportStatus)}
                    options={[
                      { label: 'Pending', value: 'pending' },
                      { label: 'Under Review', value: 'under_review' },
                      { label: 'Resolved', value: 'resolved' },
                      { label: 'Dismissed', value: 'dismissed' },
                    ]}
                  />
                </div>

                <div>
                  <Select
                    label="Action Taken"
                    value={editActionTaken}
                    onChange={(e) => setEditActionTaken(e.target.value as ReportActionTaken)}
                    options={[
                      { label: 'None', value: 'none' },
                      { label: 'Warning Issued', value: 'warning_issued' },
                      { label: 'Content Removed', value: 'content_removed' },
                      { label: 'User Blocked', value: 'user_blocked' },
                      { label: 'Store Suspended', value: 'store_suspended' },
                      { label: 'Dismissed (No Violation)', value: 'dismissed_no_violation' },
                      { label: 'Other', value: 'other' },
                    ]}
                  />
                </div>
              </div>

              <div>
                <Textarea
                  label="Admin Notes / Investigation Findings"
                  placeholder="E.g., Investigated transaction logs and found clear evidence of fraud..."
                  value={editAdminNotes}
                  onChange={(e) => setEditAdminNotes(e.target.value)}
                  rows={3}
                  hint="Provide rationale for the action taken. This will be stored for audit and review history."
                />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
