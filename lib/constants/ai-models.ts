import type { PersonalAIModelValue } from '@/lib/types/ai-models'

export const PERSONAL_AI_MODEL_AUTO = 'auto' as const

export const PERSONAL_AI_MODEL_OPTIONS: ReadonlyArray<{
  value: PersonalAIModelValue
  label: string
}> = [
  { value: PERSONAL_AI_MODEL_AUTO, label: 'Auto' },
  { value: 'claude-sonnet-4-5', label: 'Claude Sonnet 4.5' },
  { value: 'claude-haiku-4-5', label: 'Claude Haiku 4.5' }
]

const PERSONAL_AI_MODEL_VALUE_SET = new Set<string>(
  PERSONAL_AI_MODEL_OPTIONS.map((option) => option.value)
)

export const normalizePersonalAIModel = (
  value?: string | null
): PersonalAIModelValue => {
  if (!value) {
    return PERSONAL_AI_MODEL_AUTO
  }

  if (PERSONAL_AI_MODEL_VALUE_SET.has(value)) {
    return value as PersonalAIModelValue
  }

  return PERSONAL_AI_MODEL_AUTO
}

export const toManualAIModel = (
  value: PersonalAIModelValue
): string | undefined => {
  if (value === PERSONAL_AI_MODEL_AUTO) {
    return undefined
  }

  return value
}
