import type { FormEvent, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface FormPageProps {
  title: string
  description?: string
  backTo: string
  backLabel: string
  submitLabel: string
  submitDisabled?: boolean
  onSubmit: (event: FormEvent) => void
  children: ReactNode
}

/** Full-page "new record" form: back link, title, a card of fields, and a Cancel / Submit footer. */
export function FormPage({
  title,
  description,
  backTo,
  backLabel,
  submitLabel,
  submitDisabled,
  onSubmit,
  children,
}: FormPageProps) {
  const navigate = useNavigate()

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <Button variant="ghost" size="sm" className="mb-1 -ml-2" onClick={() => navigate(backTo)}>
          ← {backLabel}
        </Button>
        <h1 className="font-heading text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>

      <form onSubmit={onSubmit}>
        <Card>
          <CardContent className="flex flex-col gap-5">{children}</CardContent>
        </Card>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => navigate(backTo)}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitDisabled}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </div>
  )
}

export function FormField({ label, htmlFor, children }: { label: string; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={htmlFor} className="text-sm leading-none font-medium">
        {label}
      </label>
      {children}
    </div>
  )
}
