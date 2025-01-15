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

const DEFAULT_TIMEOUT = 5_000;
const DEFAULT_INTERVAL = 50;

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

  constructor(httpRequest: HttpRequests) {
    this.#httpRequest = httpRequest;
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
   * It is recommended to instead use {@link EnqueuedTaskPromise.waitTask}, which
   * is available on any method that resolves to an {@link EnqueuedTask}.
   */
  waitForTask(
    taskUidOrEnqueuedTask: TaskUidOrEnqueuedTask,
    options?: WaitOptions,
  ): Promise<Task> {
    const taskUid = getTaskUid(taskUidOrEnqueuedTask);
    const timeout = options?.timeout ?? DEFAULT_TIMEOUT;
    const interval = options?.interval ?? DEFAULT_INTERVAL;

    return new Promise<Task>((resolve, reject) => {
      let isFetchingTask = false;

      const int = setInterval(() => {
        if (isFetchingTask) {
          return;
        }

        isFetchingTask = true;
        this.getTask(taskUid)
          .then((task) => {
            if (task.status !== "enqueued" && task.status !== "processing") {
              resolve(task);
            }
          })
          .catch((reason) => {
            clearTimers();
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            reject(reason);
          })
          .finally(() => {
            isFetchingTask = false;
          });
      }, interval);

      const to =
        timeout !== 0
          ? setTimeout(() => {
              clearTimers();
              reject(
                new MeiliSearchTimeOutError(
                  `timeout of ${timeout}ms has exceeded on process ${taskUid} when waiting a task to be resolved.`,
                ),
              );
              // TODO: abort request
              // should first wait on https://github.com/meilisearch/meilisearch-js/pull/1741
            }, timeout)
          : null;

      function clearTimers() {
        clearInterval(int);
        if (to !== null) {
          clearTimeout(to);
        }
      }
    });
  }

  /** Lazily wait for multiple enqueued tasks to be processed. */
  async *waitForTasksIter(
    taskUidsOrEnqueuedTasks: Iterable<TaskUidOrEnqueuedTask>,
    options?: WaitOptions,
  ): AsyncGenerator<Task, void, undefined> {
    for (const taskUidOrEnqueuedTask of taskUidsOrEnqueuedTasks) {
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
  async cancelTasks(
    parameters: DeleteOrCancelTasksQuery,
  ): Promise<EnqueuedTask> {
    const url = `tasks/cancel`;

    const task = await this.#httpRequest.post(
      url,
      {},
      toQueryParams<DeleteOrCancelTasksQuery>(parameters),
    );

    return task;
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/tasks#delete-tasks} */
  async deleteTasks(
    parameters: DeleteOrCancelTasksQuery,
  ): Promise<EnqueuedTask> {
    const url = `tasks`;

    const task = await this.#httpRequest.delete(
      url,
      {},
      toQueryParams<DeleteOrCancelTasksQuery>(parameters),
    );

    return task;
  }
}
