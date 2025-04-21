import { test } from "vitest";
import { assert, getClient } from "./utils/meilisearch-test-utils.js";

const ms = await getClient("Master");

test(`${ms.getVersion.name} method`, async () => {
  const version = await ms.getVersion();
  assert.strictEqual(Object.keys(version).length, 3);
  const { commitDate, commitSha, pkgVersion } = version;
  for (const v of [commitDate, commitSha, pkgVersion]) {
    assert.typeOf(v, "string");
  }
});
