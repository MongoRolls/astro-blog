import { createRss } from '../utils/rss.ts'

export async function GET(context) {
  return createRss('zh-CN', context)
}
