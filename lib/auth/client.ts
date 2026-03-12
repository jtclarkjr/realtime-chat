'use client'

import { createAuthClient } from '@/lib/supabase/client'

export async function signInWithDiscord() {
  const supabase = createAuthClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'discord',
    options: {
      redirectTo:
        process.env.NEXT_PUBLIC_AUTH_CALLBACK_URL ||
        `${window.location.origin}/auth/callback`
    }
  })
  return { data, error }
}

export async function signInWithGitHub() {
  const supabase = createAuthClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo:
        process.env.NEXT_PUBLIC_AUTH_CALLBACK_URL ||
        `${window.location.origin}/auth/callback`
    }
  })
  return { data, error }
}

export async function signInWithApple() {
  const supabase = createAuthClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo:
        process.env.NEXT_PUBLIC_AUTH_CALLBACK_URL ||
        `${window.location.origin}/auth/callback`
    }
  })
  return { data, error }
}

export async function signInWithGoogle() {
  const supabase = createAuthClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo:
        process.env.NEXT_PUBLIC_AUTH_CALLBACK_URL ||
        `${window.location.origin}/auth/callback`
    }
  })
  return { data, error }
}

export async function signInAnonymously() {
  const supabase = createAuthClient()
  const { data, error } = await supabase.auth.signInAnonymously()
  return { data, error }
}

export async function getCurrentUser() {
  const supabase = createAuthClient()
  const {
    data: { user },
    error
  } = await supabase.auth.getUser()
  return { user, error }
}

const isAuthKey = (key: string) =>
  /^sb-.*auth-token/i.test(key) ||
  /^sb-.*code-verifier/i.test(key) ||
  /^supabase-auth/i.test(key)

export function signOutViaLogoutRoute() {
  if (typeof window === 'undefined') return

  for (let i = window.localStorage.length - 1; i >= 0; i--) {
    const key = window.localStorage.key(i)
    if (key && isAuthKey(key)) {
      window.localStorage.removeItem(key)
    }
  }

  for (let i = window.sessionStorage.length - 1; i >= 0; i--) {
    const key = window.sessionStorage.key(i)
    if (key && isAuthKey(key)) {
      window.sessionStorage.removeItem(key)
    }
  }

  window.location.assign('/auth/logout')
}

// Email/password auth moved to server actions
// See lib/actions/auth-actions.ts for signInWithEmailAction and signUpWithEmailAction
