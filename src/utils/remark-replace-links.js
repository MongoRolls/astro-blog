import { visit } from 'unist-util-visit'

export function remarkReplaceLinks() {
  return function (tree, file) {
    const hrefs = new Set()
    // 普通 Markdown 文章保留原生链接节点，MDX 继续使用 Link 组件。
    const plainBlogPost = /[/\\]content[/\\]blog[/\\].*\.md$/.test(file.path ?? '')
    visit(tree, (node, index, parent) => {
      if (node.type === 'link' || node.type === 'definition')
        hrefs.add(node.url)
      if (node.name === 'a' || node.name === 'Link') {
        const href = node.attributes?.find(attribute => attribute.name === 'href')?.value
        if (typeof href === 'string')
          hrefs.add(href)
      }

      if (node.type !== 'link' || !node.url || plainBlogPost || !parent || index == null)
        return
      const attributes = [{ type: 'mdxJsxAttribute', name: 'href', value: node.url }]
      if (node.title)
        attributes.push({ type: 'mdxJsxAttribute', name: 'title', value: node.title })
      parent.children[index] = { type: 'mdxJsxTextElement', name: 'Link', attributes, children: node.children }
    })

    file.data.astro.frontmatter.articleLinkHrefs = [...hrefs]
  }
}
