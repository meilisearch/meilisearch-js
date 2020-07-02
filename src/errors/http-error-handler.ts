import { AxiosError } from 'axios'
import MeiliSearchApiError from './meilisearch-api-error'
import MeiliSearchCommunicationError from './meilisearch-communication-error'

function httpErrorHandler(e: AxiosError, cachedStack?: string): void {
  if (e.response !== undefined) {
    throw new MeiliSearchApiError(e, cachedStack)
  } else if (e.isAxiosError === true) {
    throw new MeiliSearchCommunicationError(e.message)
  } else {
    throw e
  }
}

export { httpErrorHandler }
