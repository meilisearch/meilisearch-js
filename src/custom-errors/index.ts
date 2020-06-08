import {
  AxiosError,
} from 'axios'
import MeiliSearchApiError from './meilisearch-error'
import MeilISearchCommunicationError from './meilisearch-communication-error'

function errorHandler (e: AxiosError, cachedStack?: string): void {
    if (e.response) {
      throw new MeiliSearchApiError(e, cachedStack)
    }
    else if (e.isAxiosError) {
      throw new MeilISearchCommunicationError(e.message)
    }
    else {
      throw e;
    }
  }

export { errorHandler }
