import { MeiliSearchTaskTimeOutError } from "./errors/index.js";
import type {
  WaitOptions,
  TasksOrBatchesQuery,
  TasksResults,
  Task,
  DeleteOrCancelTasksQuery,
  EnqueuedTask,
  EnqueuedTaskPromise,
  TaskUidOrEnqueuedTask,
  ExtraRequestInit,
} from "./types/index.js";
import type { HttpRequests } from "./http-requests.js";

/**
 * Used to identify whether an error is a timeout error in
 * {@link TaskClient.waitForTask}.
 */
const TIMEOUT_ID = Symbol("<task timeout>");

/**
 * @returns A function which defines an extra function property on a
 *   {@link Promise}, which resolves to {@link EnqueuedTask}, which awaits it and
 *   resolves to a {@link Task}.
 */
function getWaitTaskApplier(
  taskClient: TaskClient,
): (enqueuedTaskPromise: Promise<EnqueuedTask>) => EnqueuedTaskPromise {
  return function (
    enqueuedTaskPromise: Promise<EnqueuedTask>,
  ): EnqueuedTaskPromise {
    return Object.defineProperty(
      enqueuedTaskPromise,
      "waitTask" satisfies keyof Pick<EnqueuedTaskPromise, "waitTask">,
      {
        async value(waitOptions?: WaitOptions): Promise<Task> {
          return await taskClient.waitForTask(
            await enqueuedTaskPromise,
            waitOptions,
          );
        },
      },
    ) as EnqueuedTaskPromise;
  };
}

const getTaskUid = (taskUidOrEnqueuedTask: TaskUidOrEnqueuedTask): number =>
  typeof taskUidOrEnqueuedTask === "number"
    ? taskUidOrEnqueuedTask
    : taskUidOrEnqueuedTask.taskUid;

/**
 * Class for handling tasks.
 *
 * @see {@link https://www.meilisearch.com/docs/reference/api/tasks}
 */
export class TaskClient {
  readonly #httpRequest: HttpRequests;
  readonly #defaultTimeout: number;
  readonly #defaultInterval: number;
  readonly #applyWaitTask: ReturnType<typeof getWaitTaskApplier>;

  constructor(httpRequest: HttpRequests, defaultWaitOptions?: WaitOptions) {
    this.#httpRequest = httpRequest;
    this.#defaultTimeout = defaultWaitOptions?.timeout ?? 5_000;
    this.#defaultInterval = defaultWaitOptions?.interval ?? 50;
    this.#applyWaitTask = getWaitTaskApplier(this);
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/tasks#get-one-task} */
  async getTask(
    uid: number,
    // TODO: Need to do this for all other methods: https://github.com/meilisearch/meilisearch-js/issues/1476
    extraRequestInit?: ExtraRequestInit,
  ): Promise<Task> {
    return await this.#httpRequest.get({
      path: `tasks/${uid}`,
      extraRequestInit,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/tasks#get-tasks} */
  async getTasks(params?: TasksOrBatchesQuery): Promise<TasksResults> {
    return await this.#httpRequest.get({ path: "tasks", params });
  }

  /**
   * Wait for an enqueued task to be processed. This is done through polling
   * with {@link TaskClient.getTask}.
   *
   * @remarks
   * If an {@link EnqueuedTask} needs to be awaited instantly, it is recommended
   * to instead use {@link EnqueuedTaskPromise.waitTask}, which is available on
   * any method that returns an {@link EnqueuedTaskPromise}.
   */
  async waitForTask(
    taskUidOrEnqueuedTask: TaskUidOrEnqueuedTask,
    options?: WaitOptions,
  ): Promise<Task> {
    const taskUid = getTaskUid(taskUidOrEnqueuedTask);
    const timeout = options?.timeout ?? this.#defaultTimeout;
    const interval = options?.interval ?? this.#defaultInterval;

    const ac = timeout > 0 ? new AbortController() : null;

    const toId =
      ac !== null
        ? setTimeout(() => void ac.abort(TIMEOUT_ID), timeout)
        : undefined;

    try {
      for (;;) {
        const task = await this.getTask(taskUid, { signal: ac?.signal });

        if (task.status !== "enqueued" && task.status !== "processing") {
          clearTimeout(toId);
          return task;
        }

        if (interval > 0) {
          await new Promise((resolve) => setTimeout(resolve, interval));
        }
      }
    } catch (error) {
      throw Object.is((error as Error).cause, TIMEOUT_ID)
        ? new MeiliSearchTaskTimeOutError(taskUid, timeout)
        : error;
    }
  }

  /**
   * Lazily wait for multiple enqueued tasks to be processed.
   *
   * @remarks
   * In this case {@link WaitOptions.timeout} is the maximum time to wait for any
   * one task, not for all of the tasks to complete.
   */
  async *waitForTasksIter(
    taskUidsOrEnqueuedTasks:
      | Iterable<TaskUidOrEnqueuedTask>
      | AsyncIterable<TaskUidOrEnqueuedTask>,
    options?: WaitOptions,
  ): AsyncGenerator<Task, void, undefined> {
    for await (const taskUidOrEnqueuedTask of taskUidsOrEnqueuedTasks) {
      yield await this.waitForTask(taskUidOrEnqueuedTask, options);
    }
  }

  /** Wait for multiple enqueued tasks to be processed. */
  async waitForTasks(
    ...params: Parameters<typeof this.waitForTasksIter>
  ): Promise<Task[]> {
    const tasks: Task[] = [];

    for await (const task of this.waitForTasksIter(...params)) {
      tasks.push(task);
    }

    return tasks;
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/tasks#cancel-tasks} */
  cancelTasks(params: DeleteOrCancelTasksQuery): EnqueuedTaskPromise {
    return this.#applyWaitTask(
      this.#httpRequest.post({ path: "tasks/cancel", params }),
    );
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/tasks#delete-tasks} */
  deleteTasks(params: DeleteOrCancelTasksQuery): EnqueuedTaskPromise {
    return this.#applyWaitTask(
      this.#httpRequest.delete({ path: "tasks", params }),
    );
  }
}

type PickedHttpRequestMethods = Pick<
  HttpRequests,
  "post" | "put" | "patch" | "delete"
>;
export type HttpRequestsWithEnqueuedTaskPromise = {
  [TKey in keyof PickedHttpRequestMethods]: (
    ...params: Parameters<PickedHttpRequestMethods[TKey]>
  ) => EnqueuedTaskPromise;
};

export function getHttpRequestsWithEnqueuedTaskPromise(
  httpRequest: HttpRequests,
  taskClient: TaskClient,
): HttpRequestsWithEnqueuedTaskPromise {
  const applyWaitTask = getWaitTaskApplier(taskClient);

  return {
    post: (...params) => applyWaitTask(httpRequest.post(...params)),
    put: (...params) => applyWaitTask(httpRequest.put(...params)),
    patch: (...params) => applyWaitTask(httpRequest.patch(...params)),
    delete: (...params) => applyWaitTask(httpRequest.delete(...params)),
  };
}
