/**
 * 图片配置管理
 * 环境感知的图片配置系统
 */

import type { ImageSource } from './env'
import { envConfig } from './env'

export interface ImageConfig {
  // OSS配置
  ossBaseUrl: string
  ossCoverPath: string

  // 本地配置
  localCoverPath: string
  localPublicPath: string

  // Unsplash配置
  unsplash: {
    accessKey: string
    searchEndpoint: string
    perPage: number
    coverImageFolder: string
    imageWidth: number
    imageHeight: number
    cropMode: string
    query: string
  }
}

/**
 * 图片配置常量
 */
export const imageConfig: ImageConfig = {
  // OSS配置
  ossBaseUrl: 'https://mongorolls-images.oss-cn-shenzhen.aliyuncs.com',
  ossCoverPath: '/img',

  // 本地配置
  localCoverPath: '/cover-images',
  localPublicPath: '/public',

  // Unsplash配置（从现有配置迁移）
  unsplash: {
    accessKey: 'jVPuYBnhE6EPu3velt7izC6cwJgO2Ttk_0VvwRAr0ms',
    searchEndpoint: 'https://api.unsplash.com/search/photos',
    perPage: 30,
    coverImageFolder: 'public/cover-images',
    imageWidth: 1200,
    imageHeight: 630,
    cropMode: 'entropy',
    query: 'nature landscape',
  },
}

/**
 * 根据环境获取图片基础URL
 */
export function getImageBaseUrl(source?: ImageSource): string {
  const actualSource = source || envConfig.imageSource

  switch (actualSource) {
    case 'local':
      return '' // 本地路径不需要基础URL
    case 'oss':
      return imageConfig.ossBaseUrl
    default:
      return ''
  }
}

/**
 * 根据环境获取封面图片路径前缀
 */
export function getCoverPathPrefix(source?: ImageSource): string {
  const actualSource = source || envConfig.imageSource

  switch (actualSource) {
    case 'local':
      return imageConfig.localCoverPath
    case 'oss':
      return imageConfig.ossCoverPath
    default:
      return imageConfig.localCoverPath
  }
}
