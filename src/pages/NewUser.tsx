import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { FormField, FormPage } from '@/components/FormPage'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { usePositions } from '@/hooks/usePositions'
import { useRoles } from '@/hooks/useRoles'
import { useCreateUser } from '@/hooks/useUsers'
import { errorMessage } from '@/lib/errors'

const DEFAULT_ROLE = 'Employee'

export default function NewUser() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [positionId, setPositionId] = useState('')
  const [role, setRole] = useState(DEFAULT_ROLE)
  const [employeeCode, setEmployeeCode] = useState('')
  const [hireDate, setHireDate] = useState('')

  const { data: positions } = usePositions()
  const { data: roles } = useRoles()
  const createUser = useCreateUser()

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    createUser.mutate(
      {
        name,
        email,
        position_id: Number(positionId),
        role,
        employee_code: employeeCode || undefined,
        hire_date: hireDate || undefined,
      },
      {
        onSuccess: () => {
          toast.success(`User created — a welcome email with login details was sent to ${email}`)
          navigate('/users')
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  return (
    <FormPage
      title="New User"
      description="A temporary password will be generated and emailed to this address."
      backTo="/users"
      backLabel="Back to Users"
      submitLabel={createUser.isPending ? 'Saving…' : 'Create User'}
      submitDisabled={!name || !email || !positionId || !role || createUser.isPending}
      onSubmit={handleSubmit}
    >
      <FormField label="Name" htmlFor="name">
        <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
      </FormField>

      <FormField label="Email" htmlFor="email">
        <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField label="Position" htmlFor="position">
          <Select value={positionId} onValueChange={setPositionId}>
            <SelectTrigger id="position" className="w-full">
              <SelectValue placeholder="Select a position" />
            </SelectTrigger>
            <SelectContent>
              {positions?.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Role" htmlFor="role">
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger id="role" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roles?.map((r) => (
                <SelectItem key={r.id} value={r.name}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="User ID" htmlFor="employee_code">
          <Input id="employee_code" value={employeeCode} onChange={(e) => setEmployeeCode(e.target.value)} />
        </FormField>

        <FormField label="Hire Date" htmlFor="hire_date">
          <Input id="hire_date" type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} />
        </FormField>
      </div>
    </FormPage>
  )
}
