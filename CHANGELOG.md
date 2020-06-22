## V0.12.00
- Feat: Make IndexInterface generic. createIndex and getIndex generic support #442
- Split bundles into umd and cjs.
  - use bundle in package.json `browser` for `umd`
  - use bundle in package.json `main` for `cjs`

## V0.11.1 (released)

- BREAKING: Usage of createIndex changed `createIndex(uid: string, options: IndexOptions): Index` #436
- BREAKING: Changes in types
  - `MeiliSearchApiErrorInterface` changes
  - Removed `UpdateIndexRequest` and replaced it with `IndexOptions`
- Error Handler improved by adding a new MeiliSearchCommunicationError #436
- Refactor Error handler #436
- Add getOrCreateIndex method to meilisearch client #436
- Faceting (#421)
- Improve tests with v11 (#422)
- Improve code examples (#434)
- Update dependencies

## V0.10.1 (released)

- Fix bug where you could not import the CJS package from a ES6 node environment. #410

## V0.10 (released)

- Build is done 100% with rollup, tsc has been removed #318. Rollup has been updated #283
- Moved tests to own folder at root #283
- Error handled created with two new custom errors: `MeiliSearchApiError` `MeiliSearchTimeoutError` #283 & #311 & #318
- Removed linting with TSLINT and replaced with eslint #283
- Improved tests #299 #301 #302
- Created WaitForPendingUpdate function #311
- Made module compatible with MeiliSearch v0.10 #312
- Changed prototypes in README #314
- `Class Indexes` has been renamed to `Class Index` #315
- createIndex now returns an instance of the Index class #315 (BREAKING)
- Main file renamed from index.ts to meilisearch.ts #315
- Replaced all sleeps in test with waitForPendingUpdate #316
- Improved types and exportation of types #318 #283
