import { Bell, BellOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useMarkNotificationRead, useNotifications } from '@/hooks/useNotifications'
import { cn } from '@/lib/utils'
import type { AppNotification } from '@/types'

function timeAgo(iso: string): string {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function NotificationBell() {
  const { data } = useNotifications()
  const markRead = useMarkNotificationRead()
  const navigate = useNavigate()

  const notifications = data?.data ?? []
  const unreadCount = notifications.filter((n) => !n.read_at).length

  const handleClick = (notification: AppNotification) => {
    if (!notification.read_at) {
      markRead.mutate(notification.id)
    }
    navigate(notification.data.action_url)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="bg-primary text-primary-foreground ring-background absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-semibold ring-2">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 overflow-hidden rounded-xl p-0">
        <div className="bg-muted/40 border-border flex items-center justify-between border-b px-4 py-3">
          <p className="font-heading text-sm font-semibold">Notifications</p>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} new
            </Badge>
          )}
        </div>
        <ScrollArea className="h-96">
          {notifications.length === 0 && (
            <div className="text-muted-foreground flex h-80 flex-col items-center justify-center gap-2 text-sm">
              <BellOff className="size-8 opacity-40" />
              You're all caught up.
            </div>
          )}
          <div className="flex flex-col gap-1.5 p-2">
            {notifications.map((notification) => {
              const unread = !notification.read_at
              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleClick(notification)}
                  className={cn(
                    'flex w-full cursor-pointer gap-3 rounded-lg border p-3 text-left text-sm transition-colors',
                    unread ? 'border-primary/20 bg-primary/5 hover:bg-primary/10' : 'border-transparent hover:bg-muted/60',
                  )}
                >
                  <span
                    className={cn('mt-1.5 size-2 shrink-0 rounded-full', unread ? 'bg-primary' : 'bg-muted-foreground/30')}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className={cn('truncate', unread ? 'font-semibold' : 'font-medium')}>
                        {notification.data.title}
                      </p>
                      <span className="text-muted-foreground shrink-0 text-xs">{timeAgo(notification.created_at)}</span>
                    </div>
                    <p className="text-muted-foreground mt-0.5 line-clamp-2">{notification.data.message}</p>
                  </div>
                </button>
              )
            })}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
