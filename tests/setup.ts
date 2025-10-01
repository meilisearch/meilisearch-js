import { spawnSync } from "node:child_process";
import { MeiliSearch } from "../src/meilisearch.js";
import pkg from "../package.json" with { type: "json" };

const POLL_INTERVAL = 250;
const CONTAINER_NAME = "meilisearch";
const TIMEOUT = 15_000;
const TIMEOUT_ID = Symbol();

const ms = new MeiliSearch({ host: "http://127.0.0.1:7700" });

function removeIfExistsMeilisearchDockerService(): void {
  spawnSync(
    "docker",

    // https://docs.docker.com/reference/cli/docker/container/rm/
    ["container", "rm", "-f", CONTAINER_NAME],

    // TODO: prefix output
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

    // TODO: prefix output
    { stdio: "inherit" },
  );
}

/** Poll Meilisearch until its reachable. */
async function waitForMeiliSearch(): Promise<void> {
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

/**
 * In case there is a connection, return Meilisearch version, and
 * `null`otherwise.
 */
async function checkConnectionAndVersion(): Promise<string | null> {
  try {
    const { pkgVersion } = await ms.getVersion();
    return pkgVersion;
  } catch {
    return null;
  }
}

// TODO: could use docker image save/load and https://github.com/actions/cache?tab=readme-ov-file
//       instead of github workflows services

/**
 * If there is no connection to Meilisearch, create a docker service of it, and
 * wait for connection.
 *
 * {@link https://vitest.dev/config/#globalsetup}
 */
export default async function () {
  const { meilisearchTargetVersion } = pkg;

  const meilisearchVersion = await checkConnectionAndVersion();
  if (meilisearchVersion !== null) {
    if (meilisearchVersion !== meilisearchTargetVersion) {
      throw new Error(
        "Meilisearch is reachable but it is the wrong version " +
          `(expected ${meilisearchTargetVersion}, got ${meilisearchVersion})`,
      );
    }

    return;
  }

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
