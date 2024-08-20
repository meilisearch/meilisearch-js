const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    include: ['tests/*.test.ts'],
    fileParallelism: false,
    testTimeout: 100_000, // 100 seconds
  },
});
