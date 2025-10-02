import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, test } from "vitest";
import { assert, getClient } from "./utils/meilisearch-test-utils.js";

const INDEX_UID = randomUUID();
const ms = await getClient("Master");

beforeAll(async () => {
  const task = await ms.createIndex(INDEX_UID).waitTask();
  assert.isTaskSuccessful(task);

  const idx = ms.index(INDEX_UID);

  const task2 = await idx.updateFilterableAttributes(["beep"]).waitTask();
  assert.isTaskSuccessful(task2);

  const task3 = await idx.addDocuments([{ id: 0, beep: "boop" }]).waitTask();
  assert.isTaskSuccessful(task3);
});

afterAll(async () => {
  const task = await ms.deleteIndex(INDEX_UID).waitTask();
  assert.isTaskSuccessful(task);
});

test(`${ms.export.name} method`, async () => {
  const task = await ms
    .export({
      url: "http://export-meilisearch:7700",
      apiKey: "masterKey",
      payloadSize: "50MiB",
      indexes: {
        [INDEX_UID]: { filter: "beep = boop", overrideSettings: true },
      },
    })
    .waitTask({ timeout: 60_000 });

  assert.isTaskSuccessful(task);
  assert.strictEqual(task.type, "export");
});
