import { MeiliSearchError } from "./meilisearch-error.js";

export class MeiliSearchTaskTimeOutError extends MeiliSearchError {
  override name = "MeiliSearchTaskTimeOutError";
  override cause: { taskUid: number; timeout: number };

  constructor(taskUid: number, timeout: number) {
    super(
      `timeout of ${timeout}ms has exceeded on task ${taskUid} when waiting for it to be resolved.`,
    );

    this.cause = { taskUid, timeout };
  }
}
