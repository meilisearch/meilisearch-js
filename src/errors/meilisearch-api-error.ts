import { MeiliSearchErrorInfo as MeiliSearchErrorResponse } from '../types'
import { MeiliSearchError } from './meilisearch-error'

export class MeiliSearchApiError extends MeiliSearchError {
  override name = 'MeiliSearchApiError'
  override cause: MeiliSearchErrorResponse & { response: Response }

  constructor(responseBody: MeiliSearchErrorResponse, response: Response) {
    super(responseBody.message)
    this.cause = { response, ...responseBody }
  }
}
