import { ArrowLeft } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useForgotPassword } from '@/hooks/useAuth'
import { errorMessage } from '@/lib/errors'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const forgotPassword = useForgotPassword()

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    forgotPassword.mutate(email, {
      onSuccess: () => setSent(true),
      onError: (error) => toast.error(errorMessage(error)),
    })
  }

  return (
    <div className="bg-muted/40 flex min-h-svh items-center justify-center p-6">
      <div
        className="rounded-[3.5rem] p-1"
        style={{ background: 'linear-gradient(180deg, var(--primary) 10%, transparent 55%)' }}
      >
        <div className="bg-background w-full max-w-md rounded-[3.3rem] px-8 py-16 sm:px-20">
          <Link
            to="/login"
            className="text-muted-foreground hover:text-foreground mb-4 inline-flex items-center gap-2 text-sm font-medium"
          >
            <ArrowLeft className="size-4" /> Back
          </Link>

          <div className="mb-8 flex flex-col items-center text-center">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">Forgot Password?</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Enter your email address associated with your account.
            </p>
          </div>

          {sent ? (
            <p className="text-center text-sm">If that email is registered, a reset link is on its way. Check your inbox.</p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <Button type="submit" className="mt-2 w-full" disabled={forgotPassword.isPending}>
                {forgotPassword.isPending ? 'Sending…' : 'Send Reset Link'}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
