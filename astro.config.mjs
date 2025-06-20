import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import { visualizer } from 'rollup-plugin-visualizer';
import siteConfig from './src/data/site-config';
import { remarkReadingTime } from './src/utils/remark-reading-time.mjs';
// https://astro.build/config

// 实现https://github.com/orgs/community/discussions/16925
const raConfig = {
    classNameMaps: {
        block: (title) => 'admonition ' + title.toLowerCase(),
        title: 'admonition-title'
    },
    titleFilter: (title) => {
        return title.match(/\[![^\]]+\]/g);
    }
};

export default defineConfig({
    site: siteConfig.website,
    integrations: [
        mdx({
            // @ts-ignore next line
            remarkPlugins: [remarkReadingTime]
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
