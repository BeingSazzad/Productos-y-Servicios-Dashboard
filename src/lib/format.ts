import { format, formatDistanceToNow, parseISO } from 'date-fns'

/** Format an ISO date string as "MMM d, yyyy". */
export function formatDate(iso: string) {
  return format(parseISO(iso), 'MMM d, yyyy')
}

/** Format an ISO date string as "MMM d, yyyy · h:mm a". */
export function formatDateTime(iso: string) {
  return format(parseISO(iso), 'MMM d, yyyy · h:mm a')
}

/** Relative time, e.g. "3 hours ago". */
export function formatRelative(iso: string) {
  return formatDistanceToNow(parseISO(iso), { addSuffix: true })
}

/**
 * Format message time:
 * - If sent today: shows time only ("3:38 PM")
 * - If sent before today: shows date and time ("Aug 19, 3:38 PM")
 */
export function formatMessageTime(iso?: string) {
  if (!iso) return ''
  try {
    const date = parseISO(iso)
    const now = new Date()
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear()

    return isToday ? format(date, 'h:mm a') : format(date, 'MMM d, h:mm a')
  } catch {
    return ''
  }
}

export const DURATION_LABEL_MAP: Record<string, string> = {
  seven_days: '7 Days',
  one_month: '1 Month',
  three_month: '3 Months',
  six_month: '6 Months',
  one_year: '1 Year',
}

export function formatDurationLabel(duration?: string): string {
  if (!duration) return ''
  if (DURATION_LABEL_MAP[duration]) return DURATION_LABEL_MAP[duration]
  return duration.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export const PACKAGE_TYPE_LABEL_MAP: Record<string, string> = {
  store_creation: 'Store Creation',
  store_growth: 'Store Growth',
  post_add: 'Post Add',
}

export function formatPackageTypeLabel(type?: string): string {
  if (!type) return ''
  if (PACKAGE_TYPE_LABEL_MAP[type]) return PACKAGE_TYPE_LABEL_MAP[type]
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

