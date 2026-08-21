import { buildSearchIndex } from '../../utils/search-index'

export async function GET() {
  const index = await buildSearchIndex('en')

  return Response.json(index, {
    headers: {
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
