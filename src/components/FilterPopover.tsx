import { ListFilter, Plus, X } from 'lucide-react'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SearchableSelect, type SearchableSelectOption } from '@/components/SearchableSelect'
import { ACTIVE_FILTER_CLASS, cn } from '@/lib/utils'

export type FilterFieldType = 'select' | 'searchable-select' | 'date-range'

export interface FilterFieldConfig {
  /** Filter param key. For `date-range`, this is a prefix — the real params are `${key}_from`/`${key}_to`. */
  key: string
  label: string
  type: FilterFieldType
  options?: SearchableSelectOption[]
  /** `searchable-select` only — opt into server-side search instead of a static `options` list (see SearchableSelect). */
  fetchOptions?: (query: string) => Promise<SearchableSelectOption[]>
}

type Filters = Record<string, string | undefined>

interface FilterPopoverProps {
  fields: FilterFieldConfig[]
  filters: Filters
  onChange: (updates: Filters) => void
}

function fieldHasValue(field: FilterFieldConfig, filters: Filters): boolean {
  if (field.type === 'date-range') {
    return Boolean(filters[`${field.key}_from`] || filters[`${field.key}_to`])
  }
  return Boolean(filters[field.key])
}

export function FilterPopover({ fields, filters, onChange }: FilterPopoverProps) {
  const [activeKeys, setActiveKeys] = useState<Set<string>>(
    () => new Set(fields.filter((f) => fieldHasValue(f, filters)).map((f) => f.key)),
  )

  const activeFields = fields.filter((f) => activeKeys.has(f.key))
  const availableFields = fields.filter((f) => !activeKeys.has(f.key))
  const activeCount = fields.filter((f) => fieldHasValue(f, filters)).length

  const addField = (key: string) => {
    setActiveKeys((prev) => new Set(prev).add(key))
  }

  const removeField = (field: FilterFieldConfig) => {
    setActiveKeys((prev) => {
      const next = new Set(prev)
      next.delete(field.key)
      return next
    })
    if (field.type === 'date-range') {
      onChange({ [`${field.key}_from`]: undefined, [`${field.key}_to`]: undefined })
    } else {
      onChange({ [field.key]: undefined })
    }
  }

  const clearAll = () => {
    const cleared: Filters = {}
    for (const field of fields) {
      if (field.type === 'date-range') {
        cleared[`${field.key}_from`] = undefined
        cleared[`${field.key}_to`] = undefined
      } else {
        cleared[field.key] = undefined
      }
    }
    setActiveKeys(new Set())
    onChange(cleared)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn('gap-1.5', activeCount > 0 && ACTIVE_FILTER_CLASS)}>
          <ListFilter className="h-3.5 w-3.5" />
          Filters
          {activeCount > 0 && (
            <Badge variant="secondary" className="h-4.5 px-1.5">
              {activeCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 overflow-hidden rounded-xl p-0" align="start">
        <div className="bg-muted/40 border-border flex items-center justify-between border-b px-4 py-3">
          <p className="font-heading text-sm font-semibold">Filters</p>
          {activeKeys.size > 0 && (
            <Button variant="ghost" size="sm" className="text-muted-foreground h-7 px-2" onClick={clearAll}>
              Clear all
            </Button>
          )}
        </div>
        <div className="flex max-h-96 flex-col gap-3 overflow-y-auto p-4">
          {activeFields.length === 0 && (
            <p className="text-muted-foreground text-sm">No filters applied. Pick a field below to start.</p>
          )}

          {activeFields.map((field) => (
            <div key={field.key} className="border-border bg-card flex items-start gap-2 rounded-lg border p-3">
              <div className="flex-1">
                <Label className="mb-1.5 block text-xs font-medium">{field.label}</Label>
                {field.type === 'select' && (
                  <Select
                    value={filters[field.key] ?? 'all'}
                    onValueChange={(value) => onChange({ [field.key]: value === 'all' ? undefined : value })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any</SelectItem>
                      {field.options?.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {field.type === 'searchable-select' && (
                  <SearchableSelect
                    options={field.options ?? []}
                    value={filters[field.key]}
                    onChange={(value) => onChange({ [field.key]: value })}
                    fetchOptions={field.fetchOptions}
                    placeholder={field.label}
                    className="w-full"
                  />
                )}

                {field.type === 'date-range' && (
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="date"
                      value={filters[`${field.key}_from`] ?? ''}
                      onChange={(e) =>
                        onChange({ [`${field.key}_from`]: e.target.value || undefined })
                      }
                      className="w-full"
                    />
                    <span className="text-muted-foreground text-xs">to</span>
                    <Input
                      type="date"
                      value={filters[`${field.key}_to`] ?? ''}
                      onChange={(e) => onChange({ [`${field.key}_to`]: e.target.value || undefined })}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground -mt-1 -mr-1 size-6 shrink-0"
                aria-label={`Remove ${field.label} filter`}
                onClick={() => removeField(field)}
              >
                <X className="size-3.5" />
              </Button>
            </div>
          ))}

          {availableFields.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">Add filter</p>
              <div className="flex flex-wrap gap-1.5">
                {availableFields.map((field) => (
                  <button
                    key={field.key}
                    type="button"
                    onClick={() => addField(field.key)}
                    className="border-border hover:bg-accent flex cursor-pointer items-center gap-1 rounded-full border border-dashed px-2.5 py-1 text-xs font-medium transition-colors"
                  >
                    <Plus className="size-3" /> {field.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
