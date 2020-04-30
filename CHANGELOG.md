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
