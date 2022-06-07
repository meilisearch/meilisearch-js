import { MeiliSearchCommunicationError } from './meilisearch-communication-error'
import { MeiliSearchApiError } from './meilisearch-api-error'
import { FetchError } from '../types'

async function httpResponseErrorHandler(response: Response): Promise<Response> {
  if (!response.ok) {
    let responseBody
    try {
      // If it is not possible to parse the return body it means there is none
      // In which case it is a communication error with the Meilisearch instance
      responseBody = await response.json()
    } catch (e: any) {
      // Not sure on how to test this part of the code.
      throw new MeiliSearchCommunicationError(
        response.statusText,
        response,
        response.url
      )
    }
    // If the body is parsable, then it means Meilisearch returned a body with
    // information on the error.
    throw new MeiliSearchApiError(responseBody, response.status)
  }

  return response
}

function httpErrorHandler(
  response: FetchError,
  stack?: string,
  url?: string
): Promise<void> {
  if (response.name !== 'MeiliSearchApiError') {
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
