import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'

interface CheckboxToggleOption<T extends string | number> {
  value: T
  label: string
}

/** Multi-select input rendered as a checkbox list. */
export function CheckboxToggleGroup<T extends string | number>({
  options,
  selected,
  onToggle,
  disabled = false,
  className,
}: {
  options: CheckboxToggleOption<T>[]
  selected: T[]
  onToggle: (value: T, checked: boolean) => void
  disabled?: boolean
  className?: string
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {options.map((option) => (
        <label key={option.value} className="flex items-center gap-2 text-sm">
          <Checkbox
            disabled={disabled}
            checked={selected.includes(option.value)}
            onCheckedChange={(checked) => onToggle(option.value, checked === true)}
          />
          {option.label}
        </label>
      ))}
    </div>
  )
}
