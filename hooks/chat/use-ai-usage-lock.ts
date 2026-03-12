'use client'

import { useMemo } from 'react'
import type { AIUsageStatusResponse } from '@/lib/types/api'

interface UseAIUsageLockParams {
  aiUsage?: AIUsageStatusResponse
  isAnonymous: boolean
}

export function useAIUsageLock({ aiUsage, isAnonymous }: UseAIUsageLockParams) {
  const isAILocked = !isAnonymous && !!aiUsage?.locked

  const aiUsageNearLimitNotice = useMemo(() => {
    if (!aiUsage || isAILocked) {
      return undefined
    }

    const nearDaily = aiUsage.daily.percent >= 90 && aiUsage.daily.percent < 100
    const nearMonthly =
      aiUsage.monthly.percent >= 90 && aiUsage.monthly.percent < 100

    switch (`${nearDaily}-${nearMonthly}`) {
      case 'true-true':
        return `Usage nearing limit: ${aiUsage.daily.percent}% (5-hour), ${aiUsage.monthly.percent}% (monthly)`
      case 'true-false':
        return `Usage nearing limit: ${aiUsage.daily.percent}% (5-hour)`
      case 'false-true':
        return `Usage nearing limit: ${aiUsage.monthly.percent}% (monthly)`
      default:
        return undefined
    }
  }, [aiUsage, isAILocked])

  const aiLockReason = useMemo(() => {
    if (!isAILocked || !aiUsage) {
      return undefined
    }

    if (aiUsage.daily.locked) {
      return `5-hour AI usage limit reached. Resets at ${new Date(aiUsage.daily.resetAt).toLocaleString()}.`
    }

    if (aiUsage.monthly.locked) {
      return `Monthly AI usage limit reached. Resets at ${new Date(aiUsage.monthly.resetAt).toLocaleString()}.`
    }

    return 'AI assistant usage is locked until reset.'
  }, [aiUsage, isAILocked])

  return {
    isAILocked,
    aiUsageNearLimitNotice,
    aiLockReason
  }
}
