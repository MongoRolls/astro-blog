// src/utils/remark-replace-links.js

import { visit } from 'unist-util-visit'

export function remarkReplaceLinks() {
  return function (tree) {
    visit(tree, 'link', (node, index, parent) => {
      // 获取链接的 URL 和子节点
      const href = node.url
      const children = node.children

      if (href && index !== null && parent) {
        // 从子节点中提取文本内容
        let textContent = ''
        if (children && children.length > 0) {
          textContent = children
            .map((child) => {
              if (child.type === 'text') {
                return child.value
              }
              else if (child.type === 'inlineCode') {
                return child.value
              }
              return ''
            })
            .join('')
        }

        // 创建新的 MDX JSX 元素节点
        const attributes = [
          {
            type: 'mdxJsxAttribute',
            name: 'href',
            value: href,
          },
        ]

        // 如果提取到了文本内容，添加 children 属性
        if (textContent) {
          attributes.push({
            type: 'mdxJsxAttribute',
            name: 'children',
            value: textContent,
          })
        }

        const newNode = {
          type: 'mdxJsxTextElement',
          name: 'Link',
          attributes,
          children: [], // 由于我们通过 children 属性传递文本，这里可以为空
        }

        // 替换父节点中的当前节点
        parent.children[index] = newNode
      }
    })

    return tree
  }
}
