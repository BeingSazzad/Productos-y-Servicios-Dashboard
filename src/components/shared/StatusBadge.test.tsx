import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusBadge, StoreTypeBadge } from './StatusBadge'

describe('StatusBadge Component', () => {
  it('renders active status badge', () => {
    render(<StatusBadge status="active" />)
    expect(screen.getByText(/active/i)).toBeInTheDocument()
  })

  it('renders suspended status badge', () => {
    render(<StatusBadge status="suspended" />)
    expect(screen.getByText(/suspended/i)).toBeInTheDocument()
  })

  it('renders store type badges correctly', () => {
    render(<StoreTypeBadge type="product" />)
    expect(screen.getByText(/product/i)).toBeInTheDocument()
  })
})
