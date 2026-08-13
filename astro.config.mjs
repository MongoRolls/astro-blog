import process from 'node:process'
import { unified } from '@astrojs/markdown-remark'
import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'
// 实现https://github.com/orgs/community/discussions/16925
import { remarkAlert } from 'remark-github-blockquote-alert'
import { visualizer } from 'rollup-plugin-visualizer'
import { pagefindDevPlugin } from './scripts/pagefind-dev-plugin.mjs'
import siteConfig from './src/data/site-config'
import { remarkReadingTime } from './src/utils/remark-reading-time.mjs'
import { remarkReplaceLinks } from './src/utils/remark-replace-links.js'

const shouldAnalyzeBundle = process.env.ANALYZE === 'true'
const redirects = {
  '/blog/24-11-17-cursor': '/blog/24-01-17-cursor',
  '/blog/prompt': '/blog/25-12-22-prompt',
  '/blog/share': '/blog/26-01-30-share',
  '/blog/正则笔记': '/blog/regexp',
  '/blog/认知觉醒': '/blog/cognition',
}

function normalizePathname(url) {
  const { pathname } = new URL(url)
  return decodeURIComponent(pathname.replace(/\/+$/, '') || '/')
}

const redirectPaths = new Set(Object.keys(redirects))

export default defineConfig({
  site: siteConfig.website,
  redirects,
  markdown: {
    processor: unified({
      remarkPlugins: [remarkReadingTime, remarkAlert, remarkReplaceLinks],
    }),
  },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => {
        const pathname = normalizePathname(page)
        if (redirectPaths.has(pathname))
          return false
        if (pathname.endsWith('/search-index.json') || pathname === '/search-index.json')
          return false
        return true
      },
      serialize(item) {
        const pathname = normalizePathname(item.url)
        if (pathname === '/')
          return { ...item, changefreq: 'weekly', priority: 1 }
        if (pathname === '/blog' || pathname === '/post' || pathname === '/tags' || pathname === '/about')
          return { ...item, changefreq: 'weekly', priority: 0.8 }
        if (pathname.startsWith('/blog/'))
          return { ...item, changefreq: 'monthly', priority: 0.7 }
        return { ...item, changefreq: 'monthly', priority: 0.5 }
      },
    }),
  ],
  vite: {
    esbuild: {
      target: 'esnext',
    },
    plugins: [
      pagefindDevPlugin(),
      tailwindcss(),
      ...(shouldAnalyzeBundle
        ? [visualizer({
            emitFile: true,
            filename: 'stats.html',
          })]
        : []),
    ],
  },
})
