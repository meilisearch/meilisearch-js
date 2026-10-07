import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  vi,
  assert,
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
} from "../src/types/index.js";
import {
  clearAllIndexes,
  config,
  dataset,
  getClient,
} from "./utils/meilisearch-test-utils.js";

const index = {
  uid: "movies_test",
};

const enqueuedAt = "2020-01-01T00:00:00.000Z";

function task(uid: number, status: TaskStatus): Task {
  const queued = status === "enqueued" || status === "processing";

  return {
    uid,
    indexUid: index.uid,
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

function enqueuedTask(taskUid: number): EnqueuedTask {
  return {
    taskUid,
    indexUid: index.uid,
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

describe("TaskClient#waitForTask", () => {
  let taskClient: TaskClient;

  beforeEach(() => {
    taskClient = new TaskClient({} as HttpRequests);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("polling", () => {
    test("resolves once the task leaves enqueued and processing", async () => {
      const getTask = vi
        .spyOn(taskClient, "getTask")
        .mockResolvedValueOnce(task(1, "enqueued"))
        .mockResolvedValueOnce(task(1, "processing"))
        .mockResolvedValue(task(1, "succeeded"));

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
        vi.spyOn(taskClient, "getTask").mockResolvedValue(task(1, status));

        const result = await taskClient.waitForTask(1, {
          timeout: 0,
          interval: 0,
        });

        expect(result.status).toBe(status);
      },
    );
  });

  describe("timeout", () => {
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
        .mockResolvedValueOnce(task(1, "enqueued"))
        .mockResolvedValue(task(1, "succeeded"));

      await taskClient.waitForTask(1, { timeout: 0, interval: 0 });

      expect(abortControllers).not.toHaveBeenCalled();
    });
  });

  describe("interval", () => {
    test("sleeps for the given interval between polls", async () => {
      vi.useFakeTimers();
      const setTimeoutSpy = vi.spyOn(globalThis, "setTimeout");
      let polls = 0;
      vi.spyOn(taskClient, "getTask").mockImplementation(() => {
        polls += 1;
        const status =
          polls === 1 ? "enqueued" : polls === 2 ? "processing" : "succeeded";

        return Promise.resolve(task(1, status));
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
        .mockResolvedValueOnce(task(1, "enqueued"))
        .mockResolvedValueOnce(task(1, "processing"))
        .mockResolvedValue(task(1, "succeeded"));

      const result = await taskClient.waitForTask(1, {
        timeout: 0,
        interval: 0,
      });

      expect(result.status).toBe("succeeded");
      expect(getTask).toHaveBeenCalledTimes(3);
      expect(setTimeoutSpy).not.toHaveBeenCalled();
    });
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
});

describe("TaskClient#waitForTasks", () => {
  let taskClient: TaskClient;

  beforeEach(() => {
    taskClient = new TaskClient({} as HttpRequests);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  test("resolves each task in order", async () => {
    vi.spyOn(taskClient, "getTask").mockImplementation((uid) =>
      Promise.resolve(task(uid, "succeeded")),
    );

    const tasks = await taskClient.waitForTasks([enqueuedTask(1), 2], {
      timeout: 0,
      interval: 0,
    });

    expect(tasks.map((item) => item.uid)).toEqual([1, 2]);
  });

  test("throws MeilisearchTaskTimeOutError for the task that does not finish", async () => {
    vi.useFakeTimers();
    vi.spyOn(taskClient, "getTask").mockImplementation((uid, extra) => {
      if (uid === 1) {
        return Promise.resolve(task(1, "succeeded"));
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
      Promise.resolve(task(uid, "succeeded")),
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
});

describe("EnqueuedTaskPromise#waitTask", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("delegates to waitForTask with the enqueued task and options", async () => {
    const enqueued = enqueuedTask(3);
    const post = vi.fn().mockResolvedValue(enqueued);
    const httpRequest = { post } as unknown as HttpRequests;
    const taskClient = new TaskClient(httpRequest);
    const requests = getHttpRequestsWithEnqueuedTaskPromise(
      httpRequest,
      taskClient,
    );
    const succeeded = task(3, "succeeded");
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
});

afterAll(() => {
  return clearAllIndexes(config);
});

describe.each([{ permission: "Master" }, { permission: "Admin" }])(
  "Test on wait for task",
  ({ permission }) => {
    beforeEach(async () => {
      vi.useRealTimers();
      const client = await getClient("Master");
      await client.createIndex(index.uid).waitTask();
    });

    // Client Wait for task
    test(`${permission} key: Tests wait for task in client until done and resolved`, async () => {
      const client = await getClient(permission);
      const update = await client
        .index(index.uid)
        .addDocuments(dataset)
        .waitTask();

      assert.strictEqual(update.status, "succeeded");
    });

    test(`${permission} key: Tests wait for task in client with custom interval and timeout until done and resolved`, async () => {
      const client = await getClient(permission);
      const update = await client
        .index(index.uid)
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
        .index(index.uid)
        .addDocuments(dataset)
        .waitTask({
          timeout: 6000,
          interval: 0,
        });

      assert.strictEqual(update.status, "succeeded");
    });

    // Index Wait for task
    test(`${permission} key: Tests wait for task with an index instance`, async () => {
      const client = await getClient(permission);
      const update = await client
        .index(index.uid)
        .addDocuments(dataset)
        .waitTask();

      assert.strictEqual(update.status, "succeeded");
    });

    // Client Wait for tasks
    test(`${permission} key: Tests wait for tasks in client until done and resolved`, async () => {
      const client = await getClient(permission);
      const task1 = await client.index(index.uid).addDocuments(dataset);
      const task2 = await client.index(index.uid).addDocuments(dataset);

      const tasks = await client.tasks.waitForTasks([task1, task2]);
      const [update1, update2] = tasks;

      assert.strictEqual(update1.status, "succeeded");
      assert.strictEqual(update2.status, "succeeded");
    });

    test(`${permission} key: Tests wait for tasks in client with custom interval and timeout until done and resolved`, async () => {
      const client = await getClient(permission);
      const task1 = await client.index(index.uid).addDocuments(dataset);
      const task2 = await client.index(index.uid).addDocuments(dataset);

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
      const task1 = await client.index(index.uid).addDocuments(dataset);
      const task2 = await client.index(index.uid).addDocuments(dataset);

      const tasks = await client.tasks.waitForTasks([task1, task2], {
        timeout: 6000,
        interval: 0,
      });
      const [update1, update2] = tasks;

      assert.strictEqual(update1.status, "succeeded");
      assert.strictEqual(update2.status, "succeeded");
    });

    test(`${permission} key: Tests to wait for task that doesn't exist`, async () => {
      const client = await getClient(permission);

      await expect(
        client.tasks.waitForTask(424242424242),
      ).rejects.toHaveProperty("name", "MeilisearchApiError");
    });
  },
);
