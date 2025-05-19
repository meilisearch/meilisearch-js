import { MeiliSearchError } from "./meilisearch-error.js";

/** Error thrown when a HTTP request times out. */
export class MeiliSearchRequestTimeOutError extends MeiliSearchError {
  override name = "MeiliSearchRequestTimeOutError";
  override cause: { timeout: number; requestInit: RequestInit };

  constructor(timeout: number, requestInit: RequestInit) {
    super(`request timed out after ${timeout}ms`);

    this.cause = { timeout, requestInit };
  }
}
