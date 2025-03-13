import { MeiliSearchError } from "./meilisearch-error.js";

export class MeiliSearchRequestTimeOutError extends MeiliSearchError {
  override name = "MeiliSearchRequestTimeOutError";
  override cause: { timeout: number; requestInit: RequestInit };

  constructor(timeout: number, requestInit: RequestInit) {
    super(`request timed out after ${timeout}ms`);

    this.cause = { timeout, requestInit };
  }
}
