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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PositionFormDialog } from '@/components/positions/PositionFormDialog'
import { useDeletePosition, usePositions } from '@/hooks/usePositions'
import { useCan } from '@/hooks/usePermissions'
import { errorMessage } from '@/lib/errors'

const PAGE_SIZE = 10

export default function Positions() {
  const { data: positions, isLoading } = usePositions()
  const deletePosition = useDeletePosition()
  const canManage = useCan('positions.manage')
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const totalPages = Math.max(1, Math.ceil((positions?.length ?? 0) / PAGE_SIZE))
  const pagedPositions = positions?.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => {
    if (!canManage) {
      navigate('/requests', { replace: true })
    }
  }, [canManage, navigate])

  if (!canManage) {
    return null
  }

  const handleDelete = (id: number) => {
    deletePosition.mutate(id, {
      onSuccess: () => toast.success('Position deleted'),
      onError: (error) => toast.error(errorMessage(error)),
    })
  }

  return (
    <div className="flex flex-col gap-6 pb-16">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Positions</h1>
          <p className="text-muted-foreground text-sm">Job titles that can be assigned to employees.</p>
        </div>
      </div>

      <div className="border-border rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Code</TableHead>
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
            {pagedPositions?.map((position) => (
              <TableRow key={position.id}>
                <TableCell className="font-medium">{position.name}</TableCell>
                <TableCell>
                  <span className="bg-muted rounded px-1.5 py-0.5 font-mono text-xs">{position.code}</span>
                </TableCell>
                <TableCell>
                  <div className="flex justify-end gap-1">
                    <PositionFormDialog
                      position={position}
                      trigger={
                        <Button variant="ghost" size="icon" className="size-8">
                          <Pencil className="size-4" />
                        </Button>
                      }
                    />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive size-8">
                          <Trash2 className="size-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete {position.name}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This can't be undone. Positions with members assigned to them can't be deleted.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(position.id)}>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <FloatingActions>
        <Button size="lg" onClick={() => navigate('/positions/new')}>
          <Plus /> New Position
        </Button>
      </FloatingActions>
    </div>
  )
}
