import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { User } from '@/types'
import { useAuthStore } from '@/stores/auth'

export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser)

  return useMutation({
    mutationFn: async (payload: { name?: string; phone?: string | null }) => {
      const { data } = await api.put<User>('/profile', payload)
      return data
    },
    onSuccess: (user) => setUser(user),
  })
}

/**
 * UserDetail.tsx reads the profile it's viewing via useUser(id), a separate
 * cache from the auth store's own `user` (which only backs things like
 * AppLayout's account menu) — both need refreshing after a change here.
 */
export function useUploadAvatar() {
  const setUser = useAuthStore((s) => s.setUser)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await api.post<User>('/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data
    },
    onSuccess: (user) => {
      setUser(user)
      queryClient.invalidateQueries({ queryKey: ['users', user.id] })
    },
  })
}

export function useDeleteAvatar() {
  const setUser = useAuthStore((s) => s.setUser)
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.delete<User>('/profile/avatar')
      return data
    },
    onSuccess: (user) => {
      setUser(user)
      queryClient.invalidateQueries({ queryKey: ['users', user.id] })
    },
  })
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: async (payload: { current_password: string; new_password: string; new_password_confirmation: string }) => {
      const { data } = await api.put<{ message: string }>('/profile/password', payload)
      return data
    },
  })
}
