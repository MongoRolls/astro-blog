export const locales = ['zh-CN', 'en'] as const

export type Locale = typeof locales[number]

export const defaultLocale: Locale = 'zh-CN'

export const localeInfo = {
  'zh-CN': {
    htmlLang: 'zh-CN',
    ogLocale: 'zh_CN',
    shortLabel: '中',
  },
  'en': {
    htmlLang: 'en',
    ogLocale: 'en_US',
    shortLabel: 'EN',
  },
} as const satisfies Record<Locale, {
  htmlLang: string
  ogLocale: string
  shortLabel: string
}>

export function getLocaleFromPath(pathname: string): Locale {
  return pathname === '/en' || pathname.startsWith('/en/') ? 'en' : defaultLocale
}

export function stripLocalePrefix(pathname: string) {
  const stripped = pathname.replace(/^\/en(?=\/|$)/, '')
  return stripped || '/'
}

export function localizedPath(locale: Locale, pathname = '/') {
  const normalized = `/${pathname}`.replace(/\/{2,}/g, '/')
  const withoutLocale = stripLocalePrefix(normalized)
  if (locale === defaultLocale)
    return withoutLocale
  return withoutLocale === '/' ? '/en/' : `/en${withoutLocale}`
}

export function alternateLocale(locale: Locale): Locale {
  return locale === defaultLocale ? 'en' : defaultLocale
}

export function getDefaultAlternates(pathname: string) {
  const path = stripLocalePrefix(pathname)
  return {
    'zh-CN': localizedPath('zh-CN', path),
    'en': localizedPath('en', path),
  } satisfies Record<Locale, string>
}
