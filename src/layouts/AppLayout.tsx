import { useState } from 'react'
import { LogOut, Menu, X } from 'lucide-react'
import { Dialog as DialogPrimitive } from 'radix-ui'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Logo } from '@/components/Logo'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/UserAvatar'
import { useLogout } from '@/hooks/useAuth'
import { useCan } from '@/hooks/usePermissions'
import { useAuthStore } from '@/stores/auth'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
}

interface NavSection {
  label?: string
  items: NavItem[]
}

const GENERAL_SECTION: NavSection = {
  items: [{ to: '/requests', label: 'Tickets' }],
}

const ADMIN_SECTION: NavSection = {
  label: 'Admin',
  items: [
    { to: '/positions', label: 'Positions' },
    { to: '/users', label: 'Users' },
    { to: '/roles', label: 'Roles' },
  ],
}

function TopNav({ sections }: { sections: NavSection[] }) {
  const items = sections.flatMap((section) => section.items)
  return (
    <nav className="hidden min-w-0 flex-1 items-center gap-1 md:flex">
      {items.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            cn(
              'relative flex shrink-0 items-center px-3 py-2 text-sm font-medium transition-colors after:absolute after:inset-x-3 after:-bottom-2 after:h-0.5 after:rounded-full after:transition-colors',
              isActive
                ? 'text-foreground after:bg-primary'
                : 'text-muted-foreground hover:text-foreground after:bg-transparent',
            )
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  )
}

function MobileNav({ sections, onNavigate }: { sections: NavSection[]; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-4 overflow-y-auto p-3">
      {sections.map((section, index) => (
        <div key={section.label ?? index} className="flex flex-col gap-1">
          {section.label && (
            <p className="text-muted-foreground px-3 pb-1 text-xs font-semibold tracking-wider uppercase">
              {section.label}
            </p>
          )}
          {section.items.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  'flex items-center rounded-md border-l-2 border-transparent px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'border-primary bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                )
              }
            >
                  {label}
            </NavLink>
          ))}
        </div>
      ))}
    </nav>
  )
}

export default function AppLayout() {
  const user = useAuthStore((s) => s.user)
  const logout = useLogout()
  const navigate = useNavigate()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  // No permission actually holds "users.manage" — Administrator bypasses via
  // Gate::before, so this check is effectively "is Administrator" without
  // hardcoding the role name.
  const isAdmin = useCan('users.manage')
  // HR holds users.view-all without being a full admin — they get just the
  // Users link (rendered read-only for them — see UserDetail/Users), not the
  // rest of the Admin section.
  const canViewAllUsers = useCan('users.view-all')

  const handleLogout = () => {
    logout.mutate(undefined, { onSettled: () => navigate('/login') })
  }

  const partialAdminItems: NavItem[] = []
  if (!isAdmin && canViewAllUsers) {
    partialAdminItems.push({ to: '/users', label: 'Users' })
  }

  const navSections: NavSection[] = isAdmin
    ? [GENERAL_SECTION, ADMIN_SECTION]
    : partialAdminItems.length > 0
    ? [GENERAL_SECTION, { label: 'Admin', items: partialAdminItems }]
    : [GENERAL_SECTION]

  const roleName = user?.roles?.[0]?.name

  return (
    <div className="flex h-svh flex-col overflow-hidden">
      <DialogPrimitive.Root open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 md:hidden" />
          <DialogPrimitive.Content className="bg-sidebar fixed inset-y-0 left-0 z-50 flex h-full w-72 max-w-[80vw] flex-col border-r border-border shadow-lg outline-none data-[state=closed]:animate-out data-[state=closed]:slide-out-to-left data-[state=open]:animate-in data-[state=open]:slide-in-from-left md:hidden">
            <DialogPrimitive.Title className="sr-only">Navigation menu</DialogPrimitive.Title>
            <div className="border-border flex items-center justify-between border-b px-5 py-5">
              <Logo />
              <DialogPrimitive.Close asChild>
                <Button variant="ghost" size="icon" aria-label="Close navigation menu">
                  <X className="size-4" />
                </Button>
              </DialogPrimitive.Close>
            </div>
            <MobileNav sections={navSections} onNavigate={() => setMobileNavOpen(false)} />
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <header className="border-border bg-sidebar flex shrink-0 items-center justify-between gap-4 border-b px-4 py-2 md:px-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu className="size-5" />
          </Button>
          <Logo />
        </div>

        <TopNav sections={navSections} />

        <div className="flex items-center gap-2">
          <NotificationBell />

          <button
            type="button"
            onClick={() => navigate(`/users/${user?.id}`)}
            aria-label="Open my profile"
            className="hover:bg-accent flex cursor-pointer items-center gap-2.5 rounded-full py-1 pr-3 pl-1 transition-colors"
          >
            <UserAvatar name={user?.name} url={user?.avatar_url} />
            <span className="hidden flex-col items-start text-left leading-tight sm:flex">
              <span className="max-w-32 truncate text-sm font-medium">{user?.name}</span>
              {roleName && <span className="text-muted-foreground max-w-32 truncate text-xs">{roleName}</span>}
            </span>
          </button>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-destructive"
            onClick={handleLogout}
            disabled={logout.isPending}
            aria-label="Log out"
            title="Log out"
          >
            <LogOut className="size-5" />
          </Button>
        </div>
      </header>
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  )
}
