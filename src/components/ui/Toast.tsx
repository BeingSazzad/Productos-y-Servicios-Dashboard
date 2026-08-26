import { useState, useEffect } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
}

type ToastListener = (msg: ToastMessage) => void
let toastListeners: ToastListener[] = []

export const toast = {
  success: (message: string) => {
    const msg: ToastMessage = { id: Math.random().toString(36).slice(2), type: 'success', message }
    toastListeners.forEach((fn) => fn(msg))
  },
  error: (message: string) => {
    const msg: ToastMessage = { id: Math.random().toString(36).slice(2), type: 'error', message }
    toastListeners.forEach((fn) => fn(msg))
  },
  info: (message: string) => {
    const msg: ToastMessage = { id: Math.random().toString(36).slice(2), type: 'info', message }
    toastListeners.forEach((fn) => fn(msg))
  },
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  useEffect(() => {
    const listener = (msg: ToastMessage) => {
      setToasts((prev) => [...prev, msg])
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== msg.id))
      }, 4000)
    }
    toastListeners.push(listener)
    return () => {
      toastListeners = toastListeners.filter((l) => l !== listener)
    }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-center justify-between gap-3 p-3.5 rounded-lg shadow-dropdown border text-sm font-medium transition-all animate-fade-in ${
            t.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : t.type === 'error'
              ? 'bg-red-50 text-red-900 border-red-200'
              : 'bg-blue-50 text-blue-900 border-blue-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {t.type === 'success' && <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />}
            {t.type === 'error' && <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />}
            {t.type === 'info' && <Info className="h-5 w-5 text-blue-600 shrink-0" />}
            <span>{t.message}</span>
          </div>
          <button
            onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
            className="text-ink-400 hover:text-ink-700 p-0.5 rounded"
            aria-label="Close Toast"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
