import { Combobox } from '@/components/ui/combobox'
import type { ComboboxOption } from '@/components/ui/combobox'

interface PersonalizationSelectFieldProps {
  label: string
  description: string
  value: string
  options: ComboboxOption[]
  searchPlaceholder: string
  onSelect: (value: string) => void
}

export function PersonalizationSelectField({
  label,
  description,
  value,
  options,
  searchPlaceholder,
  onSelect
}: PersonalizationSelectFieldProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
      <Combobox
        options={options}
        value={value}
        onSelect={onSelect}
        searchPlaceholder={searchPlaceholder}
      />
    </div>
  )
}
