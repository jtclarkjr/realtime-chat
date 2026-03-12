'use client'

import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  BASE_STYLE_OPTIONS,
  MAX_PERSONALIZATION_TEXT_LENGTH,
  RESPONSE_DETAIL_OPTIONS
} from '@/lib/constants/personalization'
import { useUpdateAIPersonalization } from '@/lib/query/mutations'
import { useAIPersonalization } from '@/lib/query/queries'
import {
  DEFAULT_AI_PERSONALIZATION_SETTINGS,
  type AIPersonalizationSettings,
  type TraitLevel
} from '@/lib/types/settings'
import {
  isPersonalizationDirty,
  normalizePersonalizationResponse,
  normalizePersonalizationSettings,
  toUpdatePersonalizationPayload
} from '@/lib/utils/personalization'
import {
  PersonalizationSelectField,
  PersonalizationTextareaField,
  PersonalizationTraitRows
} from '@/components/settings/personalization'

type UpdateDraftFn = (
  current: AIPersonalizationSettings
) => AIPersonalizationSettings

function PersonalizationLoadingState() {
  return (
    <section className="space-y-3 rounded-xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold">Personalization</h2>
      <p className="text-sm text-muted-foreground">
        Loading personalization...
      </p>
    </section>
  )
}

export function PersonalizationPanel() {
  const { data, isLoading, isError, refetch, isFetching } =
    useAIPersonalization()
  const updateMutation = useUpdateAIPersonalization()
  const [draftOverride, setDraftOverride] =
    useState<AIPersonalizationSettings | null>(null)

  const serverSettings = useMemo(
    () =>
      normalizePersonalizationSettings(
        data?.personalization,
        data?.updatedAt ?? data?.personalization?.updatedAt
      ),
    [data]
  )

  const draft = draftOverride ?? serverSettings
  const customTrimmedLength = draft.customInstructions.trim().length
  const aboutTrimmedLength = draft.aboutYou.trim().length
  const hasValidationError =
    customTrimmedLength > MAX_PERSONALIZATION_TEXT_LENGTH ||
    aboutTrimmedLength > MAX_PERSONALIZATION_TEXT_LENGTH
  const isDirty = isPersonalizationDirty(draft, serverSettings)
  const isPending = updateMutation.isPending

  const updateDraft = (updater: UpdateDraftFn) => {
    setDraftOverride((current) => updater(current ?? serverSettings))
  }

  const setTraitLevel = (
    trait: keyof AIPersonalizationSettings['characteristics'],
    level: string
  ) => {
    updateDraft((current) => ({
      ...current,
      characteristics: {
        ...current.characteristics,
        [trait]: level as TraitLevel
      }
    }))
  }

  const syncDraftWithServerResponse = (
    response: ReturnType<typeof normalizePersonalizationResponse>
  ) => {
    setDraftOverride(response)
  }

  const handleSave = async () => {
    if (!isDirty || hasValidationError || isPending) {
      return
    }

    try {
      const response = await updateMutation.mutateAsync(
        toUpdatePersonalizationPayload(draft)
      )
      syncDraftWithServerResponse(normalizePersonalizationResponse(response))
      toast.success('Personalization saved')
    } catch {
      toast.error('Failed to save personalization')
    }
  }

  const handleReset = async () => {
    if (isPending) {
      return
    }

    const previousDraft = draftOverride
    const defaults = { ...DEFAULT_AI_PERSONALIZATION_SETTINGS }
    setDraftOverride(defaults)

    try {
      const response = await updateMutation.mutateAsync(
        toUpdatePersonalizationPayload(defaults)
      )
      syncDraftWithServerResponse(normalizePersonalizationResponse(response))
      toast.success('Personalization reset to defaults')
    } catch {
      setDraftOverride(previousDraft)
      toast.error('Failed to reset personalization')
    }
  }

  if (isLoading && !data) {
    return <PersonalizationLoadingState />
  }

  if (isError && !data) {
    return (
      <section className="space-y-4 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Personalization</h2>
        <p className="text-sm text-destructive">
          Could not load personalization settings.
        </p>
        <Button
          type="button"
          variant="outline"
          className="cursor-pointer"
          onClick={() => void refetch()}
          disabled={isFetching}
        >
          Retry
        </Button>
      </section>
    )
  }

  return (
    <section className="space-y-6 rounded-xl border border-border bg-card p-5">
      <div>
        <h2 className="text-sm font-semibold">Personalization</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Tune how AI responds to you. These preferences apply to all AI
          responses.
        </p>
      </div>

      <PersonalizationSelectField
        label="Base style and tone"
        description="Set the overall style and tone for AI responses."
        options={BASE_STYLE_OPTIONS}
        value={draft.baseStyleTone}
        onSelect={(value) =>
          updateDraft((current) => ({
            ...current,
            baseStyleTone: value as AIPersonalizationSettings['baseStyleTone']
          }))
        }
        searchPlaceholder="Search base styles..."
      />

      <PersonalizationSelectField
        label="Response detail"
        description="Choose how brief or in-depth responses should be."
        options={RESPONSE_DETAIL_OPTIONS}
        value={draft.responseDetailMode}
        onSelect={(value) =>
          updateDraft((current) => ({
            ...current,
            responseDetailMode:
              value as AIPersonalizationSettings['responseDetailMode']
          }))
        }
        searchPlaceholder="Search response detail modes..."
      />

      <PersonalizationTraitRows
        characteristics={draft.characteristics}
        onSelect={setTraitLevel}
      />

      <PersonalizationTextareaField
        label="Custom instructions"
        value={draft.customInstructions}
        onChange={(value) =>
          updateDraft((current) => ({
            ...current,
            customInstructions: value
          }))
        }
        placeholder="Additional behavior, style, and tone instructions"
        characterCount={customTrimmedLength}
        maxCharacterCount={MAX_PERSONALIZATION_TEXT_LENGTH}
        isInvalid={customTrimmedLength > MAX_PERSONALIZATION_TEXT_LENGTH}
      />

      <PersonalizationTextareaField
        label="About you"
        value={draft.aboutYou}
        onChange={(value) =>
          updateDraft((current) => ({
            ...current,
            aboutYou: value
          }))
        }
        placeholder="Share context about who you are and what you care about"
        characterCount={aboutTrimmedLength}
        maxCharacterCount={MAX_PERSONALIZATION_TEXT_LENGTH}
        isInvalid={aboutTrimmedLength > MAX_PERSONALIZATION_TEXT_LENGTH}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          className="cursor-pointer"
          onClick={() => void handleSave()}
          disabled={!isDirty || hasValidationError || isPending}
        >
          {isPending ? 'Saving...' : 'Save personalization'}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="cursor-pointer"
          onClick={() => void handleReset()}
          disabled={isPending}
        >
          Reset personalization
        </Button>
        {hasValidationError && (
          <p className="text-xs text-destructive">
            Custom instructions and About you must each be 1000 characters or
            fewer.
          </p>
        )}
      </div>
    </section>
  )
}
