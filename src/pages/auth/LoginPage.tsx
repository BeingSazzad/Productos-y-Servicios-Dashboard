import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Logo } from '@/components/shared/Logo'
import { useLoginMutation } from '@/services/endpoints/authApi'
import { useAppDispatch } from '@/store/hooks'
import { setCredentials } from '@/components/auth/authSlice'
import { ROUTES } from '@/constants/routes'

export default function LoginPage() {
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const [login, { isLoading }] = useLoginMutation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? ROUTES.dashboard

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const result = await login({ email, password }).unwrap()
      dispatch(setCredentials(result))
      navigate(from, { replace: true })
    } catch (err: any) {
      const message = err?.data?.message || err?.data || err?.message || 'Unable to sign in. Please try again.'
      setError(typeof message === 'string' ? message : 'Login failed')
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
        <form onSubmit={handleSubmit} className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-ink-900">Welcome back</h2>
            <p className="mt-1 text-sm text-ink-500">Sign in to your admin account to continue.</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-600/20">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <Input
              type="email"
              name="email"
              label="Email"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="h-4 w-4" />}
              required
              autoFocus
            />

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-ink-700">
                  Password
                </label>
                <Link
                  to={ROUTES.forgotPassword}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                type={showPassword ? 'text' : 'password'}
                name="password"
                id="password"
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="h-4 w-4" />}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-ink-400 hover:text-ink-600 focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
                required
              />
            </div>
          </div>

          <Button type="submit" fullWidth loading={isLoading} className="mt-6">
            Sign in
          </Button>
        </form>
      </div>
    </div>
  )
}
