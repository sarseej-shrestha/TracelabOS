import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: ['tests/{unit,integration,security}/**/*.test.ts'],
    testTimeout: 15000,
  },
});
