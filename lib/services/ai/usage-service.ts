import { getServiceClient } from '@/lib/supabase/server'
import type { AIUsageStatusResponse, AIUsageWindow } from '@/lib/types/api'

type UsageWindowKind = 'five_hour' | 'monthly'

const FREE_TIER = 'free' as const
const FIVE_HOUR_LIMIT = 5_000
const MONTHLY_LIMIT = 50_000
const TOKEN_CHAR_DIVISOR = 4

export class AIUsageLimitError extends Error {
  constructor(
    public readonly windowKind: UsageWindowKind,
    public readonly resetAt: string
  ) {
    super(
      windowKind === 'five_hour'
        ? `5-hour AI usage limit reached. Resets at ${new Date(resetAt).toLocaleString()}.`
        : `Monthly AI usage limit reached. Resets at ${new Date(resetAt).toLocaleString()}.`
    )
    this.name = 'AIUsageLimitError'
  }
}

const getFiveHourWindowStart = (now: Date): Date =>
  new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      Math.floor(now.getUTCHours() / 5) * 5,
      0,
      0,
      0
    )
  )

const getNextFiveHourWindow = (now: Date): Date => {
  const start = getFiveHourWindowStart(now)
  return new Date(start.getTime() + 5 * 60 * 60 * 1000)
}

const getMonthWindowStart = (now: Date): Date =>
  new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0))

const getNextMonthWindow = (now: Date): Date =>
  new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0))

const toWindow = ({
  used,
  limit,
  resetAt
}: {
  used: number
  limit: number
  resetAt: string
}): AIUsageWindow => {
  const percent =
    limit === 0 ? 100 : Math.min(Math.floor((used * 100) / limit), 100)
  const locked = limit === 0 || used >= limit

  return {
    used,
    limit,
    percent,
    remaining: Math.max(limit - used, 0),
    resetAt,
    locked
  }
}

async function getBucketUsage(
  userId: string,
  windowKind: UsageWindowKind,
  windowStart: Date
): Promise<number> {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('user_ai_usage_buckets')
    .select('tokens_used')
    .eq('user_id', userId)
    .eq('window_kind', windowKind)
    .eq('window_start', windowStart.toISOString())
    .maybeSingle()

  if (error) {
    throw new Error('Failed to load AI usage')
  }

  return data?.tokens_used ?? 0
}

async function incrementBucketUsage(
  userId: string,
  windowKind: UsageWindowKind,
  windowStart: Date,
  tokenDelta: number
): Promise<number> {
  const supabase = getServiceClient()
  const { data, error } = await supabase.rpc('increment_ai_usage_bucket', {
    usage_user_id: userId,
    usage_window_kind: windowKind,
    usage_window_start: windowStart.toISOString(),
    token_delta: tokenDelta
  })

  if (error) {
    throw new Error('Failed to update AI usage')
  }

  return Number(data ?? 0)
}

export function estimateTokens(text: string): number {
  const charCount = Array.from(text).length
  if (charCount === 0) {
    return 0
  }

  return Math.ceil(charCount / TOKEN_CHAR_DIVISOR)
}

export function estimatePromptTokens({
  message,
  previousMessages = [],
  customPrompt,
  targetMessageContent
}: {
  message: string
  previousMessages?: Array<{ content: string }>
  customPrompt?: string
  targetMessageContent?: string
}): number {
  const previousTokens = previousMessages.reduce(
    (total, entry) => total + estimateTokens(entry.content),
    0
  )

  return (
    estimateTokens(message) +
    estimateTokens(customPrompt || '') +
    estimateTokens(targetMessageContent || '') +
    previousTokens
  )
}

export async function getAIUsageStatus(
  userId: string
): Promise<AIUsageStatusResponse> {
  const now = new Date()
  const fiveHourStart = getFiveHourWindowStart(now)
  const monthStart = getMonthWindowStart(now)
  const [dailyUsed, monthlyUsed] = await Promise.all([
    getBucketUsage(userId, 'five_hour', fiveHourStart),
    getBucketUsage(userId, 'monthly', monthStart)
  ])

  const daily = toWindow({
    used: dailyUsed,
    limit: FIVE_HOUR_LIMIT,
    resetAt: getNextFiveHourWindow(now).toISOString()
  })
  const monthly = toWindow({
    used: monthlyUsed,
    limit: MONTHLY_LIMIT,
    resetAt: getNextMonthWindow(now).toISOString()
  })

  return {
    tier: FREE_TIER,
    daily,
    monthly,
    locked: daily.locked || monthly.locked,
    updatedAt: now.toISOString()
  }
}

export async function checkAndConsumePromptTokens(
  userId: string,
  promptTokens: number
): Promise<AIUsageStatusResponse> {
  const status = await getAIUsageStatus(userId)

  if (status.daily.locked) {
    throw new AIUsageLimitError('five_hour', status.daily.resetAt)
  }

  if (status.monthly.locked) {
    throw new AIUsageLimitError('monthly', status.monthly.resetAt)
  }

  if (promptTokens > 0) {
    const now = new Date()
    await Promise.all([
      incrementBucketUsage(
        userId,
        'five_hour',
        getFiveHourWindowStart(now),
        promptTokens
      ),
      incrementBucketUsage(
        userId,
        'monthly',
        getMonthWindowStart(now),
        promptTokens
      )
    ])
  }

  return getAIUsageStatus(userId)
}

export async function addOutputTokens(
  userId: string,
  tokens: number
): Promise<void> {
  if (tokens <= 0) {
    return
  }

  const now = new Date()
  await Promise.all([
    incrementBucketUsage(
      userId,
      'five_hour',
      getFiveHourWindowStart(now),
      tokens
    ),
    incrementBucketUsage(userId, 'monthly', getMonthWindowStart(now), tokens)
  ])
}
