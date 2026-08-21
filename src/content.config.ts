import { glob } from 'astro/loaders'

import { z } from 'astro/zod'
import { defineCollection } from 'astro:content'

const localeSchema = z.enum(['zh-CN', 'en'])

const seoSchema = z.object({
  title: z.string().min(5).max(120).optional(),
  description: z.string().min(5).max(160).optional(),
  image: z
    .object({
      src: z.string(),
      alt: z.string().optional(),
    })
    .optional(),
  pageType: z.enum(['website', 'article']).default('website'),
})

// 博客 Collection
const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    excerpt: z.string().optional(),
    description: z.string().optional(),
    publishDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default('MongoRolls'),
    image: z.string().optional(),
    slug: z.string().optional(),
    route: z.string().optional(),
    draft: z.boolean().default(false),
    isFeatured: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
    keywords: z.array(z.string()).optional(),
    lang: localeSchema.default('zh-CN'),
    translationKey: z.string().optional(),
    seo: seoSchema.optional(),
  }),
})

const pages = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    draft: z.boolean().default(false),
    lang: localeSchema.default('zh-CN'),
    slug: z.string().optional(),
    route: z.string().optional(),
    translationKey: z.string().optional(),
    seo: seoSchema.optional(),
  }),
})

export const collections = { blog, pages }
