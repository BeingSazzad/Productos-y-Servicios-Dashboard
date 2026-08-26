import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, KeyRound, Mail } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Logo } from '@/components/shared/Logo'
import { toast } from '@/components/ui/Toast'
import { useForgotPasswordMutation } from '@/services/endpoints/authApi'
import { ROUTES } from '@/constants/routes'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation()

  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setError(null)
    try {
      const res = await forgotPassword({ email: email.trim() }).unwrap()
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('reset_email', email.trim())
      }
      toast.success(res?.message || 'Verification code sent to your email!')
      navigate(ROUTES.verifyOtp, { state: { email: email.trim() } })
    } catch (err: any) {
      const message = err?.data?.message || err?.data || err?.message || 'Failed to send verification code. Please check your email.'
      setError(typeof message === 'string' ? message : 'Failed to send code')
      toast.error(typeof message === 'string' ? message : 'Failed to send code')
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Brand panel */}
      <div className="hidden flex-1 flex-col justify-between bg-brand-600 p-12 text-white lg:flex">
        <Logo light className="rounded-lg bg-white/10 px-3 py-2" />
        <div>
          <h1 className="text-4xl font-semibold leading-tight">
            Run your marketplace<br />from one place.
          </h1>
          <p className="mt-4 max-w-md text-brand-50">
            Manage users, stores, subscriptions and conversations across product and service
            sellers — all from the Julio control center.
          </p>
        </div>
        <p className="text-sm text-brand-100">© 2026 Productos y Servicios. All rights reserved.</p>
      </div>

      {/* Form */}
      <div className="flex flex-1 items-center justify-center p-6 bg-surface-base">
        <div className="w-full max-w-sm">
          <Link
            to={ROUTES.login}
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-ink-500 hover:text-ink-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign in
          </Link>

          <div className="mb-8">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-600/10">
              <KeyRound className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-semibold text-ink-900">Forgot password?</h2>
            <p className="mt-1.5 text-sm text-ink-500">
              No worries, enter your account email and we'll send you a 6-digit verification code.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-600/20">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              name="email"
              label="Account email"
              placeholder="admin@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="h-4 w-4" />}
              required
              autoFocus
            />

            <Button type="submit" fullWidth loading={isLoading} className="mt-2">
              Send verification code
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-ink-400">
            Remember your password?{' '}
            <Link to={ROUTES.login} className="font-semibold text-brand-600 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
