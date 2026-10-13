import { useAuthStore } from '@/stores/auth'

export function useCan(permission: string): boolean {
  const user = useAuthStore((s) => s.user)
  if (!user) return false
  // Mirrors the backend's Gate::before bypass in AppServiceProvider —
  // Administrator holds no explicit permissions, it bypasses every check.
  if (user.roles?.some((r) => r.name === 'Administrator')) return true
  return user.permissions?.includes(permission) ?? false
}

/**
 * For abilities that aren't a permission at all (e.g. ticket
 * delete), gated purely on the Administrator role via the backend's
 * Gate::before bypass — mirrors that directly instead of checking a
 * permission name nobody actually holds.
 */
export function useIsAdmin(): boolean {
  const user = useAuthStore((s) => s.user)
  return user?.roles?.some((r) => r.name === 'Administrator') ?? false
}
