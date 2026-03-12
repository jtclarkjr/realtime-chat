'use client'

import { cn } from '@/lib/utils'
import { Bot, Eye, EyeOff } from 'lucide-react'

interface AIBadgeProps {
  isActive: boolean
  onToggle: () => void
  isPrivate: boolean
  onPrivacyToggle: () => void
  className?: string
  isAnonymous?: boolean
  allowPrivateToggle?: boolean
  isLocked?: boolean
  lockReason?: string
}

export const AIBadge = ({
  isActive,
  onToggle,
  isPrivate,
  onPrivacyToggle,
  className,
  isAnonymous = false,
  allowPrivateToggle = true,
  isLocked = false,
  lockReason
}: AIBadgeProps) => {
  const getAriaLabel = () => {
    if (isAnonymous) {
      return 'Sign in to use AI assistant'
    }
    if (isLocked) {
      return lockReason || 'AI assistant usage is locked until reset'
    }
    if (isActive) {
      return 'Disable AI assistant'
    }
    return 'Enable AI assistant'
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {/* AI Toggle Button */}
      <button
        type="button"
        onClick={onToggle}
        disabled={isAnonymous || isLocked}
        className={cn(
          'inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium rounded-full transition-all duration-200 border',
          'hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
          (isAnonymous || isLocked) &&
            'opacity-50 cursor-not-allowed hover:scale-100',
          isActive
            ? 'bg-primary text-primary-foreground border-primary shadow-sm'
            : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
        )}
        aria-label={getAriaLabel()}
        title={
          isAnonymous
            ? 'Sign in to use AI assistant'
            : isLocked
              ? lockReason || 'AI assistant usage is locked until reset'
              : undefined
        }
      >
        <Bot
          className={cn(
            'h-3 w-3 transition-transform duration-200',
            isActive && 'scale-110'
          )}
          aria-hidden="true"
        />
        <span>AI</span>
      </button>

      {/* Privacy Toggle Button - only show when AI is active */}
      {isActive && allowPrivateToggle && (
        <button
          type="button"
          onClick={onPrivacyToggle}
          disabled={isLocked}
          className={cn(
            'inline-flex items-center justify-center w-6 h-6 rounded-full transition-all duration-200 border',
            'hover:scale-105 active:scale-95 focus:outline-none',
            isPrivate
              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 border-orange-200 dark:border-orange-800'
              : 'bg-green-100 dark:bg-green-900/30 text-green-600 border-green-200 dark:border-green-800',
            isLocked && 'opacity-50 cursor-not-allowed hover:scale-100'
          )}
          aria-label={
            isPrivate ? 'Make AI responses public' : 'Make AI responses private'
          }
          title={
            isPrivate
              ? 'Private: Only you see AI responses'
              : 'Public: Everyone sees AI responses'
          }
        >
          {isPrivate ? (
            <EyeOff className="h-3 w-3" aria-hidden="true" />
          ) : (
            <Eye className="h-3 w-3" aria-hidden="true" />
          )}
        </button>
      )}
    </div>
  )
}
