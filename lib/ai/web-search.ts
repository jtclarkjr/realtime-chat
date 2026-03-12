import { ERROR_DEFINITIONS } from '@/lib/errors/error-definitions'

export interface WebSearchResult {
  title: string
  url: string
  snippet: string
  publishedDate?: string
}

interface TavilyResponse {
  results?: Array<{
    title?: string
    url?: string
    content?: string
    published_date?: string
  }>
}
const TAVILY_QUOTA_EXCEEDED_CODE = ERROR_DEFINITIONS.TAVILY_QUOTA_EXCEEDED.code

const asCodedError = (
  message: string,
  code: string
): Error & { code: string } => Object.assign(new Error(message), { code })

export const isTavilyQuotaExceededError = (
  error: unknown
): error is Error & { code: string } =>
  Boolean(
    error &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code?: unknown }).code === TAVILY_QUOTA_EXCEEDED_CODE
  )

const DEFAULT_MAX_RESULTS = 5
const DEFAULT_TIMEOUT_MS = 6000
const MAX_SNIPPET_LENGTH = 500

const normalizeSnippet = (value: string): string => {
  const trimmed = value.trim().replace(/\s+/g, ' ')
  if (trimmed.length <= MAX_SNIPPET_LENGTH) return trimmed
  return `${trimmed.slice(0, MAX_SNIPPET_LENGTH)}...`
}

const sanitizeHttpUrl = (rawUrl: string): string | null => {
  try {
    const parsed = new URL(rawUrl)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null
    }
    return parsed.toString()
  } catch {
    return null
  }
}

const getPublishedTimestamp = (publishedDate?: string): number => {
  if (!publishedDate) return Number.NEGATIVE_INFINITY
  const parsed = Date.parse(publishedDate)
  if (!Number.isFinite(parsed)) return Number.NEGATIVE_INFINITY
  return parsed
}

export const buildSourcesMarkdown = (
  results: WebSearchResult[],
  maxSources: number = 3
): string => {
  if (!results.length) return ''

  const uniqueByUrl: WebSearchResult[] = []
  const seen = new Set<string>()

  for (const result of results) {
    if (seen.has(result.url)) continue
    seen.add(result.url)
    uniqueByUrl.push(result)
    if (uniqueByUrl.length >= maxSources) break
  }

  if (!uniqueByUrl.length) return ''

  const links = uniqueByUrl.map((result) => {
    const safeTitle = result.title.replace(/\[|\]/g, '')
    return `[${safeTitle}](${result.url})`
  })

  return `Sources: ${links.join(' | ')}`
}

export const searchWeb = async (
  query: string,
  opts: { maxResults?: number; timeoutMs?: number } = {}
): Promise<WebSearchResult[]> => {
  const apiKey = process.env.TAVILY_API_KEY
  if (!apiKey) {
    throw new Error('Tavily API key not configured')
  }

  const trimmedQuery = query.trim()
  if (!trimmedQuery) return []

  const maxResults = Math.max(
    1,
    Math.min(10, opts.maxResults ?? DEFAULT_MAX_RESULTS)
  )
  const timeoutMs = Math.max(1000, opts.timeoutMs ?? DEFAULT_TIMEOUT_MS)

  const abortController = new AbortController()
  const timeoutId = setTimeout(() => abortController.abort(), timeoutMs)

  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: trimmedQuery,
        max_results: maxResults,
        search_depth: 'basic',
        include_answer: false,
        include_raw_content: false
      }),
      signal: abortController.signal
    })

    if (!response.ok) {
      if (response.status === 429 || response.status === 402) {
        throw asCodedError(
          `Tavily quota/rate limit reached (status ${response.status})`,
          TAVILY_QUOTA_EXCEEDED_CODE
        )
      }
      throw new Error(`Tavily request failed with status ${response.status}`)
    }

    const payload = (await response.json()) as TavilyResponse
    const normalized: WebSearchResult[] = []

    for (const item of payload.results || []) {
      const title = (item.title || '').trim()
      const snippet = (item.content || '').trim()
      const safeUrl = item.url ? sanitizeHttpUrl(item.url) : null
      if (!title || !snippet || !safeUrl) continue

      normalized.push({
        title,
        url: safeUrl,
        snippet: normalizeSnippet(snippet),
        publishedDate: item.published_date?.trim() || undefined
      })
    }

    return normalized.toSorted((a, b) => {
      const aTs = getPublishedTimestamp(a.publishedDate)
      const bTs = getPublishedTimestamp(b.publishedDate)
      return bTs - aTs
    })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Tavily request timed out', { cause: error })
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}
