import { MeiliSearchError } from "./meilisearch-error.js";

export class MeiliSearchTimeOutError extends MeiliSearchError {
  override name = "MeiliSearchTimeOutError";
}
