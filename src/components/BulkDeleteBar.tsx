import { Trash2 } from 'lucide-react'
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
import { Button } from '@/components/ui/button'

interface BulkDeleteBarProps {
  count: number
  itemLabel: string
  isPending: boolean
  onDelete: () => void
}

/** Appears once at least one row is checked, and deletes the selection after a confirmation. */
export function BulkDeleteBar({ count, itemLabel, isPending, onDelete }: BulkDeleteBarProps) {
  if (count === 0) return null

  const plural = count === 1 ? itemLabel : `${itemLabel}s`

  return (
    <div className="border-border bg-muted/50 flex items-center gap-3 rounded-lg border px-3 py-2">
      <span className="text-muted-foreground text-sm">
        {count} {plural} selected
      </span>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm" disabled={isPending}>
            <Trash2 /> Delete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {count} {plural}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes {count === 1 ? 'it' : 'them'} and can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={onDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
