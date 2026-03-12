import { getServiceClient } from '@/lib/supabase/server'
import type {
  AIPersonalizationResponse,
  UpdateAIPersonalizationRequest
} from '@/lib/types/api'
import {
  DEFAULT_AI_PERSONALIZATION_SETTINGS,
  type AIPersonalizationSettings
} from '@/lib/types/settings'
import type { Database } from '@/lib/types/supabase'

type PersonalizationRow =
  Database['public']['Tables']['user_ai_personalization_settings']['Row']

const mapRowToSettings = (
  row?: PersonalizationRow | null
): AIPersonalizationSettings => {
  if (!row) {
    return { ...DEFAULT_AI_PERSONALIZATION_SETTINGS }
  }

  return {
    baseStyleTone: row.base_style_tone,
    responseDetailMode: row.response_detail_mode,
    characteristics: {
      warm: row.warm,
      enthusiastic: row.enthusiastic,
      headersAndLists: row.headers_and_lists,
      emoji: row.emoji
    },
    customInstructions: row.custom_instructions,
    aboutYou: row.about_you,
    updatedAt: row.updated_at
  }
}

const toResponse = (
  settings: AIPersonalizationSettings
): AIPersonalizationResponse => ({
  personalization: settings,
  updatedAt: settings.updatedAt
})

export function isBehavioralDefaultPersonalization(
  settings?: AIPersonalizationSettings | null
): boolean {
  const effective = settings ?? DEFAULT_AI_PERSONALIZATION_SETTINGS

  return (
    effective.baseStyleTone === 'default' &&
    effective.responseDetailMode === 'default' &&
    effective.characteristics.warm === 'default' &&
    effective.characteristics.enthusiastic === 'default' &&
    effective.characteristics.headersAndLists === 'default' &&
    effective.characteristics.emoji === 'default' &&
    effective.customInstructions.trim().length === 0 &&
    effective.aboutYou.trim().length === 0
  )
}

export async function getAIPersonalization(
  userId: string
): Promise<AIPersonalizationResponse> {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('user_ai_personalization_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    throw new Error('Failed to load personalization settings')
  }

  return toResponse(mapRowToSettings(data))
}

export async function getAIPersonalizationSettings(
  userId: string
): Promise<AIPersonalizationSettings> {
  const response = await getAIPersonalization(userId)
  return response.personalization
}

export async function updateAIPersonalization(
  userId: string,
  payload: UpdateAIPersonalizationRequest
): Promise<AIPersonalizationResponse> {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('user_ai_personalization_settings')
    .upsert(
      {
        user_id: userId,
        base_style_tone: payload.baseStyleTone,
        response_detail_mode: payload.responseDetailMode,
        warm: payload.characteristics.warm,
        enthusiastic: payload.characteristics.enthusiastic,
        headers_and_lists: payload.characteristics.headersAndLists,
        emoji: payload.characteristics.emoji,
        custom_instructions: payload.customInstructions.trim(),
        about_you: payload.aboutYou.trim()
      },
      { onConflict: 'user_id' }
    )
    .select('*')
    .single()

  if (error) {
    throw new Error('Failed to save personalization settings')
  }

  return toResponse(mapRowToSettings(data))
}
