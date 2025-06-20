import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import { visualizer } from 'rollup-plugin-visualizer';
import siteConfig from './src/data/site-config';
import { remarkReadingTime } from './src/utils/remark-reading-time.mjs';
// 实现https://github.com/orgs/community/discussions/16925
import { remarkAlert } from 'remark-github-blockquote-alert';
// https://astro.build/config

export default defineConfig({
    site: siteConfig.website,
    integrations: [
        mdx({
            remarkPlugins: [remarkReadingTime, remarkAlert]
        }),
        sitemap(),
        tailwind({
            applyBaseStyles: false
        })
    ],
    vite: {
        plugins: [
            visualizer({
                emitFile: true,
                filename: 'stats.html'
            })
        ]
    }
});
