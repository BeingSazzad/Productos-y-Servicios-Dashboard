import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Pagination } from './Pagination'

describe('Pagination Component', () => {
  it('renders page info and total counts', () => {
    render(<Pagination page={1} pageSize={10} total={25} onPageChange={() => {}} />)
    expect(screen.getByText(/showing/i)).toBeInTheDocument()
    expect(screen.getByText(/page/i)).toBeInTheDocument()
  })

  it('disables Prev button on first page and triggers Next on click', async () => {
    const user = userEvent.setup()
    const handlePageChange = vi.fn()

    render(<Pagination page={1} pageSize={10} total={25} onPageChange={handlePageChange} />)

    const prevButton = screen.getByRole('button', { name: /prev/i })
    const nextButton = screen.getByRole('button', { name: /next/i })

    expect(prevButton).toBeDisabled()
    expect(nextButton).not.toBeDisabled()

    await user.click(nextButton)
    expect(handlePageChange).toHaveBeenCalledWith(2)
  })

  it('disables Next button on last page', () => {
    render(<Pagination page={3} pageSize={10} total={25} onPageChange={() => {}} />)
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
  })
})
