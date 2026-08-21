import { buildSearchIndex } from '../utils/search-index'

export async function GET() {
  const index = await buildSearchIndex('zh-CN')

  return Response.json(index, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
