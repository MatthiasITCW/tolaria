// Wikilink placeholder tokens for markdown round-trip
const WL_START = '\u2039WIKILINK:'
const WL_END = '\u203A'
const WL_RE = new RegExp(`${WL_START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^${WL_END}]+)${WL_END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'g')

/** Pre-process markdown: replace [[target]] with placeholder tokens */
export function preProcessWikilinks(md: string): string {
  return md.replace(/\[\[([^\]]+)\]\]/g, (_m, target) => `${WL_START}${target}${WL_END}`)
}

/** Walk blocks and replace placeholder text with wikilink inline content */
export function injectWikilinks(blocks: any[]): any[] {
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
    if (item.type !== 'text' || typeof item.text !== 'string' || !item.text.includes(WL_START)) {
      result.push(item)
      continue
    }
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
  }
  return result
}

/** Strip YAML frontmatter from markdown, returning [frontmatter, body] */
export function splitFrontmatter(content: string): [string, string] {
  if (!content.startsWith('---')) return ['', content]
  const end = content.indexOf('\n---', 3)
  if (end === -1) return ['', content]
  let to = end + 4
  if (content[to] === '\n') to++
  return [content.slice(0, to), content.slice(to)]
}

export function countWords(content: string): number {
  const [, body] = splitFrontmatter(content)
  const text = body.replace(/[#*_\[\]`>~\-|]/g, '').trim()
  if (!text) return 0
  return text.split(/\s+/).filter(Boolean).length
}
