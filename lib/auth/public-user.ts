import type { User } from '@supabase/supabase-js'
import type { PublicUser } from '@/lib/types/user'

export function toPublicUser(user: User): PublicUser {
  const isAnonymous = user.is_anonymous === true

  const displayName =
    user.user_metadata?.display_name || user.user_metadata?.full_name
  const trimmedDisplayName =
    typeof displayName === 'string' ? displayName.trim() : ''
  const emailPrefix =
    typeof user.email === 'string' ? user.email.split('@')[0] : ''

  const username = isAnonymous
    ? `Guest-${user.id.slice(0, 8)}`
    : trimmedDisplayName || emailPrefix || `User-${user.id.slice(0, 8)}`

  return {
    id: user.id,
    username,
    displayName: trimmedDisplayName || username,
    email: user.email || undefined,
    avatarUrl: user.user_metadata?.avatar_url,
    isAnonymous
  }
}
