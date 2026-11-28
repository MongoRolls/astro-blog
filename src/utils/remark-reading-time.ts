import { toString } from 'mdast-util-to-string'
import { getReadingStats } from './reading-stats'

interface AstroRemarkFile {
  value?: string | Uint8Array
  data: {
    astro?: {
      frontmatter?: Record<string, unknown>
    }
  }
}

export function remarkReadingTime() {
  return function (tree: Parameters<typeof toString>[0], file: AstroRemarkFile) {
    const rawText = typeof file.value === 'string'
      ? file.value
      : file.value
        ? new TextDecoder().decode(file.value)
        : ''
    const stats = getReadingStats(rawText.trim() ? rawText : toString(tree))
    if (file.data.astro?.frontmatter) {
      file.data.astro.frontmatter.minutesRead = stats.minutesRead
      file.data.astro.frontmatter.wordCount = stats.words
    }
  }
}
