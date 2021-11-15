import { MeiliSearchCommunicationError } from './meilisearch-communication-error'
import { MeiliSearchApiError } from './meilisearch-api-error'
import { FetchError } from '../types'

async function httpResponseErrorHandler(response: Response): Promise<Response> {
  if (!response.ok) {
    let err
    try {
      err = await response.json()
    } catch (e: any) {
      throw new MeiliSearchCommunicationError(
        response.statusText,
        response,
        response.url
      )
    }
    throw new MeiliSearchApiError(err, response.status)
  }
  return response
}

function httpErrorHandler(
  response: FetchError,
  stack?: string,
  url?: string
): Promise<void> {
  if (response.type !== 'MeiliSearchApiError') {
    throw new MeiliSearchCommunicationError(
      response.message,
      response,
      url,
      stack
    )
  }
  throw response
}

export { httpResponseErrorHandler, httpErrorHandler }
