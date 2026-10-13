import { Plus } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FloatingActions } from '@/components/FloatingActions'
import { ColumnHeader } from '@/components/ColumnHeader'
import type { FilterFieldConfig } from '@/components/FilterPopover'
import { ModuleViews } from '@/components/ModuleViews'
import { SearchFilterInput } from '@/components/SearchFilterInput'
import { TablePagination } from '@/components/TablePagination'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table'
import { UserAvatar } from '@/components/UserAvatar'
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect'
import { useListUrlState } from '@/hooks/useListUrlState'
import { useCan } from '@/hooks/usePermissions'
import { usePositions } from '@/hooks/usePositions'
import { useRoles } from '@/hooks/useRoles'
import { useUpdateSavedView } from '@/hooks/useSavedViews'
import { useUsersList } from '@/hooks/useUsers'
import { cn } from '@/lib/utils'

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

export default function Users() {
  const canManage = useCan('users.manage')
  const canViewAll = useCan('users.view-all')
  const canAccess = canManage || canViewAll
  const navigate = useNavigate()

  const { page, setPage, perPage, setPerPage, filters, setFilters, sort, setSort, activeViewId, setActiveViewId } =
    useListUrlState()

  const { data, isLoading } = useUsersList({ page, per_page: perPage, filters, sort })
  const updateSavedView = useUpdateSavedView('users')
  const { data: positions } = usePositions()
  const { data: roles } = useRoles()

  const FILTER_FIELDS: FilterFieldConfig[] = [
    {
      key: 'position_id',
      label: 'Position',
      type: 'select',
      options: (positions ?? []).map((p) => ({ value: String(p.id), label: p.name })),
    },
    { key: 'status', label: 'Status', type: 'select', options: STATUS_OPTIONS },
    {
      key: 'role',
      label: 'Role',
      type: 'select',
      options: (roles ?? []).map((r) => ({ value: r.name, label: r.name })),
    },
  ]

  const applyFilter = (updates: Record<string, string | undefined>) => {
    setFilters((prev) => ({ ...prev, ...updates }))
    setPage(1)
  }
  const applySort = (value: string | undefined) => {
    setSort(value)
    setPage(1)
  }
  const filterFor = (key: string) => FILTER_FIELDS.find((f) => f.key === key)
  const col = (label: string, sortKey?: string, filterKey?: string, className?: string) => (
    <ColumnHeader
      label={label}
      sortKey={sortKey}
      sort={sort}
      onSort={applySort}
      filter={filterKey ? filterFor(filterKey) : undefined}
      filters={filters}
      onFilter={applyFilter}
      className={className}
    />
  )

  useDebouncedEffect(
    () => {
      if (activeViewId !== 'default') {
        updateSavedView.mutate({ id: activeViewId, filters, sort })
      }
    },
    [filters, sort, activeViewId],
    500,
  )

  useEffect(() => {
    if (!canAccess) {
      navigate('/requests', { replace: true })
    }
  }, [canAccess, navigate])

  if (!canAccess) {
    return null
  }

  return (
    <div className="flex flex-col gap-4 pb-16">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-muted-foreground text-sm">Everyone with an account in Management Dashboard.</p>
        </div>
      </div>

      <ModuleViews
        module="users"
        activeViewId={activeViewId}
        currentFilters={filters}
        currentSort={sort}
        onViewChange={(viewId, viewFilters, viewSort) => {
          setActiveViewId(viewId)
          setFilters(viewFilters)
          setSort(viewSort)
          setPage(1)
        }}
      />

      <div className="flex flex-wrap items-center gap-2">
        <SearchFilterInput
          value={filters.search}
          onChange={(value) => {
            setFilters((prev) => ({ ...prev, search: value }))
            setPage(1)
          }}
          placeholder="Search name, email, or ID…"
        />
      </div>

      <div className="border-border rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {col('Name', 'name')}
              {col('Email', 'email')}
              {col('Position', undefined, 'position_id')}
              {col('Role', undefined, 'role')}
              {col('Status', undefined, 'status')}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground text-center">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && data?.data.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground text-center">
                  No users found.
                </TableCell>
              </TableRow>
            )}
            {data?.data.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  <Link to={`/users/${user.id}`} className="flex items-center gap-2 hover:underline">
                    <UserAvatar name={user.name} url={user.avatar_url} />
                    {user.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>{user.position?.name ?? '—'}</TableCell>
                <TableCell>{user.roles?.[0]?.name ?? '—'}</TableCell>
                <TableCell>
                  <Badge
                    className={cn(
                      'border-0',
                      user.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-400'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {user.status === 'active' ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination
          page={data?.current_page ?? 1}
          totalPages={data?.last_page ?? 1}
          total={data?.total}
          perPage={perPage}
          onPageChange={setPage}
          onPerPageChange={(size) => {
            setPerPage(size)
            setPage(1)
          }}
        />
      </div>

      <FloatingActions>
        {canManage && (
          <Button size="lg" onClick={() => navigate('/users/new')}>
            <Plus /> New User
          </Button>
        )}
      </FloatingActions>
    </div>
  )
}
