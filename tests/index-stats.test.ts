import { afterAll, expect, test } from "vitest";
import { getClient } from "./utils/meilisearch-test-utils.js";

const INDEX_UID = "stats-index";
const client = await getClient("Master");

afterAll(async () => {
  await client.index(INDEX_UID).deleteIndex().waitTask();
});

test("getStats method", async () => {
  await client.createIndex({ uid: INDEX_UID }).waitTask();
  const stats = await client.index(INDEX_UID).getStats();
  expect(stats).toMatchInlineSnapshot(`
    {
      "avgDocumentSize": 0,
      "fieldDistribution": {},
      "isIndexing": false,
      "numberOfDocuments": 0,
      "numberOfEmbeddedDocuments": 0,
      "numberOfEmbeddings": 0,
      "rawDocumentDbSize": 0,
    }
  `);
});
