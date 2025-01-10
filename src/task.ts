import { MeiliSearchTimeOutError } from "./errors/index.js";
import type {
  WaitOptions,
  TasksQuery,
  TasksResults,
  Task,
  CancelTasksQuery,
  DeleteTasksQuery,
  EnqueuedTask,
} from "./types/index.js";
import { type HttpRequests, toQueryParams } from "./http-requests.js";

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
  async getTasks(parameters: TasksQuery): Promise<TasksResults> {
    const url = `tasks`;

    const tasks = await this.#httpRequest.get<TasksResults>(
      url,
      toQueryParams<TasksQuery>(parameters),
    );

    return tasks;
  }

  /**
   * Wait for a task to be processed.
   *
   * @param taskUid - Task identifier
   * @param options - Additional configuration options
   * @returns Promise returning a task after it has been processed
   */
  waitForTask(taskUid: number, options?: WaitOptions): Promise<Task> {
    const timeOutMs = options?.timeOutMs ?? 5_000;
    const intervalMs = options?.intervalMs ?? 50;

    return new Promise<Task>((resolve, reject) => {
      const interval = setInterval(() => {
        this.getTask(taskUid)
          .then((response) => {
            if (
              response.status === "enqueued" ||
              response.status === "processing"
            ) {
              clearTimers();
              resolve(response);
            }
          })
          .catch((error) => {
            clearTimers();
            // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
            reject(error);
          });
      }, intervalMs);

      const timeout = setTimeout(() => {
        clearTimers();
        reject(
          new MeiliSearchTimeOutError(
            `timeout of ${timeOutMs}ms has exceeded on process ${taskUid} when waiting a task to be resolved`,
          ),
        );
      }, timeOutMs);

      function clearTimers() {
        clearInterval(interval);
        clearTimeout(timeout);
      }
    });
  }

  /**
   * Waits for multiple tasks to be processed
   *
   * @param taskUids - Tasks identifier list
   * @param options - Wait options
   * @returns Promise returning a list of tasks after they have been processed
   */
  async waitForTasks(
    taskUids: number[],
    options?: WaitOptions,
  ): Promise<Task[]> {
    const tasks: Task[] = new Array(taskUids.length);

    for (const taskUid of taskUids) {
      tasks.push(await this.waitForTask(taskUid, options));
    }

    return tasks;
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
