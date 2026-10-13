import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { Permission } from '@/types'

export function usePermissionCatalog() {
  return useQuery({
    queryKey: ['permissions'],
    queryFn: async () => {
      const { data } = await api.get<Permission[]>('/permissions')
      return data
    },
  })
}
