import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useFilteredList } from '@/hooks/useFilteredList'
import { api } from '@/lib/api'
import type { User } from '@/types'

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get<User[]>('/users')
      return data
    },
  })
}

interface UsersListParams {
  page?: number
  per_page?: number
  filters?: Record<string, string | undefined>
  sort?: string
}

/**
 * Backed by the same `/users` endpoint as `useUsers()` above, but the
 * `page` param it always sends (via useFilteredList) is what tips the
 * backend into returning a paginated `{ data, total, ... }` shape instead
 * of the flat array every dropdown consumer of `useUsers()` expects — see
 * UserController::index().
 */
export function useUsersList(params: UsersListParams = {}) {
  return useFilteredList<User>('/users', 'users-list', params)
}

export function useUser(id: number) {
  return useQuery({
    queryKey: ['users', id],
    queryFn: async () => {
      const { data } = await api.get<User>(`/users/${id}`)
      return data
    },
  })
}

interface CreateUserPayload {
  name: string
  email: string
  position_id: number
  role: string
  employee_code?: string
  hire_date?: string
}

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (payload: CreateUserPayload) => {
      const { data } = await api.post<User>('/users', payload)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}

interface UpdateUserPayload {
  name?: string
  email?: string
  position_id?: number
  status?: 'active' | 'inactive'
  role?: string
  phone?: string | null
  employee_code?: string | null
  hire_date?: string | null
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: UpdateUserPayload }) => {
      const { data } = await api.patch<User>(`/users/${id}`, payload)
      return data
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })
}
