import { randomUUID } from "node:crypto";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
} from "vitest";
import { MeilisearchApiError } from "../src/errors/index.js";
import type { HttpRequests } from "../src/http-requests.js";
import {
  getHttpRequestsWithEnqueuedTaskPromise,
  TaskClient,
} from "../src/task.js";
import type {
  EnqueuedTask,
  ExtraRequestInit,
  Task,
  TaskStatus,
  TasksOrBatchesQuery,
} from "../src/types/index.js";
import {
  assert,
  clearAllIndexes,
  config,
  dataset,
  getClient,
  objectEntries,
} from "./utils/meilisearch-test-utils.js";
import {
  possibleTaskStatuses,
  possibleTaskTypes,
} from "./utils/assertions/tasks-and-batches.js";

const INDEX_UID = randomUUID();
const moviesUid = "movies_test";
const ms = await getClient("Master");
const index = ms.index(INDEX_UID);
const enqueuedAt = "2020-01-01T00:00:00.000Z";
const permissions = [
  { permission: "Master" },
  { permission: "Admin" },
] as const;

function taskWithStatus(uid: number, status: TaskStatus): Task {
  const queued = status === "enqueued" || status === "processing";

  return {
    uid,
    indexUid: moviesUid,
    status,
    type: "documentAdditionOrUpdate",
    enqueuedAt,
    batchUid: queued ? null : 1,
    canceledBy: null,
    error: null,
    duration: queued ? null : "PT0.01S",
    startedAt: status === "enqueued" ? null : enqueuedAt,
    finishedAt: queued ? null : enqueuedAt,
  };
}

function summarizedTask(taskUid: number): EnqueuedTask {
  return {
    taskUid,
    indexUid: moviesUid,
    status: "enqueued",
    type: "documentAdditionOrUpdate",
    enqueuedAt,
  };
}

/**
 * Hang until the wait timeout aborts `signal`. `cause` is the abort reason,
 * which is the shape {@link TaskClient.waitForTask} sees after
 * {@link HttpRequests} wraps a fetch rejection.
 */
function rejectedOnAbort(signal: ExtraRequestInit["signal"]): Promise<never> {
  return new Promise((_resolve, reject) => {
    if (signal == null) {
      return;
    }

    const rejectOnAbort = () => {
      reject(new Error("The operation was aborted.", { cause: signal.reason }));
    };

    if (signal.aborted) {
      rejectOnAbort();
      return;
    }

    signal.addEventListener("abort", rejectOnAbort, { once: true });
  });
}

function prepareMoviesIndex(): void {
  beforeEach(async () => {
    vi.useRealTimers();
    const client = await getClient("Master");
    await client.createIndex(moviesUid).waitTask();
  });
}

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

afterAll(() => {
  return clearAllIndexes(config);
});

describe("TaskClient", () => {
  let taskClient: TaskClient;

  beforeEach(() => {
    taskClient = new TaskClient({} as HttpRequests);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("waitForTask", () => {
    test("resolves once the task leaves enqueued and processing", async () => {
      const getTask = vi
        .spyOn(taskClient, "getTask")
        .mockResolvedValueOnce(taskWithStatus(1, "enqueued"))
        .mockResolvedValueOnce(taskWithStatus(1, "processing"))
        .mockResolvedValue(taskWithStatus(1, "succeeded"));

      const result = await taskClient.waitForTask(1, {
        timeout: 0,
        interval: 0,
      });

      expect(result.status).toBe("succeeded");
      expect(getTask).toHaveBeenCalledTimes(3);
    });

    test.each(["failed", "canceled"] as const)(
      "returns a %s task without throwing",
      async (status) => {
        vi.spyOn(taskClient, "getTask").mockResolvedValue(
          taskWithStatus(1, status),
        );

        const result = await taskClient.waitForTask(1, {
          timeout: 0,
          interval: 0,
        });

        expect(result.status).toBe(status);
      },
    );

    test("throws MeilisearchTaskTimeOutError when the task does not finish", async () => {
      vi.useFakeTimers();
      vi.spyOn(taskClient, "getTask").mockImplementation((_uid, extra) =>
        rejectedOnAbort(extra?.signal),
      );

      const pending = taskClient.waitForTask(4, { timeout: 50, interval: 0 });

      await expect(
        Promise.all([pending, vi.runAllTimersAsync()]),
      ).rejects.toMatchObject({
        name: "MeilisearchTaskTimeOutError",
        cause: { taskUid: 4, timeout: 50 },
      });
    });

    test("does not abort when timeout is less than 1", async () => {
      const abortControllers = vi.spyOn(globalThis, "AbortController");
      vi.spyOn(taskClient, "getTask")
        .mockResolvedValueOnce(taskWithStatus(1, "enqueued"))
        .mockResolvedValue(taskWithStatus(1, "succeeded"));

      await taskClient.waitForTask(1, { timeout: 0, interval: 0 });

      expect(abortControllers).not.toHaveBeenCalled();
    });

    test("sleeps for the given interval between polls", async () => {
      vi.useFakeTimers();
      const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
      let polls = 0;
      vi.spyOn(taskClient, "getTask").mockImplementation(() => {
        polls += 1;
        const status =
          polls === 1 ? "enqueued" : polls === 2 ? "processing" : "succeeded";

        return Promise.resolve(taskWithStatus(1, status));
      });

      const pending = taskClient.waitForTask(1, { timeout: 0, interval: 25 });

      await vi.advanceTimersByTimeAsync(0);
      expect(polls).toBe(1);

      await vi.advanceTimersByTimeAsync(24);
      expect(polls).toBe(1);

      await vi.advanceTimersByTimeAsync(1);
      expect(polls).toBe(2);

      await vi.advanceTimersByTimeAsync(24);
      expect(polls).toBe(2);

      await vi.advanceTimersByTimeAsync(1);
      expect(polls).toBe(3);

      await expect(pending).resolves.toMatchObject({ status: "succeeded" });
      expect(setTimeoutSpy.mock.calls.map(([, delay]) => delay)).toEqual([
        25, 25,
      ]);
    });

    test("does not sleep between polls when interval is less than 1", async () => {
      const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
      const getTask = vi
        .spyOn(taskClient, "getTask")
        .mockResolvedValueOnce(taskWithStatus(1, "enqueued"))
        .mockResolvedValueOnce(taskWithStatus(1, "processing"))
        .mockResolvedValue(taskWithStatus(1, "succeeded"));

      const result = await taskClient.waitForTask(1, {
        timeout: 0,
        interval: 0,
      });

      expect(result.status).toBe("succeeded");
      expect(getTask).toHaveBeenCalledTimes(3);
      expect(setTimeoutSpy).not.toHaveBeenCalled();
    });

    test("rethrows MeilisearchApiError from getTask", async () => {
      const apiError = new MeilisearchApiError(
        new Response(null, { status: 404, statusText: "Not Found" }),
        {
          message: "Task `424242424242` not found.",
          code: "task_not_found",
          type: "invalid_request",
          link: "https://docs.meilisearch.com/errors#task_not_found",
        },
      );
      vi.spyOn(taskClient, "getTask").mockRejectedValue(apiError);

      await expect(
        taskClient.waitForTask(424242424242, { timeout: 0, interval: 0 }),
      ).rejects.toBe(apiError);
    });

    test("resolves an enqueued task and a task uid", async () => {
      const enqueued = await index.addDocuments([{ id: 1 }, { id: 2 }]);
      assert.isEnqueuedTask(enqueued);

      const taskThroughGet = await ms.tasks.getTask(enqueued.taskUid);
      assert.isTask(taskThroughGet);

      const taskThroughWaitOne = await ms.tasks.waitForTask(enqueued, {
        interval: 42,
        timeout: 61_234,
      });
      assert.isTask(taskThroughWaitOne);

      const taskThroughWaitTwo = await ms.tasks.waitForTask(enqueued.taskUid);
      assert.isTask(taskThroughWaitTwo);
    });

    describe.each(permissions)("$permission key", ({ permission }) => {
      prepareMoviesIndex();

      test(`${permission} key: Tests to wait for task that doesn't exist`, async () => {
        const client = await getClient(permission);

        await expect(
          client.tasks.waitForTask(424242424242),
        ).rejects.toHaveProperty("name", "MeilisearchApiError");
      });
    });
  });

  describe("waitForTasks", () => {
    test("resolves each task in order", async () => {
      vi.spyOn(taskClient, "getTask").mockImplementation((uid) =>
        Promise.resolve(taskWithStatus(uid, "succeeded")),
      );

      const tasks = await taskClient.waitForTasks([summarizedTask(1), 2], {
        timeout: 0,
        interval: 0,
      });

      expect(tasks.map((item) => item.uid)).toEqual([1, 2]);
    });

    test("throws MeilisearchTaskTimeOutError for the task that does not finish", async () => {
      vi.useFakeTimers();
      vi.spyOn(taskClient, "getTask").mockImplementation((uid, extra) => {
        if (uid === 1) {
          return Promise.resolve(taskWithStatus(1, "succeeded"));
        }

        return rejectedOnAbort(extra?.signal);
      });

      const pending = taskClient.waitForTasks([1, 2], {
        timeout: 40,
        interval: 0,
      });

      await expect(
        Promise.all([pending, vi.runAllTimersAsync()]),
      ).rejects.toMatchObject({
        name: "MeilisearchTaskTimeOutError",
        cause: { taskUid: 2, timeout: 40 },
      });
    });

    test("starts a new timeout for each task", async () => {
      const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
      vi.spyOn(taskClient, "getTask").mockImplementation((uid) =>
        Promise.resolve(taskWithStatus(uid, "succeeded")),
      );

      const tasks = await taskClient.waitForTasks([1, 2], {
        timeout: 80,
        interval: 0,
      });

      expect(tasks.map((item) => item.uid)).toEqual([1, 2]);
      expect(
        setTimeoutSpy.mock.calls
          .map(([, delay]) => delay)
          .filter((delay) => delay === 80),
      ).toHaveLength(2);
    });

    // this implicitly also tests `waitForTasksIter` (`waitForTasks` depends on it)
    test("resolves enqueued document additions", async () => {
      const enqueuedTasks = await Promise.all([
        index.addDocuments([{ id: 3 }, { id: 4 }]),
        index.addDocuments([{ id: 5 }, { id: 6 }]),
        index.addDocuments([{ id: 7 }, { id: 8 }]),
      ]);

      for (const enqueued of enqueuedTasks) {
        assert.isEnqueuedTask(enqueued);
      }

      const tasks = await ms.tasks.waitForTasks(enqueuedTasks);

      for (const task of tasks) {
        assert.isTask(task);
      }
    });

    describe.each(permissions)("$permission key", ({ permission }) => {
      prepareMoviesIndex();

      test(`${permission} key: Tests wait for tasks in client until done and resolved`, async () => {
        const client = await getClient(permission);
        const task1 = await client.index(moviesUid).addDocuments(dataset);
        const task2 = await client.index(moviesUid).addDocuments(dataset);

        const tasks = await client.tasks.waitForTasks([task1, task2]);
        const [update1, update2] = tasks;

        assert.strictEqual(update1.status, "succeeded");
        assert.strictEqual(update2.status, "succeeded");
      });

      test(`${permission} key: Tests wait for tasks in client with custom interval and timeout until done and resolved`, async () => {
        const client = await getClient(permission);
        const task1 = await client.index(moviesUid).addDocuments(dataset);
        const task2 = await client.index(moviesUid).addDocuments(dataset);

        const tasks = await client.tasks.waitForTasks([task1, task2], {
          timeout: 6000,
          interval: 100,
        });
        const [update1, update2] = tasks;

        assert.strictEqual(update1.status, "succeeded");
        assert.strictEqual(update2.status, "succeeded");
      });

      test(`${permission} key: Tests wait for tasks in client with custom timeout and interval at 0 done and resolved`, async () => {
        const client = await getClient(permission);
        const task1 = await client.index(moviesUid).addDocuments(dataset);
        const task2 = await client.index(moviesUid).addDocuments(dataset);

        const tasks = await client.tasks.waitForTasks([task1, task2], {
          timeout: 6000,
          interval: 0,
        });
        const [update1, update2] = tasks;

        assert.strictEqual(update1.status, "succeeded");
        assert.strictEqual(update2.status, "succeeded");
      });
    });
  });
});

describe("EnqueuedTaskPromise", () => {
  describe("waitTask", () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    test("delegates to waitForTask with the enqueued task and options", async () => {
      const enqueued = summarizedTask(3);
      const post = vi.fn().mockResolvedValue(enqueued);
      const httpRequest = { post } as unknown as HttpRequests;
      const taskClient = new TaskClient(httpRequest);
      const requests = getHttpRequestsWithEnqueuedTaskPromise(
        httpRequest,
        taskClient,
      );
      const succeeded = taskWithStatus(3, "succeeded");
      const waitForTask = vi
        .spyOn(taskClient, "waitForTask")
        .mockResolvedValue(succeeded);
      const options = { timeout: 10, interval: 1 };

      const result = await requests
        .post({ path: "indexes/movies_test/documents" })
        .waitTask(options);

      expect(post).toHaveBeenCalledTimes(1);
      expect(waitForTask).toHaveBeenCalledTimes(1);
      expect(waitForTask).toHaveBeenCalledWith(enqueued, options);
      expect(result).toBe(succeeded);
    });

    describe.each(permissions)("$permission key", ({ permission }) => {
      prepareMoviesIndex();

      test(`${permission} key: Tests wait for task in client until done and resolved`, async () => {
        const client = await getClient(permission);
        const update = await client
          .index(moviesUid)
          .addDocuments(dataset)
          .waitTask();

        assert.strictEqual(update.status, "succeeded");
      });

      test(`${permission} key: Tests wait for task in client with custom interval and timeout until done and resolved`, async () => {
        const client = await getClient(permission);
        const update = await client
          .index(moviesUid)
          .addDocuments(dataset)
          .waitTask({
            timeout: 6000,
            interval: 100,
          });

        assert.strictEqual(update.status, "succeeded");
      });

      test(`${permission} key: Tests wait for task in client with custom timeout and interval at 0 done and resolved`, async () => {
        const client = await getClient(permission);
        const update = await client
          .index(moviesUid)
          .addDocuments(dataset)
          .waitTask({
            timeout: 6000,
            interval: 0,
          });

        assert.strictEqual(update.status, "succeeded");
      });

      test(`${permission} key: Tests wait for task with an index instance`, async () => {
        const client = await getClient(permission);
        const update = await client
          .index(moviesUid)
          .addDocuments(dataset)
          .waitTask();

        assert.strictEqual(update.status, "succeeded");
      });
    });
  });
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
      const tasksResults = await ms.tasks.getTasks({ [key]: value });

      assert.isTasksOrBatchesResults(tasksResults);

      for (const task of tasksResults.results) {
        assert.isTask(task);
      }
    },
  );

  test.for(testValues)(
    `${ms.batches.getBatches.name} method%s`,
    async ([, value]) => {
      const batchesResults = await ms.batches.getBatches({ [key]: value });

      assert.isTasksOrBatchesResults(batchesResults);

      for (const batch of batchesResults.results) {
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
        const enqueuedTask = await ms.tasks.cancelTasks({ [key]: value });
        assert.isEnqueuedTask(enqueuedTask);
        const task = await ms.tasks.waitForTask(enqueuedTask);
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
        const enqueuedTask = await ms.tasks.deleteTasks({ [key]: value });
        assert.isEnqueuedTask(enqueuedTask);
        const task = await ms.tasks.waitForTask(enqueuedTask);
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
