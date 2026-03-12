import type {
  AIPersonalizationResponse,
  UpdateAIPersonalizationRequest
} from '@/lib/types/api'
import {
  DEFAULT_AI_PERSONALIZATION_SETTINGS,
  type AIPersonalizationSettings
} from '@/lib/types/settings'

export const normalizePersonalizationSettings = (
  settings?: Partial<AIPersonalizationSettings> | null,
  updatedAt?: string | null
): AIPersonalizationSettings => ({
  ...DEFAULT_AI_PERSONALIZATION_SETTINGS,
  ...settings,
  characteristics: {
    ...DEFAULT_AI_PERSONALIZATION_SETTINGS.characteristics,
    ...settings?.characteristics
  },
  updatedAt: updatedAt ?? settings?.updatedAt ?? null
})

export const normalizePersonalizationForCompare = (
  settings: AIPersonalizationSettings
) => ({
  ...settings,
  customInstructions: settings.customInstructions.trim(),
  aboutYou: settings.aboutYou.trim(),
  updatedAt: null
})

export const isPersonalizationDirty = (
  draft: AIPersonalizationSettings,
  server: AIPersonalizationSettings
): boolean =>
  JSON.stringify(normalizePersonalizationForCompare(draft)) !==
  JSON.stringify(normalizePersonalizationForCompare(server))

export const toUpdatePersonalizationPayload = (
  settings: AIPersonalizationSettings
): UpdateAIPersonalizationRequest => ({
  baseStyleTone: settings.baseStyleTone,
  responseDetailMode: settings.responseDetailMode,
  characteristics: settings.characteristics,
  customInstructions: settings.customInstructions,
  aboutYou: settings.aboutYou
})

export const normalizePersonalizationResponse = (
  response: AIPersonalizationResponse
): AIPersonalizationSettings =>
  normalizePersonalizationSettings(response.personalization, response.updatedAt)
