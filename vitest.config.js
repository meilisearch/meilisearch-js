const { defineConfig } = require("vitest/config");

module.exports = defineConfig({
  test: {
    include: "tests/**/*.test.ts",
    exclude: "tests/env/**",
    fileParallelism: false,
    testTimeout: 100_000, // 100 seconds
    coverage: { include: "src/**/*.ts" },
  },
});
