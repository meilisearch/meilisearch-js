import { randomUUID } from "node:crypto";
import { beforeAll, describe, test, vi } from "vitest";
import type { TasksOrBatchesQuery } from "../src/types/index.js";
import { getClient, objectEntries } from "./utils/meilisearch-test-utils.js";
import {
  assert,
  possibleTaskTypes,
  possibleTaskStatuses,
} from "./utils/tasks-and-batches.js";

const INDEX_UID = randomUUID();
const ms = await getClient("Master");
const index = ms.index(INDEX_UID);

const NOW_ISO_STRING = new Date().toISOString();

type TestValues = {
  [TKey in keyof TasksOrBatchesQuery]-?: [
    name: string | undefined,
    value: TasksOrBatchesQuery[TKey],
  ][];
};

type SimplifiedTestValues = Record<
  keyof TasksOrBatchesQuery,
  [
    name: string | undefined,
    value: TasksOrBatchesQuery[keyof TasksOrBatchesQuery],
  ][]
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
    ["all possible values", possibleTaskTypes],
    ["*", ["*"]],
  ],

  statuses: [
    ["all possible values", possibleTaskStatuses],
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

// transform names for printing purposes
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

beforeAll(async () => {
  await index.delete().waitTask();
});

test(`${ms.tasks.waitForTask.name} and ${ms.tasks.getTask.name} methods`, async () => {
  const summarizedTask = await index.addDocuments([{ id: 1 }, { id: 2 }]);
  assert.isEnqueuedTask(summarizedTask);

  const taskThroughGet = await ms.tasks.getTask(summarizedTask.taskUid);
  assert.isTask(taskThroughGet);

  // test timeout and interval
  const spy = vi.spyOn(globalThis, "setTimeout");

  const interval = 42;
  const timeout = 61_234;
  const taskThroughWaitOne = await ms.tasks.waitForTask(summarizedTask, {
    interval,
    timeout,
  });

  const timeoutParams = spy.mock.calls.map(([, to]) => to);
  assert.include(timeoutParams, interval);
  assert.include(timeoutParams, timeout);

  spy.mockRestore();

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
    assert.isEnqueuedTask(summarizedTask);
  }

  const tasks = await ms.tasks.waitForTasks(summarizedTasks);

  for (const task of tasks) {
    assert.isTask(task);
  }
});

test(`${ms.batches.getBatch.name} method`, async () => {
  await Promise.all([
    index.addDocuments([{ id: 9 }, { id: 10 }]),
    index.addDocuments([{ id: 11 }, { id: 12 }]),
    index.addDocuments([{ id: 13 }, { id: 14 }]),
  ]);

  // this is the only way to get batch uids at the moment of writing this
  const { results } = await ms.batches.getBatches();

  for (const { uid } of results) {
    const batch = await ms.batches.getBatch(uid);
    assert.isBatch(batch);
  }
});

describe.for(objectEntries(testValuesRecord))("%s", ([key, testValues]) => {
  test.for(testValues)(
    `${ms.tasks.getTasks.name} method%s`,
    async ([, value]) => {
      const { results, ...r } = await ms.tasks.getTasks({ [key]: value });

      assert.isResult(r);

      for (const task of results) {
        assert.isTask(task);
      }
    },
  );

  test.for(testValues)(
    `${ms.batches.getBatches.name} method%s`,
    async ([, value]) => {
      const { results, ...r } = await ms.batches.getBatches({ [key]: value });

      assert.isResult(r);

      for (const batch of results) {
        assert.isBatch(batch);
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
        assert.isEnqueuedTask(summarizedTask);
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
        assert.isEnqueuedTask(summarizedTask);
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
