import { MeiliSearchError } from "./meilisearch-error";

export class MeiliSearchRequestError extends MeiliSearchError {
  override name = "MeiliSearchRequestError";

  constructor(url: string, cause: unknown) {
    super(`Request to ${url} has failed`, { cause });
  }
}
