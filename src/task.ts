import { MeiliSearchTimeOutError } from "./errors/index.js";
import type {
  WaitOptions,
  TasksOrBatchesQuery,
  TasksResults,
  Task,
  DeleteOrCancelTasksQuery,
  EnqueuedTask,
  EnqueuedTaskPromise,
  TaskUidOrEnqueuedTask,
} from "./types/index.js";
import { type HttpRequests, toQueryParams } from "./http-requests.js";

/**
 * @returns A function which defines an extra function property on a
 *   {@link Promise}, which resolves to {@link EnqueuedTask}, which awaits it and
 *   resolves to a {@link Task}.
 */
export function getWaitTaskApplier(
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
    this.#defaultInterval = defaultWaitOptions?.interval ?? 50; // 200
    this.#applyWaitTask = getWaitTaskApplier(this);
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/tasks#get-one-task} */
  async getTask(uid: number): Promise<Task> {
    const url = `tasks/${uid}`;

    const task = await this.#httpRequest.get<Task>(url);

    return task;
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/tasks#get-tasks} */
  async getTasks(parameters?: TasksOrBatchesQuery): Promise<TasksResults> {
    const url = `tasks`;

    const tasks = await this.#httpRequest.get<TasksResults>(
      url,
      toQueryParams<TasksOrBatchesQuery>(parameters ?? {}),
    );

    return tasks;
  }

  /**
   * Wait for an enqueued task to be processed.
   *
   * @remarks
   * If an {@link EnqueuedTask} needs to be awaited instantly, it is recommended
   * to instead use {@link EnqueuedTaskPromise.waitTask}, which is available on
   * any method that resolves to an {@link EnqueuedTask}.
   */
  waitForTask(
    taskUidOrEnqueuedTask: TaskUidOrEnqueuedTask,
    options?: WaitOptions,
  ): Promise<Task> {
    const taskUid = getTaskUid(taskUidOrEnqueuedTask);
    const timeout = options?.timeout ?? this.#defaultTimeout;
    const interval = options?.interval ?? this.#defaultInterval;

    return new Promise((resolve, reject) => {
      (async () => {
        const to =
          timeout !== 0
            ? setTimeout(() => {
                reject(
                  new MeiliSearchTimeOutError(
                    `timeout of ${timeout}ms has exceeded on process ${taskUid} when waiting a task to be resolved.`,
                  ),
                );
                // TODO: abort request, `getTask` should reject instead with the abort error
                // should first wait on https://github.com/meilisearch/meilisearch-js/pull/1741
              }, timeout)
            : undefined;

        try {
          for (;;) {
            const task = await this.getTask(taskUid);

            if (task.status !== "enqueued" && task.status !== "processing") {
              clearTimeout(to);
              resolve(task);
              return;
            }

            if (interval !== 0) {
              // TODO: clearTimeout + AbortSignal solution: https://mattrossman.com/2024/04/10/cancelling-the-javascript-sleep-function
              await new Promise((resolve) => setTimeout(resolve, interval));
            }
          }
        } catch (error) {
          clearTimeout(to);
          // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
          reject(error);
        }
      })().catch(reject);
    });
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
  cancelTasks(parameters: DeleteOrCancelTasksQuery): EnqueuedTaskPromise {
    const url = `tasks/cancel`;

    return this.#applyWaitTask(
      this.#httpRequest.post(
        url,
        {},
        toQueryParams<DeleteOrCancelTasksQuery>(parameters),
      ),
    );
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/tasks#delete-tasks} */
  deleteTasks(parameters: DeleteOrCancelTasksQuery): EnqueuedTaskPromise {
    const url = `tasks`;

    return this.#applyWaitTask(
      this.#httpRequest.delete(
        url,
        {},
        toQueryParams<DeleteOrCancelTasksQuery>(parameters),
      ),
    );
  }
}
