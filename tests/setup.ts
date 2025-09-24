import { beforeAll } from "vitest";
import pkg from "../package.json" with { type: "json" };
import { getClient } from "./utils/meilisearch-test-utils.js";

/**
 * Asserts meilisearch is reachable, and version is what is configured in
 * `package.json`.
 */
beforeAll(async () => {
  const client = await getClient("MASTER");
  const { pkgVersion } = await client.getVersion();

  if (pkgVersion !== pkg.meilisearchTargetVersion) {
    // TODO: Also print address of meilisearch so it's super clear what the error is about
    throw new Error(
      "test environment Meilisearch version doesn't match configured version; " +
        `expected ${pkg.meilisearchTargetVersion}, got ${pkgVersion}`,
    );
  }
});
