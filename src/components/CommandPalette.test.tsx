import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CommandPalette } from './CommandPalette'
import type { CommandAction } from '../hooks/useCommandRegistry'

// jsdom doesn't implement scrollIntoView
Element.prototype.scrollIntoView = vi.fn()

const makeCommand = (overrides: Partial<CommandAction> = {}): CommandAction => ({
  id: 'test-cmd',
  label: 'Test Command',
  group: 'Navigation',
  keywords: [],
  enabled: true,
  shortcut: undefined,
  execute: vi.fn(),
  ...overrides,
})

const commands: CommandAction[] = [
  makeCommand({ id: 'search-notes', label: 'Search Notes', group: 'Navigation', shortcut: '⌘P', keywords: ['find'] }),
  makeCommand({ id: 'create-note', label: 'Create New Note', group: 'Note', shortcut: '⌘N' }),
  makeCommand({ id: 'commit-push', label: 'Commit & Push', group: 'Git', keywords: ['git', 'sync'] }),
  makeCommand({ id: 'open-settings', label: 'Open Settings', group: 'Settings', shortcut: '⌘,' }),
  makeCommand({ id: 'disabled-cmd', label: 'Disabled Command', group: 'Note', enabled: false }),
]

describe('CommandPalette', () => {
  const onClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when closed', () => {
    const { container } = render(
      <CommandPalette open={false} commands={commands} onClose={onClose} />,
    )
    expect(container.firstChild).toBeNull()
  })

  it('shows search input when open', () => {
    render(<CommandPalette open={true} commands={commands} onClose={onClose} />)
    expect(screen.getByPlaceholderText('Type a command...')).toBeInTheDocument()
  })

  it('shows all enabled commands grouped by category', () => {
    render(<CommandPalette open={true} commands={commands} onClose={onClose} />)
    expect(screen.getByText('Search Notes')).toBeInTheDocument()
    expect(screen.getByText('Create New Note')).toBeInTheDocument()
    expect(screen.getByText('Commit & Push')).toBeInTheDocument()
    expect(screen.getByText('Open Settings')).toBeInTheDocument()
    // Disabled command should not appear
    expect(screen.queryByText('Disabled Command')).not.toBeInTheDocument()
  })

  it('shows group labels', () => {
    render(<CommandPalette open={true} commands={commands} onClose={onClose} />)
    expect(screen.getByText('Navigation')).toBeInTheDocument()
    expect(screen.getByText('Note')).toBeInTheDocument()
    expect(screen.getByText('Git')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
  })

  it('shows keyboard shortcuts', () => {
    render(<CommandPalette open={true} commands={commands} onClose={onClose} />)
    expect(screen.getByText('⌘P')).toBeInTheDocument()
    expect(screen.getByText('⌘N')).toBeInTheDocument()
    expect(screen.getByText('⌘,')).toBeInTheDocument()
  })

  it('filters commands by fuzzy search', () => {
    render(<CommandPalette open={true} commands={commands} onClose={onClose} />)
    const input = screen.getByPlaceholderText('Type a command...')
    fireEvent.change(input, { target: { value: 'commit' } })

    expect(screen.getByText('Commit & Push')).toBeInTheDocument()
    expect(screen.queryByText('Search Notes')).not.toBeInTheDocument()
  })

  it('matches by keyword', () => {
    render(<CommandPalette open={true} commands={commands} onClose={onClose} />)
    const input = screen.getByPlaceholderText('Type a command...')
    fireEvent.change(input, { target: { value: 'find' } })

    expect(screen.getByText('Search Notes')).toBeInTheDocument()
  })

  it('shows "No matching commands" when no results', () => {
    render(<CommandPalette open={true} commands={commands} onClose={onClose} />)
    const input = screen.getByPlaceholderText('Type a command...')
    fireEvent.change(input, { target: { value: 'zzzzzzz' } })

    expect(screen.getByText('No matching commands')).toBeInTheDocument()
  })

  it('calls onClose when pressing Escape', () => {
    render(<CommandPalette open={true} commands={commands} onClose={onClose} />)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
  })

  it('executes command and closes on Enter', () => {
    render(<CommandPalette open={true} commands={commands} onClose={onClose} />)
    fireEvent.keyDown(window, { key: 'Enter' })

    // First enabled command (Search Notes) should execute
    expect(commands[0].execute).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('navigates with arrow keys and selects with Enter', () => {
    render(<CommandPalette open={true} commands={commands} onClose={onClose} />)

    fireEvent.keyDown(window, { key: 'ArrowDown' })
    fireEvent.keyDown(window, { key: 'Enter' })

    // Second enabled command (Create New Note) should execute
    expect(commands[1].execute).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('does not go below the last item', () => {
    render(<CommandPalette open={true} commands={commands} onClose={onClose} />)

    for (let i = 0; i < 20; i++) {
      fireEvent.keyDown(window, { key: 'ArrowDown' })
    }
    fireEvent.keyDown(window, { key: 'Enter' })

    // Should select last enabled command (Open Settings)
    expect(commands[3].execute).toHaveBeenCalled()
  })

  it('does not go above first item', () => {
    render(<CommandPalette open={true} commands={commands} onClose={onClose} />)

    fireEvent.keyDown(window, { key: 'ArrowUp' })
    fireEvent.keyDown(window, { key: 'Enter' })

    // Should still select first command
    expect(commands[0].execute).toHaveBeenCalled()
  })

  it('calls onClose when clicking backdrop', () => {
    render(<CommandPalette open={true} commands={commands} onClose={onClose} />)

    const backdrop = screen.getByPlaceholderText('Type a command...').closest('.fixed')!
    fireEvent.click(backdrop)

    expect(onClose).toHaveBeenCalled()
  })

  it('executes command when clicking an item', () => {
    render(<CommandPalette open={true} commands={commands} onClose={onClose} />)
    fireEvent.click(screen.getByText('Commit & Push'))

    expect(commands[2].execute).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  it('shows footer hints', () => {
    render(<CommandPalette open={true} commands={commands} onClose={onClose} />)
    expect(screen.getByText('↑↓ navigate')).toBeInTheDocument()
    expect(screen.getByText('↵ select')).toBeInTheDocument()
    expect(screen.getByText('esc close')).toBeInTheDocument()
  })
})
