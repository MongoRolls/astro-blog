// src/utils/remark-replace-links.js

import { visit } from 'unist-util-visit'

export function remarkReplaceLinks() {
  return function (tree) {
    visit(tree, 'link', (node, index, parent) => {
      const href = node.url
      const children = node.children

      if (href && index !== null && parent) {
        const attributes = [
          {
            type: 'mdxJsxAttribute',
            name: 'href',
            value: href,
          },
        ]

        const newNode = {
          type: 'mdxJsxTextElement',
          name: 'Link',
          attributes,
          children,
        }
        parent.children[index] = newNode
      }
    })

    return tree
  }
}
