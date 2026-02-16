import { useState } from 'react'
import type { VaultEntry, SidebarSelection, ModifiedFile } from '../types'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus } from 'lucide-react'

interface NoteListProps {
  entries: VaultEntry[]
  selection: SidebarSelection
  selectedNote: VaultEntry | null
  allContent: Record<string, string>
  modifiedFiles?: ModifiedFile[]
  onSelectNote: (entry: VaultEntry) => void
  onCreateNote: () => void
}

interface RelationshipGroup {
  label: string
  entries: VaultEntry[]
}

/** Extract first ~80 chars of content after the title heading */
function getSnippet(content: string | undefined): string {
  if (!content) return ''
  const withoutFm = content.replace(/^---[\s\S]*?---\s*/, '')
  const withoutH1 = withoutFm.replace(/^#\s+.*\n+/, '')
  const clean = withoutH1
    .replace(/[#*_`\[\]]/g, '')
    .replace(/\n+/g, ' ')
    .trim()
  return clean.slice(0, 80) + (clean.length > 80 ? '...' : '')
}

function relativeDate(ts: number | null): string {
  if (!ts) return ''
  const now = Math.floor(Date.now() / 1000)
  const diff = now - ts
  if (diff < 0) {
    const date = new Date(ts * 1000)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  const date = new Date(ts * 1000)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getDisplayDate(entry: VaultEntry): number | null {
  return entry.modifiedAt ?? entry.createdAt
}

function refsMatch(refs: string[], entry: VaultEntry): boolean {
  const stem = entry.path.replace(/^.*\/Laputa\//, '').replace(/\.md$/, '')
  return refs.some((ref) => {
    const inner = ref.replace(/^\[\[/, '').replace(/\]\]$/, '')
    return inner === stem
  })
}

function resolveRefs(refs: string[], entries: VaultEntry[]): VaultEntry[] {
  return refs
    .map((ref) => {
      const inner = ref.replace(/^\[\[/, '').replace(/\]\]$/, '')
      return entries.find((e) => {
        const stem = e.path.replace(/^.*\/Laputa\//, '').replace(/\.md$/, '')
        if (stem === inner) return true
        const fileStem = e.filename.replace(/\.md$/, '')
        if (fileStem === inner.split('/').pop()) return true
        return false
      })
    })
    .filter((e): e is VaultEntry => e !== undefined)
}

function sortByModified(a: VaultEntry, b: VaultEntry): number {
  return (getDisplayDate(b) ?? 0) - (getDisplayDate(a) ?? 0)
}

function buildRelationshipGroups(entity: VaultEntry, allEntries: VaultEntry[]): RelationshipGroup[] {
  const groups: RelationshipGroup[] = []
  const seen = new Set<string>([entity.path])

  const children = allEntries
    .filter((e) => !seen.has(e.path) && e.isA !== 'Event' && refsMatch(e.belongsTo, entity))
    .sort(sortByModified)
  if (children.length > 0) {
    groups.push({ label: 'Children', entries: children })
    children.forEach((e) => seen.add(e.path))
  }

  const events = allEntries
    .filter(
      (e) =>
        !seen.has(e.path) &&
        e.isA === 'Event' &&
        (refsMatch(e.belongsTo, entity) || refsMatch(e.relatedTo, entity))
    )
    .sort(sortByModified)
  if (events.length > 0) {
    groups.push({ label: 'Events', entries: events })
    events.forEach((e) => seen.add(e.path))
  }

  const referencedBy = allEntries
    .filter((e) => !seen.has(e.path) && e.isA !== 'Event' && refsMatch(e.relatedTo, entity))
    .sort(sortByModified)
  if (referencedBy.length > 0) {
    groups.push({ label: 'Referenced By', entries: referencedBy })
    referencedBy.forEach((e) => seen.add(e.path))
  }

  const belongsTo = resolveRefs(entity.belongsTo, allEntries).filter((e) => !seen.has(e.path))
  if (belongsTo.length > 0) {
    groups.push({ label: 'Belongs To', entries: belongsTo })
    belongsTo.forEach((e) => seen.add(e.path))
  }

  const relatedTo = resolveRefs(entity.relatedTo, allEntries).filter((e) => !seen.has(e.path))
  if (relatedTo.length > 0) {
    groups.push({ label: 'Related To', entries: relatedTo })
    relatedTo.forEach((e) => seen.add(e.path))
  }

  return groups
}

function filterEntries(entries: VaultEntry[], selection: SidebarSelection, modifiedFiles?: ModifiedFile[]): VaultEntry[] {
  switch (selection.kind) {
    case 'filter':
      switch (selection.filter) {
        case 'all':
          return entries
        case 'people':
          return entries.filter((e) => e.isA === 'Person')
        case 'events':
          return entries.filter((e) => e.isA === 'Event')
        case 'changes': {
          if (!modifiedFiles || modifiedFiles.length === 0) return []
          const modifiedPaths = new Set(modifiedFiles.map((f) => f.path))
          return entries.filter((e) => modifiedPaths.has(e.path))
        }
        case 'favorites':
          return []
        case 'trash':
          return []
      }
      break
    case 'sectionGroup':
      return entries.filter((e) => e.isA === selection.type)
    case 'entity':
      return []
    case 'topic': {
      const topic = selection.entry
      return entries.filter((e) => refsMatch(e.relatedTo, topic))
    }
  }
}

const TYPE_PILLS = [
  { label: 'All', type: null },
  { label: 'Projects', type: 'Project' },
  { label: 'Notes', type: 'Note' },
  { label: 'Events', type: 'Event' },
  { label: 'People', type: 'Person' },
  { label: 'Experiments', type: 'Experiment' },
  { label: 'Procedures', type: 'Procedure' },
  { label: 'Responsibilities', type: 'Responsibility' },
] as const

const TYPE_COLORS: Record<string, string> = {
  project: 'bg-[rgba(74,158,255,0.15)] text-[#4a9eff]',
  responsibility: 'bg-[rgba(156,114,255,0.15)] text-[#9c72ff]',
  procedure: 'bg-[rgba(255,152,0,0.15)] text-[#ff9800]',
  experiment: 'bg-[rgba(0,200,150,0.15)] text-[#00c896]',
  note: 'bg-[rgba(200,200,200,0.1)] text-[#999]',
  person: 'bg-[rgba(255,100,130,0.15)] text-[#ff6482]',
  event: 'bg-[rgba(255,200,50,0.15)] text-[#e6b800]',
  topic: 'bg-[rgba(100,220,200,0.15)] text-[#64dcc8]',
}

const GIT_STATUS_COLORS: Record<string, string> = {
  modified: 'bg-[rgba(255,152,0,0.15)] text-[#ff9800]',
  added: 'bg-[rgba(76,175,80,0.15)] text-[#4caf50]',
  deleted: 'bg-[rgba(244,67,54,0.15)] text-[#f44336]',
  untracked: 'bg-[rgba(76,175,80,0.15)] text-[#4caf50]',
  renamed: 'bg-[rgba(33,150,243,0.15)] text-[#2196f3]',
}

export function NoteList({ entries, selection, selectedNote, allContent, modifiedFiles, onSelectNote, onCreateNote }: NoteListProps) {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string | null>(null)

  const isEntityView = selection.kind === 'entity'
  const entityGroups = isEntityView ? buildRelationshipGroups(selection.entry, entries) : []
  const isChangesView = selection.kind === 'filter' && selection.filter === 'changes'

  const modifiedStatusMap = new Map<string, string>()
  if (modifiedFiles) {
    for (const f of modifiedFiles) {
      modifiedStatusMap.set(f.path, f.status)
    }
  }

  const filtered = isEntityView ? [] : filterEntries(entries, selection, modifiedFiles)
  const sorted = isEntityView ? [] : [...filtered].sort(sortByModified)

  const query = search.trim().toLowerCase()

  const searchedGroups = query
    ? entityGroups
        .map((g) => ({
          ...g,
          entries: g.entries.filter((e) => e.title.toLowerCase().includes(query)),
        }))
        .filter((g) => g.entries.length > 0)
    : entityGroups

  const searched = query
    ? sorted.filter((e) => e.title.toLowerCase().includes(query))
    : sorted

  const typeCounts = new Map<string | null, number>()
  typeCounts.set(null, searched.length)
  for (const entry of searched) {
    if (entry.isA) {
      typeCounts.set(entry.isA, (typeCounts.get(entry.isA) ?? 0) + 1)
    }
  }

  const displayed = typeFilter
    ? searched.filter((e) => e.isA === typeFilter)
    : searched

  const totalCount = isEntityView
    ? searchedGroups.reduce((sum, g) => sum + g.entries.length, 0)
    : displayed.length

  const renderItem = (entry: VaultEntry, isPinned = false) => {
    const gitStatus = modifiedStatusMap.get(entry.path)
    return (
      <div
        key={entry.path}
        className={cn(
          "cursor-pointer border-b border-[var(--border-subtle)] px-4 py-2.5 transition-colors",
          isPinned && "border-l-[3px] border-l-[var(--accent-green)] bg-muted pl-[13px]",
          selectedNote?.path === entry.path && !isPinned && "border-l-[3px] border-l-primary bg-[var(--bg-selected)] pl-[13px]",
          !isPinned && selectedNote?.path !== entry.path && "hover:bg-muted"
        )}
        onClick={() => onSelectNote(entry)}
      >
        <div className="flex items-baseline justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center truncate text-[13px] font-semibold text-foreground">
            {isChangesView && gitStatus && (
              <span className={cn(
                "mr-1.5 inline-flex size-[18px] shrink-0 items-center justify-center rounded-sm font-mono text-[10px] font-bold",
                GIT_STATUS_COLORS[gitStatus]
              )}>
                {gitStatus === 'modified' ? 'M' : gitStatus === 'added' ? 'A' : gitStatus === 'deleted' ? 'D' : gitStatus === 'untracked' ? '?' : 'R'}
              </span>
            )}
            <span className="truncate">{entry.title}</span>
          </div>
          <span className="shrink-0 whitespace-nowrap text-[11px] text-muted-foreground">
            {relativeDate(getDisplayDate(entry))}
          </span>
        </div>
        <div className="mt-0.5 truncate text-xs leading-relaxed text-muted-foreground">
          {getSnippet(allContent[entry.path])}
        </div>
        <div className="mt-1 flex gap-1.5 text-[11px]">
          {entry.isA && (
            <span className={cn(
              "rounded-sm px-1.5 py-px text-[10px] font-medium tracking-wide",
              TYPE_COLORS[entry.isA.toLowerCase()] ?? "bg-secondary text-secondary-foreground"
            )}>
              {entry.isA}
            </span>
          )}
          {entry.status && (
            <span className="text-[10px] text-[var(--accent-green)]">
              {entry.status}
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col overflow-y-auto border-r border-border bg-card text-foreground">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3.5" data-tauri-drag-region style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
        <h3 className="m-0 min-w-0 flex-1 truncate text-sm font-semibold">
          {isEntityView ? selection.entry.title : 'Notes'}
        </h3>
        <div className="flex items-center gap-2" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <Badge variant="secondary" className="text-[11px]">{totalCount}</Badge>
          <Button variant="secondary" size="icon-xs" onClick={onCreateNote} title="Create new note">
            <Plus className="size-4" />
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="border-b border-border px-3 py-2">
        <Input
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 text-[13px]"
        />
      </div>

      {/* Type filter pills */}
      {!isEntityView && (
        <div className="flex flex-wrap gap-1 border-b border-border px-3 py-2">
          {TYPE_PILLS.filter(({ type }) => {
            const count = typeCounts.get(type) ?? 0
            return type === null || count > 0
          }).map(({ label, type }) => {
            const count = typeCounts.get(type) ?? 0
            return (
              <button
                key={label}
                className={cn(
                  "whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] transition-colors",
                  typeFilter === type
                    ? "border-primary/20 bg-primary/10 text-primary"
                    : "border-border bg-transparent text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
                )}
                onClick={() => setTypeFilter(type)}
              >
                {label} <span className="ml-0.5 opacity-60 text-[10px]">{count}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Items */}
      <div className="flex-1 overflow-y-auto">
        {isEntityView ? (
          <>
            {renderItem(selection.entry, true)}
            {searchedGroups.length === 0 ? (
              <div className="px-4 py-8 text-center text-[13px] text-muted-foreground">
                {query ? 'No matching items' : 'No related items'}
              </div>
            ) : (
              searchedGroups.map((group) => (
                <div key={group.label} className="border-t border-[var(--border-subtle)]">
                  <div className="flex items-center justify-between px-4 py-2.5 pt-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {group.label}
                    </span>
                    <Badge variant="secondary" className="text-[10px]">{group.entries.length}</Badge>
                  </div>
                  {group.entries.map((entry) => renderItem(entry))}
                </div>
              ))
            )}
          </>
        ) : (
          displayed.length === 0 ? (
            <div className="px-4 py-8 text-center text-[13px] text-muted-foreground">No notes found</div>
          ) : (
            displayed.map((entry) => renderItem(entry))
          )
        )}
      </div>
    </div>
  )
}
