import { MeiliSearchTimeOutError } from "./errors/index.js";
import type {
  WaitOptions,
  TasksQuery,
  TasksResults,
  Task,
  CancelTasksQuery,
  DeleteTasksQuery,
  EnqueuedTask,
  EnqueuedTaskPromise,
} from "./types/index.js";
import { type HttpRequests, toQueryParams } from "./http-requests.js";

const DEFAULT_TIMEOUT = 5_000;
const DEFAULT_BATCH_TIMEOUT = 30_000;
const DEFAULT_INTERVAL = 50;

// TODO: Is there a way to pass context to this for stack trace? Is it even worth it?
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

type TaskUidOrEnqueuedTask =
  | number
  | (Record<string, unknown> & Pick<EnqueuedTask, "taskUid">);

const getTaskUid = (taskUidOrEnqueuedTask: TaskUidOrEnqueuedTask) =>
  typeof taskUidOrEnqueuedTask === "number"
    ? taskUidOrEnqueuedTask
    : taskUidOrEnqueuedTask.taskUid;

export class TaskClient {
  readonly #httpRequest: HttpRequests;

  constructor(httpRequest: HttpRequests) {
    this.#httpRequest = httpRequest;
  }

  /**
   * Get one task
   *
   * @param uid - Unique identifier of the task
   * @returns
   */
  async getTask(uid: number): Promise<Task> {
    const url = `tasks/${uid}`;

    const task = await this.#httpRequest.get<Task>(url);

    return task;
  }

  /**
   * Get tasks
   *
   * @param parameters - Parameters to browse the tasks
   * @returns Promise containing all tasks
   */
  async getTasks(parameters?: TasksQuery): Promise<TasksResults> {
    const url = `tasks`;

    const tasks = await this.#httpRequest.get<TasksResults>(
      url,
      toQueryParams<TasksQuery>(parameters ?? {}),
    );

    return tasks;
  }

  // TODO: Rename
  #taskThingy(
    taskUid: number,
    cbs: {
      successCb: (task: Task) => number | void;
      failureCb: (reason: unknown) => void;
    },
    waitOptions: Required<WaitOptions>,
  ) {
    let isFetchingTask = false;

    const interval = setInterval(() => {
      if (isFetchingTask) {
        return;
      }

      isFetchingTask = true;
      this.getTask(taskUid)
        .then((task) => {
          if (task.status !== "enqueued" && task.status !== "processing") {
            const newTaskUid = cbs.successCb(task);

            if (newTaskUid === undefined) {
              clearTimers();
            } else {
              taskUid = newTaskUid;
            }
          }
        })
        .catch((reason) => {
          clearTimers();
          cbs.failureCb(reason);
        })
        .finally(() => {
          isFetchingTask = false;
        });
    }, waitOptions.intervalMs);

    // TODO: This should only be for batches, otherwise should just set a timeout on HTTP request
    const timeout = setTimeout(() => {
      clearTimers();
      cbs.failureCb(
        new MeiliSearchTimeOutError(
          `timeout of ${waitOptions.timeOutMs}ms has exceeded on process ${taskUid} when waiting a task to be resolved.`,
        ),
      );
      // TODO: abort req
    }, waitOptions.timeOutMs);

    function clearTimers() {
      clearInterval(interval);
      clearTimeout(timeout);
    }
  }

  /**
   * Wait for a task to be processed.
   *
   * @param taskUidOrEnqueuedTask - Task identifier
   * @param options - Additional configuration options
   * @returns Promise returning a task after it has been processed
   */
  waitForTask(
    taskUidOrEnqueuedTask: TaskUidOrEnqueuedTask,
    options?: WaitOptions,
  ): Promise<Task> {
    const taskUid = getTaskUid(taskUidOrEnqueuedTask);

    return new Promise<Task>((resolve, reject) =>
      this.#taskThingy(
        taskUid,
        { successCb: resolve, failureCb: reject },
        {
          timeOutMs: options?.timeOutMs ?? DEFAULT_TIMEOUT,
          intervalMs: options?.intervalMs ?? DEFAULT_INTERVAL,
        },
      ),
    );
  }

  /**
   * Waits for multiple tasks to be processed
   *
   * @param taskUids - Tasks identifier list
   * @param options - Wait options
   * @returns Promise returning a list of tasks after they have been processed
   */
  async waitForTasks(
    taskUidsOrEnqueuedTasks: TaskUidOrEnqueuedTask[],
    options?: WaitOptions,
  ): Promise<Task[]> {
    const tasks = new Array(taskUidsOrEnqueuedTasks.length);
    let index = 0;

    return new Promise<Task[]>((resolve, reject) =>
      this.#taskThingy(
        getTaskUid(taskUidsOrEnqueuedTasks[index]),
        {
          successCb(task) {
            tasks[index] = task;
            index += 1;

            if (index !== taskUidsOrEnqueuedTasks.length) {
              return getTaskUid(taskUidsOrEnqueuedTasks[index]);
            }

            resolve(tasks);
          },
          failureCb: reject,
        },
        {
          timeOutMs: options?.timeOutMs ?? DEFAULT_BATCH_TIMEOUT,
          intervalMs: options?.intervalMs ?? DEFAULT_INTERVAL,
        },
      ),
    );
  }

  /**
   * Cancel a list of enqueued or processing tasks.
   *
   * @param parameters - Parameters to filter the tasks.
   * @returns Promise containing an EnqueuedTask
   */
  async cancelTasks(parameters: CancelTasksQuery): Promise<EnqueuedTask> {
    const url = `tasks/cancel`;

    const task = await this.#httpRequest.post(
      url,
      {},
      toQueryParams<CancelTasksQuery>(parameters),
    );

    return task;
  }

  /**
   * Delete a list tasks.
   *
   * @param parameters - Parameters to filter the tasks.
   * @returns Promise containing an EnqueuedTask
   */
  async deleteTasks(parameters: DeleteTasksQuery): Promise<EnqueuedTask> {
    const url = `tasks`;

    const task = await this.#httpRequest.delete(
      url,
      {},
      toQueryParams<DeleteTasksQuery>(parameters),
    );

    return task;
  }
}
