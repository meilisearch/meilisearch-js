import { MeilisearchError } from "./meilisearch-error.js";

export class MeilisearchRequestError extends MeilisearchError {
  override name = "MeilisearchRequestError";

  constructor(url: string, cause: unknown) {
    super(`Request to ${url} has failed`, { cause });
  }
}
