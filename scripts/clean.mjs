import { rm } from 'node:fs/promises'

const generatedDirectories = ['.astro', 'dist', 'node_modules/.astro']

await Promise.all(
  generatedDirectories.map(directory => rm(directory, { force: true, recursive: true })),
)

console.log(`Removed generated directories: ${generatedDirectories.join(', ')}`)
