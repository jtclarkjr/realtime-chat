'use client'

import { useCallback, useEffect, useRef } from 'react'

type UseComposerTextareaParams = {
  value: string
  onValueChange: (value: string) => void
  inputRef?: React.RefObject<HTMLTextAreaElement | null>
}

export function useComposerTextarea({
  value,
  onValueChange,
  inputRef
}: UseComposerTextareaParams) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const autoResize = useCallback(() => {
    const textarea = textareaRef.current
    if (!textarea) return

    const maxHeight = parseFloat(getComputedStyle(textarea).maxHeight) || 160
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, maxHeight) + 'px'
  }, [])

  const setTextareaRef = useCallback(
    (node: HTMLTextAreaElement | null) => {
      textareaRef.current = node
      if (inputRef) {
        inputRef.current = node
      }
    },
    [inputRef]
  )

  const handleTextChange = useCallback(
    (nextValue: string) => {
      onValueChange(nextValue)
      autoResize()
    },
    [autoResize, onValueChange]
  )

  const handleEnterSubmit = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key !== 'Enter' || event.shiftKey) return

      event.preventDefault()
      if (!value.trim()) return

      event.currentTarget.form?.requestSubmit()
    },
    [value]
  )

  useEffect(() => {
    autoResize()
  }, [autoResize, value])

  return {
    setTextareaRef,
    handleTextChange,
    handleEnterSubmit
  }
}
