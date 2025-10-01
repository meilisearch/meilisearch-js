import { spawnSync } from "node:child_process";
import { MeiliSearch } from "../src/meilisearch.js";
import pkg from "../package.json" with { type: "json" };

const POLL_INTERVAL = 250;
const CONTAINER_NAME = "meilisearch";
const TIMEOUT = 15_000;
const TIMEOUT_ID = Symbol();

function removeIfExistsMeilisearchDockerService(): void {
  spawnSync(
    "docker",

    // https://docs.docker.com/reference/cli/docker/container/rm/
    ["container", "rm", "-f", CONTAINER_NAME],

    // TODO: prefix
    { stdio: "inherit" },
  );
}

function startMeilisearchDockerService(meilisearchVersion: string): void {
  spawnSync(
    "docker",
    [
      // https://docs.docker.com/reference/cli/docker/container/run
      "run",

      // https://docs.docker.com/reference/cli/docker/container/run/#rm
      "--rm",

      // https://docs.docker.com/reference/cli/docker/container/run/#detach
      "-d",

      // https://docs.docker.com/reference/cli/docker/container/run/#name
      "--name",
      CONTAINER_NAME,

      // https://docs.docker.com/reference/cli/docker/container/run/#publish
      "-p",
      "7700:7700",

      // https://docs.docker.com/reference/cli/docker/container/run/#env
      "-e",
      "MEILI_MASTER_KEY=masterKey",
      "-e",
      "MEILI_NO_ANALYTICS=true",

      `getmeili/meilisearch:v${meilisearchVersion}`,
    ],

    // TODO: prefix
    { stdio: "inherit" },
  );
}

/** Poll Meilisearch until its reachable. */
async function waitForMeiliSearch(): Promise<void> {
  const ms = new MeiliSearch({ host: "http://127.0.0.1:7700" });
  let lastError;

  const ac = new AbortController();

  const toId = setTimeout(() => void ac.abort(TIMEOUT_ID), TIMEOUT);

  for (;;) {
    try {
      await ms.health({ signal: ac.signal });

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

    await new Promise<void>((resolve) => setTimeout(resolve, POLL_INTERVAL));
  }
}

// TODO
/**
 * Description.
 *
 * {@link https://vitest.dev/config/#globalsetup}
 */
export default async function () {
  const { meilisearchTargetVersion } = pkg;

  try {
    removeIfExistsMeilisearchDockerService();

    startMeilisearchDockerService(meilisearchTargetVersion);

    await waitForMeiliSearch();

    return removeIfExistsMeilisearchDockerService;
  } catch (error) {
    removeIfExistsMeilisearchDockerService();

    throw error;
  }
}
