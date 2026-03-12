'use client'

import { Button } from '@/components/ui/button'
import type { PillSwitcherOption } from '@/lib/types/ui'
import { cn } from '@/lib/utils'

interface PillSwitcherProps<T extends string> {
  value: T
  options: PillSwitcherOption<T>[]
  onValueChange: (value: T) => void
  ariaLabel: string
  collapsed?: boolean
  className?: string
}

export function PillSwitcher<T extends string>({
  value,
  options,
  onValueChange,
  ariaLabel,
  collapsed = false,
  className
}: PillSwitcherProps<T>) {
  const activeIndex = Math.max(
    options.findIndex((option) => option.value === value),
    0
  )

  return (
    <div
      className={cn(
        'relative grid items-center rounded-full bg-muted p-0.5',
        className
      )}
      style={{
        gridTemplateColumns: `repeat(${Math.max(options.length, 1)}, minmax(0, 1fr))`
      }}
      role="tablist"
      aria-label={ariaLabel}
    >
      <div
        className="pointer-events-none absolute top-0.5 bottom-0.5 left-0.5 z-0 rounded-full bg-background shadow-sm transition-transform duration-200 ease-out"
        style={{
          width: `calc((100% - 0.25rem) / ${Math.max(options.length, 1)})`,
          transform: `translateX(calc(${activeIndex} * 100%))`
        }}
      />
      {options.map((option) => {
        const isActive = value === option.value

        if (collapsed && option.icon) {
          const Icon = option.icon

          return (
            <Button
              key={option.value}
              variant="ghost"
              className={cn(
                'relative z-10 h-7 w-full cursor-pointer rounded-full px-0 hover:bg-transparent',
                isActive
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              onClick={() => onValueChange(option.value)}
              aria-label={option.label}
              aria-pressed={isActive}
            >
              <Icon className="h-3.5 w-3.5" />
              <span className="sr-only">{option.label}</span>
            </Button>
          )
        }

        return (
          <Button
            key={option.value}
            variant="ghost"
            className={cn(
              'relative z-10 h-7 w-full cursor-pointer rounded-full px-2.5 text-xs font-medium hover:bg-transparent',
              isActive
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => onValueChange(option.value)}
            aria-pressed={isActive}
          >
            {option.label}
          </Button>
        )
      })}
    </div>
  )
}
