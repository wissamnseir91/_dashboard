import { Paperclip, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { formatFileSize } from '@/lib/utils'

/** Files staged on a comment composer before it's posted — not yet uploaded, so no download action. */
export function PendingFileChips({ files, onRemove }: { files: File[]; onRemove: (index: number) => void }) {
  if (files.length === 0) return null

  return (
    <div className="flex flex-wrap gap-1.5">
      {files.map((file, index) => (
        <Badge key={`${file.name}-${index}`} variant="secondary" className="h-auto gap-1 py-1 pr-1">
          <Paperclip className="size-3" />
          <span className="max-w-40 truncate">{file.name}</span>
          <span className="text-muted-foreground">{formatFileSize(file.size)}</span>
          <button
            type="button"
            onClick={() => onRemove(index)}
            className="hover:bg-foreground/10 rounded-full p-0.5"
            aria-label={`Remove ${file.name}`}
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
    </div>
  )
}
