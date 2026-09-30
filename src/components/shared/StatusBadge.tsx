import { Badge, type BadgeTone } from '@/components/ui/Badge'
import type { EntityStatus } from '@/types/common.types'
import type {
  ContentStatus,
  ReportSeverity,
  ReportStatus,
  StoreType,
  SubscriptionStatus,
  SupportStatus,
  TransactionStatus,
} from '@/types/models'

/* Centralized status → tone/label maps so every screen renders the same
   status the same way. Add a status here once; the whole app stays in sync. */

const entityTone: Record<EntityStatus, BadgeTone> = {
  active: 'green',
  inactive: 'gray',
  pending: 'amber',
  suspended: 'red',
  rejected: 'red',
  under_review: 'blue',
}

const subscriptionTone: Record<SubscriptionStatus, BadgeTone> = {
  active: 'green',
  trialing: 'blue',
  past_due: 'amber',
  canceled: 'gray',
  expired: 'red',
}

const subscriptionLabel: Record<SubscriptionStatus, string> = {
  active: 'active',
  trialing: 'trialing',
  past_due: 'past due',
  canceled: 'canceled',
  expired: 'expired',
}

export function StatusBadge({ status }: { status: EntityStatus }) {
  return <Badge tone={entityTone[status]}>{status}</Badge>
}

export function SubscriptionStatusBadge({ status }: { status: SubscriptionStatus | string }) {
  const s = status as SubscriptionStatus
  const tone = subscriptionTone[s] || 'gray'
  const label = subscriptionLabel[s] || status
  return <Badge tone={tone}>{label}</Badge>
}

export function StoreTypeBadge({ type }: { type: StoreType }) {
  return <Badge tone={type === 'product' ? 'blue' : 'purple'}>{type}</Badge>
}

const reportTone: Record<ReportStatus, BadgeTone> = {
  open: 'amber',
  resolved: 'green',
  dismissed: 'gray',
}
export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  return <Badge tone={reportTone[status]}>{status}</Badge>
}

const severityTone: Record<ReportSeverity, BadgeTone> = {
  low: 'gray',
  medium: 'amber',
  high: 'red',
}
export function SeverityBadge({ severity }: { severity: ReportSeverity }) {
  return <Badge tone={severityTone[severity]}>{severity}</Badge>
}

const txTone: Record<TransactionStatus, BadgeTone> = {
  paid: 'green',
  pending: 'amber',
  failed: 'red',
  refunded: 'gray',
}
export function TransactionStatusBadge({ status }: { status: TransactionStatus | string }) {
  const s = String(status || '').toLowerCase() as TransactionStatus
  const label = s ? s.charAt(0).toUpperCase() + s.slice(1) : '—'
  return <Badge tone={txTone[s] || 'gray'}>{label}</Badge>
}

const adPaymentTone: Record<string, BadgeTone> = {
  PAID: 'green',
  TRIAL: 'blue',
  PENDING: 'amber',
  FAILED: 'red',
  REFUNDED: 'gray',
}

export function AdvertisementPaymentStatusBadge({ status }: { status?: string }) {
  const key = (status || '').toUpperCase()
  return <Badge tone={adPaymentTone[key] || 'gray'}>{status || 'unknown'}</Badge>
}

export function ContentStatusBadge({ status }: { status: ContentStatus }) {
  return <Badge tone={status === 'published' ? 'green' : 'gray'}>{status}</Badge>
}

const supportTone: Record<SupportStatus, BadgeTone> = {
  open: 'amber',
  pending: 'blue',
  resolved: 'green',
}
export function SupportStatusBadge({ status }: { status: SupportStatus }) {
  return <Badge tone={supportTone[status]}>{status}</Badge>
}
