import { env, loadEnvFile } from "node:process";
import { Meilisearch } from "#src/index";
import type { TestProject } from "vitest/node";

loadEnvFile(new URL("../../.conf", import.meta.url));

const POLL_INTERVAL = 250;
const TIMEOUT = 6_000;
const TIMEOUT_ID = Symbol();

const host = `http://127.0.0.1:${env.PORT}`;

const client = new Meilisearch({ host, apiKey: env.MASTER_KEY });

/** Poll Meilisearch until its reachable. */
async function waitForMeiliSearch() {
  let lastError;

  const ac = new AbortController();

  const toId = setTimeout(() => void ac.abort(TIMEOUT_ID), TIMEOUT);

  for (;;) {
    try {
      await client.health({ signal: ac.signal });

      clearTimeout(toId);

      break;
    } catch (error) {
      if (Object.is((error as Error).cause, TIMEOUT_ID)) {
        throw new Error(
          `connection unsuccessful to meilisearch after ${TIMEOUT}ms`,
          { cause: lastError },
        );
      }

      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
  }
}

/**
 * Checks if there is a connection to Meilisearch before any test is run.
 *
 * @see {@link https://vitest.dev/config/globalsetup}
 */
export default async function (project: TestProject) {
  await waitForMeiliSearch();

  project.provide("PORT", env.PORT!);
  project.provide("MASTER_KEY", env.MASTER_KEY!);
}

declare module "vitest" {
  export interface ProvidedContext {
    PORT: string;
    MASTER_KEY: string;
  }
}
