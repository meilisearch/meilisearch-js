import { MeilisearchError } from "./meilisearch-error.js";

/** Error thrown when a HTTP request times out. */
export class MeilisearchRequestTimeOutError extends MeilisearchError {
  override name = "MeilisearchRequestTimeOutError";
  override cause: { timeout: number; requestInit: RequestInit };

  /**
   * Builds a timeout error whose `cause` keeps the request details for
   * debugging but with the `Authorization` header redacted, so the API key
   * never leaks into logs or error trackers.
   */
  constructor(timeout: number, requestInit: RequestInit) {
    super(`request timed out after ${timeout}ms`);

    // Never expose credentials: the init headers carry the
    // `Authorization: Bearer <apiKey>` header, which would otherwise leak
    // into logs and error trackers via `error.cause`.
    const headers = new Headers(requestInit.headers);
    if (headers.has("Authorization")) {
      headers.set("Authorization", "<redacted>");
    }

    this.cause = { timeout, requestInit: { ...requestInit, headers } };
  }
}
