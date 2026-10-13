import { Plus } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { FloatingActions } from '@/components/FloatingActions'
import { BulkDeleteBar } from '@/components/BulkDeleteBar'
import { ColumnHeader } from '@/components/ColumnHeader'
import type { FilterFieldConfig } from '@/components/FilterPopover'
import { ModuleViews } from '@/components/ModuleViews'
import { REQUEST_STATUS_LABELS, StatusBadge } from '@/components/requests/StatusBadge'
import { SearchFilterInput } from '@/components/SearchFilterInput'
import { TablePagination } from '@/components/TablePagination'
import { TagList } from '@/components/TagList'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useListUrlState } from '@/hooks/useListUrlState'
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect'
import { useIsAdmin } from '@/hooks/usePermissions'
import { useBulkDeleteRequests, useRequests } from '@/hooks/useRequests'
import { useUpdateSavedView } from '@/hooks/useSavedViews'
import { useUsers } from '@/hooks/useUsers'
import { errorMessage } from '@/lib/errors'
import { formatDate } from '@/lib/utils'
import type { RequestStatus } from '@/types'

const STATUS_OPTIONS = Object.keys(REQUEST_STATUS_LABELS) as RequestStatus[]

export default function RequestsList() {
  const navigate = useNavigate()
  const { page, setPage, perPage, setPerPage, filters, setFilters, sort, setSort, activeViewId, setActiveViewId } =
    useListUrlState()
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const { data, isLoading } = useRequests({ page, per_page: perPage, filters, sort })
  const bulkDelete = useBulkDeleteRequests()
  const isAdmin = useIsAdmin()
  const updateSavedView = useUpdateSavedView('requests')
  const { data: users } = useUsers()
  const userOptions = (users ?? []).map((u) => ({ value: String(u.id), label: u.name }))
  const rows = data?.data ?? []
  const columnCount = 7 + (isAdmin ? 1 : 0)

  const FILTER_FIELDS: FilterFieldConfig[] = [
    {
      key: 'workflow_status',
      label: 'Status',
      type: 'select',
      options: STATUS_OPTIONS.map((s) => ({ value: s, label: REQUEST_STATUS_LABELS[s] })),
    },
    { key: 'created_by', label: 'Requester', type: 'searchable-select', options: userOptions },
    { key: 'assigned_to', label: 'Assigned To', type: 'searchable-select', options: userOptions },
    { key: 'created', label: 'Created', type: 'date-range' },
    { key: 'due_date', label: 'Due Date', type: 'date-range' },
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
    setSelectedIds([])
  }, [page, filters, sort])

  const handleBulkDelete = () => {
    bulkDelete.mutate(selectedIds, {
      onSuccess: () => {
        toast.success('Deleted')
        setSelectedIds([])
      },
      onError: (error) => toast.error(errorMessage(error)),
    })
  }

  const allSelected = rows.length > 0 && rows.every((request) => selectedIds.includes(request.id))
  const someSelected = selectedIds.length > 0 && !allSelected

  return (
    <div className="flex flex-col gap-4 pb-16">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold tracking-tight">Tickets</h1>
          <p className="text-muted-foreground text-sm">Internal tickets.</p>
        </div>
      </div>

      <ModuleViews
        module="requests"
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
          placeholder="Search title or description…"
        />
      </div>

      <BulkDeleteBar
        count={selectedIds.length}
        itemLabel="ticket"
        isPending={bulkDelete.isPending}
        onDelete={handleBulkDelete}
      />

      <div className="border-border rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {isAdmin && (
                <TableHead className="w-10">
                  <Checkbox
                    checked={someSelected ? 'indeterminate' : allSelected}
                    disabled={rows.length === 0}
                    onCheckedChange={(checked) => setSelectedIds(checked ? rows.map((request) => request.id) : [])}
                    aria-label="Select all"
                  />
                </TableHead>
              )}
              {col('Title', 'title')}
              {col('Requested By', undefined, 'created_by')}
              {col('Assigned To', undefined, 'assigned_to')}
              {col('Status', 'workflow_status', 'workflow_status')}
              {col('Created At', 'created_at', 'created')}
              {col('Due Date', 'due_date', 'due_date')}
              <TableHead>Resolved Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={columnCount} className="text-muted-foreground text-center">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {!isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={columnCount} className="text-muted-foreground text-center">
                  No tickets yet.
                </TableCell>
              </TableRow>
            )}
            {rows.map((request) => (
              <TableRow key={request.id}>
                {isAdmin && (
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.includes(request.id)}
                      onCheckedChange={(checked) =>
                        setSelectedIds((prev) =>
                          checked ? [...prev, request.id] : prev.filter((id) => id !== request.id),
                        )
                      }
                      aria-label="Select row"
                    />
                  </TableCell>
                )}
                <TableCell>
                  <Link to={`/requests/${request.id}`} className="font-medium hover:underline">
                    {request.title}
                  </Link>
                </TableCell>
                <TableCell>{request.creator?.name?.split(' ')[0]}</TableCell>
                <TableCell className="text-muted-foreground">
                  <TagList items={request.assignees?.map((a) => a.name) ?? []} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={request.workflow_status} />
                </TableCell>
                <TableCell className="text-muted-foreground">{formatDate(request.created_at)}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(request.due_date)}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(request.resolved_at)}</TableCell>
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
        <Button size="lg" onClick={() => navigate('/requests/new')}>
          <Plus /> New Ticket
        </Button>
      </FloatingActions>
    </div>
  )
}
