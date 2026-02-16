import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { BlockNoteSchema, defaultInlineContentSpecs } from '@blocknote/core'
import { filterSuggestionItems } from '@blocknote/core/extensions'
import { createReactInlineContentSpec, useCreateBlockNote, SuggestionMenuController } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/mantine/style.css'
import type { VaultEntry } from '../types'
import { useEditorTheme } from '../hooks/useTheme'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import './Editor.css'
import './EditorTheme.css'

interface Tab {
  entry: VaultEntry
  content: string
}

interface EditorProps {
  tabs: Tab[]
  activeTabPath: string | null
  entries: VaultEntry[]
  onSwitchTab: (path: string) => void
  onCloseTab: (path: string) => void
  onNavigateWikilink: (target: string) => void
  onLoadDiff?: (path: string) => Promise<string>
  isModified?: (path: string) => boolean
}

// --- Custom Inline Content: WikiLink ---

const WikiLink = createReactInlineContentSpec(
  {
    type: "wikilink" as const,
    propSchema: {
      target: { default: "" },
    },
    content: "none",
  },
  {
    render: (props) => (
      <span
        className="wikilink"
        data-target={props.inlineContent.props.target}
      >
        {props.inlineContent.props.target}
      </span>
    ),
  }
)

// --- Schema with wikilink ---

const schema = BlockNoteSchema.create({
  inlineContentSpecs: {
    ...defaultInlineContentSpecs,
    wikilink: WikiLink,
  },
})

/** Strip YAML frontmatter from markdown, returning [frontmatter, body] */
function splitFrontmatter(content: string): [string, string] {
  if (!content.startsWith('---')) return ['', content]
  const end = content.indexOf('\n---', 3)
  if (end === -1) return ['', content]
  let to = end + 4
  if (content[to] === '\n') to++
  return [content.slice(0, to), content.slice(to)]
}

// Wikilink placeholder tokens for markdown round-trip
const WL_START = '\u2039WIKILINK:'
const WL_END = '\u203A'
const WL_RE = new RegExp(`${WL_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^${WL_END}]+)${WL_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g')

/** Pre-process markdown: replace [[target]] with placeholder tokens */
function preProcessWikilinks(md: string): string {
  return md.replace(/\[\[([^\]]+)\]\]/g, (_m, target) => `${WL_START}${target}${WL_END}`)
}

/** Walk blocks and replace placeholder text with wikilink inline content */
function injectWikilinks(blocks: any[]): any[] {
  return blocks.map(block => {
    if (block.content && Array.isArray(block.content)) {
      block.content = expandWikilinksInContent(block.content)
    }
    if (block.children && Array.isArray(block.children)) {
      block.children = injectWikilinks(block.children)
    }
    return block
  })
}

function expandWikilinksInContent(content: any[]): any[] {
  const result: any[] = []
  for (const item of content) {
    if (item.type === 'text' && typeof item.text === 'string' && item.text.includes(WL_START)) {
      const text = item.text as string
      let lastIndex = 0
      WL_RE.lastIndex = 0
      let match
      while ((match = WL_RE.exec(text)) !== null) {
        if (match.index > lastIndex) {
          result.push({ ...item, text: text.slice(lastIndex, match.index) })
        }
        result.push({
          type: 'wikilink',
          props: { target: match[1] },
          content: undefined,
        })
        lastIndex = match.index + match[0].length
      }
      if (lastIndex < text.length) {
        result.push({ ...item, text: text.slice(lastIndex) })
      }
    } else {
      result.push(item)
    }
  }
  return result
}

function DiffView({ diff }: { diff: string }) {
  if (!diff) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No changes to display
      </div>
    )
  }

  const lines = diff.split('\n')

  return (
    <div className="font-mono text-[13px] leading-relaxed py-3">
      {lines.map((line, i) => {
        let lineClass = 'text-secondary-foreground'
        if (line.startsWith('+') && !line.startsWith('+++')) {
          lineClass = 'bg-[rgba(76,175,80,0.12)] text-[#4caf50]'
        } else if (line.startsWith('-') && !line.startsWith('---')) {
          lineClass = 'bg-[rgba(244,67,54,0.12)] text-[#f44336]'
        } else if (line.startsWith('@@')) {
          lineClass = 'bg-[rgba(33,150,243,0.08)] text-primary italic'
        } else if (line.startsWith('diff') || line.startsWith('index') || line.startsWith('---') || line.startsWith('+++') || line.startsWith('new file')) {
          lineClass = 'bg-muted text-muted-foreground font-semibold'
        }

        return (
          <div key={i} className={cn("flex min-h-[22px] px-4", lineClass)}>
            <span className="w-10 shrink-0 text-right pr-3 text-muted-foreground select-none">
              {i + 1}
            </span>
            <span className="flex-1 whitespace-pre-wrap break-all px-2">
              {line || '\u00A0'}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/** Inner component that creates/manages BlockNote for a single tab */
function BlockNoteTab({ content, entries, onNavigateWikilink }: { content: string; entries: VaultEntry[]; onNavigateWikilink: (target: string) => void }) {
  const [, body] = useMemo(() => splitFrontmatter(content), [content])
  const navigateRef = useRef(onNavigateWikilink)
  navigateRef.current = onNavigateWikilink
  const { cssVars } = useEditorTheme()

  const editor = useCreateBlockNote({ schema })

  useEffect(() => {
    async function load() {
      const preprocessed = preProcessWikilinks(body)
      const blocks = await editor.tryParseMarkdownToBlocks(preprocessed)
      const withWikilinks = injectWikilinks(blocks)
      editor.replaceBlocks(editor.document, withWikilinks)
    }
    load()
  }, [body, editor])

  useEffect(() => {
    const container = document.querySelector('.editor__blocknote-container')
    if (!container) return
    const handler = (e: MouseEvent) => {
      const wikilink = (e.target as HTMLElement).closest('.wikilink')
      if (wikilink) {
        e.preventDefault()
        e.stopPropagation()
        const target = (wikilink as HTMLElement).dataset.target
        if (target) navigateRef.current(target)
      }
    }
    container.addEventListener('click', handler as EventListener, true)
    return () => container.removeEventListener('click', handler as EventListener, true)
  }, [editor])

  const getWikilinkItems = useCallback(async (query: string) => {
    const items = entries.map(entry => ({
      title: entry.title,
      onItemClick: () => {
        editor.insertInlineContent([
          {
            type: 'wikilink' as const,
            props: { target: entry.title },
          },
          " ",
        ])
      },
      aliases: [entry.filename.replace(/\.md$/, ''), ...entry.aliases],
      group: entry.isA || 'Note',
    }))
    return filterSuggestionItems(items, query)
  }, [entries, editor])

  const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')

  return (
    <div className="editor__blocknote-container" style={cssVars as React.CSSProperties}>
      <BlockNoteView
        editor={editor}
        theme={isDark ? 'dark' : 'light'}
      >
        <SuggestionMenuController
          triggerCharacter="[["
          getItems={getWikilinkItems}
        />
      </BlockNoteView>
    </div>
  )
}

export function Editor({ tabs, activeTabPath, entries, onSwitchTab, onCloseTab, onNavigateWikilink, onLoadDiff, isModified }: EditorProps) {
  const [diffMode, setDiffMode] = useState(false)
  const [diffContent, setDiffContent] = useState<string | null>(null)
  const [diffLoading, setDiffLoading] = useState(false)

  const activeTab = tabs.find((t) => t.entry.path === activeTabPath) ?? null
  const showDiffToggle = activeTab && isModified?.(activeTab.entry.path)

  useEffect(() => {
    setDiffMode(false)
    setDiffContent(null)
  }, [activeTabPath])

  const handleToggleDiff = useCallback(async () => {
    if (diffMode) {
      setDiffMode(false)
      setDiffContent(null)
      return
    }
    if (!activeTabPath || !onLoadDiff) return
    setDiffLoading(true)
    try {
      const diff = await onLoadDiff(activeTabPath)
      setDiffContent(diff)
      setDiffMode(true)
    } catch (err) {
      console.warn('Failed to load diff:', err)
    } finally {
      setDiffLoading(false)
    }
  }, [diffMode, activeTabPath, onLoadDiff])

  if (tabs.length === 0) {
    return (
      <div className="editor flex flex-col bg-background text-foreground">
        <div className="editor__drag-strip h-12 shrink-0" data-tauri-drag-region style={{ WebkitAppRegion: 'drag' } as React.CSSProperties} />
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
          <p className="m-0 text-[15px]">Select a note to start editing</p>
          <span className="text-xs text-muted-foreground">Cmd+P to search &middot; Cmd+N to create</span>
        </div>
      </div>
    )
  }

  return (
    <div className="editor flex flex-col bg-background text-foreground">
      {/* Tab bar */}
      <div className="flex shrink-0 overflow-x-auto border-b border-border bg-card" data-tauri-drag-region style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
        {tabs.map((tab) => (
          <div
            key={tab.entry.path}
            className={cn(
              "flex shrink-0 cursor-pointer items-center gap-1.5 border-r border-border px-3.5 py-[7px] text-xs whitespace-nowrap max-w-[180px] transition-all",
              tab.entry.path === activeTabPath
                ? "bg-background text-foreground border-b-2 border-b-primary"
                : "text-muted-foreground hover:bg-muted hover:text-secondary-foreground"
            )}
            onClick={() => onSwitchTab(tab.entry.path)}
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            <span className="truncate">{tab.entry.title}</span>
            <button
              className={cn(
                "shrink-0 rounded-sm p-0 bg-transparent border-none text-muted-foreground cursor-pointer transition-opacity hover:bg-accent hover:text-foreground",
                tab.entry.path === activeTabPath ? "opacity-100" : "opacity-0 group-hover:opacity-100"
              )}
              onClick={(e) => {
                e.stopPropagation()
                onCloseTab(tab.entry.path)
              }}
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
        {showDiffToggle && (
          <div className="ml-auto flex items-center px-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            <Button
              variant={diffMode ? 'default' : 'outline'}
              size="xs"
              onClick={handleToggleDiff}
              disabled={diffLoading}
            >
              {diffLoading ? '...' : diffMode ? 'Edit' : 'Diff'}
            </Button>
          </div>
        )}
      </div>
      {diffMode ? (
        <div className="flex-1 overflow-auto">
          <DiffView diff={diffContent ?? ''} />
        </div>
      ) : (
        activeTab && (
          <BlockNoteTab
            key={activeTabPath}
            content={activeTab.content}
            entries={entries}
            onNavigateWikilink={onNavigateWikilink}
          />
        )
      )}
    </div>
  )
}
