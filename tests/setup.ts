import { platform } from "node:process";
import { spawnSync } from "node:child_process";
import { MeiliSearch } from "../src/meilisearch.js";

const POLL_INTERVAL = 250;
const CONTAINER_NAME = "meilisearch";
const TIMEOUT = 15_000;
const TIMEOUT_ID = Symbol("<timeout waiting for client>");

const ms = new MeiliSearch({
  host: "http://127.0.0.1:7700",
  apiKey: "masterKey",
});

// TODO: Logs before cleanup script? Worry that it might pollute node logs, so probably should write them to a file
// and then log it in another step

function removeIfExistsMeilisearchDockerService(): void {
  spawnSync(
    "docker",

    // https://docs.docker.com/reference/cli/docker/container/rm/
    ["container", "rm", "-f", CONTAINER_NAME],

    // TODO: prefix output
    { stdio: "inherit" },
  );
}

// TODO
/** < explanation > */
function getNetworkOptions() {
  if (platform === "linux") {
    return [
      // https://docs.docker.com/reference/cli/docker/container/run/#network
      "--network",
      "host",
    ];
  }

  return [
    // https://docs.docker.com/reference/cli/docker/container/run/#publish
    "-p",
    "7700:7700",
  ];
}

function startMeilisearchDockerService(): void {
  spawnSync(
    "docker",
    [
      // https://docs.docker.com/reference/cli/docker/container/run
      "run",

      // https://docs.docker.com/reference/cli/docker/container/run/#rm
      "--rm",

      // https://docs.docker.com/reference/cli/docker/container/run/#detach
      "-d",

      // TODO: Instead of name somehow get uid of container
      // https://docs.docker.com/reference/cli/docker/container/run/#name
      "--name",
      CONTAINER_NAME,

      ...getNetworkOptions(),

      // https://docs.docker.com/reference/cli/docker/container/run/#env
      "-e",
      "MEILI_MASTER_KEY=masterKey",
      "-e",
      "MEILI_NO_ANALYTICS=true",

      // https://hub.docker.com/r/getmeili/meilisearch
      `getmeili/meilisearch:latest`,
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
 * In case there is a connection, return Meilisearch health, and `null`
 * otherwise.
 */
async function checkConnection() {
  try {
    return await ms.health();
  } catch {
    return null;
  }
}

// TODO caching: https://forums.docker.com/t/caching-images-and-layers-on-gh-actions-workflow/140647/2

/**
 * If there is no connection to Meilisearch, create a docker service of it, and
 * wait for connection.
 *
 * {@link https://vitest.dev/config/#globalsetup}
 */
export default async function () {
  const health = await checkConnection();
  if (health !== null) {
    return;
  }

  try {
    removeIfExistsMeilisearchDockerService();
    startMeilisearchDockerService();
    await waitForMeiliSearch();

    return removeIfExistsMeilisearchDockerService;
  } catch (error) {
    removeIfExistsMeilisearchDockerService();

    throw error;
  }
}
