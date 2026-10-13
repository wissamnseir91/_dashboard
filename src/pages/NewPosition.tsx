import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { FormField, FormPage } from '@/components/FormPage'
import { Input } from '@/components/ui/input'
import { useCreatePosition } from '@/hooks/usePositions'
import { errorMessage } from '@/lib/errors'

export default function NewPosition() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const createPosition = useCreatePosition()

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    createPosition.mutate(
      { name, code },
      {
        onSuccess: () => {
          toast.success('Position created')
          navigate('/positions')
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  return (
    <FormPage
      title="New Position"
      description="Job titles that can be assigned to employees."
      backTo="/positions"
      backLabel="Back to Positions"
      submitLabel={createPosition.isPending ? 'Saving…' : 'Create Position'}
      submitDisabled={!name || !code || createPosition.isPending}
      onSubmit={handleSubmit}
    >
      <FormField label="Name" htmlFor="name">
        <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
      </FormField>
      <FormField label="Code" htmlFor="code">
        <Input id="code" required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
      </FormField>
    </FormPage>
  )
}
