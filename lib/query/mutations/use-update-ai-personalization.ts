'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateAIPersonalization } from '@/lib/api/client'
import { queryKeys } from '../query-keys'
import type {
  AIPersonalizationResponse,
  UpdateAIPersonalizationRequest
} from '@/lib/types/api'

export function useUpdateAIPersonalization() {
  const queryClient = useQueryClient()

  return useMutation<
    AIPersonalizationResponse,
    Error,
    UpdateAIPersonalizationRequest
  >({
    mutationFn: updateAIPersonalization,
    onSuccess: (response) => {
      queryClient.setQueryData(queryKeys.ai.personalization(), response)
    }
  })
}
