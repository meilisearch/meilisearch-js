import { test, afterAll } from "vitest";
import { getClient, assert } from "./utils/meilisearch-test-utils.js";
import { Index, type SwapIndexesPayload } from "../src/index.js";

const MY_INDEX_ONE = "my-index-one";
const MY_INDEX_TWO = "my-index-two";
const client = await getClient("Master");

test.concurrent("index method", () => {
  const myIndex = client.index(MY_INDEX_ONE);
  assert.instanceOf(myIndex, Index);
  assert.strictEqual(myIndex.uid, MY_INDEX_ONE);
});

afterAll(async () => {
  await Promise.all([
    client.index(MY_INDEX_ONE).deleteIndex().waitTask(),
    client.index(MY_INDEX_TWO).deleteIndex().waitTask(),
  ]);
});

test("createIndex and getIndex method", async () => {
  const primaryKey = "objectID";
  await client.createIndex({ uid: MY_INDEX_ONE, primaryKey }).waitTask();

  const { createdAt, updatedAt, ...myIndex } = await client
    .index(MY_INDEX_ONE)
    .getIndex();

  assert.deepEqual(myIndex, {
    primaryKey,
    uid: MY_INDEX_ONE,
  });
  assert.typeOf(createdAt, "string");
  assert.typeOf(updatedAt, "string");
});

test("updateIndex method", async () => {
  const primaryKey = "id";
  const index = client.index(MY_INDEX_ONE);
  await index.updateIndex({ primaryKey }).waitTask();

  const { createdAt: _ca, updatedAt: _ua, ...myIndex } = await index.getIndex();

  assert.deepEqual(myIndex, {
    primaryKey,
    uid: MY_INDEX_ONE,
  });
});

test("deleteIndex method", async () => {
  const { indexUid, status, type } = await client
    .index(MY_INDEX_ONE)
    .deleteIndex()
    .waitTask();

  assert.deepEqual(
    { indexUid, status, type },
    {
      indexUid: MY_INDEX_ONE,
      status: "succeeded",
      type: "indexDeletion",
    },
  );
});

test("swapIndexes method", async () => {
  const indexOne = client.index(MY_INDEX_ONE);
  const indexTwo = client.index(MY_INDEX_TWO);

  const doc1 = { id: 1, title: "index_1" };
  const doc2 = { id: 1, title: "index_2" };

  await indexOne.addDocuments([doc1]).waitTask();
  await indexTwo.addDocuments([doc2]).waitTask();

  const swaps: SwapIndexesPayload[] = [
    { indexes: [MY_INDEX_ONE, MY_INDEX_TWO] },
  ];

  const task = await client.swapIndexes(swaps).waitTask();
  const docIndex1 = await indexOne.getDocument(doc2.id);
  const docIndex2 = await indexTwo.getDocument(doc1.id);

  assert.deepEqual(doc1, docIndex2);
  assert.deepEqual(doc2, docIndex1);

  const { type, details } = task;
  assert.deepEqual(
    { type, details },
    { details: { swaps }, type: "indexSwap" },
  );
});
