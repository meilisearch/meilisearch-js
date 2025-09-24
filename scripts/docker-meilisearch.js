import { spawnSync } from "node:child_process";
import { argv } from "node:process";
import pkg from "../package.json" with { type: "json" };

const { meilisearchTargetVersion } = pkg;

// TODO: On Windows this isn't always terminated properly, resulting
//       in the docker container not stopping, but this is not a big issue.
spawnSync(
  "docker",
  [
    // https://docs.docker.com/reference/cli/docker/container/run
    "run",

    // https://docs.docker.com/reference/cli/docker/container/run/#rm
    "--rm",

    // https://docs.docker.com/reference/cli/docker/container/run/#name
    "--name",
    "meilisearch",

    // https://docs.docker.com/reference/cli/docker/container/run/#publish
    "-p",
    "7700:7700",

    // https://docs.docker.com/reference/cli/docker/container/run/#env
    "-e",
    "MEILI_MASTER_KEY=masterKey",
    "-e",
    "MEILI_NO_ANALYTICS=true",

    // any other arguments passed to this script file
    ...argv.slice(2),

    `getmeili/meilisearch:v${meilisearchTargetVersion}`,
  ],
  { stdio: "inherit" },
);
