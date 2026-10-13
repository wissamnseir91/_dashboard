import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { toast } from 'sonner'
import { CheckboxToggleGroup } from '@/components/CheckboxToggleGroup'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { usePermissionCatalog } from '@/hooks/usePermissionCatalog'
import { useCreateRole, useUpdateRole } from '@/hooks/useRoles'
import { errorMessage } from '@/lib/errors'
import { PROTECTED_ROLE_NAMES } from '@/lib/roles'
import type { Role } from '@/types'

export function RoleFormDialog({ role, trigger }: { role?: Role; trigger: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(role?.name ?? '')
  const [permissionNames, setPermissionNames] = useState<string[]>(role?.permissions?.map((p) => p.name) ?? [])

  const { data: permissions } = usePermissionCatalog()
  const createRole = useCreateRole()
  const updateRole = useUpdateRole()
  const isEdit = !!role
  const isProtected = isEdit && PROTECTED_ROLE_NAMES.includes(role.name)
  const isPending = createRole.isPending || updateRole.isPending

  useEffect(() => {
    if (open) {
      setName(role?.name ?? '')
      setPermissionNames(role?.permissions?.map((p) => p.name) ?? [])
    }
  }, [open, role])

  const togglePermission = (permissionName: string, checked: boolean) => {
    setPermissionNames((prev) => (checked ? [...prev, permissionName] : prev.filter((p) => p !== permissionName)))
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const payload = { name, permissions: permissionNames }
    const onSuccess = () => {
      toast.success(isEdit ? 'Role updated' : 'Role created')
      setOpen(false)
    }
    const onError = (error: unknown) => toast.error(errorMessage(error))

    if (isEdit) {
      updateRole.mutate({ id: role.id, payload }, { onSuccess, onError })
    } else {
      createRole.mutate(payload, { onSuccess, onError })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? `Edit ${role.name}` : 'New Role'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" required disabled={isProtected} value={name} onChange={(e) => setName(e.target.value)} />
            {isProtected && <p className="text-muted-foreground text-xs">Built-in role — name can't be changed.</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label>Permissions</Label>
            <div className="border-border max-h-64 overflow-y-auto rounded-md border p-3">
              <CheckboxToggleGroup
                options={permissions?.map((p) => ({ value: p.name, label: p.name })) ?? []}
                selected={permissionNames}
                onToggle={togglePermission}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" disabled={!name || isPending}>
              {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Role'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
