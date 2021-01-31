const config = {
  rootDir: '.',
  testMatch: ['<rootDir>/tests/**/*.ts?(x)'],
  testPathIgnorePatterns: ['meilisearch-test-utils', 'env'],
  coverageThreshold: {
    global: {
      'ts-jest': {
        tsConfig: '<rootDir>/tsconfig.json',
      },
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
      // We are using jest-environment-jsdom 25 until we stop supporting node 10
      // jest-environment-jsdom 25 uses jsdom 15 which still supports node 10
      testEnvironment: 'jest-environment-jsdom',
      testMatch: ['<rootDir>/tests/**/*.ts?(x)'],
      testPathIgnorePatterns: ['meilisearch-test-utils', 'env/'],
    },
    {
      preset: 'ts-jest',
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: ['<rootDir>/tests/**/*.ts?(x)'],
      testPathIgnorePatterns: ['meilisearch-test-utils', 'env/'],
    },
  ],
}

module.exports = config
