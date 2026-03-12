'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight'
import { marked } from 'marked'
import createDOMPurify from 'dompurify'
import {
  FAVICON_SERVICE_BASE_URL,
  MARKDOWN_LINK_REGEX,
  SANITIZE_ALLOWED_ATTR,
  SANITIZE_ALLOWED_TAGS,
  SOURCES_MAX_COUNT,
  SOURCES_PREFIX_REGEX,
  lowlight
} from '@/lib/constants/chat-markdown'
import type { ExtractedSource, ParsedContent } from '@/lib/types/chat-markdown'
import { insertBreakOpportunities } from '@/lib/utils/text'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip'

interface MarkdownMessageContentProps {
  content: string
}

const sanitizeLinkHref = (rawHref: string): string | null => {
  const href = rawHref.trim()
  if (!href) return null

  try {
    const parsed = new URL(href)
    if (
      parsed.protocol !== 'http:' &&
      parsed.protocol !== 'https:' &&
      parsed.protocol !== 'mailto:'
    ) {
      return null
    }
    return parsed.toString()
  } catch {
    return null
  }
}

const toDomain = (url: string): string | null => {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null
    }
    return parsed.hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

const getFaviconUrl = (domain: string): string =>
  `${FAVICON_SERVICE_BASE_URL}${encodeURIComponent(domain)}&sz=64`

const extractTrailingSources = (markdown: string): ParsedContent => {
  if (!markdown.trim()) {
    return { bodyMarkdown: markdown, sources: [] }
  }

  const lines = markdown.split('\n')
  let lastNonEmptyIndex = -1
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    if (lines[i].trim()) {
      lastNonEmptyIndex = i
      break
    }
  }

  if (lastNonEmptyIndex === -1) {
    return { bodyMarkdown: markdown, sources: [] }
  }

  if (!SOURCES_PREFIX_REGEX.test(lines[lastNonEmptyIndex])) {
    return { bodyMarkdown: markdown, sources: [] }
  }

  const sourceLineIndexes: number[] = []
  for (let i = lastNonEmptyIndex; i >= 0; i -= 1) {
    const line = lines[i]
    if (SOURCES_PREFIX_REGEX.test(line)) {
      sourceLineIndexes.push(i)
      continue
    }

    if (!line.trim()) {
      continue
    }

    break
  }

  const sourceLines = sourceLineIndexes
    .toSorted((a, b) => a - b)
    .map((index) => lines[index].replace(SOURCES_PREFIX_REGEX, ''))

  const seen = new Set<string>()
  const sources: ExtractedSource[] = []

  for (const sourceLine of sourceLines) {
    for (const match of sourceLine.matchAll(MARKDOWN_LINK_REGEX)) {
      const rawLabel = (match[1] || '').trim()
      const rawUrl = (match[2] || '').trim()
      const safeUrl = sanitizeLinkHref(rawUrl)
      if (!safeUrl || seen.has(safeUrl)) continue

      const domain = toDomain(safeUrl)
      if (!domain) continue

      seen.add(safeUrl)
      sources.push({
        label: rawLabel || domain || safeUrl,
        url: safeUrl,
        domain
      })

      if (sources.length >= SOURCES_MAX_COUNT) break
    }

    if (sources.length >= SOURCES_MAX_COUNT) break
  }

  // Fail-safe: if we can't parse valid source links, preserve original markdown.
  if (!sources.length) {
    return { bodyMarkdown: markdown, sources: [] }
  }

  for (const index of sourceLineIndexes.toSorted((a, b) => b - a)) {
    lines.splice(index, 1)
  }
  const bodyMarkdown = lines.join('\n').replace(/\n+$/, '')
  return { bodyMarkdown, sources }
}

const sanitizeHtml = (html: string): string => {
  if (typeof window === 'undefined') {
    return html
  }

  const purifier = createDOMPurify(window)
  const sanitized = purifier.sanitize(html, {
    ALLOWED_TAGS: SANITIZE_ALLOWED_TAGS,
    ALLOWED_ATTR: [...SANITIZE_ALLOWED_ATTR, 'class']
  })

  const doc = new window.DOMParser().parseFromString(
    String(sanitized),
    'text/html'
  )
  const anchors = doc.querySelectorAll('a')

  for (const anchor of anchors) {
    const safeHref = sanitizeLinkHref(anchor.getAttribute('href') || '')
    if (!safeHref) {
      anchor.removeAttribute('href')
      continue
    }

    anchor.setAttribute('href', safeHref)
    if (safeHref.startsWith('http://') || safeHref.startsWith('https://')) {
      anchor.setAttribute('target', '_blank')
      anchor.setAttribute('rel', 'noopener noreferrer')
    } else {
      anchor.removeAttribute('target')
      anchor.removeAttribute('rel')
    }
  }

  // Insert break opportunities in long unbreakable text runs (skipping code blocks)
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT)
  const textNodes: Text[] = []
  let textNode: Node | null
  while ((textNode = walker.nextNode())) {
    textNodes.push(textNode as Text)
  }
  for (const node of textNodes) {
    if (node.parentElement?.closest('pre, code')) continue
    const processed = insertBreakOpportunities(node.textContent || '')
    if (processed !== node.textContent) {
      node.textContent = processed
    }
  }

  return doc.body.innerHTML
}

const markdownToSafeHtml = (markdown: string): string => {
  const renderer = new marked.Renderer()
  renderer.html = () => ''

  marked.setOptions({
    gfm: true,
    breaks: true,
    renderer
  })

  const html = marked.parse(markdown || '')
  return sanitizeHtml(String(html))
}

const SourceThumbnail = ({
  source,
  className
}: {
  source: ExtractedSource
  className?: string
}) => {
  const [hasImageError, setHasImageError] = useState(false)
  const initial = source.domain.charAt(0).toUpperCase()

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border/60 bg-muted text-[10px] font-semibold text-muted-foreground ${className || ''}`}
      aria-hidden="true"
    >
      {!hasImageError ? (
        <Image
          src={getFaviconUrl(source.domain)}
          alt=""
          width={20}
          height={20}
          unoptimized
          className="h-full w-full object-cover"
          onError={() => setHasImageError(true)}
        />
      ) : (
        <span>{initial}</span>
      )}
    </span>
  )
}

const SourceBadgesRow = ({ sources }: { sources: ExtractedSource[] }) => {
  if (!sources.length) return null

  return (
    <TooltipProvider delayDuration={150}>
      <div className="mt-2 flex items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/70 px-2.5 py-1 text-[11px] font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label={`Sources (${sources.length})`}
            >
              <span className="flex items-center">
                {sources.map((source, index) => (
                  <span
                    key={source.url}
                    className={index === 0 ? '' : '-ml-1.5'}
                    style={{ zIndex: sources.length - index }}
                  >
                    <SourceThumbnail source={source} className="h-4 w-4" />
                  </span>
                ))}
              </span>
              <span>Sources</span>
              <span className="rounded-full bg-background/90 px-1.5 py-0.5 text-[10px] leading-none text-muted-foreground">
                {sources.length}
              </span>
            </button>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            align="start"
            className="max-w-80 rounded-lg border border-border bg-popover px-3 py-2 text-popover-foreground shadow-md"
          >
            <div className="space-y-2">
              {sources.map((source) => (
                <a
                  key={source.url}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 rounded-sm p-1 text-xs leading-snug text-popover-foreground underline-offset-2 hover:bg-muted/50 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <SourceThumbnail source={source} className="mt-0.5 h-5 w-5" />
                  <span className="min-w-0">
                    <p className="line-clamp-2 font-semibold">{source.label}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {source.domain}
                    </p>
                  </span>
                </a>
              ))}
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}

export const MarkdownMessageContent = ({
  content
}: MarkdownMessageContentProps) => {
  const { bodyMarkdown, sources } = useMemo(
    () => extractTrailingSources(content),
    [content]
  )
  const safeHtml = useMemo(
    () => markdownToSafeHtml(bodyMarkdown),
    [bodyMarkdown]
  )

  const editor = useEditor({
    immediatelyRender: false,
    editable: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        link: false,
        heading: {
          levels: [1, 2, 3, 4, 5, 6]
        }
      }),
      CodeBlockLowlight.configure({
        lowlight
      }),
      Link.configure({
        openOnClick: true,
        autolink: false,
        linkOnPaste: false,
        HTMLAttributes: {
          rel: 'noopener noreferrer',
          target: '_blank'
        }
      })
    ],
    content: '',
    editorProps: {
      attributes: {
        class:
          'tiptap-markdown leading-relaxed whitespace-normal break-words [overflow-wrap:break-word] [&_p]:my-1 [&_h1]:my-2 [&_h1]:text-base [&_h1]:font-semibold [&_h2]:my-2 [&_h2]:text-[0.95rem] [&_h2]:font-semibold [&_h3]:my-1 [&_h3]:font-semibold [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_pre]:relative [&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:border [&_pre]:border-zinc-700 [&_pre]:bg-zinc-800 [&_pre]:p-3 [&_pre]:text-zinc-100 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_code]:rounded [&_code]:bg-black/10 [&_code]:px-1 [&_code]:py-0.5 [&_a]:text-blue-700 [&_a]:underline dark:[&_a]:text-blue-300 [&_blockquote]:my-1 [&_blockquote]:border-l-2 [&_blockquote]:pl-3'
      }
    }
  })

  useEffect(() => {
    if (!editor) return
    editor.commands.setContent(safeHtml)
  }, [editor, safeHtml])

  if (!editor) {
    return (
      <div className="leading-relaxed break-words [overflow-wrap:break-word]">
        <div className="whitespace-pre-wrap break-words [overflow-wrap:break-word]">
          {insertBreakOpportunities(bodyMarkdown)}
        </div>
        <SourceBadgesRow sources={sources} />
      </div>
    )
  }

  return (
    <div className="leading-relaxed break-words [overflow-wrap:break-word]">
      <EditorContent editor={editor} />
      <SourceBadgesRow sources={sources} />
    </div>
  )
}
