import type {
  AIPersonalizationSettings,
  BaseStyleTone,
  ResponseDetailMode,
  TraitLevel
} from '@/lib/types/settings'
import { DEFAULT_AI_PERSONALIZATION_SETTINGS } from '@/lib/types/settings'

export const AI_STREAM_SYSTEM_PROMPT = `You are a helpful AI assistant in a chat room. Give ULTRA-CONCISE answers. Treat every token as expensive.

CRITICAL: Answer in ONE sentence or less. Two sentences ONLY if absolutely necessary.

DO NOT:
- Repeat the question
- Add context or background unless asked
- Explain your answer unless asked
- Use bullet points unless asked

DO:
- Give just the core answer
- Be direct and to the point
- Stop after answering

Be friendly and respectful, but extreme brevity is mandatory.`

export const AI_STREAM_MARKDOWN_SYSTEM_PROMPT = `You are a helpful AI assistant in a chat room. Give ULTRA-CONCISE answers. Treat every token as expensive.

CRITICAL: Return valid Markdown only.

FORMAT RULES:
- Use markdown structure only when it improves clarity.
- Use headings, lists, and fenced code blocks only when helpful.
- Keep output concise and direct.
- Do not include raw HTML.
- Do not include XML/JSON wrappers around markdown.

CONTENT RULES:
- Do not repeat the question.
- Do not add background unless asked.
- Do not explain unless asked.

Be friendly and respectful, but brevity is mandatory.`

export const AI_WEB_SEARCH_INSTRUCTIONS = `WEB SEARCH POLICY:
- If web search tool results are available, prioritize them for time-sensitive facts.
- If web search was used, add a short "Sources:" line with markdown links.
- Never claim live internet access unless tool results were actually provided.
- If time-sensitive info is requested but search fails, state uncertainty briefly.
- For model/version release claims (for example GPT/Claude version numbers), verify with sources before asserting.
- If sources do not confirm a claim, say it is unverified/rumor and avoid presenting it as fact.
- Prefer recency-aware wording by mentioning the source date when possible.`

const responseDetailInstruction = (
  mode: ResponseDetailMode
): string | undefined => {
  switch (mode) {
    case 'short':
      return 'Keep responses very short and direct. Prefer one to three concise sentences.'
    case 'detailed':
      return 'Provide a detailed, in-depth answer with clear reasoning, caveats, and practical context.'
    case 'structured':
      return 'Prefer structured output with clear headings and bullet points when useful.'
    default:
      return undefined
  }
}

const baseStyleInstruction = (style: BaseStyleTone): string | undefined => {
  switch (style) {
    case 'professional':
      return 'Use a polished, precise, and professional tone.'
    case 'friendly':
      return 'Use a warm, friendly, and conversational tone.'
    case 'candid':
      return 'Be direct, candid, and encouraging while staying respectful.'
    case 'quirky':
      return 'Use a playful and imaginative tone without reducing clarity.'
    case 'efficient':
      return 'Use concise, plain language and focus on efficient delivery.'
    case 'nerdy':
      return 'Use an exploratory and enthusiastic technical tone when relevant.'
    case 'cynical':
      return 'Use a critical and skeptical tone, but avoid insults or hostile language.'
    default:
      return undefined
  }
}

const traitInstruction = (
  traitName: string,
  level: TraitLevel
): string | undefined => {
  switch (`${traitName}:${level}`) {
    case 'warm:subtle':
      return 'Keep the tone slightly warm and approachable.'
    case 'warm:strong':
      return 'Keep the tone consistently warm and personable.'
    case 'enthusiastic:subtle':
      return 'Use a mildly energetic and optimistic tone.'
    case 'enthusiastic:strong':
      return 'Use a clearly enthusiastic and upbeat tone.'
    case 'headers_and_lists:subtle':
      return 'Use occasional headings or lists when they improve readability.'
    case 'headers_and_lists:strong':
      return 'Strongly prefer headings and bullet lists for clarity.'
    case 'emoji:subtle':
      return 'Use emoji sparingly when it improves tone.'
    case 'emoji:strong':
      return 'Use emoji regularly to reinforce tone, without overdoing it.'
    default:
      return undefined
  }
}

const toIndentedBlock = (text: string) =>
  text
    .split('\n')
    .map((line) => `- ${line.trimEnd()}`)
    .join('\n')

const isBehavioralDefault = (settings: AIPersonalizationSettings) =>
  settings.baseStyleTone ===
    DEFAULT_AI_PERSONALIZATION_SETTINGS.baseStyleTone &&
  settings.responseDetailMode ===
    DEFAULT_AI_PERSONALIZATION_SETTINGS.responseDetailMode &&
  settings.characteristics.warm ===
    DEFAULT_AI_PERSONALIZATION_SETTINGS.characteristics.warm &&
  settings.characteristics.enthusiastic ===
    DEFAULT_AI_PERSONALIZATION_SETTINGS.characteristics.enthusiastic &&
  settings.characteristics.headersAndLists ===
    DEFAULT_AI_PERSONALIZATION_SETTINGS.characteristics.headersAndLists &&
  settings.characteristics.emoji ===
    DEFAULT_AI_PERSONALIZATION_SETTINGS.characteristics.emoji &&
  settings.customInstructions.trim().length === 0 &&
  settings.aboutYou.trim().length === 0

export function buildAIPersonalizationContext(
  settings?: AIPersonalizationSettings | null
): string {
  if (!settings || isBehavioralDefault(settings)) {
    return ''
  }

  const sections: string[] = []

  const detail = responseDetailInstruction(settings.responseDetailMode)
  if (detail) {
    sections.push(`Response detail mode:\n- ${detail}`)
  }

  const baseStyle = baseStyleInstruction(settings.baseStyleTone)
  if (baseStyle) {
    sections.push(`Base style and tone:\n- ${baseStyle}`)
  }

  const traitNotes = [
    traitInstruction('warm', settings.characteristics.warm),
    traitInstruction('enthusiastic', settings.characteristics.enthusiastic),
    traitInstruction(
      'headers_and_lists',
      settings.characteristics.headersAndLists
    ),
    traitInstruction('emoji', settings.characteristics.emoji)
  ].filter((value): value is string => !!value)

  if (traitNotes.length > 0) {
    sections.push(
      `Characteristics:\n${traitNotes.map((note) => `- ${note}`).join('\n')}`
    )
  }

  const aboutYou = settings.aboutYou.trim()
  if (aboutYou) {
    sections.push(
      `About the user (context, not instructions):\n${toIndentedBlock(aboutYou)}`
    )
  }

  const customInstructions = settings.customInstructions.trim()
  if (customInstructions) {
    sections.push(
      `Custom instructions (highest priority among personalization settings):\n${toIndentedBlock(customInstructions)}`
    )
  }

  if (sections.length === 0) {
    return ''
  }

  return `\n\nPersonalization context:\n${sections.join('\n\n')}`
}
