const config = {
  preset: 'ts-jest',
  rootDir: '..',
  testMatch: ['<rootDir>/tests/**/*.ts?(x)'],
  testPathIgnorePatterns: ['dist'],
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
  setupFiles: ['<rootDir>/config/setup-tests.js'],
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
  ],
  testEnvironment: 'node',
}

module.exports = config
