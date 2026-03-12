'use client'

import { useState, useEffect } from 'react'
import { track } from '@vercel/analytics/react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import {
  DiscordIcon,
  GitHubIcon,
  AppleIcon,
  GoogleIcon
} from '@/components/ui/icons'
import {
  signInWithDiscord,
  signInWithGitHub,
  signInWithApple,
  signInWithGoogle,
  signInAnonymously,
  getCurrentUser
} from '@/lib/auth/client'
import {
  signInWithEmailAction,
  signUpWithEmailAction
} from '@/lib/actions/auth-actions'
import { Input } from '@/components/ui/input'
import { useRouter, useSearchParams } from 'next/navigation'

const isEmailAuthEnabled = process.env.NEXT_PUBLIC_ENABLE_EMAIL_AUTH === 'true'
const isGuestUsersEnabled =
  process.env.NEXT_PUBLIC_ENABLE_GUEST_USERS !== 'false'
const isDiscordAuthEnabled = process.env.NEXT_PUBLIC_ENABLE_DISCORD_AUTH
const isGitHubAuthEnabled = process.env.NEXT_PUBLIC_ENABLE_GITHUB_AUTH
const isGoogleAuthEnabled = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH
const isAppleAuthEnabled = process.env.NEXT_PUBLIC_ENABLE_APPLE_AUTH
const hasOAuthProvidersEnabled =
  isDiscordAuthEnabled ||
  isGitHubAuthEnabled ||
  isGoogleAuthEnabled ||
  isAppleAuthEnabled
const hasNonGuestSignInMethods = isEmailAuthEnabled || hasOAuthProvidersEnabled

export function LoginClient() {
  const [loading, setLoading] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Check if user is already signed in as anonymous on mount
  useEffect(() => {
    const checkAnonymousStatus = async () => {
      const { user } = await getCurrentUser()
      if (user?.is_anonymous) {
        setIsAnonymous(true)
      }
    }
    checkAnonymousStatus()
  }, [])

  // Handle clearing loading state when returning to the page
  useEffect(() => {
    const handleWindowFocus = () => {
      if (!document.hidden) {
        setLoading(null)
      }
    }

    // Clear loading state on mount in case page loads while visible
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setLoading(null)
      }
    }

    // Clear loading when returning from external sites (GitHub/Discord login)
    window.addEventListener('focus', handleWindowFocus)
    // Clear loading when tab becomes visible again
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleWindowFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  useEffect(() => {
    // Only activate cancellation detection for Apple login
    if (loading !== 'apple') return

    let intervalId: NodeJS.Timeout

    // Wait 2s for Apple popup to show, then start cancellation detection
    const timeoutId = setTimeout(() => {
      intervalId = setInterval(() => {
        if (document.visibilityState === 'visible' && !document.hidden) {
          setLoading(null)
        }
      }, 500)
    }, 2000)

    return () => {
      clearTimeout(timeoutId)
      if (intervalId) clearInterval(intervalId)
    }
  }, [loading])

  const handleOAuthSignIn = async (
    provider: 'discord' | 'github' | 'apple' | 'google',
    signIn: () => Promise<{ error: Error | null }>
  ) => {
    track('event_login_attempt', { provider })
    try {
      setLoading(provider)

      // Set a timeout to reset loading state in case of redirect
      const timeoutId = setTimeout(() => {
        setLoading(null)
      }, 1500)

      const { error: signInError } = await signIn()

      // Clear timeout if we get here (error case)
      clearTimeout(timeoutId)

      if (signInError) {
        console.error(`Error signing in with ${provider}:`, signInError)
        setLoading(null)
      }
    } catch (err) {
      console.error(`Error signing in with ${provider}:`, err)
      setLoading(null)
    }
  }

  const handleDiscordSignIn = () =>
    handleOAuthSignIn('discord', signInWithDiscord)
  const handleGitHubSignIn = () => handleOAuthSignIn('github', signInWithGitHub)
  const handleAppleSignIn = () => handleOAuthSignIn('apple', signInWithApple)
  const handleGoogleSignIn = () => handleOAuthSignIn('google', signInWithGoogle)

  const handleGuestSignIn = async () => {
    track('event_login_attempt', { provider: 'anonymous' })
    try {
      setLoading('guest')

      // Check if user is already signed in
      const { user } = await getCurrentUser()
      if (user) {
        if (user.is_anonymous) {
          track('event_login_success', {
            provider: 'anonymous',
            source: 'existing_session'
          })
        }
        // User is already signed in (anonymous or full account), just redirect
        router.push('/')
        router.refresh()
        return
      }

      // No existing session, create new anonymous user
      const { error: anonError } = await signInAnonymously()
      if (anonError) {
        console.error('Error signing in anonymously:', anonError)
        setError('Failed to sign in as guest. Please try again.')
        setLoading(null)
      } else {
        track('event_login_success', {
          provider: 'anonymous',
          source: 'new_session'
        })
        router.push('/')
        router.refresh()
      }
    } catch (err) {
      console.error('Error signing in anonymously:', err)
      setError('Failed to sign in as guest. Please try again.')
      setLoading(null)
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading('email')

    try {
      if (isSignUp) {
        const result = await signUpWithEmailAction(email, password)
        if ('error' in result) {
          setError(result.error)
          setLoading(null)
          return
        }
        if ('message' in result) {
          setError(result.message) // Display confirmation message
          setLoading(null)
          return
        }
      } else {
        const result = await signInWithEmailAction(email, password)
        if ('error' in result) {
          setError(result.error)
          setLoading(null)
          return
        }
      }

      // Successful sign in - redirect
      router.push('/')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(null)
    }
  }

  return (
    <div className="space-y-4">
      {isAnonymous && searchParams.get('guest') === '1' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="space-y-3">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              You&apos;re currently browsing as a guest. You can continue as a
              guest or sign in with a full account for the complete experience.
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => router.push('/')}
                variant="outline"
                size="sm"
                className="flex-1"
              >
                Continue as Guest
              </Button>
            </div>
          </div>
        </div>
      )}

      {isAnonymous &&
        searchParams.get('guest') === '1' &&
        hasNonGuestSignInMethods && (
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-gray-950 px-2 text-gray-500 dark:text-gray-400">
                Or sign in with
              </span>
            </div>
          </div>
        )}

      {isEmailAuthEnabled && (
        <>
          <form onSubmit={handleEmailAuth} className="space-y-3">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={!!loading}
                className="w-full"
              />
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={!!loading}
                className="w-full"
                minLength={6}
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
            )}

            <Button
              type="submit"
              disabled={!!loading}
              variant="default"
              size="xl"
            >
              {loading === 'email' ? (
                <span className="flex items-center gap-2">
                  <Spinner />
                  {isSignUp ? 'Signing up...' : 'Signing in...'}
                </span>
              ) : (
                <span>{isSignUp ? 'Sign up' : 'Sign in'} with Email</span>
              )}
            </Button>

            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError(null)
              }}
              disabled={!!loading}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors w-full text-center"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "Don't have an account? Sign up"}
            </button>
          </form>

          {hasOAuthProvidersEnabled && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-950 px-2 text-gray-500 dark:text-gray-400">
                  Or continue with
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {isDiscordAuthEnabled && (
        <Button
          onClick={handleDiscordSignIn}
          disabled={!!loading}
          variant="discord"
          size="xl"
        >
          {loading === 'discord' ? (
            <span className="flex items-center gap-2">
              <Spinner variant="white" />
              Signing in...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <DiscordIcon />
              Continue with Discord
            </span>
          )}
        </Button>
      )}

      {isGitHubAuthEnabled && (
        <Button
          onClick={handleGitHubSignIn}
          disabled={!!loading}
          variant="github"
          size="xl"
        >
          {loading === 'github' ? (
            <span className="flex items-center gap-2">
              <Spinner />
              Signing in...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <GitHubIcon />
              Continue with GitHub
            </span>
          )}
        </Button>
      )}

      {isGoogleAuthEnabled && (
        <Button
          onClick={handleGoogleSignIn}
          disabled={!!loading}
          variant="google"
          size="xl"
        >
          {loading === 'google' ? (
            <span className="flex items-center gap-2">
              <Spinner />
              Signing in...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <GoogleIcon />
              Continue with Google
            </span>
          )}
        </Button>
      )}

      {isAppleAuthEnabled && (
        <Button
          onClick={handleAppleSignIn}
          disabled={!!loading}
          variant="apple"
          size="xl"
        >
          {loading === 'apple' ? (
            <span className="flex items-center gap-2">
              <Spinner variant="white" />
              Signing in...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <AppleIcon />
              Continue with Apple
            </span>
          )}
        </Button>
      )}

      {!isAnonymous && isGuestUsersEnabled && (
        <>
          {hasNonGuestSignInMethods && (
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white dark:bg-gray-950 px-2 text-gray-500 dark:text-gray-400">
                  Or
                </span>
              </div>
            </div>
          )}

          <Button
            onClick={handleGuestSignIn}
            disabled={!!loading}
            variant="outline"
            size="xl"
          >
            {loading === 'guest' ? (
              <span className="flex items-center gap-2">
                <Spinner />
                Signing in...
              </span>
            ) : (
              <span>Continue as Guest</span>
            )}
          </Button>
        </>
      )}
    </div>
  )
}
