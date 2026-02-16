import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Sidebar } from './Sidebar'
import type { VaultEntry, SidebarSelection } from '../types'

const mockEntries: VaultEntry[] = [
  {
    path: '/vault/project/build-app.md',
    filename: 'build-app.md',
    title: 'Build Laputa App',
    isA: 'Project',
    aliases: [],
    belongsTo: [],
    relatedTo: [],
    status: 'Active',
    owner: 'Luca',
    cadence: null,
    modifiedAt: 1700000000,
    createdAt: null,
    fileSize: 1024,
  },
  {
    path: '/vault/responsibility/grow-newsletter.md',
    filename: 'grow-newsletter.md',
    title: 'Grow Newsletter',
    isA: 'Responsibility',
    aliases: [],
    belongsTo: [],
    relatedTo: [],
    status: 'Active',
    owner: 'Luca',
    cadence: null,
    modifiedAt: 1700000000,
    createdAt: null,
    fileSize: 512,
  },
  {
    path: '/vault/experiment/stock-screener.md',
    filename: 'stock-screener.md',
    title: 'Stock Screener',
    isA: 'Experiment',
    aliases: [],
    belongsTo: [],
    relatedTo: [],
    status: 'Active',
    owner: 'Luca',
    cadence: null,
    modifiedAt: 1700000000,
    createdAt: null,
    fileSize: 256,
  },
  {
    path: '/vault/procedure/weekly-essays.md',
    filename: 'weekly-essays.md',
    title: 'Write Weekly Essays',
    isA: 'Procedure',
    aliases: [],
    belongsTo: [],
    relatedTo: [],
    status: 'Active',
    owner: 'Luca',
    cadence: 'Weekly',
    modifiedAt: 1700000000,
    createdAt: null,
    fileSize: 128,
  },
  {
    path: '/vault/topic/software-development.md',
    filename: 'software-development.md',
    title: 'Software Development',
    isA: 'Topic',
    aliases: ['Dev', 'Coding'],
    belongsTo: [],
    relatedTo: [],
    status: null,
    owner: null,
    cadence: null,
    modifiedAt: 1700000000,
    createdAt: null,
    fileSize: 256,
  },
  {
    path: '/vault/topic/trading.md',
    filename: 'trading.md',
    title: 'Trading',
    isA: 'Topic',
    aliases: ['Algorithmic Trading'],
    belongsTo: [],
    relatedTo: [],
    status: null,
    owner: null,
    cadence: null,
    modifiedAt: 1700000000,
    createdAt: null,
    fileSize: 180,
  },
]

const defaultSelection: SidebarSelection = { kind: 'filter', filter: 'all' }

describe('Sidebar', () => {
  it('renders the app title', () => {
    render(<Sidebar entries={[]} selection={defaultSelection} onSelect={() => {}} />)
    expect(screen.getByText('Laputa')).toBeInTheDocument()
  })

  it('renders section group headers', () => {
    render(<Sidebar entries={mockEntries} selection={defaultSelection} onSelect={() => {}} />)
    expect(screen.getByText('PROJECTS')).toBeInTheDocument()
    expect(screen.getByText('EXPERIMENTS')).toBeInTheDocument()
    expect(screen.getByText('RESPONSIBILITIES')).toBeInTheDocument()
    expect(screen.getByText('PROCEDURES')).toBeInTheDocument()
  })

  it('shows entity names under their section groups', () => {
    render(<Sidebar entries={mockEntries} selection={defaultSelection} onSelect={() => {}} />)
    expect(screen.getByText('Build Laputa App')).toBeInTheDocument()
    expect(screen.getByText('Grow Newsletter')).toBeInTheDocument()
    expect(screen.getByText('Stock Screener')).toBeInTheDocument()
    expect(screen.getByText('Write Weekly Essays')).toBeInTheDocument()
  })

  it('shows correct counts per section', () => {
    render(<Sidebar entries={mockEntries} selection={defaultSelection} onSelect={() => {}} />)
    // Each section has exactly 1 item
    const counts = screen.getAllByText('1')
    expect(counts.length).toBe(4)
  })

  it('collapses and expands sections', () => {
    render(<Sidebar entries={mockEntries} selection={defaultSelection} onSelect={() => {}} />)
    expect(screen.getByText('Build Laputa App')).toBeInTheDocument()

    // Collapse PROJECTS section
    fireEvent.click(screen.getByLabelText('Collapse PROJECTS'))
    expect(screen.queryByText('Build Laputa App')).not.toBeInTheDocument()

    // Expand PROJECTS section
    fireEvent.click(screen.getByLabelText('Expand PROJECTS'))
    expect(screen.getByText('Build Laputa App')).toBeInTheDocument()
  })

  it('calls onSelect when clicking an entity', () => {
    const onSelect = vi.fn()
    render(<Sidebar entries={mockEntries} selection={defaultSelection} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('Build Laputa App'))
    expect(onSelect).toHaveBeenCalledWith({
      kind: 'entity',
      entry: mockEntries[0],
    })
  })

  it('calls onSelect when clicking a section header', () => {
    const onSelect = vi.fn()
    render(<Sidebar entries={mockEntries} selection={defaultSelection} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('PROJECTS'))
    expect(onSelect).toHaveBeenCalledWith({
      kind: 'sectionGroup',
      type: 'Project',
    })
  })

  it('renders filter items', () => {
    render(<Sidebar entries={[]} selection={defaultSelection} onSelect={() => {}} />)
    expect(screen.getByText('All Notes')).toBeInTheDocument()
    expect(screen.getByText('People')).toBeInTheDocument()
    expect(screen.getByText('Events')).toBeInTheDocument()
    expect(screen.getByText('Favorites')).toBeInTheDocument()
    expect(screen.getByText('Trash')).toBeInTheDocument()
  })

  it('highlights active filter', () => {
    render(<Sidebar entries={[]} selection={defaultSelection} onSelect={() => {}} />)
    const allNotes = screen.getByText('All Notes')
    expect(allNotes.className).toContain('sidebar__filter-item--active')
  })

  it('calls onSelect when clicking a filter', () => {
    const onSelect = vi.fn()
    render(<Sidebar entries={[]} selection={defaultSelection} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('People'))
    expect(onSelect).toHaveBeenCalledWith({
      kind: 'filter',
      filter: 'people',
    })
  })

  it('renders TOPICS section with topic entries', () => {
    render(<Sidebar entries={mockEntries} selection={defaultSelection} onSelect={() => {}} />)
    expect(screen.getByText('TOPICS')).toBeInTheDocument()
    expect(screen.getByText('Software Development')).toBeInTheDocument()
    expect(screen.getByText('Trading')).toBeInTheDocument()
  })

  it('calls onSelect with topic kind when clicking a topic', () => {
    const onSelect = vi.fn()
    render(<Sidebar entries={mockEntries} selection={defaultSelection} onSelect={onSelect} />)
    fireEvent.click(screen.getByText('Software Development'))
    expect(onSelect).toHaveBeenCalledWith({
      kind: 'topic',
      entry: mockEntries[4],
    })
  })

  it('highlights active topic', () => {
    const topicSelection: SidebarSelection = { kind: 'topic', entry: mockEntries[4] }
    render(<Sidebar entries={mockEntries} selection={topicSelection} onSelect={() => {}} />)
    const topicEl = screen.getByText('Software Development')
    expect(topicEl.className).toContain('sidebar__topic-item--active')
  })

  it('does not render TOPICS section when no topics exist', () => {
    const noTopics = mockEntries.filter((e) => e.isA !== 'Topic')
    render(<Sidebar entries={noTopics} selection={defaultSelection} onSelect={() => {}} />)
    expect(screen.queryByText('TOPICS')).not.toBeInTheDocument()
  })
})
