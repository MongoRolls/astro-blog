import type { ImageSource } from './env'
import { existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { imageSource } from './env'

const OSS_HOST = 'https://mongorolls-images.oss-cn-shenzhen.aliyuncs.com'
const OSS_PREFIX = 'blog'

export const COVER_WIDTH = 1200
export const COVER_HEIGHT = 630

export function ossAsset(...segments: string[]) {
  const objectPath = [OSS_PREFIX, ...segments]
    .flatMap(segment => segment.split('/'))
    .map(segment => segment.replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/')
  return `${OSS_HOST}/${objectPath}`
}

const LOCAL_DEFAULT_OG_IMAGE = '/cover-images/og-default.webp'
const OSS_DEFAULT_OG_IMAGE = ossAsset('cover-images/og-default.webp')
const OSS_HERO_IMAGE = ossAsset('site/blog-cover.webp')
const EXTERNAL_OR_ROOT_RE = /^(?:https?:\/\/|\/)/

export interface CoverCredit {
  author: string
  url?: string
}

export interface ResolvedCoverImage {
  src: string
  alt: string
  credit?: CoverCredit
}

interface CoverFields {
  image?: string
  seo?: {
    image?: {
      src: string
      alt?: string
      credit?: CoverCredit
    }
  }
}

function resolveSource(options?: { source?: ImageSource }) {
  return options?.source ?? imageSource
}

function normalizeRelativeOssKey(rawSrc: string) {
  return rawSrc
    .split('/')
    .map(segment => segment.replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/')
}

export function resolveBlogImageSrc(rawSrc?: string, options?: { source?: ImageSource }) {
  const trimmed = rawSrc?.trim()
  if (!trimmed)
    return undefined
  if (EXTERNAL_OR_ROOT_RE.test(trimmed))
    return trimmed

  const normalizedKey = normalizeRelativeOssKey(trimmed)
  if (!normalizedKey)
    return undefined

  if (resolveSource(options) === 'local') {
    const stagedLocalPath = path.join(process.cwd(), 'public', OSS_PREFIX, normalizedKey)
    if (existsSync(stagedLocalPath))
      return `/${OSS_PREFIX}/${normalizedKey}`
  }

  return ossAsset(normalizedKey)
}

export function getDefaultOgImageSrc(options?: { source?: ImageSource }) {
  return resolveSource(options) === 'local' ? LOCAL_DEFAULT_OG_IMAGE : OSS_DEFAULT_OG_IMAGE
}

export function getPostCoverSrc(data: CoverFields, options?: { source?: ImageSource }) {
  const raw = data.seo?.image?.src?.trim() || data.image?.trim()
  return resolveBlogImageSrc(raw, options)
}

export function getPostCoverImage(
  data: CoverFields,
  fallbackAlt: string,
  options?: { source?: ImageSource },
): ResolvedCoverImage | undefined {
  const src = getPostCoverSrc(data, options)
  if (!src)
    return undefined
  return {
    src,
    alt: data.seo?.image?.alt?.trim() || fallbackAlt,
    credit: data.seo?.image?.credit,
  }
}

export function getPostOgImage(
  data: CoverFields,
  fallbackAlt: string,
  options?: { source?: ImageSource },
): { src: string, alt: string } {
  const cover = getPostCoverImage(data, fallbackAlt, options)
  if (cover)
    return { src: cover.src, alt: cover.alt }
  return {
    src: getDefaultOgImageSrc(options),
    alt: fallbackAlt,
  }
}

export function getHeroImageSrc(localSrc: string, options?: { source?: ImageSource }) {
  return resolveSource(options) === 'local' ? localSrc : OSS_HERO_IMAGE
}
