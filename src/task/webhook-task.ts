import type {
  EnqueuedTask,
  Task,
  WebhookTaskClientOptions,
} from "../types/index.js";
import { TIMEOUT_ID } from "./task.js";

type TimeoutID = ReturnType<typeof setTimeout>;
type TaskUid = EnqueuedTask["taskUid"];

function* parseNDJSONTasks(tasksString: string) {
  if (tasksString === "") {
    return;
  }

  let newLineIndex: number | undefined = undefined;
  for (;;) {
    const lastIndexPlusOneOrZero =
      newLineIndex === undefined ? 0 : newLineIndex + 1;
    newLineIndex = tasksString.indexOf("\n", lastIndexPlusOneOrZero);

    if (newLineIndex === -1) {
      newLineIndex = undefined;
    }

    yield JSON.parse(
      tasksString.substring(lastIndexPlusOneOrZero, newLineIndex),
    ) as Task;

    if (newLineIndex === undefined) {
      return;
    }
  }
}

export class WebhookTaskClient {
  readonly #taskMap = new Map<TaskUid, (task: Task) => void>();
  readonly #orphanTaskMap = new Map<
    TaskUid,
    { task: Task; timeoutId?: TimeoutID }
  >();
  readonly #timeout: number;
  readonly #timeoutCallback: (task: Task) => void;

  constructor(options?: WebhookTaskClientOptions) {
    this.#timeout = options?.timeout ?? 30_000;
    this.#timeoutCallback =
      options?.timeoutCallback ??
      ((task) => console.error("unclaimed orphan task", task));
  }

  pushTasksString(tasksString: string): void {
    for (const task of parseNDJSONTasks(tasksString)) {
      const callback = this.#taskMap.get(task.uid);

      if (callback !== undefined) {
        this.#taskMap.delete(task.uid);
        callback(task);

        return;
      }

      const timeoutId = setTimeout(() => {
        this.#orphanTaskMap.delete(task.uid);
        this.#timeoutCallback(task);
      }, this.#timeout);

      this.#orphanTaskMap.set(task.uid, { task, timeoutId });
    }
  }

  async waitForTask(taskUid: TaskUid, timeout?: number): Promise<Task> {
    const orphan = this.#orphanTaskMap.get(taskUid);

    if (orphan !== undefined) {
      clearTimeout(orphan.timeoutId);
      return orphan.task;
    }

    let to: TimeoutID | undefined = undefined;

    const task = await new Promise<Task>((resolve, reject) => {
      this.#taskMap.set(taskUid, resolve);
      to = setTimeout(() => {
        // TODO: This should be the same as in TaskClient
        // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
        reject(TIMEOUT_ID);
      }, timeout);
    });

    clearTimeout(to);

    return task;
  }

  // TODO: destroy method -> for every orphaned task call error method and clear timeouts
}
