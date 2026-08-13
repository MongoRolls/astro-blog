import type { ImageSource } from './env'
import { imageSource } from './env'

export const OSS_HOST = 'https://mongorolls-images.oss-cn-shenzhen.aliyuncs.com'
export const OSS_PREFIX = 'blog'

export function ossAsset(...segments: string[]) {
  const objectPath = [OSS_PREFIX, ...segments]
    .flatMap(segment => segment.split('/'))
    .map(segment => segment.replace(/^\/+|\/+$/g, ''))
    .filter(Boolean)
    .join('/')
  return `${OSS_HOST}/${objectPath}`
}

const LOCAL_COVER_IMAGE = '/cover-images/image.png'
const OSS_COVER_IMAGE = ossAsset('cover-images/imageplaceholder.png')
const OSS_HERO_IMAGE = ossAsset('site/blog-cover.webp')

interface CoverFields {
  image?: string
  seo?: { image?: { src: string } }
}

function resolveSource(options?: { source?: ImageSource }) {
  return options?.source ?? imageSource
}

export function buildCoverPath(options?: { source?: ImageSource }) {
  return resolveSource(options) === 'local' ? LOCAL_COVER_IMAGE : OSS_COVER_IMAGE
}

export function getPostCoverSrc(data: CoverFields, options?: { source?: ImageSource }) {
  return data.seo?.image?.src ?? data.image ?? buildCoverPath(options)
}

export function getHeroImageSrc(localSrc: string, options?: { source?: ImageSource }) {
  return resolveSource(options) === 'local' ? localSrc : OSS_HERO_IMAGE
}
