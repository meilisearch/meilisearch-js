import { MeiliSearchError } from './meilisearch-error'

export class MeiliSearchRequestError extends MeiliSearchError {
  override name = 'MeiliSearchRequestError'

  constructor(cause: unknown) {
    super("Request to Meilisearch endpoint has failed", { cause })
  }
}
