export type ImageSource = 'local' | 'oss'

const configuredImageSource = import.meta.env.ASTRO_IMAGE_SOURCE

export const imageSource: ImageSource = configuredImageSource === 'local' || configuredImageSource === 'oss'
  ? configuredImageSource
  : import.meta.env.DEV ? 'local' : 'oss'
