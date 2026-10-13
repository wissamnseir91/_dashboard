import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { HistoryTimeline } from '@/components/HistoryTimeline'
import { CAMPAIGN_FIELDS } from '@/lib/campaign'
import { StatusBadge } from '@/components/requests/StatusBadge'
import { RequestThread } from '@/components/requests/RequestThread'
import { CheckboxToggleGroup } from '@/components/CheckboxToggleGroup'
import { TagList } from '@/components/TagList'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { useUsers } from '@/hooks/useUsers'
import {
  useAssignRequest,
  useCancelRequest,
  useRejectRequest,
  useRequest,
  useUpdateRequestStatus,
} from '@/hooks/useRequests'
import { errorMessage } from '@/lib/errors'

export default function RequestDetail() {
  const { id } = useParams<{ id: string }>()
  const requestId = Number(id)
  const { data: request, isLoading } = useRequest(requestId)

  const [assignOpen, setAssignOpen] = useState(false)
  const [assigneeIds, setAssigneeIds] = useState<number[]>([])
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  const { data: users } = useUsers()
  const assignRequest = useAssignRequest()
  const rejectRequest = useRejectRequest()
  const cancelRequest = useCancelRequest()
  const updateStatus = useUpdateRequestStatus()

  if (isLoading || !request) {
    return <p className="text-muted-foreground">Loading…</p>
  }

  const handleAssign = () => {
    assignRequest.mutate(
      { id: request.id, payload: { user_ids: assigneeIds } },
      {
        onSuccess: () => {
          toast.success('Ticket assigned')
          setAssignOpen(false)
          setAssigneeIds([])
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  const toggleAssignee = (userId: number, checked: boolean) => {
    setAssigneeIds((current) => (checked ? [...current, userId] : current.filter((id) => id !== userId)))
  }

  const handleReject = () => {
    rejectRequest.mutate(
      { id: request.id, payload: { reason: rejectReason } },
      {
        onSuccess: () => {
          toast.success('Ticket rejected')
          setRejectOpen(false)
          setRejectReason('')
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  const handleCancel = () => {
    cancelRequest.mutate(
      { id: request.id },
      {
        onSuccess: () => toast.success('Ticket cancelled'),
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  const handleUpdateStatus = (status: 'resolved') => {
    updateStatus.mutate(
      { id: request.id, payload: { status } },
      {
        onSuccess: () => toast.success(`Ticket marked ${status}`),
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="border-border bg-card flex flex-col gap-4 rounded-xl border p-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground font-mono text-sm">{request.request_number}</span>
            <StatusBadge status={request.workflow_status} />
          </div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">{request.title}</h1>
          {request.description && (
            <p className="text-muted-foreground max-w-2xl text-sm whitespace-pre-wrap">{request.description}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {request.can?.assign && (
            <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
              <DialogTrigger asChild>
                <Button size="sm">Assign</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Assign Ticket</DialogTitle>
                </DialogHeader>
                <div className="max-h-64 overflow-y-auto">
                  <CheckboxToggleGroup
                    options={users?.map((user) => ({ value: user.id, label: user.name })) ?? []}
                    selected={assigneeIds}
                    onToggle={toggleAssignee}
                  />
                </div>
                <DialogFooter>
                  <Button onClick={handleAssign} disabled={assigneeIds.length === 0 || assignRequest.isPending}>
                    Assign
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {request.can?.reject && (
            <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="destructive">
                  Reject
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reject Ticket</DialogTitle>
                </DialogHeader>
                <Textarea
                  placeholder="Reason for rejection"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                />
                <DialogFooter>
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                    disabled={!rejectReason || rejectRequest.isPending}
                  >
                    Reject
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {request.workflow_status === 'processing' && request.can?.update_status && (
            <Button size="sm" onClick={() => handleUpdateStatus('resolved')} disabled={updateStatus.isPending}>
              Mark Resolved
            </Button>
          )}

          {request.can?.cancel && (
            <Button size="sm" variant="outline" onClick={handleCancel} disabled={cancelRequest.isPending}>
              Cancel Ticket
            </Button>
          )}
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="flex min-w-0 flex-col gap-6">
          {request.type === 'Campaign' && request.type_details && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Campaign Brief</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 text-sm">
                {CAMPAIGN_FIELDS.map(({ key, label, multiline }) =>
                  request.type_details?.[key] ? (
                    <div key={key} className={multiline ? 'col-span-2' : ''}>
                      <p className="text-muted-foreground">{label}</p>
                      <p className="whitespace-pre-wrap">{request.type_details[key]}</p>
                    </div>
                  ) : null,
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Discussion</CardTitle>
            </CardHeader>
            <CardContent>
              <RequestThread request={request} />
            </CardContent>
          </Card>
        </div>

        <aside className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs tracking-wide uppercase">Type</p>
                <p className="mt-1 font-medium">{request.type}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs tracking-wide uppercase">Created by</p>
                <p className="mt-1 font-medium">{request.creator?.name}</p>
              </div>
              {request.assignees && request.assignees.length > 0 && (
                <div>
                  <p className="text-muted-foreground text-xs tracking-wide uppercase">Assigned to</p>
                  <div className="mt-1">
                    <TagList items={request.assignees.map((a) => a.name)} />
                  </div>
                </div>
              )}
              {request.rejection_reason && (
                <div>
                  <p className="text-muted-foreground text-xs tracking-wide uppercase">Rejection reason</p>
                  <p className="mt-1">{request.rejection_reason}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <HistoryTimeline
            entries={(request.activities ?? []).map((entry) => ({
              id: entry.id,
              title: entry.description,
              actorName: entry.causer?.name,
              timestamp: entry.created_at,
            }))}
          />
        </aside>
      </div>
    </div>
  )
}
