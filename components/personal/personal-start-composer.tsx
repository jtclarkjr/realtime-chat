'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuthenticatedUser } from '@/hooks/use-authenticated-user'
import { useStartPersonalChat } from '@/lib/query/mutations'
import { processAiFiles } from '@/lib/api/client'
import { getRoomHref } from '@/lib/utils/chat-routes'
import {
  ChatComposer,
  ChatComposerModelSelector
} from '@/components/ui/chat-composer'
import {
  MAX_ATTACHMENT_FILE_BYTES,
  MAX_PERSONAL_ATTACHMENTS,
  PERSONAL_ATTACHMENT_ACCEPT
} from '@/lib/constants/attachments'
import {
  PERSONAL_AI_MODEL_AUTO,
  toManualAIModel
} from '@/lib/constants/ai-models'
import type { PersonalAIModelValue } from '@/lib/types/ai-models'
import { useUIStore } from '@/lib/stores/ui-store'

type AttachmentSelection = {
  id: string
  file: File
}

export function PersonalStartComposer() {
  const router = useRouter()
  const user = useAuthenticatedUser()
  const startPersonalChatMutation = useStartPersonalChat()
  const setPendingPersonalAI = useUIStore((state) => state.setPendingPersonalAI)
  const [content, setContent] = useState('')
  const [selectedModel, setSelectedModel] = useState<PersonalAIModelValue>(
    PERSONAL_AI_MODEL_AUTO
  )
  const [attachmentFiles, setAttachmentFiles] = useState<AttachmentSelection[]>(
    []
  )

  const firstName = useMemo(
    () => user.username.split(/[.\s@_-]/).filter(Boolean)[0] || 'there',
    [user.username]
  )
  const attachmentChips = useMemo(
    () =>
      attachmentFiles.map((entry) => ({
        id: entry.id,
        name: entry.file.name
      })),
    [attachmentFiles]
  )

  const handleSelectAttachmentFiles = (files: FileList | null) => {
    if (!files) {
      return
    }

    setAttachmentFiles((current) => {
      const next = [...current]
      for (const file of Array.from(files)) {
        if (file.size > MAX_ATTACHMENT_FILE_BYTES) {
          toast.error(`${file.name} exceeds the 20 MB per-file limit`)
          continue
        }

        if (next.length >= MAX_PERSONAL_ATTACHMENTS) {
          toast.error(`You can attach up to ${MAX_PERSONAL_ATTACHMENTS} files`)
          break
        }

        const duplicate = next.some(
          (entry) =>
            entry.file.name === file.name &&
            entry.file.size === file.size &&
            entry.file.lastModified === file.lastModified
        )
        if (duplicate) {
          continue
        }

        next.push({
          id: crypto.randomUUID(),
          file
        })
      }

      return next
    })
  }

  const handleRemoveAttachmentFile = (fileId: string) => {
    setAttachmentFiles((current) =>
      current.filter((attachment) => attachment.id !== fileId)
    )
  }

  const processAttachmentsForChat = async (
    chatId: string,
    files: AttachmentSelection[]
  ): Promise<string | undefined> => {
    if (files.length === 0) {
      return undefined
    }

    const formData = new FormData()
    formData.append('channelId', chatId)
    files.forEach((entry) => {
      formData.append('files', entry.file, entry.file.name)
    })

    const result = await processAiFiles(formData)
    if (result.rejectedFiles.length > 0) {
      toast.error(
        `${result.rejectedFiles.length} file(s) were rejected by the server`
      )
    }

    return result.fileContextId
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmedContent = content.trim()
    if (!trimmedContent) {
      return
    }

    try {
      const selectedAttachments = [...attachmentFiles]
      const hasAttachments = selectedAttachments.length > 0
      const response = await startPersonalChatMutation.mutateAsync({
        userId: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
        content: trimmedContent,
        aiModel: toManualAIModel(selectedModel),
        deferAiResponse: hasAttachments
      })

      if (!response.success || !response.chat || !response.message) {
        throw new Error(response.error || 'Failed to start personal chat')
      }

      setContent('')
      if (!hasAttachments) {
        router.push(getRoomHref(response.chat))
        return
      }

      setAttachmentFiles([])
      setPendingPersonalAI(response.chat.id, {
        content: trimmedContent,
        triggerMessageId: response.message.id,
        requiresFileContext: true
      })
      router.push(getRoomHref(response.chat))

      void (async () => {
        try {
          const fileContextId = await processAttachmentsForChat(
            response.chat!.id,
            selectedAttachments
          )
          setPendingPersonalAI(response.chat!.id, {
            content: trimmedContent,
            triggerMessageId: response.message!.id,
            fileContextId,
            requiresFileContext: false
          })
        } catch (error) {
          console.error('Failed to process personal chat attachments:', error)
          toast.error(
            'File processing failed. Continuing without file context.'
          )
          setPendingPersonalAI(response.chat!.id, {
            content: trimmedContent,
            triggerMessageId: response.message!.id,
            requiresFileContext: false
          })
        }
      })()
    } catch (submitError) {
      toast.error(
        submitError instanceof Error
          ? submitError.message
          : 'Failed to start personal chat'
      )
    }
  }

  return (
    <div className="h-full overflow-hidden px-4">
      <div className="mx-auto flex h-full max-w-4xl items-center justify-center">
        <div className="w-full max-w-3xl space-y-6">
          <h1 className="text-center text-4xl font-semibold tracking-tight">
            Hey, {firstName}. Ready to dive in?
          </h1>

          <ChatComposer
            value={content}
            placeholder="Ask anything"
            disabled={startPersonalChatMutation.isPending}
            sendDisabled={
              startPersonalChatMutation.isPending || !content.trim()
            }
            isConnected
            showStopButton={false}
            attachment={{
              enabled: true,
              disabled: startPersonalChatMutation.isPending,
              accept: PERSONAL_ATTACHMENT_ACCEPT,
              maxFiles: MAX_PERSONAL_ATTACHMENTS,
              files: attachmentChips
            }}
            onValueChange={setContent}
            onSubmit={handleSubmit}
            onStopAIResponse={() => {}}
            onSelectAttachmentFiles={handleSelectAttachmentFiles}
            onRemoveAttachmentFile={handleRemoveAttachmentFile}
          >
            <ChatComposerModelSelector
              selectedModel={selectedModel}
              disabled={startPersonalChatMutation.isPending}
              onModelChange={(value) => setSelectedModel(value)}
            />
          </ChatComposer>
        </div>
      </div>
    </div>
  )
}
