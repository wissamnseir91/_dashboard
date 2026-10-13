import { cn } from '@/lib/utils'

const SIZE_CLASSES = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-20 text-2xl',
} as const

/** A user's uploaded photo, or their initial in a circle when they haven't set one. */
export function UserAvatar({
  name,
  url,
  size = 'sm',
  className,
}: {
  name?: string
  url?: string | null
  size?: keyof typeof SIZE_CLASSES
  className?: string
}) {
  if (url) {
    return (
      <img
        src={url}
        alt={name ?? 'User avatar'}
        className={cn(SIZE_CLASSES[size], 'shrink-0 rounded-full object-cover', className)}
      />
    )
  }

  return (
    <div
      className={cn(
        SIZE_CLASSES[size],
        'bg-muted text-muted-foreground flex shrink-0 items-center justify-center rounded-full font-medium',
        className,
      )}
    >
      {name?.charAt(0)?.toUpperCase() ?? '?'}
    </div>
  )
}
