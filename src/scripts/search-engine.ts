export interface SearchResult {
  excerpt: string
  meta: { title: string }
  searchText?: string
  url: string
}

export interface SearchMatch {
  data: () => Promise<SearchResult>
}

interface SearchEngine {
  search: (query: string) => Promise<{ results: SearchMatch[] }>
}

interface PagefindInstance extends SearchEngine {
  init: () => Promise<void>
  destroy: () => Promise<void>
}

const engines = new Map<string, Promise<SearchEngine>>()
let importAttempt = 0

async function loadFallbackSearch(indexUrl: string): Promise<SearchEngine> {
  const response = await fetch(indexUrl)
  if (!response.ok)
    throw new Error(`搜索索引加载失败: ${response.status}`)
  const items = await response.json() as SearchResult[]
  const indexed = items.map(item => ({
    item,
    text: `${item.meta.title} ${item.excerpt} ${item.searchText ?? ''}`.toLocaleLowerCase(),
  }))

  return {
    search: async (query) => {
      const normalizedQuery = query.toLocaleLowerCase()
      return {
        results: indexed.filter(({ text }) => text.includes(normalizedQuery))
          .map(({ item }) => ({ data: async () => item })),
      }
    },
  }
}

async function loadPagefindEngine(locale: string): Promise<SearchEngine> {
  // Failed dynamic imports are cached by the browser; a new attempt must use a new URL.
  const url = new URL('/pagefind/pagefind.js', window.location.origin)
  url.searchParams.set('attempt', String(importAttempt++))
  const module = await import(/* @vite-ignore */ url.href) as {
    createInstance: () => PagefindInstance
  }
  // Pagefind 1.5 detects the DOM language when creating an instance.
  // Navigation may have changed it while the module was downloading.
  if (document.documentElement.lang !== locale)
    throw new Error('搜索语言已切换')
  const instance = module.createInstance()
  try {
    await instance.init()
    return instance
  }
  catch (error) {
    await instance.destroy()
    throw error
  }
}

export function loadSearchEngine(indexUrl: string, locale: string) {
  const key = `${locale}:${indexUrl}`
  let pending = engines.get(key)
  if (!pending) {
    pending = loadPagefindEngine(locale)
      .catch(() => loadFallbackSearch(indexUrl))
      .catch((error) => {
        engines.delete(key)
        throw error
      })
    engines.set(key, pending)
  }
  return pending
}
