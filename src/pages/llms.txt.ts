import type { APIContext } from 'astro'
import { createLlmsResponse } from '../utils/llms-index'

export const prerender = true

export async function GET({ site }: APIContext) {
  return createLlmsResponse('zh-CN', site)
}
