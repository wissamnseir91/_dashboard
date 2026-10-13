import { Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { useDebouncedEffect } from '@/hooks/useDebouncedEffect'
import { ACTIVE_FILTER_CLASS, cn } from '@/lib/utils'

interface SearchFilterInputProps {
  value?: string
  onChange: (value: string | undefined) => void
  placeholder?: string
}

export function SearchFilterInput({ value, onChange, placeholder = 'Search…' }: SearchFilterInputProps) {
  const [local, setLocal] = useState(value ?? '')

  useEffect(() => {
    setLocal(value ?? '')
  }, [value])

  useDebouncedEffect(
    () => {
      const next = local.trim() === '' ? undefined : local
      if (next !== value) {
        onChange(next)
      }
    },
    [local],
    400,
  )

  return (
    <div className="relative">
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
      <Input
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'bg-muted/50 focus-visible:bg-background w-64 rounded-full border-transparent pr-8 pl-9 shadow-none',
          value && ACTIVE_FILTER_CLASS,
        )}
      />
      {local && (
        <button
          type="button"
          onClick={() => setLocal('')}
          aria-label="Clear search"
          className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2.5 -translate-y-1/2 cursor-pointer"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}
