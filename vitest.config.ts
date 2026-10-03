import { defineConfig } from 'vitest/config';
// Unit tests run with the demo mode as the build default; tests pick a mode explicitly where it matters.
export default defineConfig({
  define: { __BUSINESS_MODE__: JSON.stringify('demo') },
  test: { include: ['tests/unit/**/*.test.ts'], environment: 'node' },
});
