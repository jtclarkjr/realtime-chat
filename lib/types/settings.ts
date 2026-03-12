export type SettingsTab = 'general' | 'ai-usage' | 'personalization'

export type BaseStyleTone =
  | 'default'
  | 'professional'
  | 'friendly'
  | 'candid'
  | 'quirky'
  | 'efficient'
  | 'nerdy'
  | 'cynical'

export type ResponseDetailMode = 'default' | 'short' | 'detailed' | 'structured'

export type TraitLevel = 'default' | 'subtle' | 'strong'

export interface AIPersonalizationCharacteristics {
  warm: TraitLevel
  enthusiastic: TraitLevel
  headersAndLists: TraitLevel
  emoji: TraitLevel
}

export interface AIPersonalizationSettings {
  baseStyleTone: BaseStyleTone
  responseDetailMode: ResponseDetailMode
  characteristics: AIPersonalizationCharacteristics
  customInstructions: string
  aboutYou: string
  updatedAt: string | null
}

export const DEFAULT_AI_PERSONALIZATION_SETTINGS: AIPersonalizationSettings = {
  baseStyleTone: 'default',
  responseDetailMode: 'default',
  characteristics: {
    warm: 'default',
    enthusiastic: 'default',
    headersAndLists: 'default',
    emoji: 'default'
  },
  customInstructions: '',
  aboutYou: '',
  updatedAt: null
}
