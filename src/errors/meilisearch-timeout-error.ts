import { MeiliSearchError } from "./meilisearch-error";

export class MeiliSearchTimeOutError extends MeiliSearchError {
  override name = "MeiliSearchTimeOutError";

  constructor(message: string) {
    super(message);
  }
}
