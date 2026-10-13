import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreatePosition, useUpdatePosition } from '@/hooks/usePositions'
import { errorMessage } from '@/lib/errors'
import type { Position } from '@/types'

export function PositionFormDialog({ position, trigger }: { position?: Position; trigger: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(position?.name ?? '')
  const [code, setCode] = useState(position?.code ?? '')

  const createPosition = useCreatePosition()
  const updatePosition = useUpdatePosition()
  const isEdit = !!position
  const isPending = createPosition.isPending || updatePosition.isPending

  useEffect(() => {
    if (open) {
      setName(position?.name ?? '')
      setCode(position?.code ?? '')
    }
  }, [open, position])

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const payload = { name, code }
    const onSuccess = () => {
      toast.success(isEdit ? 'Position updated' : 'Position created')
      setOpen(false)
    }
    const onError = (error: unknown) => toast.error(errorMessage(error))

    if (isEdit) {
      updatePosition.mutate({ id: position.id, payload }, { onSuccess, onError })
    } else {
      createPosition.mutate(payload, { onSuccess, onError })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Position' : 'New Position'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="code">Code</Label>
            <Input id="code" required value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={!name || !code || isPending}>
              {isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Position'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
