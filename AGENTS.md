# AGENTS.md

Use `pnpm`, not `npm`.

This repository provides a `docker-compose.yml` that lets you develop and run tests without installing Meilisearch or Node.js locally.

## Commmands

Run the commands inside Docker using `docker compose run --rm package bash -c "<command>"`.

- `pnpm test` - run tests
- `pnpm test path/to/file.test.ts` - run specific test files
- `pnpm style:fix` - lint and format the code

## Workflow

- Lint and format code after finishing a task

## Tests

Name the test file after the implementation.

- A source module keeps its file name: `src/utils.ts` is tested in `tests/utils.test.ts`.
- `Index` (`src/indexes.ts`) and `Meilisearch` (`src/meilisearch.ts`) are split by the `/// SECTION ///` banners in those files. The test file is that section: `/// DOCUMENTS ///` is `tests/documents.test.ts`, `/// KEYS ///` is `tests/keys.test.ts`.

Group cases with nested `describe` blocks that follow the implementation. The outer block is the class or module (`index`). The inner block is the method (`searchGet`). The `test` title is the case.

## Cursor Cloud specific instructions

`pnpm lint` loads `oxlint.config.ts`. That works on Node.js 22.22 (the version in `~/.nvm`). The image also exposes Node.js 22.14 earlier on `PATH`, and that build cannot load the TypeScript config. The environment links Node.js 22.22 and pnpm 10.32.1 into `/usr/local/cargo/bin`, which is ahead of the older Node binary.

Meilisearch Enterprise 1.54.3 (the `getmeili/meilisearch-enterprise:v1.54` image in `docker-compose.yml`) listens on `http://127.0.0.1:7700` after boot. The master key is `masterKey`, analytics are off, and `MEILI_EXPERIMENTAL_ALLOWED_IP_NETWORKS=any`. `pnpm test` uses this host unless `MEILISEARCH_URL` is set.

Run `pnpm test`, `pnpm style`, `pnpm types`, and `pnpm build` in the workspace. Non-interactive installs set `HUSKY=0` so the `prepare` script skips git hooks. On a laptop, `docker compose` is the setup described above.
