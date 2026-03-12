import { Combobox } from '@/components/ui/combobox'
import {
  TRAIT_LEVEL_OPTIONS,
  TRAIT_ROWS
} from '@/lib/constants/personalization'
import type { AIPersonalizationSettings } from '@/lib/types/settings'

interface PersonalizationTraitRowsProps {
  characteristics: AIPersonalizationSettings['characteristics']
  onSelect: (
    trait: keyof AIPersonalizationSettings['characteristics'],
    value: string
  ) => void
}

export function PersonalizationTraitRows({
  characteristics,
  onSelect
}: PersonalizationTraitRowsProps) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium">Characteristics</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Add additional customizations on top of your base style.
        </p>
      </div>
      {TRAIT_ROWS.map((trait) => (
        <div
          key={trait.key}
          className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between"
        >
          <p className="text-sm">{trait.label}</p>
          <div className="w-full md:max-w-[220px]">
            <Combobox
              options={TRAIT_LEVEL_OPTIONS}
              value={characteristics[trait.key]}
              onSelect={(value) => onSelect(trait.key, value)}
              searchPlaceholder={`Search ${trait.label.toLowerCase()} level...`}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
