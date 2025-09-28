import fs from 'node:fs'
import https from 'node:https'
import path from 'node:path'
import { imageConfig } from '../config/image'
import { getCoverImagePath as getImagePath } from './imagePath'

// 获取Unsplash API配置
const UNSPLASH_API_CONFIG = imageConfig.unsplash

// 确保封面图片目录存在
function ensureCoverImageDirExists() {
  if (!fs.existsSync(UNSPLASH_API_CONFIG.coverImageFolder)) {
    fs.mkdirSync(UNSPLASH_API_CONFIG.coverImageFolder, { recursive: true })
  }
}

// 检查封面图片是否已存在
export function coverImageExists(postId: string): boolean {
  return fs.existsSync(path.join(UNSPLASH_API_CONFIG.coverImageFolder, `${postId}.jpg`))
}

// 获取封面图片的URL路径
export function getCoverImagePath(postId: string): string {
  return getImagePath(postId)
}

// 获取Unsplash图片并保存
export async function fetchAndSaveCoverImage(postId: string, query = 'nature landscape'): Promise<string> {
  ensureCoverImageDirExists()

  // 如果图片已存在，直接返回路径
  if (coverImageExists(postId)) {
    return getCoverImagePath(postId)
  }

  try {
    // 生成随机页码 (1-10)
    const randomPage = Math.floor(Math.random() * 10) + 1

    // 构建API请求URL，添加随机页码和排序方式
    const sortOptions = ['relevant', 'latest']
    const randomSort = sortOptions[Math.floor(Math.random() * sortOptions.length)]

    const url = `${UNSPLASH_API_CONFIG.searchEndpoint}?query=${encodeURIComponent(query)}&per_page=${UNSPLASH_API_CONFIG.perPage}&page=${randomPage}&order_by=${randomSort}&orientation=landscape`

    // 发送API请求
    const response = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${UNSPLASH_API_CONFIG.accessKey}`,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status}`)
    }

    const data = await response.json()

    if (!data.results || data.results.length === 0) {
      throw new Error('未找到图片')
    }

    // 随机选择一张图片
    const randomIndex = Math.floor(Math.random() * data.results.length)
    const rawImageUrl = data.results[randomIndex].urls.raw

    // 构建带尺寸和裁剪参数的URL
    const imageUrl = `${rawImageUrl}&w=${UNSPLASH_API_CONFIG.imageWidth}&h=${UNSPLASH_API_CONFIG.imageHeight}&fit=crop&crop=${UNSPLASH_API_CONFIG.cropMode}`

    // 下载并保存图片
    await downloadImage(imageUrl, `${postId}.jpg`)

    return getCoverImagePath(postId)
  }
  catch (error) {
    console.error('获取Unsplash图片时出错:', error)
    return '' // 出错时返回空字符串
  }
}

// 下载图片函数
function downloadImage(url: string, filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const filePath = path.join(UNSPLASH_API_CONFIG.coverImageFolder, filename)
    const fileStream = fs.createWriteStream(filePath)

    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`下载失败，HTTP状态码: ${response.statusCode}`))
        return
      }

      response.pipe(fileStream)

      fileStream.on('finish', () => {
        fileStream.close()
        resolve()
      })
    }).on('error', (error) => {
      reject(error)
    })

    fileStream.on('error', (error) => {
      reject(error)
    })
  })
}
