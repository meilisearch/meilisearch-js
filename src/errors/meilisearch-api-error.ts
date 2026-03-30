import type { MeilisearchErrorResponse } from "../types/index.js";
import { MeilisearchError } from "./meilisearch-error.js";

export class MeilisearchApiError extends MeilisearchError {
  override name = "MeilisearchApiError";
  override cause?: MeilisearchErrorResponse;
  readonly response: Response;

  constructor(response: Response, responseBody?: MeilisearchErrorResponse) {
    super(
      responseBody?.message ?? `${response.status}: ${response.statusText}`,
    );

    this.response = response;

    if (responseBody !== undefined) {
      this.cause = responseBody;
    }
  }
}
