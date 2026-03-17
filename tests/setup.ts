import { spawnSync } from "node:child_process";
import { MeiliSearch } from "../src/index.js";
import pkg from "../package.json" with { type: "json" };

const { meilisearchTargetVersion } = pkg;

const POLL_INTERVAL = 250;
const CONTAINER_NAME = `meilisearch-enterprise-${meilisearchTargetVersion}-test`;
const PORT = 7700;
const TIMEOUT = 15_000;
const TIMEOUT_ID = Symbol();

const ms = new MeiliSearch({
  host: `http://127.0.0.1:${PORT}`,
  apiKey: "masterKey",
});

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
      `7700:${PORT}`,

      // https://docs.docker.com/reference/cli/docker/container/run/#env
      "-e",
      "MEILI_MASTER_KEY=masterKey",
      "-e",
      "MEILI_NO_ANALYTICS=true",
      "-e",
      "MEILI_EXPERIMENTAL_ALLOWED_IP_NETWORKS=any",

      // https://hub.docker.com/r/getmeili/meilisearch
      `getmeili/meilisearch-enterprise:v${meilisearchVersion}`,
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
 * In case there is a connection, return Meilisearch version, and `null`
 * otherwise.
 */
async function checkConnectionAndVersion(): Promise<string | null> {
  try {
    const { pkgVersion } = await ms.getVersion();
    return pkgVersion;
  } catch {
    return null;
  }
}

/**
 * If there is no connection to Meilisearch with the appropriate version, create
 * a docker service of it, and wait for connection. Otherwise try and (re)create
 * it.
 *
 * @see {@link https://vitest.dev/config/globalsetup}
 */
export default async function () {
  const meilisearchVersion = await checkConnectionAndVersion();
  if (meilisearchVersion === meilisearchTargetVersion) {
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
