import { useState, useEffect, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, Eye, EyeOff, Lock, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Logo } from '@/components/shared/Logo'
import { toast } from '@/components/ui/Toast'
import { useResetPasswordMutation, RESET_PASSWORD_TOKEN_KEY } from '@/services/endpoints/authApi'
import { ROUTES } from '@/constants/routes'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [resetPassword, { isLoading }] = useResetPasswordMutation()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasToken, setHasToken] = useState<boolean>(true)

  useEffect(() => {
    const token =
      typeof localStorage !== 'undefined'
        ? localStorage.getItem(RESET_PASSWORD_TOKEN_KEY) || localStorage.getItem('resettoken')
        : null
    if (!token) {
      setHasToken(false)
    }
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please ensure both fields are identical.')
      return
    }

    try {
      const res = await resetPassword({
        newPassword,
        confirmPassword,
      }).unwrap()

      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem('reset_email')
      }

      toast.success(res?.message || 'Password reset successfully! Please sign in with your new password.')
      navigate(ROUTES.login)
    } catch (err: any) {
      const message =
        err?.data?.message || err?.data || err?.message || 'Failed to reset password. The session may have expired.'
      setError(typeof message === 'string' ? message : 'Password reset failed')
      toast.error(typeof message === 'string' ? message : 'Password reset failed')
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
          {!hasToken ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 ring-1 ring-amber-500/20">
                <ShieldAlert className="h-7 w-7" />
              </div>
              <h2 className="text-xl font-semibold text-ink-900">Session Expired</h2>
              <p className="mt-2 text-sm text-ink-500">
                Your password reset token is missing or has expired. Please request a new verification code.
              </p>
              <Link to={ROUTES.forgotPassword}>
                <Button fullWidth className="mt-6">
                  Request New Code
                </Button>
              </Link>
              <Link
                to={ROUTES.login}
                className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-ink-500 hover:text-ink-900"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign in
              </Link>
            </div>
          ) : (
            <>
              <Link
                to={ROUTES.login}
                className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-ink-500 hover:text-ink-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Sign in
              </Link>

              <div className="mb-8">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-600/10">
                  <Lock className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-semibold text-ink-900">Reset password</h2>
                <p className="mt-1.5 text-sm text-ink-500">
                  Enter and confirm your new password below to regain access to your account.
                </p>
              </div>

              {error && (
                <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-600/20">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Input
                    type={showNewPassword ? 'text' : 'password'}
                    name="newPassword"
                    label="New password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    leftIcon={<Lock className="h-4 w-4" />}
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="text-ink-400 hover:text-ink-600 focus:outline-none"
                        aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    label="Confirm new password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    leftIcon={<Lock className="h-4 w-4" />}
                    rightElement={
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="text-ink-400 hover:text-ink-600 focus:outline-none"
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    }
                    required
                  />
                </div>

                {/* Password match indicator helper */}
                {newPassword && confirmPassword && (
                  <div className="flex items-center gap-1.5 text-xs">
                    {newPassword === confirmPassword ? (
                      <span className="flex items-center gap-1 text-emerald-600 font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Passwords match
                      </span>
                    ) : (
                      <span className="text-red-500 font-medium">
                        Passwords do not match
                      </span>
                    )}
                  </div>
                )}

                <Button type="submit" fullWidth loading={isLoading} className="mt-2">
                  Reset password
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
