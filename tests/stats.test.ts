import { test } from "vitest";
import { assert, getClient } from "./utils/meilisearch-test-utils.js";

const ms = await getClient("Master");

test(`${ms.getStats.name} method`, async () => {
  const stats = await ms.getStats();
  assert.strictEqual(Object.keys(stats).length, 4);
  const { databaseSize, usedDatabaseSize, lastUpdate, indexes } = stats;
  assert.typeOf(databaseSize, "number");
  assert.typeOf(usedDatabaseSize, "number");
  assert(typeof lastUpdate === "string" || lastUpdate === null);

  for (const indexStats of Object.values(indexes)) {
    assert.lengthOf(Object.keys(indexStats), 7);
    const {
      numberOfDocuments,
      isIndexing,
      fieldDistribution,
      numberOfEmbeddedDocuments,
      numberOfEmbeddings,
      rawDocumentDbSize,
      avgDocumentSize,
    } = indexStats;

    assert.typeOf(numberOfDocuments, "number");
    assert.typeOf(isIndexing, "boolean");
    assert.typeOf(numberOfEmbeddedDocuments, "number");
    assert.typeOf(numberOfEmbeddings, "number");
    assert.typeOf(rawDocumentDbSize, "number");
    assert.typeOf(avgDocumentSize, "number");

    for (const val of Object.values(fieldDistribution)) {
      assert.typeOf(val, "number");
    }
  }
});
