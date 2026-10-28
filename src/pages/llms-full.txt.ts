import type { APIContext } from 'astro'
import { createLlmsFullResponse } from '../utils/llms-index'

export const prerender = true

export async function GET({ site }: APIContext) {
  return createLlmsFullResponse('zh-CN', site)
}
