import { Eye, EyeOff } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLogin, useVerifyOtp } from '@/hooks/useAuth'
import { errorMessage } from '@/lib/errors'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  // Set only when the server responds with requires_otp — everywhere OTP
  // is disabled (local dev, by default) this never becomes true and the
  // form below never renders.
  const [otpEmail, setOtpEmail] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const login = useLogin()
  const verifyOtp = useVerifyOtp()
  const navigate = useNavigate()

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    login.mutate(
      { email, password, remember },
      {
        onSuccess: (data) => {
          if ('requires_otp' in data) {
            setOtpEmail(data.email)
          } else {
            navigate('/requests')
          }
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  const handleVerifyOtp = (event: FormEvent) => {
    event.preventDefault()
    if (!otpEmail) return

    verifyOtp.mutate(
      { email: otpEmail, code, remember },
      {
        onSuccess: () => navigate('/requests'),
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  const handleResendCode = () => {
    login.mutate(
      { email, password, remember },
      {
        onSuccess: () => toast.success('A new code has been sent.'),
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="bg-primary text-primary-foreground hidden flex-col justify-end p-12 lg:flex">
        <h2 className="font-heading max-w-md text-5xl leading-tight font-semibold tracking-tight">Management Dashboard</h2>
        <p className="text-primary-foreground/80 mt-4 max-w-md text-lg">
          Tickets and your team — all in one place.
        </p>
      </div>

      <div className="bg-background flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="font-heading text-3xl font-semibold tracking-tight">
              <span className="lg:hidden">Management Dashboard</span>
              <span className="hidden lg:inline">Sign in</span>
            </h1>
            <p className="text-muted-foreground mt-1 font-medium">
              {otpEmail ? `Enter the code sent to ${otpEmail}` : 'Enter your credentials to continue'}
            </p>
          </div>

          {otpEmail ? (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="code">Verification code</Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="6-digit code"
                  required
                  autoFocus
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>

              <Button type="submit" className="mt-2 w-full" disabled={verifyOtp.isPending}>
                {verifyOtp.isPending ? 'Verifying…' : 'Verify'}
              </Button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => {
                    setOtpEmail(null)
                    setCode('')
                  }}
                  className="font-medium hover:underline"
                >
                  Back to sign in
                </button>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={login.isPending}
                  className="font-medium hover:underline disabled:opacity-50"
                >
                  Resend code
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Email address"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Password"
                    required
                    autoComplete="current-password"
                    className="pr-9"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex w-9 items-center justify-center"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember"
                    checked={remember}
                    onCheckedChange={(checked) => setRemember(checked === true)}
                  />
                  <Label htmlFor="remember" className="text-sm font-normal">
                    Remember me
                  </Label>
                </div>
                <Link to="/forgot-password" className="text-sm font-medium hover:underline">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" className="mt-2 w-full" disabled={login.isPending}>
                {login.isPending ? 'Signing in…' : 'Sign In'}
              </Button>
            </form>
          )}

          <p className="text-muted-foreground mt-8 text-center text-sm">
            Demo login: <span className="font-medium">admin@example.com</span> / <span className="font-medium">password</span>
          </p>
        </div>
      </div>
    </div>
  )
}
