'use client'

import { useQuery } from '@tanstack/react-query'
import { getAIPersonalization } from '@/lib/api/client'
import { queryKeys } from '../query-keys'
import type { AIPersonalizationResponse } from '@/lib/types/api'

interface UseAIPersonalizationOptions {
  enabled?: boolean
  initialData?: AIPersonalizationResponse
}

export function useAIPersonalization({
  enabled = true,
  initialData
}: UseAIPersonalizationOptions = {}) {
  return useQuery({
    queryKey: queryKeys.ai.personalization(),
    queryFn: getAIPersonalization,
    enabled,
    initialData,
    staleTime: 5 * 60 * 1000
  })
}
