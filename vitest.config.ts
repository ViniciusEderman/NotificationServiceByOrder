import tsConfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tsConfigPaths()],
  test: {
    globals: true,
    clearMocks: true,
    testTimeout: 15000,
    coverage: {
      provider: 'istanbul',
      include: ["src/domain/application/use-cases/**"]
    },
  },
});
