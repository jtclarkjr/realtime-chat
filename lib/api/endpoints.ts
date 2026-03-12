// Main use case is to have option to host API as a external outside of application layer

export type ApiEndpointKey =
  | 'rooms.list'
  | 'rooms.create'
  | 'rooms.delete'
  | 'rooms.byId'
  | 'rooms.rejoin'
  | 'rooms.generate'
  | 'groups.list'
  | 'groups.create'
  | 'groups.byId'
  | 'groups.users'
  | 'groups.members'
  | 'groups.channels'
  | 'groups.join'
  | 'personal.list'
  | 'personal.start'
  | 'personal.byId'
  | 'messages.send'
  | 'messages.unsend'
  | 'messages.markReceived'
  | 'ai.usage'
  | 'ai.personalization'
  | 'ai.files.process'
  | 'ai.stream'

const endpointFlagEnvNames: Record<ApiEndpointKey, string> = {
  'rooms.list': 'NEXT_PUBLIC_USE_EXTERNAL_API_ROOMS_LIST',
  'rooms.create': 'NEXT_PUBLIC_USE_EXTERNAL_API_ROOMS_CREATE',
  'rooms.delete': 'NEXT_PUBLIC_USE_EXTERNAL_API_ROOMS_DELETE',
  'rooms.byId': 'NEXT_PUBLIC_USE_EXTERNAL_API_ROOMS_BY_ID',
  'rooms.rejoin': 'NEXT_PUBLIC_USE_EXTERNAL_API_ROOMS_REJOIN',
  'rooms.generate': 'NEXT_PUBLIC_USE_EXTERNAL_API_ROOMS_GENERATE',
  'groups.list': 'NEXT_PUBLIC_USE_EXTERNAL_API_GROUPS_LIST',
  'groups.create': 'NEXT_PUBLIC_USE_EXTERNAL_API_GROUPS_CREATE',
  'groups.byId': 'NEXT_PUBLIC_USE_EXTERNAL_API_GROUPS_BY_ID',
  'groups.users': 'NEXT_PUBLIC_USE_EXTERNAL_API_GROUPS_USERS',
  'groups.members': 'NEXT_PUBLIC_USE_EXTERNAL_API_GROUPS_MEMBERS',
  'groups.channels': 'NEXT_PUBLIC_USE_EXTERNAL_API_GROUPS_CHANNELS',
  'groups.join': 'NEXT_PUBLIC_USE_EXTERNAL_API_GROUPS_JOIN',
  'personal.list': 'NEXT_PUBLIC_USE_EXTERNAL_API_PERSONAL_LIST',
  'personal.start': 'NEXT_PUBLIC_USE_EXTERNAL_API_PERSONAL_START',
  'personal.byId': 'NEXT_PUBLIC_USE_EXTERNAL_API_PERSONAL_BY_ID',
  'messages.send': 'NEXT_PUBLIC_USE_EXTERNAL_API_MESSAGES_SEND',
  'messages.unsend': 'NEXT_PUBLIC_USE_EXTERNAL_API_MESSAGES_UNSEND',
  'messages.markReceived':
    'NEXT_PUBLIC_USE_EXTERNAL_API_MESSAGES_MARK_RECEIVED',
  'ai.usage': 'NEXT_PUBLIC_USE_EXTERNAL_API_AI_USAGE',
  'ai.personalization': 'NEXT_PUBLIC_USE_EXTERNAL_API_AI_PERSONALIZATION',
  'ai.files.process': 'NEXT_PUBLIC_USE_EXTERNAL_API_AI_FILES_PROCESS',
  'ai.stream': 'NEXT_PUBLIC_USE_EXTERNAL_API_AI_STREAM'
}

const EXTERNAL_API_BASE_URL_ENV = 'NEXT_PUBLIC_EXTERNAL_API_BASE_URL'
const EXTERNAL_API_URL_ENV = 'NEXT_PUBLIC_EXTERNAL_API_URL'
const GLOBAL_EXTERNAL_API_FLAG_ENV = 'NEXT_PUBLIC_USE_EXTERNAL_API'

const truthyValues = new Set(['1', 'true', 'yes', 'on'])

const isEnabled = (value: string | undefined): boolean => {
  return Boolean(value && truthyValues.has(value.toLowerCase()))
}

const publicEnv = {
  NEXT_PUBLIC_USE_EXTERNAL_API: process.env.NEXT_PUBLIC_USE_EXTERNAL_API,
  NEXT_PUBLIC_EXTERNAL_API_BASE_URL:
    process.env.NEXT_PUBLIC_EXTERNAL_API_BASE_URL,
  NEXT_PUBLIC_EXTERNAL_API_URL: process.env.NEXT_PUBLIC_EXTERNAL_API_URL,
  NEXT_PUBLIC_USE_EXTERNAL_API_ROOMS_LIST:
    process.env.NEXT_PUBLIC_USE_EXTERNAL_API_ROOMS_LIST,
  NEXT_PUBLIC_USE_EXTERNAL_API_ROOMS_CREATE:
    process.env.NEXT_PUBLIC_USE_EXTERNAL_API_ROOMS_CREATE,
  NEXT_PUBLIC_USE_EXTERNAL_API_ROOMS_DELETE:
    process.env.NEXT_PUBLIC_USE_EXTERNAL_API_ROOMS_DELETE,
  NEXT_PUBLIC_USE_EXTERNAL_API_ROOMS_BY_ID:
    process.env.NEXT_PUBLIC_USE_EXTERNAL_API_ROOMS_BY_ID,
  NEXT_PUBLIC_USE_EXTERNAL_API_ROOMS_REJOIN:
    process.env.NEXT_PUBLIC_USE_EXTERNAL_API_ROOMS_REJOIN,
  NEXT_PUBLIC_USE_EXTERNAL_API_ROOMS_GENERATE:
    process.env.NEXT_PUBLIC_USE_EXTERNAL_API_ROOMS_GENERATE,
  NEXT_PUBLIC_USE_EXTERNAL_API_GROUPS_LIST:
    process.env.NEXT_PUBLIC_USE_EXTERNAL_API_GROUPS_LIST,
  NEXT_PUBLIC_USE_EXTERNAL_API_GROUPS_CREATE:
    process.env.NEXT_PUBLIC_USE_EXTERNAL_API_GROUPS_CREATE,
  NEXT_PUBLIC_USE_EXTERNAL_API_GROUPS_BY_ID:
    process.env.NEXT_PUBLIC_USE_EXTERNAL_API_GROUPS_BY_ID,
  NEXT_PUBLIC_USE_EXTERNAL_API_GROUPS_USERS:
    process.env.NEXT_PUBLIC_USE_EXTERNAL_API_GROUPS_USERS,
  NEXT_PUBLIC_USE_EXTERNAL_API_GROUPS_MEMBERS:
    process.env.NEXT_PUBLIC_USE_EXTERNAL_API_GROUPS_MEMBERS,
  NEXT_PUBLIC_USE_EXTERNAL_API_GROUPS_CHANNELS:
    process.env.NEXT_PUBLIC_USE_EXTERNAL_API_GROUPS_CHANNELS,
  NEXT_PUBLIC_USE_EXTERNAL_API_GROUPS_JOIN:
    process.env.NEXT_PUBLIC_USE_EXTERNAL_API_GROUPS_JOIN,
  NEXT_PUBLIC_USE_EXTERNAL_API_PERSONAL_LIST:
    process.env.NEXT_PUBLIC_USE_EXTERNAL_API_PERSONAL_LIST,
  NEXT_PUBLIC_USE_EXTERNAL_API_PERSONAL_START:
    process.env.NEXT_PUBLIC_USE_EXTERNAL_API_PERSONAL_START,
  NEXT_PUBLIC_USE_EXTERNAL_API_PERSONAL_BY_ID:
    process.env.NEXT_PUBLIC_USE_EXTERNAL_API_PERSONAL_BY_ID,
  NEXT_PUBLIC_USE_EXTERNAL_API_MESSAGES_SEND:
    process.env.NEXT_PUBLIC_USE_EXTERNAL_API_MESSAGES_SEND,
  NEXT_PUBLIC_USE_EXTERNAL_API_MESSAGES_UNSEND:
    process.env.NEXT_PUBLIC_USE_EXTERNAL_API_MESSAGES_UNSEND,
  NEXT_PUBLIC_USE_EXTERNAL_API_MESSAGES_MARK_RECEIVED:
    process.env.NEXT_PUBLIC_USE_EXTERNAL_API_MESSAGES_MARK_RECEIVED,
  NEXT_PUBLIC_USE_EXTERNAL_API_AI_USAGE:
    process.env.NEXT_PUBLIC_USE_EXTERNAL_API_AI_USAGE,
  NEXT_PUBLIC_USE_EXTERNAL_API_AI_PERSONALIZATION:
    process.env.NEXT_PUBLIC_USE_EXTERNAL_API_AI_PERSONALIZATION,
  NEXT_PUBLIC_USE_EXTERNAL_API_AI_FILES_PROCESS:
    process.env.NEXT_PUBLIC_USE_EXTERNAL_API_AI_FILES_PROCESS,
  NEXT_PUBLIC_USE_EXTERNAL_API_AI_STREAM:
    process.env.NEXT_PUBLIC_USE_EXTERNAL_API_AI_STREAM
} as const

const getEnvVar = (name: string): string | undefined => {
  return publicEnv[name as keyof typeof publicEnv]
}

export const shouldUseExternalApi = (endpoint: ApiEndpointKey): boolean => {
  const endpointFlag = getEnvVar(endpointFlagEnvNames[endpoint])
  const globalFlag = getEnvVar(GLOBAL_EXTERNAL_API_FLAG_ENV)

  return endpointFlag !== undefined
    ? isEnabled(endpointFlag)
    : isEnabled(globalFlag)
}

const normalizeBaseUrl = (baseUrl: string): string =>
  baseUrl.replace(/\/+$/, '')

const normalizePath = (path: string): string => {
  if (!path.startsWith('/')) {
    return `/${path}`
  }
  return path
}

const resolveExternalPath = (baseUrl: string, path: string): string => {
  const normalizedPath = normalizePath(path)
  const normalizedBaseUrl = normalizeBaseUrl(baseUrl)

  if (!normalizedPath.startsWith('/api')) {
    return normalizedPath
  }

  const baseIncludesExternalApi = /\/v1\/external\/api$/i.test(
    normalizedBaseUrl
  )
  const baseIncludesExternal = /\/v1\/external$/i.test(normalizedBaseUrl)

  if (baseIncludesExternalApi) {
    return normalizedPath.replace(/^\/api/i, '')
  }

  if (baseIncludesExternal) {
    return normalizedPath
  }

  return `/v1/external${normalizedPath}`
}

const getExternalBaseUrl = (): string | undefined => {
  // Support both names to stay compatible with docs/config from sibling services.
  return getEnvVar(EXTERNAL_API_BASE_URL_ENV) || getEnvVar(EXTERNAL_API_URL_ENV)
}

export const getApiEndpointUrl = (
  endpoint: ApiEndpointKey,
  path: string
): string => {
  if (!shouldUseExternalApi(endpoint)) {
    return path
  }

  const externalBaseUrl = getExternalBaseUrl()
  if (!externalBaseUrl) {
    return path
  }

  return `${normalizeBaseUrl(externalBaseUrl)}${resolveExternalPath(externalBaseUrl, path)}`
}
