process.env.HOST = 'http://127.0.0.1:7700'
process.env.MASTER_KEY = '123'
process.env.PRIVATE_KEY =
  '8c222193c4dff5a19689d637416820bc623375f2ad4c31a2e3a76e8f4c70440d'
process.env.PUBLIC_KEY =
  '948413b6667024a0704c2023916c21eaf0a13485a586c43e4d2df520852a4fb8'

const config = {
  preset: 'ts-jest',
  rootDir: '..',
  testMatch: ['<rootDir>/tests/**/*.ts?(x)'],
  testPathIgnorePatterns: ['dist', 'utils', 'setup-keys', 'context-helper'],
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
  testEnvironment: 'node',
}

module.exports = config
