import type { APIContext } from 'astro'
import { getBlogPostStaticPaths } from '../../utils/data-utils'
import { createPostMarkdownResponse } from '../../utils/post-markdown'

export const prerender = true

export function getStaticPaths() {
  return getBlogPostStaticPaths('zh-CN')
}

export function GET({ props, site }: APIContext) {
  return createPostMarkdownResponse(props.post, props.translation, site)
}
