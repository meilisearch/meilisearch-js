const config = {
  rootDir: '.',
  coverageThreshold: {
    global: {
      'ts-jest': {
        tsConfig: '<rootDir>/config/tsconfig.json',
      },
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  setupFiles: [],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
  projects: [
    {
      preset: 'ts-jest',
      displayName: 'dom',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/tests/**/*.ts?(x)'],
      testPathIgnorePatterns: ['meilisearch-test-utils'],
    },
    {
      preset: 'ts-jest',
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/**/*.ts?(x)'],
      testPathIgnorePatterns: ['meilisearch-test-utils'],
    },
  ],
}

module.exports = config
