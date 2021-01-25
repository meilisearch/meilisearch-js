const config = {
  rootDir: '.',
  testMatch: ['<rootDir>/tests/**/*.ts?(x)'],
  testPathIgnorePatterns: ['meilisearch-test-utils', 'env'],
  coverageThreshold: {
    global: {
      'ts-jest': {
        tsConfig: '<rootDir>/tsconfig.json',
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
      // TODO: Change this value back to jsdom once once `globalThis` issue is resolved
      // Also uninstall jest-environment-jsdom-sixteen
      // https://github.com/jsdom/jsdom/issues/2961
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
