import { useState, useRef, useEffect, type FormEvent, type KeyboardEvent, type ClipboardEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ArrowLeft, ShieldCheck, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/shared/Logo'
import { toast } from '@/components/ui/Toast'
import { useVerifyOtpMutation, useResendOtpMutation, RESET_PASSWORD_TOKEN_KEY } from '@/services/endpoints/authApi'
import { ROUTES } from '@/constants/routes'

const OTP_LENGTH = 6
const RESEND_COOLDOWN_SECONDS = 60

export default function VerifyOtpPage() {
  const location = useLocation()
  const navigate = useNavigate()

  const stateEmail = (location.state as { email?: string })?.email
  const savedEmail = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('reset_email') || '' : ''
  const email = stateEmail || savedEmail || ''

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [error, setError] = useState<string | null>(null)
  const [countdown, setCountdown] = useState<number>(RESEND_COOLDOWN_SECONDS)

  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  const [verifyOtp, { isLoading: isVerifying }] = useVerifyOtpMutation()
  const [resendOtp, { isLoading: isResending }] = useResendOtpMutation()

  // Countdown timer for Resend OTP
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [countdown])

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleOtpChange = (index: number, value: string) => {
    setError(null)
    const cleaned = value.replace(/\D/g, '')

    if (!cleaned) {
      const newOtp = [...otp]
      newOtp[index] = ''
      setOtp(newOtp)
      return
    }

    // Handle single digit
    const digit = cleaned.slice(-1)
    const newOtp = [...otp]
    newOtp[index] = digit
    setOtp(newOtp)

    // Advance to next input if available
    if (index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputRefs.current[index - 1]?.focus()
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    setError(null)
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (!pasteData) return

    const newOtp = [...otp]
    for (let i = 0; i < pasteData.length; i++) {
      newOtp[i] = pasteData[i]
    }
    setOtp(newOtp)

    const nextIndex = Math.min(pasteData.length, OTP_LENGTH - 1)
    inputRefs.current[nextIndex]?.focus()
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const fullCode = otp.join('')
    if (fullCode.length < OTP_LENGTH) {
      setError('Please enter the complete 6-digit verification code.')
      return
    }

    if (!email) {
      setError('No email address provided. Please return to the previous page.')
      return
    }

    setError(null)
    try {
      const codeNum = parseInt(fullCode, 10)
      const res = await verifyOtp({
        email,
        oneTimeCode: codeNum,
      }).unwrap()

      if (res.resetToken && typeof localStorage !== 'undefined') {
        localStorage.setItem(RESET_PASSWORD_TOKEN_KEY, res.resetToken)
        localStorage.setItem('resettoken', res.resetToken)
      }

      toast.success(res.message || 'Verification successful! You can now reset your password.')
      navigate(ROUTES.resetPassword)
    } catch (err: any) {
      const message = err?.data?.message || err?.data || err?.message || 'Invalid or expired verification code.'
      setError(typeof message === 'string' ? message : 'Verification failed')
      toast.error(typeof message === 'string' ? message : 'Verification failed')
    }
  }

  const handleResend = async () => {
    if (countdown > 0 || isResending || !email) return
    setError(null)

    try {
      const res = await resendOtp({ email }).unwrap()
      toast.success(res?.message || 'A new verification code has been sent.')
      setCountdown(RESEND_COOLDOWN_SECONDS)
      setOtp(Array(OTP_LENGTH).fill(''))
      inputRefs.current[0]?.focus()
    } catch (err: any) {
      const message = err?.data?.message || err?.data || err?.message || 'Failed to resend verification code.'
      toast.error(typeof message === 'string' ? message : 'Failed to resend OTP')
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
            to={ROUTES.forgotPassword}
            className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-ink-500 hover:text-ink-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Change email
          </Link>

          <div className="mb-8">
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-600 ring-1 ring-brand-600/10">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-semibold text-ink-900">Verify your email</h2>
            <p className="mt-1.5 text-sm text-ink-500">
              We sent a 6-digit code to{' '}
              <span className="font-semibold text-ink-900">{email || 'your email'}</span>.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-600/20">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 6-Digit OTP Inputs */}
            <div>
              <label className="mb-2 block text-sm font-medium text-ink-700 text-center">
                Enter verification code
              </label>
              <div className="flex items-center justify-between gap-2">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => {
                      inputRefs.current[index] = el
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    className="h-12 w-12 rounded-lg border border-ink-200 bg-white text-center text-xl font-bold text-ink-900 shadow-sm transition-all focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30"
                    aria-label={`Digit ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            <Button
              type="submit"
              fullWidth
              loading={isVerifying}
              disabled={otp.join('').length < OTP_LENGTH}
            >
              Verify code
            </Button>
          </form>

          {/* Resend Section */}
          <div className="mt-6 flex flex-col items-center gap-3">
            <div className="text-center text-sm text-ink-500">
              Didn't receive the code?{' '}
              {countdown > 0 ? (
                <span className="font-medium text-ink-700">
                  Resend in <span className="tabular-nums font-semibold text-brand-600">{countdown}s</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="font-semibold text-brand-600 hover:text-brand-700 hover:underline disabled:opacity-50 inline-flex items-center gap-1"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isResending ? 'animate-spin' : ''}`} />
                  Resend code
                </button>
              )}
            </div>

            <Link
              to={ROUTES.login}
              className="text-xs font-medium text-ink-400 hover:text-ink-600 transition-colors"
            >
              Back to Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
