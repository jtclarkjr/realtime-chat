'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/ui/user-avatar'
import { UsageBar } from '@/components/settings/usage-bar'
import { PersonalizationPanel } from '@/components/settings/personalization-panel'
import { useAuthenticatedUser } from '@/hooks/use-authenticated-user'
import { useAIUsage } from '@/lib/query/queries'
import type { SettingsTab } from '@/lib/types/settings'
import { cn } from '@/lib/utils'

export default function SettingsPage() {
  const router = useRouter()
  const user = useAuthenticatedUser()
  const [activeTab, setActiveTab] = useState<SettingsTab>('general')
  const {
    data: usage,
    isLoading,
    isError,
    refetch,
    isFetching
  } = useAIUsage({ enabled: !user.isAnonymous })

  let aiUsageContent: ReactNode = null
  if (user.isAnonymous) {
    aiUsageContent = (
      <p className="text-sm text-muted-foreground">
        Sign in with a full account to use AI assistant features.
      </p>
    )
  } else if (isLoading) {
    aiUsageContent = (
      <p className="text-sm text-muted-foreground">Loading usage...</p>
    )
  } else if (isError || !usage) {
    aiUsageContent = (
      <p className="text-sm text-destructive">
        Could not load usage right now.
      </p>
    )
  } else {
    aiUsageContent = (
      <div className="space-y-5">
        {usage.locked && (
          <p className="text-sm text-amber-600 dark:text-amber-400">
            AI assistant is temporarily locked until your limit resets.
          </p>
        )}
        <UsageBar
          label="5-hour limit"
          percent={usage.daily.percent}
          resetAt={usage.daily.resetAt}
          usedLabel={`${usage.daily.percent}% used`}
        />
        <UsageBar
          label="Monthly limit"
          percent={usage.monthly.percent}
          resetAt={usage.monthly.resetAt}
          usedLabel={`${usage.monthly.percent}% used`}
        />
        <p className="text-xs text-muted-foreground">
          Last updated {new Date(usage.updatedAt).toLocaleString()}
        </p>
      </div>
    )
  }

  useEffect(() => {
    if (user.isAnonymous) {
      router.replace('/')
    }
  }, [router, user.isAnonymous])

  if (user.isAnonymous) {
    return null
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage your account preferences and AI assistant limits.
          </p>
        </header>

        <div className="inline-flex rounded-lg bg-muted p-1">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={cn(
              'cursor-pointer rounded-md px-3 py-1.5 text-sm transition-colors',
              activeTab === 'general'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            General
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ai-usage')}
            className={cn(
              'cursor-pointer rounded-md px-3 py-1.5 text-sm transition-colors',
              activeTab === 'ai-usage'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            AI Usage
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('personalization')}
            className={cn(
              'cursor-pointer rounded-md px-3 py-1.5 text-sm transition-colors',
              activeTab === 'personalization'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Personalization
          </button>
        </div>

        {activeTab === 'general' && (
          <section className="space-y-4 rounded-xl border border-border bg-card p-5">
            <h2 className="text-sm font-semibold">Profile</h2>
            <div className="flex items-start gap-4">
              <UserAvatar
                src={user.avatarUrl}
                alt={user.displayName || user.username}
                size="xl"
                className="shrink-0"
              />
              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Display name</p>
                  <p className="truncate text-sm font-medium">
                    {user.displayName || user.username}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Chat name</p>
                  <p className="truncate text-sm font-medium">
                    {user.username}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="break-all text-sm font-medium">
                    {user.email || 'No email available'}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'ai-usage' && (
          <section className="space-y-5 rounded-xl border border-border bg-card p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold">
                  AI assistant usage limits
                </h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => void refetch()}
                disabled={isFetching}
              >
                <RefreshCcw
                  className={cn('h-4 w-4', isFetching && 'animate-spin')}
                />
                <span className="sr-only">Refresh usage</span>
              </Button>
            </div>

            {aiUsageContent}
          </section>
        )}

        {activeTab === 'personalization' && <PersonalizationPanel />}
      </div>
    </div>
  )
}
