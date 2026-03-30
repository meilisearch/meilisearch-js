import { MeilisearchError } from "./meilisearch-error.js";

/** Error thrown when a waiting for a task times out. */
export class MeilisearchTaskTimeOutError extends MeilisearchError {
  override name = "MeilisearchTaskTimeOutError";
  override cause: { taskUid: number; timeout: number };

  constructor(taskUid: number, timeout: number) {
    super(
      `timeout of ${timeout}ms has exceeded on task ${taskUid} when waiting for it to be resolved.`,
    );

    this.cause = { taskUid, timeout };
  }
}
