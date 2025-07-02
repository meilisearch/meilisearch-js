import type { MeiliSearchErrorResponse } from "../types/index.js";
import { MeiliSearchError } from "./meilisearch-error.js";

export class MeiliSearchApiError extends MeiliSearchError {
  override name = "MeiliSearchApiError";
  override cause?: MeiliSearchErrorResponse;
  readonly details: unknown;

  constructor(
    responseBodyOrMessage: MeiliSearchErrorResponse | string,
    details: unknown,
  ) {
    super(
      typeof responseBodyOrMessage === "string"
        ? responseBodyOrMessage
        : responseBodyOrMessage.message,
    );

    this.details = details;

    if (typeof responseBodyOrMessage !== "string") {
      this.cause = responseBodyOrMessage;
    }
  }
}
