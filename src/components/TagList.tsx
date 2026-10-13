import { Badge } from '@/components/ui/badge'

/** Read-only display of multiple values as tag chips, replacing a comma-joined string. */
export function TagList({ items, empty = '—' }: { items: string[]; empty?: string }) {
  if (!items.length) return <span className="text-muted-foreground">{empty}</span>

  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item) => (
        <Badge key={item} variant="secondary">
          {item}
        </Badge>
      ))}
    </div>
  )
}
