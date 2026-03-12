'use client'

import { useState, useEffect } from 'react'
import { track } from '@vercel/analytics/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  signInWithGoogle
} from '@/lib/auth/client'
import {
  signInWithEmailAction,
  signUpWithEmailAction
} from '@/lib/actions/auth-actions'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { useRouter } from 'next/navigation'

const isEmailAuthEnabled = process.env.NEXT_PUBLIC_ENABLE_EMAIL_AUTH
const isDiscordAuthEnabled = process.env.NEXT_PUBLIC_ENABLE_DISCORD_AUTH
const isGitHubAuthEnabled = process.env.NEXT_PUBLIC_ENABLE_GITHUB_AUTH
const isGoogleAuthEnabled = process.env.NEXT_PUBLIC_ENABLE_GOOGLE_AUTH
const isAppleAuthEnabled = process.env.NEXT_PUBLIC_ENABLE_APPLE_AUTH
const hasOAuthProvidersEnabled =
  isDiscordAuthEnabled ||
  isGitHubAuthEnabled ||
  isGoogleAuthEnabled ||
  isAppleAuthEnabled

interface LoginDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoginDialog({ open, onOpenChange }: LoginDialogProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const resetForm = () => {
    setEmail('')
    setPassword('')
    setError(null)
    setIsSignUp(false)
    setLoading(null)
  }

  const handleDialogOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm()
    }
    onOpenChange(nextOpen)
  }

  // Handle clearing loading state when returning to the page
  useEffect(() => {
    const handleWindowFocus = () => {
      if (!document.hidden) {
        setLoading(null)
      }
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setLoading(null)
      }
    }

    window.addEventListener('focus', handleWindowFocus)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('focus', handleWindowFocus)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const handleOAuthSignIn = async (
    provider: 'discord' | 'github' | 'apple' | 'google',
    signIn: () => Promise<{ error: Error | null }>
  ) => {
    track('event_login_attempt', { provider, source: 'dialog' })
    try {
      setLoading(provider)

      const timeoutId = setTimeout(() => {
        setLoading(null)
      }, 1500)

      const { error: signInError } = await signIn()

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
          setError(result.message)
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

      resetForm()
      onOpenChange(false)
      router.push('/')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setLoading(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign in to continue</DialogTitle>
          <DialogDescription>
            Sign in with your account to send messages, create rooms, and use AI
            features.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
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
                  <p className="text-sm text-red-500 dark:text-red-400">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={!!loading}
                  variant="default"
                  size="xl"
                  className="w-full"
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
                    <span className="bg-background px-2 text-gray-500 dark:text-gray-400">
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
              className="w-full"
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
              className="w-full"
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
              className="w-full"
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
              className="w-full"
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
        </div>
      </DialogContent>
    </Dialog>
  )
}
