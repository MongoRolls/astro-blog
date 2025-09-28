export function slugify(input?: string) {
  if (!input)
    return ''

  // 处理输入字符串
  let slug = input.trim()

  // 检查是否包含中文字符
  if (/[\u4E00-\u9FA5]/.test(slug)) {
    // 如果包含中文，使用 encodeURIComponent 编码
    slug = encodeURIComponent(slug)
      .toLowerCase()
  }
  else {
    // 如果不包含中文，使用常规的 slug 处理
    slug = slug
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '-')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }

  // 移除首尾的连字符
  slug = slug.replace(/^-+|-+$/g, '')

  // // console.log('slug', slug);
  return slug
}
