import { ArrowLeft, ArrowRight, MoreVertical, Plus } from 'lucide-react'
import { useState } from 'react'
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
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  useCreateSavedView,
  useDeleteSavedView,
  useReorderSavedViews,
  useSavedViews,
  useUpdateSavedView,
} from '@/hooks/useSavedViews'
import { errorMessage } from '@/lib/errors'
import { cn } from '@/lib/utils'
import type { SavedViewModule } from '@/types'

type ActiveView = number | 'default'
type Filters = Record<string, string | undefined>

interface ModuleViewsProps {
  module: SavedViewModule
  activeViewId: ActiveView
  currentFilters: Filters
  currentSort?: string
  onViewChange: (viewId: ActiveView, filters: Filters, sort?: string) => void
}

function ViewPill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'cursor-pointer rounded-full border px-3.5 py-1 text-sm font-medium transition-colors',
        active ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-accent',
      )}
    >
      {children}
    </button>
  )
}

export function ModuleViews({ module, activeViewId, currentFilters, currentSort, onViewChange }: ModuleViewsProps) {
  const { data: views } = useSavedViews(module)
  const createView = useCreateSavedView(module)
  const updateView = useUpdateSavedView(module)
  const deleteView = useDeleteSavedView(module)
  const reorderViews = useReorderSavedViews(module)

  const [renamingId, setRenamingId] = useState<number | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const [newViewName, setNewViewName] = useState('')

  const handleTabChange = (value: string) => {
    if (value === 'default') {
      onViewChange('default', {}, undefined)
      return
    }
    const view = views?.find((v) => v.id === Number(value))
    if (view) {
      onViewChange(view.id, view.filters ?? {}, view.sort ?? undefined)
    }
  }

  const submitRename = () => {
    if (renamingId == null || !renameValue.trim()) return
    updateView.mutate(
      { id: renamingId, name: renameValue.trim() },
      {
        onSuccess: () => {
          setRenamingId(null)
          toast.success('View renamed')
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  const deletingView = views?.find((v) => v.id === deletingId)

  const confirmDelete = () => {
    if (deletingId == null) return
    deleteView.mutate(deletingId, {
      onSuccess: () => {
        if (activeViewId === deletingId) {
          onViewChange('default', {}, undefined)
        }
        setDeletingId(null)
        toast.success('View deleted')
      },
      onError: (error) => toast.error(errorMessage(error)),
    })
  }

  const submitCreate = () => {
    if (!newViewName.trim()) return
    createView.mutate(
      { name: newViewName.trim(), filters: currentFilters, sort: currentSort },
      {
        onSuccess: (view) => {
          setCreating(false)
          setNewViewName('')
          onViewChange(view.id, view.filters ?? {}, view.sort ?? undefined)
          toast.success('View created')
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  const move = (index: number, direction: -1 | 1) => {
    if (!views) return
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= views.length) return
    const orderedIds = views.map((v) => v.id)
    ;[orderedIds[index], orderedIds[targetIndex]] = [orderedIds[targetIndex], orderedIds[index]]
    reorderViews.mutate(orderedIds, { onError: (error) => toast.error(errorMessage(error)) })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ViewPill active={activeViewId === 'default'} onClick={() => handleTabChange('default')}>
        All
      </ViewPill>
      {views?.map((view, index) => (
        <div
          key={view.id}
          className={cn(
            'flex items-center rounded-full border transition-colors',
            activeViewId === view.id
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border hover:bg-accent',
          )}
        >
          <button
            type="button"
            onClick={() => handleTabChange(String(view.id))}
            className="cursor-pointer py-1 pr-1 pl-3.5 text-sm font-medium"
          >
            {view.name}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="mr-1 flex size-6 cursor-pointer items-center justify-center rounded-full opacity-70 hover:opacity-100"
                aria-label={`${view.name} view options`}
              >
                <MoreVertical className="size-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled={index === 0} onSelect={() => move(index, -1)}>
                <ArrowLeft /> Move left
              </DropdownMenuItem>
              <DropdownMenuItem disabled={index === views.length - 1} onSelect={() => move(index, 1)}>
                <ArrowRight /> Move right
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => {
                  setRenameValue(view.name)
                  setRenamingId(view.id)
                }}
              >
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onSelect={() => setDeletingId(view.id)}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ))}

      <button
        type="button"
        onClick={() => setCreating(true)}
        className="border-border text-muted-foreground hover:text-foreground hover:bg-accent flex cursor-pointer items-center gap-1 rounded-full border border-dashed px-3 py-1 text-sm font-medium transition-colors"
      >
        <Plus className="size-3.5" /> New view
      </button>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New view</DialogTitle>
          </DialogHeader>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              submitCreate()
            }}
          >
            <Input
              value={newViewName}
              onChange={(e) => setNewViewName(e.target.value)}
              placeholder="View name"
              autoFocus
              maxLength={100}
            />
            <DialogFooter>
              <Button type="submit" disabled={createView.isPending}>
                {createView.isPending ? 'Creating…' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={renamingId != null} onOpenChange={(open) => !open && setRenamingId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename view</DialogTitle>
          </DialogHeader>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault()
              submitRename()
            }}
          >
            <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} autoFocus maxLength={100} />
            <DialogFooter>
              <Button type="submit" disabled={updateView.isPending}>
                {updateView.isPending ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deletingId != null} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deletingView?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This view and its saved filters will be permanently removed. This can&apos;t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleteView.isPending}>
              {deleteView.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
