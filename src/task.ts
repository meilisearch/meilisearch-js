import { MeiliSearchTaskTimeOutError } from "./errors/index.js";
import type {
  WaitOptions,
  TasksFilterQuery,
  AllTasks,
  TaskView,
  TaskDeletionOrCancelationQuery,
  SummarizedTaskView,
  SummarizedTaskPromise,
  TaskUidOrSummarizedTaskView,
  ExtraRequestInit,
} from "./types/index.js";
import type { HttpRequests } from "./http-requests.js";

// TODO: Convert to Symbol("timeout id") when Node.js 18 is dropped
/**
 * Used to identify whether an error is a timeout error in
 * {@link TaskClient.waitForTask}.
 */
const TIMEOUT_ID = {};

/**
 * @returns A function which defines an extra function property on a
 *   {@link Promise}, which resolves to {@link SummarizedTaskView}, which awaits
 *   it and resolves to a {@link TaskView}.
 */
function getWaitTaskApplier(
  taskClient: TaskClient,
): (
  summarizedTaskPromise: Promise<SummarizedTaskView>,
) => SummarizedTaskPromise {
  return function (
    summarizedTaskPromise: Promise<SummarizedTaskView>,
  ): SummarizedTaskPromise {
    return Object.defineProperty(
      summarizedTaskPromise,
      "waitTask" satisfies keyof Pick<SummarizedTaskPromise, "waitTask">,
      {
        async value(waitOptions?: WaitOptions): Promise<TaskView> {
          return await taskClient.waitForTask(
            await summarizedTaskPromise,
            waitOptions,
          );
        },
      },
    ) as SummarizedTaskPromise;
  };
}

const getTaskUid = (
  taskUidOrSummarizedTask: TaskUidOrSummarizedTaskView,
): number =>
  typeof taskUidOrSummarizedTask === "number"
    ? taskUidOrSummarizedTask
    : taskUidOrSummarizedTask.taskUid;

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
  ): Promise<TaskView> {
    return await this.#httpRequest.get<TaskView>({
      path: `tasks/${uid}`,
      extraRequestInit,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/tasks#get-tasks} */
  async getTasks(params?: TasksFilterQuery): Promise<AllTasks> {
    return await this.#httpRequest.get({ path: "tasks", params });
  }

  /**
   * Wait for an enqueued task to be processed. This is done through polling
   * with {@link TaskClient.getTask}.
   *
   * @remarks
   * If a {@link SummarizedTaskView} needs to be awaited instantly, it is
   * recommended to instead use {@link SummarizedTaskPromise.waitTask}, which is
   * available on any method that returns a {@link SummarizedTaskPromise}.
   */
  async waitForTask(
    taskUidOrSummarizedTask: TaskUidOrSummarizedTaskView,
    options?: WaitOptions,
  ): Promise<TaskView> {
    const taskUid = getTaskUid(taskUidOrSummarizedTask);
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
    taskUidsOrSummarizedTasks:
      | Iterable<TaskUidOrSummarizedTaskView>
      | AsyncIterable<TaskUidOrSummarizedTaskView>,
    options?: WaitOptions,
  ): AsyncGenerator<TaskView, void, undefined> {
    for await (const taskUidOrSummarizedTask of taskUidsOrSummarizedTasks) {
      yield await this.waitForTask(taskUidOrSummarizedTask, options);
    }
  }

  /** Wait for multiple enqueued tasks to be processed. */
  async waitForTasks(
    ...params: Parameters<typeof this.waitForTasksIter>
  ): Promise<TaskView[]> {
    const tasks: TaskView[] = [];

    for await (const task of this.waitForTasksIter(...params)) {
      tasks.push(task);
    }

    return tasks;
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/tasks#cancel-tasks} */
  cancelTasks(params: TaskDeletionOrCancelationQuery): SummarizedTaskPromise {
    return this.#applyWaitTask(
      this.#httpRequest.post({ path: "tasks/cancel", params }),
    );
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/tasks#delete-tasks} */
  deleteTasks(params: TaskDeletionOrCancelationQuery): SummarizedTaskPromise {
    return this.#applyWaitTask(
      this.#httpRequest.delete({ path: "tasks", params }),
    );
  }
}

type PickedHttpRequestMethods = Pick<
  HttpRequests,
  "post" | "put" | "patch" | "delete"
>;
export type HttpRequestsWithSummarizedTaskPromise = {
  [TKey in keyof PickedHttpRequestMethods]: (
    ...params: Parameters<PickedHttpRequestMethods[TKey]>
  ) => SummarizedTaskPromise;
};

export function getHttpRequestsWithSummarizedTaskPromise(
  httpRequest: HttpRequests,
  taskClient: TaskClient,
): HttpRequestsWithSummarizedTaskPromise {
  const applyWaitTask = getWaitTaskApplier(taskClient);

  return {
    post: (...params) => applyWaitTask(httpRequest.post(...params)),
    put: (...params) => applyWaitTask(httpRequest.put(...params)),
    patch: (...params) => applyWaitTask(httpRequest.patch(...params)),
    delete: (...params) => applyWaitTask(httpRequest.delete(...params)),
  };
}
