import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Switch } from './Switch'

describe('Switch Component', () => {
  it('renders unchecked switch and handles toggle click', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()

    render(<Switch checked={false} onChange={handleChange} label="Toggle Active" />)

    const switchBtn = screen.getByRole('switch', { name: /toggle active/i })
    expect(switchBtn).toHaveAttribute('aria-checked', 'false')

    await user.click(switchBtn)
    expect(handleChange).toHaveBeenCalledWith(true)
  })

  it('renders checked switch state correctly', () => {
    render(<Switch checked={true} onChange={() => {}} label="Toggle Active" />)
    const switchBtn = screen.getByRole('switch', { name: /toggle active/i })
    expect(switchBtn).toHaveAttribute('aria-checked', 'true')
  })
})
