import { ArrowDown, ArrowUp, ChevronsUpDown, ListFilter } from 'lucide-react'
import type { FilterFieldConfig } from '@/components/FilterPopover'
import { SearchableSelect } from '@/components/SearchableSelect'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TableHead } from '@/components/ui/table'
import { cn } from '@/lib/utils'

type Filters = Record<string, string | undefined>

interface ColumnHeaderProps {
  label: string
  /** Sort param for this column. Omit when the column can't be sorted. */
  sortKey?: string
  sort?: string
  onSort?: (sort: string | undefined) => void
  /** Filter for this column. Omit when the column can't be filtered. */
  filter?: FilterFieldConfig
  filters?: Filters
  onFilter?: (updates: Filters) => void
  className?: string
}

function filterKeys(field: FilterFieldConfig): string[] {
  return field.type === 'date-range' ? [`${field.key}_from`, `${field.key}_to`] : [field.key]
}

/** Table header cell with click-to-sort (none → asc → desc) and an inline per-column filter popover. */
export function ColumnHeader({ label, sortKey, sort, onSort, filter, filters = {}, onFilter, className }: ColumnHeaderProps) {
  const direction = sortKey && sort === sortKey ? 'asc' : sortKey && sort === `-${sortKey}` ? 'desc' : null

  const cycleSort = () => {
    if (!sortKey || !onSort) return
    onSort(direction === null ? sortKey : direction === 'asc' ? `-${sortKey}` : undefined)
  }

  const filterActive = filter ? filterKeys(filter).some((key) => filters[key]) : false
  const clearFilter = () => {
    if (!filter || !onFilter) return
    onFilter(Object.fromEntries(filterKeys(filter).map((key) => [key, undefined])))
  }

  return (
    <TableHead className={className}>
      <div className="flex items-center gap-1">
        {sortKey ? (
          <button
            type="button"
            onClick={cycleSort}
            aria-label={`Sort by ${label}`}
            className={cn(
              'hover:text-foreground -ml-1.5 flex cursor-pointer items-center gap-1 rounded px-1.5 py-0.5 transition-colors',
              direction && 'text-primary',
            )}
          >
            {label}
            {direction === 'asc' ? (
              <ArrowUp className="size-3.5" />
            ) : direction === 'desc' ? (
              <ArrowDown className="size-3.5" />
            ) : (
              <ChevronsUpDown className="size-3.5 opacity-40" />
            )}
          </button>
        ) : (
          <span>{label}</span>
        )}

        {filter && onFilter && (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                aria-label={`Filter by ${label}`}
                className={cn(
                  'relative flex size-6 cursor-pointer items-center justify-center rounded transition-colors',
                  filterActive ? 'text-primary' : 'text-muted-foreground opacity-50 hover:opacity-100',
                )}
              >
                <ListFilter className="size-3.5" />
                {filterActive && <span className="bg-primary absolute top-0.5 right-0.5 size-1.5 rounded-full" />}
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64 p-3">
              <div className="flex flex-col gap-3">
                <p className="text-xs font-medium">Filter {label.toLowerCase()}</p>

                {filter.type === 'select' && (
                  <Select
                    value={filters[filter.key] ?? 'all'}
                    onValueChange={(value) => onFilter({ [filter.key]: value === 'all' ? undefined : value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any</SelectItem>
                      {filter.options?.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {filter.type === 'searchable-select' && (
                  <SearchableSelect
                    options={filter.options ?? []}
                    value={filters[filter.key]}
                    onChange={(value) => onFilter({ [filter.key]: value })}
                    fetchOptions={filter.fetchOptions}
                    placeholder={filter.label}
                    className="w-full"
                  />
                )}

                {filter.type === 'date-range' && (
                  <div className="flex flex-col gap-2">
                    <Input
                      type="date"
                      aria-label="From"
                      value={filters[`${filter.key}_from`] ?? ''}
                      onChange={(e) => onFilter({ [`${filter.key}_from`]: e.target.value || undefined })}
                    />
                    <Input
                      type="date"
                      aria-label="To"
                      value={filters[`${filter.key}_to`] ?? ''}
                      onChange={(e) => onFilter({ [`${filter.key}_to`]: e.target.value || undefined })}
                    />
                  </div>
                )}

                {filterActive && (
                  <Button variant="ghost" size="sm" className="text-muted-foreground self-start" onClick={clearFilter}>
                    Clear
                  </Button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </TableHead>
  )
}
