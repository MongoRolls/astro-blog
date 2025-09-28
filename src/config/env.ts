/**
 * 环境配置管理
 * 提供统一的环境检测和配置管理
 */

export type Environment = 'development' | 'production'
export type ImageSource = 'local' | 'oss'

export interface EnvironmentConfig {
  env: Environment
  isDev: boolean
  isProd: boolean
  imageSource: ImageSource
}

/**
 * 获取当前环境配置
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  // 检测优先级：
  // 1. 环境变量 ASTRO_IMAGE_SOURCE
  // 2. Astro内置环境标识
  // 3. 默认fallback

  const customImageSource = import.meta.env.ASTRO_IMAGE_SOURCE as ImageSource
  const isDev = import.meta.env.DEV
  const isProd = import.meta.env.PROD

  // 确定环境
  const env: Environment = isDev ? 'development' : 'production'

  // 确定图片源
  let imageSource: ImageSource
  if (customImageSource && (customImageSource === 'local' || customImageSource === 'oss')) {
    imageSource = customImageSource
  }
  else {
    // 默认：开发环境使用本地，生产环境使用OSS
    imageSource = isDev ? 'local' : 'oss'
  }

  return {
    env,
    isDev,
    isProd,
    imageSource,
  }
}

/**
 * 全局环境配置实例
 */
export const envConfig = getEnvironmentConfig()
