import { describe, it, expect } from 'vitest'
import { fuzzyMatch } from './fuzzyMatch'

describe('fuzzyMatch', () => {
  it('matches exact string', () => {
    const result = fuzzyMatch('hello', 'hello')
    expect(result.match).toBe(true)
    expect(result.score).toBeGreaterThan(0)
  })

  it('matches case-insensitively', () => {
    expect(fuzzyMatch('hello', 'Hello World').match).toBe(true)
  })

  it('matches subsequence chars in order', () => {
    expect(fuzzyMatch('cnt', 'Create New Type').match).toBe(true)
  })

  it('rejects when chars are not all present', () => {
    expect(fuzzyMatch('xyz', 'hello').match).toBe(false)
  })

  it('rejects when chars are out of order', () => {
    expect(fuzzyMatch('ba', 'abc').match).toBe(false)
  })

  it('returns higher score for consecutive matches', () => {
    const consecutive = fuzzyMatch('com', 'Commit & Push')
    const scattered = fuzzyMatch('cmt', 'Commit & Push')
    expect(consecutive.score).toBeGreaterThan(scattered.score)
  })

  it('gives bonus for word-start matches', () => {
    const wordStart = fuzzyMatch('cp', 'Commit Push')
    const midWord = fuzzyMatch('om', 'Commit Push')
    expect(wordStart.score).toBeGreaterThan(midWord.score)
  })

  it('matches empty query against any string', () => {
    expect(fuzzyMatch('', 'anything').match).toBe(true)
  })

  it('handles empty target', () => {
    expect(fuzzyMatch('a', '').match).toBe(false)
  })
})
