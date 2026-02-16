import { useState, useEffect } from 'react'
import type { VaultEntry, SidebarSelection } from '../types'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sun, Moon, Plus, ChevronRight, ChevronDown, GitCommitHorizontal } from 'lucide-react'

interface SidebarProps {
  entries: VaultEntry[]
  selection: SidebarSelection
  onSelect: (selection: SidebarSelection) => void
  onSelectNote?: (entry: VaultEntry) => void
  modifiedCount?: number
  onCommitPush?: () => void
}

const FILTERS = [
  { label: 'All Notes', filter: 'all' as const },
  { label: 'People', filter: 'people' as const },
  { label: 'Events', filter: 'events' as const },
  { label: 'Changes', filter: 'changes' as const },
  { label: 'Favorites', filter: 'favorites' as const },
  { label: 'Trash', filter: 'trash' as const },
]

const SECTION_GROUPS = [
  { label: 'PROJECTS', type: 'Project' },
  { label: 'EXPERIMENTS', type: 'Experiment' },
  { label: 'RESPONSIBILITIES', type: 'Responsibility' },
  { label: 'PROCEDURES', type: 'Procedure' },
] as const

export function Sidebar({ entries, selection, onSelect, onSelectNote, modifiedCount = 0, onCommitPush }: SidebarProps) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      return (localStorage.getItem('laputa-theme') as 'dark' | 'light') || 'dark'
    } catch {
      return 'dark'
    }
  })

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    try {
      localStorage.setItem('laputa-theme', theme)
    } catch {
      // localStorage unavailable
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  const toggleSection = (type: string) => {
    setCollapsed((prev) => ({ ...prev, [type]: !prev[type] }))
  }

  const isActive = (sel: SidebarSelection): boolean => {
    if (selection.kind !== sel.kind) return false
    if (sel.kind === 'filter' && selection.kind === 'filter') return sel.filter === selection.filter
    if (sel.kind === 'sectionGroup' && selection.kind === 'sectionGroup') return sel.type === selection.type
    if (sel.kind === 'entity' && selection.kind === 'entity') return sel.entry.path === selection.entry.path
    if (sel.kind === 'topic' && selection.kind === 'topic') return sel.entry.path === selection.entry.path
    return false
  }

  return (
    <aside className="flex h-full flex-col overflow-y-auto bg-sidebar text-sidebar-foreground">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3 pl-[78px]" data-tauri-drag-region style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
        <h2 className="m-0 text-[17px] font-bold tracking-tight text-foreground">Laputa</h2>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={toggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="text-muted-foreground hover:text-foreground"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {/* Filters */}
        <div className="mb-2 border-b border-border py-1">
          {FILTERS.map(({ label, filter }) => (
            <div
              key={filter}
              className={cn(
                "mx-1.5 my-px cursor-pointer rounded-md px-4 py-1.5 text-[13px] transition-colors",
                isActive({ kind: 'filter', filter })
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
              onClick={() => onSelect({ kind: 'filter', filter })}
            >
              <span className="flex items-center gap-1.5">
                {label}
                {filter === 'changes' && modifiedCount > 0 && (
                  <Badge className="h-[18px] min-w-[18px] bg-[var(--accent-orange)] px-1 text-[10px] text-white">
                    {modifiedCount}
                  </Badge>
                )}
              </span>
            </div>
          ))}
        </div>

        {/* Section Groups */}
        {SECTION_GROUPS.map(({ label, type }) => {
          const items = entries.filter((e) => e.isA === type)
          const isCollapsed = collapsed[type] ?? false

          return (
            <div key={type} className="mb-1">
              <div
                className={cn(
                  "mx-1 flex cursor-pointer select-none items-center rounded px-2 py-1.5 text-[11px] font-semibold tracking-wide",
                  isActive({ kind: 'sectionGroup', type })
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                )}
                onClick={() => onSelect({ kind: 'sectionGroup', type })}
              >
                <button
                  className="mr-1 flex shrink-0 items-center bg-transparent border-none text-inherit cursor-pointer p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleSection(type)
                  }}
                  aria-label={isCollapsed ? `Expand ${label}` : `Collapse ${label}`}
                >
                  {isCollapsed ? <ChevronRight className="size-3" /> : <ChevronDown className="size-3" />}
                </button>
                <span className="flex-1">{label}</span>
                <span className="text-[10px] text-muted-foreground mr-1">{items.length}</span>
                <button
                  className="flex items-center bg-transparent border-none text-muted-foreground cursor-pointer p-0 opacity-0 transition-opacity group-hover/section:opacity-100 hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation()
                  }}
                  aria-label={`Add ${type}`}
                >
                  <Plus className="size-3.5" />
                </button>
              </div>
              {!isCollapsed && (
                <div className="py-0.5">
                  {items.map((entry) => (
                    <div
                      key={entry.path}
                      className={cn(
                        "mx-1.5 my-px cursor-pointer truncate rounded-md py-1.5 pl-7 pr-4 text-[13px] transition-colors",
                        isActive({ kind: 'entity', entry })
                          ? "bg-primary/10 font-medium text-primary"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground"
                      )}
                      onClick={() => {
                        onSelect({ kind: 'entity', entry })
                        onSelectNote?.(entry)
                      }}
                    >
                      {entry.title}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {/* Topics */}
        {(() => {
          const topics = entries.filter((e) => e.isA === 'Topic')
          if (topics.length === 0) return null
          return (
            <div className="mt-2 border-t border-border pt-2">
              <div className="px-4 py-1.5 text-[11px] font-semibold tracking-wide text-muted-foreground select-none">
                TOPICS
              </div>
              {topics.map((entry) => (
                <div
                  key={entry.path}
                  className={cn(
                    "mx-1.5 my-px cursor-pointer truncate rounded-md py-1.5 pl-7 pr-4 text-[13px] transition-colors",
                    isActive({ kind: 'topic', entry })
                      ? "bg-primary/10 font-medium text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                  onClick={() => {
                    onSelect({ kind: 'topic', entry })
                    onSelectNote?.(entry)
                  }}
                >
                  {entry.title}
                </div>
              ))}
            </div>
          )
        })()}
      </nav>

      {/* Commit button */}
      {modifiedCount > 0 && onCommitPush && (
        <div className="shrink-0 border-t border-border p-3">
          <Button className="w-full gap-1.5" size="sm" onClick={onCommitPush}>
            <GitCommitHorizontal className="size-3.5" />
            Commit & Push
            <Badge className="ml-1 bg-white/25 text-white text-[10px] h-[18px] min-w-[18px] px-1">
              {modifiedCount}
            </Badge>
          </Button>
        </div>
      )}
    </aside>
  )
}
