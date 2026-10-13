import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface HistoryEntry {
  id: number | string
  title: string
  detail?: string | null
  actorName?: string | null
  timestamp: string
}

const COLLAPSED_COUNT = 5

/**
 * Shared "History" card for Tickets — a vertical timeline of
 * status-change entries, newest first. Collapses to the most recent
 * COLLAPSED_COUNT entries once a record's lifecycle runs long (resubmissions,
 * multiple rejections, note edits), rather than dumping everything inline.
 */
export function HistoryTimeline({ entries }: { entries: HistoryEntry[] }) {
  const [expanded, setExpanded] = useState(false)

  if (entries.length === 0) return null

  const sorted = [...entries].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  const visible = expanded ? sorted : sorted.slice(0, COLLAPSED_COUNT)
  const hiddenCount = sorted.length - visible.length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">History</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col">
          {visible.map((entry, index) => (
            <li key={entry.id} className="relative flex gap-3 pb-4 last:pb-0">
              {index < visible.length - 1 && (
                <span className="bg-border absolute top-2.5 left-[3.5px] h-full w-px" aria-hidden="true" />
              )}
              <span className="bg-primary mt-1.5 size-[7px] shrink-0 rounded-full" aria-hidden="true" />
              <div className="flex min-w-0 flex-col gap-0.5">
                <p className="text-sm">
                  <span className="font-medium">{entry.title}</span>
                  {entry.actorName && <span className="text-muted-foreground"> by {entry.actorName}</span>}
                </p>
                {entry.detail && (
                  <p className="text-muted-foreground bg-muted/40 border-border mt-1 rounded-md border-l-2 px-3 py-2 text-sm whitespace-pre-wrap break-words">
                    {entry.detail}
                  </p>
                )}
                <p className="text-muted-foreground text-xs">{new Date(entry.timestamp).toLocaleString()}</p>
              </div>
            </li>
          ))}
        </ol>

        {sorted.length > COLLAPSED_COUNT && (
          <Button variant="ghost" size="sm" className="mt-1 -ml-2" onClick={() => setExpanded((v) => !v)}>
            <ChevronDown className={cn('size-4 transition-transform', expanded && 'rotate-180')} />
            {expanded ? 'Show less' : `Show ${hiddenCount} more`}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
