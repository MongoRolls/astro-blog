/**
 * =========================================
 *  Link组件相关类型定义
 * =========================================
 */
/**
 * Link组件Props接口
 */
export interface LinkProps {
  /** 链接地址 */
  href: string
  /** 是否在新标签页打开 */
  external?: boolean
  /** 是否显示网站图标 */
  showIcon?: boolean
  /** 链接文本 */
  children?: string
}
