import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { CheckboxToggleGroup } from '@/components/CheckboxToggleGroup'
import { FormField, FormPage } from '@/components/FormPage'
import { Input } from '@/components/ui/input'
import { usePermissionCatalog } from '@/hooks/usePermissionCatalog'
import { useCreateRole } from '@/hooks/useRoles'
import { errorMessage } from '@/lib/errors'

export default function NewRole() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [permissionNames, setPermissionNames] = useState<string[]>([])
  const { data: permissions } = usePermissionCatalog()
  const createRole = useCreateRole()

  const togglePermission = (permissionName: string, checked: boolean) => {
    setPermissionNames((prev) => (checked ? [...prev, permissionName] : prev.filter((p) => p !== permissionName)))
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    createRole.mutate(
      { name, permissions: permissionNames },
      {
        onSuccess: () => {
          toast.success('Role created')
          navigate('/roles')
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  return (
    <FormPage
      title="New Role"
      description="Name the role and choose the permissions it grants."
      backTo="/roles"
      backLabel="Back to Roles"
      submitLabel={createRole.isPending ? 'Saving…' : 'Create Role'}
      submitDisabled={!name || createRole.isPending}
      onSubmit={handleSubmit}
    >
      <FormField label="Name" htmlFor="name">
        <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
      </FormField>
      <FormField label="Permissions">
        <div className="border-border max-h-80 overflow-y-auto rounded-md border p-3">
          <CheckboxToggleGroup
            options={permissions?.map((p) => ({ value: p.name, label: p.name })) ?? []}
            selected={permissionNames}
            onToggle={togglePermission}
          />
        </div>
      </FormField>
    </FormPage>
  )
}
