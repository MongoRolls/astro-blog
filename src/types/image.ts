/**
 * 图片相关类型定义
 */

import type { Environment, ImageSource } from '../config/env'

export type { Environment, ImageSource }

/**
 * 图片对象类型
 */
export interface Image {
  src: string
  alt?: string
  caption?: string
}

/**
 * 图片路径获取选项
 */
export interface ImagePathOptions {
  source?: ImageSource
  fallback?: string
}

/**
 * 封面图片信息
 */
export interface CoverImage {
  postId: string
  fileName: string
  localPath: string
  ossPath: string
  exists: boolean
}

/**
 * 图片处理结果
 */
export interface ImageProcessResult {
  success: boolean
  path: string
  error?: string
}
