import type { AIPersonalizationSettings } from '@/lib/types/settings'

type PersonalizationSelectOption = {
  value: string
  label: string
  description: string
}

export const MAX_PERSONALIZATION_TEXT_LENGTH = 1000

export const BASE_STYLE_OPTIONS: PersonalizationSelectOption[] = [
  { value: 'default', label: 'Default', description: 'Preset style and tone' },
  {
    value: 'professional',
    label: 'Professional',
    description: 'Polished and precise'
  },
  { value: 'friendly', label: 'Friendly', description: 'Warm and chatty' },
  { value: 'candid', label: 'Candid', description: 'Direct and encouraging' },
  { value: 'quirky', label: 'Quirky', description: 'Playful and imaginative' },
  {
    value: 'efficient',
    label: 'Efficient',
    description: 'Concise and plain'
  },
  {
    value: 'nerdy',
    label: 'Nerdy',
    description: 'Exploratory and enthusiastic'
  },
  {
    value: 'cynical',
    label: 'Cynical',
    description: 'Critical and skeptical'
  }
]

export const RESPONSE_DETAIL_OPTIONS: PersonalizationSelectOption[] = [
  {
    value: 'default',
    label: 'Default',
    description: 'Current concise behavior'
  },
  { value: 'short', label: 'Short', description: 'Very brief responses' },
  {
    value: 'detailed',
    label: 'Detailed',
    description: 'In-depth explanations'
  },
  {
    value: 'structured',
    label: 'Structured',
    description: 'Prefer headings and bullet points'
  }
]

export const TRAIT_LEVEL_OPTIONS: PersonalizationSelectOption[] = [
  {
    value: 'default',
    label: 'Default',
    description: 'Use base style behavior'
  },
  { value: 'subtle', label: 'Subtle', description: 'Light emphasis' },
  { value: 'strong', label: 'Strong', description: 'High emphasis' }
]

export const TRAIT_ROWS: Array<{
  key: keyof AIPersonalizationSettings['characteristics']
  label: string
}> = [
  { key: 'warm', label: 'Warm' },
  { key: 'enthusiastic', label: 'Enthusiastic' },
  { key: 'headersAndLists', label: 'Headers & Lists' },
  { key: 'emoji', label: 'Emoji' }
]
