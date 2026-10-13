import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore, useHasHydrated } from '@/stores/auth'

export default function ProtectedRoute() {
  const token = useAuthStore((s) => s.token)
  const hasHydrated = useHasHydrated()

  // Don't judge `token` until the persisted store has actually loaded from
  // storage — on a fresh page load it reads as null for a tick even when a
  // valid session exists, which would otherwise bounce the user to /login.
  if (!hasHydrated) {
    return null
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
