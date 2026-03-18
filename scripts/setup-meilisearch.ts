import spawn from "nano-spawn";
import { MeiliSearch } from "../src/index.js";
import pkg from "../package.json" with { type: "json" };

// TODO: More and Better logging?

// TODO: Use this in the future https://nodejs.org/api/esm.html#importmetamain
const isNotTestingEnvironment = import.meta?.env?.MODE !== "test";

const { meilisearchTargetVersion } = pkg;

const PORT = "7700";
const MASTER_KEY = "masterKey";
const CONTAINER_NAME = "meilisearch-enterprise-test";
const POLL_INTERVAL = 250;
const TIMEOUT = 15_000;
const TIMEOUT_ID = Symbol();

const host = `http://127.0.0.1:${PORT}`;

const client = new MeiliSearch({ host, apiKey: MASTER_KEY });

function dockerEnv(env: Record<string, string>) {
  return Object.entries(env).flatMap(([key, val]) => ["-e", `${key}=${val}`]);
}

async function removeMeilisearchDockerContainer() {
  await spawn(
    "docker",

    // https://docs.docker.com/reference/cli/docker/container/rm/
    ["container", "rm", "-f", CONTAINER_NAME],

    { stdout: "inherit" },
  );
}

async function startMeilisearchDockerContainer(meilisearchVersion: string) {
  await spawn(
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
      ...dockerEnv({
        MEILI_MASTER_KEY: MASTER_KEY,
        MEILI_NO_ANALYTICS: "true",
        MEILI_EXPERIMENTAL_ALLOWED_IP_NETWORKS: "any",
      }),

      // https://hub.docker.com/r/getmeili/meilisearch
      `getmeili/meilisearch-enterprise:v${meilisearchVersion}`,
    ],

    { stdout: "inherit" },
  );
}

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
 * In case there is a connection, return Meilisearch version, and `null`
 * otherwise.
 */
async function checkConnectionAndVersion() {
  try {
    const { pkgVersion } = await client.getVersion();
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
export default async function setupMeilisearch() {
  const meilisearchVersion = await checkConnectionAndVersion();

  if (meilisearchVersion !== null) {
    console.log(
      `meilisearch ${meilisearchVersion} client connection detected!`,
    );

    if (meilisearchVersion !== meilisearchTargetVersion) {
      throw new Error(
        `meilisearch client target version mismatch, expected ${meilisearchTargetVersion}` +
          '\nmake sure "package.json" "meilisearchTargetVersion" is set up correctly,' +
          ` and that the correct docker container is running on ${host}, or none at all` +
          " to let the script set it up",
        { cause: { meilisearchVersion, meilisearchTargetVersion } },
      );
    }

    return;
  }

  try {
    await removeMeilisearchDockerContainer();
    await startMeilisearchDockerContainer(meilisearchTargetVersion);
    await waitForMeiliSearch();

    return removeMeilisearchDockerContainer;
  } catch (error) {
    await removeMeilisearchDockerContainer();

    throw error;
  }
}

// if it is not called within tests, run directly
if (isNotTestingEnvironment) {
  await setupMeilisearch();
}
