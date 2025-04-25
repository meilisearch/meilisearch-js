import { test, afterAll } from "vitest";
import { getClient, assert } from "./utils/meilisearch-test-utils.js";
import { Index, type SwapIndexesPayload } from "../src/index.js";

const INDEX_UID_ONE = "c5ffe1f8-7da8-4e47-a698-d4183f98a552";
const INDEX_UID_TWO = "8be542e9-0f24-4c72-b4e9-4a23e7e29e9d";
const ms = await getClient("Master");
const index = ms.index(INDEX_UID_ONE);

test(`${ms.index.name} method`, () => {
  const myIndex = ms.index(INDEX_UID_ONE);
  assert.instanceOf(myIndex, Index);
  assert.strictEqual(myIndex.uid, INDEX_UID_ONE);
});

afterAll(async () => {
  await Promise.all(
    [INDEX_UID_ONE, INDEX_UID_TWO].map((i) =>
      ms.index(i).deleteIndex().waitTask(),
    ),
  );
});

test(`${ms.createIndex.name} and ${index.getIndex.name} method`, async () => {
  const primaryKey = "cléPrimaire";
  const task = await ms
    .createIndex({ uid: INDEX_UID_ONE, primaryKey })
    .waitTask();

  assert.isTaskSuccessful(task);
  assert.strictEqual(task.indexUid, INDEX_UID_ONE);
  assert.deepEqual(task.details, { primaryKey });
  assert.strictEqual(task.type, "indexCreation");

  const { createdAt, updatedAt, ...myIndex } = await index.getIndex();

  assert.deepEqual(myIndex, {
    primaryKey,
    uid: INDEX_UID_ONE,
  });
  assert.typeOf(createdAt, "string");
  assert.typeOf(updatedAt, "string");
});

test(`${index.updateIndex.name} and ${index.getIndex.name} method`, async () => {
  const primaryKey = "id";
  const task = await index.updateIndex({ primaryKey }).waitTask();

  assert.isTaskSuccessful(task);
  assert.strictEqual(task.indexUid, INDEX_UID_ONE);
  assert.deepEqual(task.details, { primaryKey });
  assert.strictEqual(task.type, "indexUpdate");

  const { createdAt, updatedAt, ...myIndex } = await index.getIndex();

  assert.typeOf(createdAt, "string");
  assert.typeOf(updatedAt, "string");

  assert.deepEqual(myIndex, {
    primaryKey,
    uid: INDEX_UID_ONE,
  });
});

test(`${index.deleteIndex.name} method`, async () => {
  const task = await index.deleteIndex().waitTask();

  assert.isTaskSuccessful(task);
  assert.strictEqual(task.indexUid, INDEX_UID_ONE);
  assert.deepEqual(task.details, { deletedDocuments: 0 });
  assert.strictEqual(task.type, "indexDeletion");
});

test(`${ms.swapIndexes.name} method`, async () => {
  const otherIndex = ms.index(INDEX_UID_TWO);

  const doc1 = { id: 1, title: "index_un" };
  const doc2 = { id: 1, title: "index_deux" };

  await index.addDocuments([doc1]).waitTask();
  await otherIndex.addDocuments([doc2]).waitTask();

  const swaps: SwapIndexesPayload[] = [
    { indexes: [INDEX_UID_ONE, INDEX_UID_TWO] },
  ];

  const task = await ms.swapIndexes(swaps).waitTask();

  assert.isTaskSuccessful(task);
  assert.strictEqual(task.indexUid, null);
  assert.deepEqual(task.details, { swaps });
  assert.strictEqual(task.type, "indexSwap");

  const docIndex = await index.getDocument(doc2.id);
  const docOtherIndex = await otherIndex.getDocument(doc1.id);

  assert.deepEqual(doc1, docOtherIndex);
  assert.deepEqual(doc2, docIndex);
});
