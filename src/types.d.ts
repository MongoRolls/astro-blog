// 为URL导入添加类型声明
declare module '@fontsource-variable/inter/files/inter-latin-wght-normal.woff2?url' {
  const url: string;
  export default url;
}

declare module '@fontsource-variable/newsreader/files/newsreader-latin-wght-normal.woff2?url' {
  const url: string;
  export default url;
}

// Astro内置模块类型声明
declare module 'astro:assets' {
  interface ImageAttributes {
    src: string | ImageMetadata;
    width?: number;
    height?: number;
    alt?: string;
    format?: string;
    [key: string]: any;
  }
  
  interface ImageMetadata {
    src: string;
    width: number;
    height: number;
    format: string;
  }
  
  export function getImage(options: any): Promise<any>;
  export function Image(props: ImageAttributes): any;
}

// Astro视图过渡模块类型声明
declare module 'astro:transitions' {
  export const ClientRouter: any;
  export const ViewTransitions: any;
} 