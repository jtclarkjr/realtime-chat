'use client'

import { useQuery } from '@tanstack/react-query'
import { getAIUsageStatus } from '@/lib/api/client'
import { queryKeys } from '../query-keys'
import type { AIUsageStatusResponse } from '@/lib/types/api'

interface UseAIUsageOptions {
  enabled?: boolean
  initialData?: AIUsageStatusResponse
}

export function useAIUsage({
  enabled = true,
  initialData
}: UseAIUsageOptions = {}) {
  return useQuery({
    queryKey: queryKeys.ai.usage(),
    queryFn: getAIUsageStatus,
    enabled,
    initialData,
    staleTime: 30 * 1000
  })
}
