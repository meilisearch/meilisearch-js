import type { ResponseError } from "../types/index.js";
import { MeiliSearchError } from "./meilisearch-error.js";

export class MeiliSearchApiError extends MeiliSearchError {
  override name = "MeiliSearchApiError";
  override cause?: ResponseError;
  readonly response: Response;

  constructor(response: Response, responseBody?: ResponseError) {
    super(
      responseBody?.message ?? `${response.status}: ${response.statusText}`,
    );

    this.response = response;

    if (responseBody !== undefined) {
      this.cause = responseBody;
    }
  }
}
