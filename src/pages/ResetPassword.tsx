import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useResetPassword } from '@/hooks/useAuth'
import { errorMessage } from '@/lib/errors'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const email = searchParams.get('email') ?? ''

  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const resetPassword = useResetPassword()
  const navigate = useNavigate()

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    resetPassword.mutate(
      { token, email, password, password_confirmation: passwordConfirmation },
      {
        onSuccess: () => {
          toast.success('Password reset — sign in with your new password')
          navigate('/login')
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  if (!token || !email) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm text-center">
          <p className="text-sm">This reset link is invalid or incomplete.</p>
          <Link to="/forgot-password" className="text-primary mt-4 block text-sm hover:underline">
            Request a new one
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <Logo />
        </div>

        <h1 className="font-heading text-2xl font-semibold tracking-tight">Set a new password</h1>
        <p className="text-muted-foreground mt-1 text-sm">for {email}</p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password_confirmation">Confirm password</Label>
            <Input
              id="password_confirmation"
              type="password"
              required
              autoComplete="new-password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
            />
          </div>
          <Button type="submit" className="mt-2 w-full" disabled={resetPassword.isPending}>
            {resetPassword.isPending ? 'Resetting…' : 'Reset Password'}
          </Button>
        </form>
      </div>
    </div>
  )
}
