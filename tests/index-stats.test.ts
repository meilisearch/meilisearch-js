import { randomUUID } from "node:crypto";
import { afterAll, test } from "vitest";
import { assert, getClient } from "./utils/meilisearch-test-utils.js";

const INDEX_UID = randomUUID();
const ms = await getClient("Master");
const index = ms.index(INDEX_UID);

afterAll(async () => {
  const task = await ms.index(INDEX_UID).deleteIndex().waitTask();
  assert.isTaskSuccessful(task);
});

test(`${index.getStats.name} method`, async () => {
  const task = await index
    .addDocuments([
      { id: 1, liberté: true },
      { id: 2, égalité: true },
      { id: 3, fraternité: true },
    ])
    .waitTask();

  assert.isTaskSuccessful(task);

  const stats = await index.getStats();

  assert.deepEqual(stats, {
    avgDocumentSize: 1357,
    fieldDistribution: {
      fraternité: 1,
      id: 3,
      liberté: 1,
      égalité: 1,
    },
    isIndexing: false,
    numberOfDocuments: 3,
    numberOfEmbeddedDocuments: 0,
    numberOfEmbeddings: 0,
    rawDocumentDbSize: 4096,
  });
});
