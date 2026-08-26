import { describe, expect, it } from 'vitest'
import { formatDate, formatDateTime, formatRelative } from './format'

describe('format.ts utilities', () => {
  it('formatDate formats ISO string to MMM d, yyyy', () => {
    const iso = '2026-08-08T08:40:32.514Z'
    expect(formatDate(iso)).toBe('Aug 8, 2026')
  })

  it('formatDateTime formats ISO string to MMM d, yyyy · h:mm a', () => {
    const iso = '2026-08-08T08:40:32.514Z'
    expect(formatDateTime(iso)).toContain('Aug 8, 2026')
  })

  it('formatRelative returns a relative time string', () => {
    const pastIso = '2020-01-01T00:00:00.000Z'
    expect(formatRelative(pastIso)).toContain('ago')
  })
})
