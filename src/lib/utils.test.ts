import { describe, expect, it } from 'vitest'
import { cn, colorFromString, formatCurrency, formatNumber, getInitials, stripHtml } from './utils'

describe('utils.ts utilities', () => {
  it('cn merges Tailwind CSS class names correctly', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
    expect(cn('bg-red-500', { 'text-white': true })).toBe('bg-red-500 text-white')
  })

  it('formatCurrency formats numbers into formatted currency strings', () => {
    expect(formatCurrency(100)).toBe('$100')
    expect(formatCurrency(128.53)).toBe('$128.53')
  })

  it('formatNumber formats compact numbers', () => {
    expect(formatNumber(12500)).toBe('12.5K')
  })

  it('stripHtml strips HTML tags from input string', () => {
    expect(stripHtml('<p>Hello <strong>World</strong></p>')).toBe('Hello World')
  })

  it('getInitials extracts upper case initials from full names', () => {
    expect(getInitials('Moshfiqur Rahman')).toBe('MR')
    expect(getInitials('John')).toBe('J')
  })

  it('colorFromString generates consistent hex color from string seed', () => {
    const color1 = colorFromString('Moshfiqur Rahman')
    const color2 = colorFromString('Moshfiqur Rahman')
    expect(color1).toBe(color2)
    expect(color1).toMatch(/^#[0-9a-fA-F]{6}$/)
  })
})
