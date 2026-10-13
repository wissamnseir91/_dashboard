import { useEffect, useState } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  setAuth: (user: User, token: string) => void
  setUser: (user: User) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, token: null }),
    }),
    { name: 'connect-auth' },
  ),
)

/**
 * zustand's persist middleware always reads localStorage through a
 * microtask — even though localStorage itself is synchronous — so on a
 * fresh page load (reopening the browser, a hard refresh) the store's
 * `token` reads as null for the very first render, before hydration has
 * actually run. A route guard that redirects to /login on `!token` without
 * checking this can bounce a user with a perfectly valid, unexpired session
 * back to a fresh login for no reason. Wait for this to flip true before
 * trusting an empty token.
 */
export function useHasHydrated() {
  const [hasHydrated, setHasHydrated] = useState(useAuthStore.persist.hasHydrated())

  useEffect(() => useAuthStore.persist.onFinishHydration(() => setHasHydrated(true)), [])

  return hasHydrated
}
