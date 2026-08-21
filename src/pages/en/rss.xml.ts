import type { APIContext } from 'astro'
import { createRss } from '../../utils/rss'

export function GET(context: APIContext) {
  return createRss('en', context)
}
