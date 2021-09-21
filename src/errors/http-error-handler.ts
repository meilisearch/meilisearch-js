import { MeiliSearchCommunicationError, MeiliSearchApiError } from './'
import { FetchError } from '../types'

async function httpResponseErrorHandler(response: Response): Promise<Response> {
  if (!response.ok) {
    let err
    try {
      err = await response.json()
    } catch (e) {
      throw new MeiliSearchCommunicationError(response.statusText, response)
    }
    throw new MeiliSearchApiError(err, response.status)
  }
  return response
}

function httpErrorHandler(response: FetchError): Promise<void> {
  if (response.type !== 'MeiliSearchApiError') {
    throw new MeiliSearchCommunicationError(response.message, response)
  }
  throw response
}

export { httpResponseErrorHandler, httpErrorHandler }
