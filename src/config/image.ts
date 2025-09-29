/**
 * 图片配置管理
 * 环境感知的图片配置系统
 */

import type { ImageSource } from './env'
import { envConfig } from './env'

// OSS配置
const OSS_BASE_URL = 'https://mongorolls-images.oss-cn-shenzhen.aliyuncs.com'
const OSS_COVER_PATH = '/img'

// 本地配置
const LOCAL_COVER_PATH = '/cover-images'
const LOCAL_PUBLIC_PATH = '/public'

export function getImageBaseUrl(source?: ImageSource): string {
  const actualSource = source || envConfig.imageSource

  switch (actualSource) {
    case 'local':
      return ''
    case 'oss':
      return OSS_BASE_URL
    default:
      return ''
  }
}

export function getCoverPathPrefix(source?: ImageSource): string {
  const actualSource = source || envConfig.imageSource

  switch (actualSource) {
    case 'local':
      return LOCAL_COVER_PATH
    case 'oss':
      return OSS_COVER_PATH
    default:
      return LOCAL_COVER_PATH
  }
}

export function getLocalPublicPath(): string {
  return LOCAL_PUBLIC_PATH
}
