import { Check, ChevronsUpDown, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ACTIVE_FILTER_CLASS, cn } from '@/lib/utils'

export interface SearchableSelectOption {
  value: string
  label: string
}

interface SearchableSelectProps {
  /** Used directly when `fetchOptions` is absent. When `fetchOptions` is given, only used as a fallback to resolve the *currently selected* option's label (e.g. include the record being edited so its name shows before any search runs). */
  options: SearchableSelectOption[]
  value?: string
  /** `option` is the full matched option (undefined when clearing) — handy when the caller needs the label too, e.g. to show it before a fetch happens elsewhere. */
  onChange: (value: string | undefined, option?: SearchableSelectOption) => void
  placeholder?: string
  emptyText?: string
  className?: string
  /**
   * Opt into server-side search instead of filtering `options` client-side —
   * required once a list can plausibly outgrow what's reasonable to fetch
   * in full. Called on open and on every debounced keystroke; `options` is
   * still consulted so the selected value has a label to show immediately,
   * without waiting on a fetch.
   */
  fetchOptions?: (query: string) => Promise<SearchableSelectOption[]>
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  emptyText = 'No matches.',
  className,
  fetchOptions,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [remoteOptions, setRemoteOptions] = useState<SearchableSelectOption[]>([])
  const [loading, setLoading] = useState(false)

  const selected = options.find((o) => o.value === value) ?? remoteOptions.find((o) => o.value === value)
  const displayedOptions = fetchOptions ? remoteOptions : options

  useEffect(() => {
    if (!fetchOptions || !open) return

    let cancelled = false
    setLoading(true)
    const timeout = setTimeout(() => {
      fetchOptions(query)
        .then((results) => {
          if (!cancelled) setRemoteOptions(results)
        })
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
    }, 250)

    return () => {
      cancelled = true
      clearTimeout(timeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchOptions, open, query])

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setQuery('')
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-48 justify-between font-normal',
            selected ? ACTIVE_FILTER_CLASS : 'text-muted-foreground',
            className,
          )}
        >
          <span className="truncate">{selected ? `${placeholder}: ${selected.label}` : placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <Command shouldFilter={!fetchOptions}>
          <CommandInput placeholder={placeholder} value={query} onValueChange={setQuery} />
          <CommandList>
            {loading && (
              <div className="text-muted-foreground flex items-center gap-2 px-3 py-2 text-sm">
                <Loader2 className="size-3.5 animate-spin" /> Searching…
              </div>
            )}
            {!loading && <CommandEmpty>{emptyText}</CommandEmpty>}
            <CommandGroup>
              <CommandItem
                value="__all__"
                onSelect={() => {
                  onChange(undefined)
                  setOpen(false)
                }}
              >
                <Check className={cn('mr-2 h-4 w-4', !value ? 'opacity-100' : 'opacity-0')} />
                {placeholder}
              </CommandItem>
              {displayedOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    const next = option.value === value ? undefined : option.value
                    onChange(next, next ? option : undefined)
                    setOpen(false)
                  }}
                >
                  <Check className={cn('mr-2 h-4 w-4', value === option.value ? 'opacity-100' : 'opacity-0')} />
                  {option.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
