import mdx from '@astrojs/mdx'
import sitemap from '@astrojs/sitemap'
import tailwind from '@astrojs/tailwind'
import { defineConfig } from 'astro/config'
// 实现https://github.com/orgs/community/discussions/16925
import { remarkAlert } from 'remark-github-blockquote-alert'
import { visualizer } from 'rollup-plugin-visualizer'
import siteConfig from './src/data/site-config'
import { remarkReadingTime } from './src/utils/remark-reading-time.mjs'
import { remarkReplaceLinks } from './src/utils/remark-replace-links.js'
// https://astro.build/config

export default defineConfig({
  site: siteConfig.website,
  integrations: [
    mdx({
      remarkPlugins: [remarkReadingTime, remarkAlert,remarkReplaceLinks],
    }),
    sitemap(),
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  vite: {
    plugins: [
      visualizer({
        emitFile: true,
        filename: 'stats.html',
      }),
    ],
  },
})
