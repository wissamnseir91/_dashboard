import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import type { PaginatedResponse } from '@/types'

interface FilteredListParams {
  page?: number
  per_page?: number
  filters?: Record<string, string | undefined>
  sort?: string
}

export function useFilteredList<T>(endpoint: string, queryKeyBase: string, params: FilteredListParams = {}) {
  const { page = 1, per_page, filters, sort } = params
  const cleanFilters = Object.fromEntries(Object.entries(filters ?? {}).filter(([, v]) => v != null && v !== ''))

  return useQuery({
    queryKey: [queryKeyBase, page, per_page, cleanFilters, sort],
    queryFn: async () => {
      const { data } = await api.get<PaginatedResponse<T>>(endpoint, {
        params: { page, per_page, sort, filter: cleanFilters },
      })
      return data
    },
    placeholderData: (previous) => previous,
  })
}
