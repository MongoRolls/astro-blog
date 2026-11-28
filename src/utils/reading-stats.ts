const FRONTMATTER_RE = /^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/
const CJK_CHAR_RE = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu
const LATIN_WORD_RE = /[A-Z0-9]+(?:['’-][A-Z0-9]+)*/gi

const CJK_CHARS_PER_MINUTE = 400
const LATIN_WORDS_PER_MINUTE = 220

export interface ReadingStats {
  words: number
  minutes: number
  minutesRead: number
}

export function stripInlineMarkdown(text: string): string {
  return text
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/~~([^~]+)~~/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

export function cleanMarkdownForStats(markdown = ''): string {
  return stripInlineMarkdown(
    markdown
      .replace(FRONTMATTER_RE, '')
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/^[ \t]*(?:import|export)[ \t][^\n]*$/gm, ' ')
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/^#{1,6}\s+/gm, '')
      .replace(/^>\s?/gm, ''),
  )
}

export function getReadingStats(markdown = ''): ReadingStats {
  const cleaned = cleanMarkdownForStats(markdown)
  const cjkMatches = cleaned.match(CJK_CHAR_RE)
  const cjkCount = cjkMatches ? cjkMatches.length : 0
  const withoutCjk = cleaned.replace(CJK_CHAR_RE, ' ')
  const latinMatches = withoutCjk.match(LATIN_WORD_RE)
  const latinCount = latinMatches ? latinMatches.length : 0
  const words = cjkCount + latinCount
  const minutes = cjkCount / CJK_CHARS_PER_MINUTE + latinCount / LATIN_WORDS_PER_MINUTE
  const minutesRead = Math.max(1, Math.ceil(minutes))

  return { words, minutes, minutesRead }
}
