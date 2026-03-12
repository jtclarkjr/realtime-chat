'use client'

import { useRef } from 'react'
import { Plus, SendHorizontal, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useComposerTextarea } from '@/hooks/ui'
import { PERSONAL_AI_MODEL_OPTIONS } from '@/lib/constants/ai-models'
import type { PersonalAIModelValue } from '@/lib/types/ai-models'
import { cn } from '@/lib/utils'

type ChatComposerAttachment = {
  enabled: boolean
  disabled: boolean
  accept: string
  maxFiles: number
  files: Array<{
    id: string
    name: string
  }>
}

export function ChatComposer({
  value,
  placeholder,
  inputRef,
  disabled,
  sendDisabled,
  isConnected,
  showStopButton,
  attachment,
  onValueChange,
  onSubmit,
  onStopAIResponse,
  onSelectAttachmentFiles,
  onRemoveAttachmentFile,
  children,
  className
}: {
  value: string
  placeholder: string
  inputRef?: React.RefObject<HTMLTextAreaElement | null>
  disabled: boolean
  sendDisabled: boolean
  isConnected: boolean
  showStopButton: boolean
  attachment?: ChatComposerAttachment
  onValueChange: (value: string) => void
  onSubmit: (event: React.SyntheticEvent<HTMLFormElement>) => void
  onStopAIResponse: () => void
  onSelectAttachmentFiles?: (files: FileList | null) => void
  onRemoveAttachmentFile?: (fileId: string) => void
  children?: React.ReactNode
  className?: string
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { setTextareaRef, handleTextChange, handleEnterSubmit } =
    useComposerTextarea({
      value,
      onValueChange,
      inputRef
    })

  return (
    <form onSubmit={onSubmit} className={cn('w-full', className)}>
      <div className="rounded-3xl border border-border/70 bg-muted/40 shadow-sm dark:bg-white/5">
        {attachment?.enabled && attachment.files.length > 0 ? (
          <div className="flex flex-wrap gap-2 px-3 pt-3">
            {attachment.files.map((file) => (
              <span
                key={file.id}
                className="inline-flex max-w-[220px] items-center gap-1 rounded-full border border-border/70 bg-background/80 px-2 py-1 text-xs"
              >
                <span className="truncate" title={file.name}>
                  {file.name}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 rounded-full"
                  onClick={() => onRemoveAttachmentFile?.(file.id)}
                  disabled={attachment.disabled}
                  aria-label={`Remove ${file.name}`}
                >
                  <X className="h-3 w-3" />
                </Button>
              </span>
            ))}
          </div>
        ) : null}

        <div className="flex items-end gap-2 px-3 py-2">
          <Textarea
            ref={setTextareaRef}
            value={value}
            onChange={(event) => handleTextChange(event.target.value)}
            placeholder={placeholder}
            rows={1}
            disabled={disabled}
            autoComplete="off"
            autoCapitalize="sentences"
            className="min-h-0 h-10 max-h-40 resize-none border-0 bg-transparent px-1 py-2 text-base leading-6 shadow-none focus-visible:border-transparent focus-visible:ring-0 dark:bg-transparent"
            onKeyDown={handleEnterSubmit}
          />
        </div>

        <div className="px-3 pb-3">
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center">
              {attachment?.enabled ? (
                <>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    multiple
                    accept={attachment.accept}
                    onChange={(event) => {
                      onSelectAttachmentFiles?.(event.target.files)
                      event.currentTarget.value = ''
                    }}
                    disabled={
                      attachment.disabled ||
                      attachment.files.length >= attachment.maxFiles
                    }
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-9 w-9 shrink-0 rounded-full text-muted-foreground"
                    aria-label="Attach files"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={
                      attachment.disabled ||
                      attachment.files.length >= attachment.maxFiles
                    }
                  >
                    <Plus className="h-5 w-5" />
                  </Button>
                </>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              {children}
              {showStopButton ? (
                <Button
                  type="button"
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-full bg-destructive hover:bg-destructive/90"
                  onClick={onStopAIResponse}
                  aria-label="Stop response"
                  title="Stop response"
                >
                  <X className="h-3.5 w-3.5 text-white" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-full"
                  disabled={sendDisabled}
                  aria-label={
                    isConnected ? 'Send message' : 'Queue message (offline)'
                  }
                  title={
                    isConnected
                      ? 'Send message'
                      : "You're offline - message will be queued and sent when connection is restored"
                  }
                >
                  <SendHorizontal className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}

export function ChatComposerModelSelector({
  selectedModel,
  disabled,
  notice,
  noticeTone,
  onModelChange
}: {
  selectedModel: PersonalAIModelValue
  disabled?: boolean
  notice?: string
  noticeTone?: 'warning' | 'destructive'
  onModelChange: (value: PersonalAIModelValue) => void | Promise<void>
}) {
  return (
    <>
      {notice ? (
        <p
          className={cn(
            'text-xs',
            noticeTone === 'destructive'
              ? 'text-destructive'
              : 'text-amber-600 dark:text-amber-400'
          )}
        >
          {notice}
        </p>
      ) : null}
      <Select
        value={selectedModel}
        onValueChange={(value) =>
          void onModelChange(value as PersonalAIModelValue)
        }
        disabled={disabled}
      >
        <SelectTrigger
          size="sm"
          className={cn(
            'h-8 border-0 bg-transparent shadow-none hover:bg-transparent focus:ring-0 dark:bg-transparent dark:hover:bg-transparent',
            disabled && 'opacity-60'
          )}
          aria-label="Select AI model"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PERSONAL_AI_MODEL_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  )
}
