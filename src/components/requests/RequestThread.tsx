import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { Paperclip } from 'lucide-react'
import { Mention, MentionsInput } from 'react-mentions'
import { toast } from 'sonner'
import { AttachmentRow } from '@/components/AttachmentRow'
import '@/components/mentions-input.css'
import { PendingFileChips } from '@/components/PendingFileChips'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/UserAvatar'
import { useMentionSuggestions, useRepositionMentionsOnScroll } from '@/hooks/useMentionSuggestions'
import { downloadAttachment, fetchMentionableUsers, useAddRequestComment, useDeleteAttachment } from '@/hooks/useRequests'
import { errorMessage } from '@/lib/errors'
import { renderMentionText } from '@/lib/mentions'
import type { Attachment, ServiceRequest } from '@/types'

type ThreadEntry =
  | {
      kind: 'message'
      id: string
      name?: string
      avatarUrl?: string | null
      timestamp: string
      body: string
      attachments: Attachment[]
    }
  | { kind: 'attachment'; id: string; name?: string; avatarUrl?: string | null; timestamp: string; attachment: Attachment }

function ThreadRow({
  name,
  avatarUrl,
  timestamp,
  children,
}: {
  name?: string
  avatarUrl?: string | null
  timestamp: string
  children: React.ReactNode
}) {
  return (
    <div className="flex gap-3">
      <UserAvatar name={name} url={avatarUrl} />
      <div className="border-border bg-card min-w-0 flex-1 rounded-lg border p-3">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-sm font-medium">{name ?? 'Unknown'}</p>
          <p className="text-muted-foreground shrink-0 text-xs">{new Date(timestamp).toLocaleString()}</p>
        </div>
        {children}
      </div>
    </div>
  )
}

function RequestAttachmentRow({ requestId, attachment }: { requestId: number; attachment: Attachment }) {
  const deleteAttachment = useDeleteAttachment()

  const handleDownload = async () => {
    try {
      await downloadAttachment(requestId, attachment.id, attachment.original_filename)
    } catch (error) {
      toast.error(errorMessage(error))
    }
  }

  const handleDelete = () => {
    deleteAttachment.mutate(
      { requestId, attachmentId: attachment.id },
      {
        onSuccess: () => toast.success('Attachment removed'),
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  return (
    <AttachmentRow
      attachment={attachment}
      onDownload={handleDownload}
      onDelete={attachment.can_delete ? handleDelete : undefined}
    />
  )
}

export function RequestThread({ request }: { request: ServiceRequest }) {
  const [body, setBody] = useState('')
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const addComment = useAddRequestComment()
  const fetchMentionSuggestions = useMentionSuggestions((search) => fetchMentionableUsers(request.id, search))
  useRepositionMentionsOnScroll()

  const entries: ThreadEntry[] = []
  if (request.description) {
    entries.push({
      kind: 'message',
      id: 'description',
      name: request.creator?.name,
      avatarUrl: request.creator?.avatar_url,
      timestamp: request.created_at,
      body: request.description,
      attachments: [],
    })
  }
  request.comments?.forEach((comment) =>
    entries.push({
      kind: 'message',
      id: `comment-${comment.id}`,
      name: comment.user?.name,
      avatarUrl: comment.user?.avatar_url,
      timestamp: comment.created_at,
      body: comment.body,
      attachments: request.attachments?.filter((attachment) => attachment.comment_id === comment.id) ?? [],
    }),
  )
  // Files posted alongside a message are rendered under that message's entry
  // above, not as their own row — only ones posted with no message land here.
  request.attachments
    ?.filter((attachment) => attachment.comment_id === null)
    .forEach((attachment) =>
      entries.push({
        kind: 'attachment',
        id: `attachment-${attachment.id}`,
        name: attachment.uploader?.name,
        avatarUrl: attachment.uploader?.avatar_url,
        timestamp: attachment.created_at,
        attachment,
      }),
    )
  entries.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    addComment.mutate(
      { requestId: request.id, body, files: pendingFiles },
      {
        onSuccess: () => {
          setBody('')
          setPendingFiles([])
        },
        onError: (error) => toast.error(errorMessage(error)),
      },
    )
  }

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (files.length === 0) return

    setPendingFiles((prev) => [...prev, ...files])
    event.target.value = ''
  }

  const handleRemovePendingFile = (index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        {entries.map((entry) => (
          <ThreadRow key={entry.id} name={entry.name} avatarUrl={entry.avatarUrl} timestamp={entry.timestamp}>
            {entry.kind === 'message' ? (
              <>
                <p className="mt-1 text-sm whitespace-pre-wrap break-words">{renderMentionText(entry.body)}</p>
                {entry.attachments.length > 0 && (
                  <div className="mt-2 flex flex-col gap-2">
                    {entry.attachments.map((attachment) => (
                      <RequestAttachmentRow key={attachment.id} requestId={request.id} attachment={attachment} />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <RequestAttachmentRow requestId={request.id} attachment={entry.attachment} />
            )}
          </ThreadRow>
        ))}
        {entries.length === 0 && <p className="text-muted-foreground text-sm">No updates yet.</p>}
      </div>

      <form onSubmit={handleSubmit} className="border-border flex flex-col gap-2 border-t pt-4">
        <MentionsInput
          value={body}
          onChange={(_event, newValue) => setBody(newValue)}
          placeholder="Post an update… Type @ to mention someone"
          className="mentions"
          allowSuggestionsAboveCursor
          suggestionsPortalHost={document.body}
        >
          <Mention
            trigger="@"
            data={fetchMentionSuggestions}
            markup="@[__display__](__id__)"
            displayTransform={(_id, display) => `@${display}`}
            className="mentions__mention"
            appendSpaceOnAdd
          />
        </MentionsInput>
        <PendingFileChips files={pendingFiles} onRemove={handleRemovePendingFile} />
        <div className="flex items-center justify-between">
          <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />
          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Paperclip /> Attach File
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={(!body.trim() && pendingFiles.length === 0) || addComment.isPending}
          >
            {addComment.isPending ? 'Posting…' : 'Post Update'}
          </Button>
        </div>
      </form>
    </div>
  )
}
