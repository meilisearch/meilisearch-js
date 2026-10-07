# AGENTS.md

Use `pnpm`, not `npm`.

This repository provides a `docker-compose.yml` that lets you develop and run tests without installing Meilisearch or Node.js locally. The `package` service keeps `node_modules` in a Docker volume, so a host install is not used inside the container. Run `pnpm install` in the container when that volume is empty or `pnpm-lock.yaml` changes.

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
