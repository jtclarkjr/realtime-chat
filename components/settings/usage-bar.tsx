'use client'

import { useMemo } from 'react'
import { Progress } from '@/components/ui/progress'
import { formatTimeUntil } from '@/lib/utils/time-until'

interface UsageBarProps {
  label: string
  percent: number
  resetAt: string
  usedLabel: string
}

export function UsageBar({
  label,
  percent,
  resetAt,
  usedLabel
}: UsageBarProps) {
  const resetIn = useMemo(() => formatTimeUntil(resetAt), [resetAt])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">Resets in {resetIn}</p>
        </div>
        <p className="text-xs text-muted-foreground">{usedLabel}</p>
      </div>
      <Progress value={percent} />
    </div>
  )
}
