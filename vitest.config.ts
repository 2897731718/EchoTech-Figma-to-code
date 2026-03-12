import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    name: 'figma-to-code',
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'tests/**']
    }
  }
})
