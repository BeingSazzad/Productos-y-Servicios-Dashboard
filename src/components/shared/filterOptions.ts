import type { Option } from '@/types/common.types'

/** Shared filter dropdown options reused across list pages. */

export const ENTITY_STATUS_OPTIONS: Option[] = [
  { label: 'All statuses', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Pending', value: 'pending' },
  { label: 'Suspended', value: 'suspended' },
]

/** User-facing labels — a suspended user is shown as "Banned". */
export const USER_STATUS_OPTIONS: Option[] = [
  { label: 'All users', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  // { label: 'Pending', value: 'pending' },
  // { label: 'Banned', value: 'suspended' },
]

export const SUBSCRIPTION_STATUS_OPTIONS: Option[] = [
  { label: 'All statuses', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Trialing', value: 'trialing' },
  { label: 'Canceled', value: 'canceled' },
  { label: 'Expired', value: 'expired' },
]

export const STORE_TYPE_TABS: Option[] = [
  { label: 'All', value: 'all' },
  { label: 'Product', value: 'product' },
  { label: 'Service', value: 'service' },
]

export const REPORT_STATUS_OPTIONS: Option[] = [
  { label: 'All reports', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'Resolved', value: 'resolved' },
  { label: 'Dismissed', value: 'dismissed' },
]

export const AD_PAYMENT_STATUS_OPTIONS: Option[] = [
  { label: 'All statuses', value: 'all' },
  { label: 'Paid', value: 'PAID' },
  { label: 'Trial', value: 'TRIAL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Failed', value: 'FAILED' },
]

export const TRANSACTION_STATUS_OPTIONS: Option[] = [
  { label: 'All statuses', value: 'all' },
  { label: 'Paid', value: 'Paid' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Failed', value: 'Failed' },
  { label: 'Refunded', value: 'Refunded' },
]

export const SUPPORT_STATUS_OPTIONS: Option[] = [
  { label: 'All tickets', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'Pending', value: 'pending' },
  { label: 'Resolved', value: 'resolved' },
]

export const YEAR_OPTIONS: Option[] = (() => {
  const currentYear = new Date().getFullYear()
  const years: Option[] = []
  for (let i = 0; i < 5; i++) {
    const y = String(currentYear - i)
    years.push({ label: y, value: y })
  }
  return years
})()

