import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Vite 7 resolves tsconfig paths natively; no plugin needed.
  resolve: { tsconfigPaths: true },
  test: {
    environment: 'node',
    include: ['lib/**/*.test.ts'],
  },
})
