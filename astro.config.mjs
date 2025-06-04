import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import { visualizer } from 'rollup-plugin-visualizer';
import siteConfig from './src/data/site-config';
// https://astro.build/config
export default defineConfig({
    site: siteConfig.website,
    integrations: [
        mdx(),
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
