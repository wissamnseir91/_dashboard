import { Download, Paperclip, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { formatFileSize } from '@/lib/utils'
import type { Attachment } from '@/types'

export function AttachmentRow({
  attachment,
  onDownload,
  onDelete,
}: {
  attachment: Attachment
  onDownload: () => void
  onDelete?: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        <Paperclip className="text-muted-foreground size-4 shrink-0" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{attachment.original_filename}</p>
          <p className="text-muted-foreground text-xs">{formatFileSize(attachment.size)}</p>
        </div>
      </div>
      <div className="flex shrink-0 gap-1">
        <Button variant="ghost" size="icon" className="size-8" onClick={onDownload}>
          <Download className="size-4" />
        </Button>
        {onDelete && (
          <Button variant="ghost" size="icon" className="text-destructive size-8" onClick={onDelete}>
            <Trash2 className="size-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
