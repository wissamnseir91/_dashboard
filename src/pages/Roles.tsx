import { Pencil, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { FloatingActions } from '@/components/FloatingActions'
import { Button } from '@/components/ui/button'
import { TablePagination } from '@/components/TablePagination'
import { TagList } from '@/components/TagList'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { RoleFormDialog } from '@/components/roles/RoleFormDialog'
import { useDeleteRole, useRoles } from '@/hooks/useRoles'
import { useCan } from '@/hooks/usePermissions'
import { errorMessage } from '@/lib/errors'
import { PROTECTED_ROLE_NAMES } from '@/lib/roles'

const PAGE_SIZE = 10

export default function Roles() {
  const { data: roles, isLoading } = useRoles()
  const deleteRole = useDeleteRole()
  const canManage = useCan('roles.manage')
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil((roles?.length ?? 0) / PAGE_SIZE))
  const pagedRoles = roles?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => {
    if (!canManage) {
      navigate('/requests', { replace: true })
    }
  }, [canManage, navigate])

  if (!canManage) {
    return null
  }

  const handleDelete = (id: number) => {
    deleteRole.mutate(id, {
      onSuccess: () => toast.success('Role deleted'),
      onError: (error) => toast.error(errorMessage(error)),
    })
  }

  return (
    <div className="flex flex-col gap-6 pb-16">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Roles</h1>
          <p className="text-muted-foreground text-sm">Roles and the permissions they grant.</p>
        </div>
      </div>

      <div className="border-border rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={3} className="text-muted-foreground text-center">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {pagedRoles?.map((role) => {
              const isProtected = PROTECTED_ROLE_NAMES.includes(role.name)

              return (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    <TagList items={role.permissions?.map((p) => p.name) ?? []} />
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      {role.name !== 'Administrator' && (
                        <RoleFormDialog
                          role={role}
                          trigger={
                            <Button variant="ghost" size="icon" className="size-8">
                              <Pencil className="size-4" />
                            </Button>
                          }
                        />
                      )}
                      {!isProtected && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive size-8">
                              <Trash2 className="size-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete {role.name}?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This can't be undone. Roles still assigned to users can't be deleted.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(role.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <FloatingActions>
        <Button size="lg" onClick={() => navigate('/roles/new')}>
          <Plus /> New Role
        </Button>
      </FloatingActions>
    </div>
  )
}
