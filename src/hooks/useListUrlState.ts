import { useCallback, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

type Filters = Record<string, string | undefined>
type ViewId = number | 'default'
type Updater<T> = T | ((prev: T) => T)

interface ListState {
  page: number
  perPage: number
  filters: Filters
  sort?: string
  activeViewId: ViewId
}

const DEFAULTS: ListState = { page: 1, perPage: 20, filters: {}, sort: undefined, activeViewId: 'default' }
const EMPTY_FILTERS: Filters = {}

/**
 * Keeps a list page's page/perPage/filters/sort/active view in the browser history entry
 * (not the URL), so going Back from a detail page, or refreshing, restores the same list view.
 * A fresh navigation (e.g. the sidebar link) has no state and starts clean.
 * Updates use `replace` so paging/filtering doesn't flood the history stack.
 */
export function useListUrlState() {
  const location = useLocation()
  const navigate = useNavigate()

  const stored = (location.state as { list?: Partial<ListState> } | null)?.list
  const state: ListState = { ...DEFAULTS, ...stored, filters: stored?.filters ?? EMPTY_FILTERS }

  // Several setters can fire in one handler; chain them off the latest state, not the render snapshot.
  const latest = useRef(state)
  latest.current = state

  const update = useCallback(
    (patch: (prev: ListState) => Partial<ListState>) => {
      const next = { ...latest.current, ...patch(latest.current) }
      latest.current = next
      navigate(
        { pathname: location.pathname, search: location.search },
        { replace: true, state: { ...(location.state as object | null), list: next } },
      )
    },
    [navigate, location.pathname, location.search, location.state],
  )

  const setPage = useCallback((page: number) => update(() => ({ page })), [update])
  const setPerPage = useCallback((perPage: number) => update(() => ({ perPage })), [update])
  const setSort = useCallback((sort: string | undefined) => update(() => ({ sort })), [update])
  const setActiveViewId = useCallback((activeViewId: ViewId) => update(() => ({ activeViewId })), [update])
  const setFilters = useCallback(
    (value: Updater<Filters>) =>
      update((prev) => ({ filters: typeof value === 'function' ? value(prev.filters) : value })),
    [update],
  )

  return {
    page: state.page,
    setPage,
    perPage: state.perPage,
    setPerPage,
    filters: state.filters,
    setFilters,
    sort: state.sort,
    setSort,
    activeViewId: state.activeViewId,
    setActiveViewId,
  }
}
