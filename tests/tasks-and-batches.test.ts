import { afterAll, describe, test } from "vitest";
import type {
  AllTasks,
  BatchView,
  Kind,
  Status,
  SummarizedTaskView,
  TasksFilterQuery,
} from "../src/types/index.js";
import {
  assert,
  getClient,
  objectKeys,
  objectEntries,
} from "./utils/meilisearch-test-utils.js";
import type { SafeOmit } from "../src/types/shared.js";

const INDEX_UID = "536438df-c883-4c65-9e1d-3852b3f82330";
const ms = await getClient("Master");
const index = ms.index(INDEX_UID);

const NOW_ISO_STRING = new Date().toISOString();
const possibleStatuses = objectKeys<Status>({
  enqueued: null,
  processing: null,
  succeeded: null,
  failed: null,
  canceled: null,
});
const possibleKinds = objectKeys<Kind>({
  documentAdditionOrUpdate: null,
  documentEdition: null,
  documentDeletion: null,
  settingsUpdate: null,
  indexCreation: null,
  indexDeletion: null,
  indexUpdate: null,
  indexSwap: null,
  taskCancelation: null,
  taskDeletion: null,
  dumpCreation: null,
  snapshotCreation: null,
  upgradeDatabase: null,
});

function assertIsSummarizedTask(summarizedTask: SummarizedTaskView) {
  assert.lengthOf(Object.keys(summarizedTask), 5);

  const { taskUid, indexUid, status, type, enqueuedAt } = summarizedTask;

  assert.typeOf(taskUid, "number");
  assert(
    indexUid === null || typeof indexUid === "string",
    `expected ${indexUid} to be null or string`,
  );
  assert.oneOf(status, possibleStatuses);
  assert.oneOf(type, possibleKinds);
  assert.typeOf(enqueuedAt, "string");
}

function assertIsBatch(batch: BatchView) {
  assert.lengthOf(Object.keys(batch), 7);

  const { uid, progress, details, stats, duration, startedAt, finishedAt } =
    batch;

  assert.typeOf(uid, "number");
  assert(
    typeof progress === "object",
    "expected progress to be of type object or null",
  );

  if (progress !== null) {
    assert.lengthOf(Object.keys(progress), 2);
    const { steps, percentage } = progress;

    for (const step of steps) {
      assert.lengthOf(Object.keys(step), 3);

      const { currentStep, finished, total } = step;

      assert.typeOf(currentStep, "string");
      assert.typeOf(finished, "number");
      assert.typeOf(total, "number");
    }

    assert.typeOf(percentage, "number");
  }

  assert.typeOf(details, "object");

  const { length } = Object.keys(stats);

  assert.isAtLeast(length, 4);
  assert.isAtMost(length, 7);

  const {
    totalNbTasks,
    status,
    types,
    indexUids,
    progressTrace,
    writeChannelCongestion,
    internalDatabaseSizes,
  } = stats;

  assert.typeOf(totalNbTasks, "number");

  for (const [key, val] of Object.entries(status)) {
    assert.oneOf(key, possibleStatuses);
    assert.typeOf(val, "number");
  }

  for (const [key, val] of Object.entries(types)) {
    assert.oneOf(key, possibleKinds);
    assert.typeOf(val, "number");
  }

  for (const val of Object.values(indexUids)) {
    assert.typeOf(val, "number");
  }

  assert(
    progressTrace === undefined ||
      (progressTrace !== null && typeof progressTrace === "object"),
    "expected progressTrace to be undefined or an object",
  );

  assert(
    writeChannelCongestion === undefined ||
      (writeChannelCongestion !== null &&
        typeof writeChannelCongestion === "object"),
    "expected writeChannelCongestion to be undefined or an object",
  );

  assert(
    internalDatabaseSizes === undefined ||
      (internalDatabaseSizes !== null &&
        typeof internalDatabaseSizes === "object"),
    "expected internalDatabaseSizes to be undefined or an object",
  );

  assert(
    duration === null || typeof duration === "string",
    "expected duration to be null or string",
  );
  assert(
    startedAt === null || typeof startedAt === "string",
    "expected startedAt to be null or string",
  );
  assert(
    finishedAt === null || typeof finishedAt === "string",
    "expected finishedAt to be null or string",
  );
}

function assertIsResult(value: SafeOmit<AllTasks, "results">) {
  assert.lengthOf(Object.keys(value), 4);
  assert.typeOf(value.total, "number");
  assert.typeOf(value.limit, "number");
  assert(
    value.from === null || typeof value.from === "number",
    "expected from to be null or number",
  );
  assert(
    value.next === null || typeof value.next === "number",
    "expected next to be null or number",
  );
}

type TestValues = {
  [TKey in keyof TasksFilterQuery]-?: [
    name: string | undefined,
    value: TasksFilterQuery[TKey],
  ][];
};

type SimplifiedTestValues = Record<
  keyof TasksFilterQuery,
  [name: string | undefined, value: TasksFilterQuery[keyof TasksFilterQuery]][]
>;

const testValuesRecord = {
  limit: [[undefined, 1]],

  from: [[undefined, 1]],

  reverse: [[undefined, true]],

  batchUids: [
    [undefined, [1912, 1265]],
    ["*", ["*"]],
  ],

  uids: [
    [undefined, [1945, 1865]],
    ["*", ["*"]],
  ],

  canceledBy: [
    [undefined, [1587, 1896]],
    ["*", ["*"]],
  ],

  types: [
    ["all possible values", possibleKinds],
    ["*", ["*"]],
  ],

  statuses: [
    ["all possible values", possibleStatuses],
    ["*", ["*"]],
  ],

  indexUids: [
    [undefined, [INDEX_UID]],
    ["*", ["*"]],
  ],

  afterEnqueuedAt: [
    [undefined, NOW_ISO_STRING],
    ["*", "*"],
  ],

  beforeEnqueuedAt: [
    [undefined, NOW_ISO_STRING],
    ["*", "*"],
  ],

  afterStartedAt: [
    [undefined, NOW_ISO_STRING],
    ["*", "*"],
  ],

  beforeStartedAt: [
    [undefined, NOW_ISO_STRING],
    ["*", "*"],
  ],

  afterFinishedAt: [
    [undefined, NOW_ISO_STRING],
    ["*", "*"],
  ],

  beforeFinishedAt: [
    [undefined, NOW_ISO_STRING],
    ["*", "*"],
  ],
} satisfies TestValues as SimplifiedTestValues;

// transform names
for (const testValues of Object.values(testValuesRecord)) {
  for (const testValue of testValues) {
    const [name] = testValue;
    testValue[0] = name === undefined ? "" : " with " + name;
  }
}

const testValuesRecordExceptSome = (() => {
  const {
    limit: _limit,
    from: _from,
    reverse: _reverse,
    ...r
  } = testValuesRecord;

  return r;
})();

afterAll(async () => {
  await index.delete().waitTask();
});

test(`${ms.tasks.waitForTask.name} and ${ms.tasks.getTask.name} methods`, async () => {
  const summarizedTask = await index.addDocuments([{ id: 1 }, { id: 2 }]);
  assertIsSummarizedTask(summarizedTask);

  const taskThroughGet = await ms.tasks.getTask(summarizedTask.taskUid);
  assert.isTask(taskThroughGet);

  const taskThroughWaitOne = await ms.tasks.waitForTask(summarizedTask);
  assert.isTask(taskThroughWaitOne);

  const taskThroughWaitTwo = await ms.tasks.waitForTask(summarizedTask.taskUid);
  assert.isTask(taskThroughWaitTwo);
});

// this implicitly also tests `waitForTasksIter` (`waitForTasks` depends on it)
test(`${ms.tasks.waitForTasks.name} method`, async () => {
  const summarizedTasks = await Promise.all([
    index.addDocuments([{ id: 3 }, { id: 4 }]),
    index.addDocuments([{ id: 5 }, { id: 6 }]),
    index.addDocuments([{ id: 7 }, { id: 8 }]),
  ]);

  for (const summarizedTask of summarizedTasks) {
    assertIsSummarizedTask(summarizedTask);
  }

  const tasks = await ms.tasks.waitForTasks(summarizedTasks);

  for (const task of tasks) {
    assert.isTask(task);
  }
});

// TODO: Should probably extend assert locally
// eslint-disable-next-line vitest/expect-expect
test(`${ms.batches.getBatch.name} method`, async () => {
  await Promise.all([
    index.addDocuments([{ id: 9 }, { id: 10 }]),
    index.addDocuments([{ id: 11 }, { id: 12 }]),
    index.addDocuments([{ id: 13 }, { id: 14 }]),
  ]);

  // this is the only way to get batch uids at the moment of writing this
  const allBatches = await ms.batches.getBatches();

  for (const { uid } of allBatches.results) {
    const batch = await ms.batches.getBatch(uid);
    assertIsBatch(batch);
  }
});

describe.for(objectEntries(testValuesRecord))("%s", ([key, testValues]) => {
  test.for(testValues)(
    `${ms.tasks.getTasks.name} method%s`,
    async ([, value]) => {
      const { results, ...r } = await ms.tasks.getTasks({ [key]: value });

      assertIsResult(r);

      for (const task of results) {
        assert.isTask(task);
      }
    },
  );

  test.for(testValues)(
    `${ms.batches.getBatches.name} method%s`,
    async ([, value]) => {
      const { results, ...r } = await ms.batches.getBatches({ [key]: value });

      assertIsResult(r);

      for (const batch of results) {
        assertIsBatch(batch);
      }
    },
  );
});

describe.for(objectEntries(testValuesRecordExceptSome))(
  "%s",
  ([key, testValues]) => {
    test.for(testValues)(
      `${ms.tasks.cancelTasks.name} method%s`,
      async ([, value]) => {
        const summarizedTask = await ms.tasks.cancelTasks({ [key]: value });
        assertIsSummarizedTask(summarizedTask);
        const task = await ms.tasks.waitForTask(summarizedTask);
        assert.isTask(task);

        assert.isDefined(task.details);
        assert.typeOf(task.details.matchedTasks, "number");
        assert.typeOf(task.details.canceledTasks, "number");
        assert.typeOf(task.details.originalFilter, "string");

        assert.strictEqual(task.type, "taskCancelation");
      },
    );

    test.for(testValues)(
      `${ms.tasks.deleteTasks.name} method%s`,
      async ([, value]) => {
        const summarizedTask = await ms.tasks.deleteTasks({ [key]: value });
        assertIsSummarizedTask(summarizedTask);
        const task = await ms.tasks.waitForTask(summarizedTask);
        assert.isTask(task);

        assert.isDefined(task.details);
        assert.typeOf(task.details.matchedTasks, "number");
        assert.typeOf(task.details.deletedTasks, "number");
        assert.typeOf(task.details.originalFilter, "string");

        assert.strictEqual(task.type, "taskDeletion");
      },
    );
  },
);
