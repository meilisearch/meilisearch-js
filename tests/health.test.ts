import { test } from "vitest";
import { assert, getClient } from "./utils/meilisearch-test-utils.js";

const ms = await getClient("Master");

test(`${ms.health.name} method`, async () => {
  const health = await ms.health();
  assert.strictEqual(Object.keys(health).length, 1);
  assert.strictEqual(health.status, "available");
});
