import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.ts', 'bin/cli.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  target: 'es2022',
  platform: 'neutral',
  outDir: 'dist'
})
