import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ModalProps {
  open: boolean
  onClose: () => void
  title?: ReactNode
  description?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizes = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-3xl' }

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  const [mounted, setMounted] = useState(open)
  const [active, setActive] = useState(open)

  useEffect(() => {
    if (open) {
      setMounted(true)
      const timer = setTimeout(() => setActive(true), 10)
      document.body.style.overflow = 'hidden'
      return () => clearTimeout(timer)
    } else {
      setActive(false)
      const timer = setTimeout(() => {
        setMounted(false)
        document.body.style.overflow = ''
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with smooth fade transition */}
      <div
        className={cn(
          'absolute inset-0 bg-ink-900/40 backdrop-blur-sm transition-opacity duration-200 ease-out',
          active ? 'opacity-100' : 'opacity-0',
        )}
        onClick={onClose}
      />

      {/* Modal Box with smooth scale & fade-in/out transition */}
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          'relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-xl bg-white shadow-dropdown transition-all duration-200 ease-out transform',
          sizes[size],
          active ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2',
        )}
      >
        {(title || description) && (
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-ink-100 p-5">
            <div>
              {title && <h2 className="text-lg font-semibold text-ink-900">{title}</h2>}
              {description && <p className="mt-0.5 text-sm text-ink-500">{description}</p>}
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-ink-500 hover:bg-ink-100 transition-colors"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        )}
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
        {footer && (
          <div className="flex shrink-0 justify-end gap-3 border-t border-ink-100 p-5">{footer}</div>
        )}
      </div>
    </div>,
    document.body,
  )
}
