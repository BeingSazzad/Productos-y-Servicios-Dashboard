import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Avatar } from './Avatar'

describe('Avatar Component', () => {
  it('renders initials when no image src is provided', () => {
    render(<Avatar name="Moshfiqur Rahman" />)
    expect(screen.getByText('MR')).toBeInTheDocument()
  })

  it('renders image when src is provided', () => {
    render(<Avatar name="Moshfiqur Rahman" src="https://example.com/profile.png" />)
    const img = screen.getByRole('img', { name: /moshfiqur rahman/i })
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/profile.png')
  })
})
