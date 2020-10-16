import 'cross-fetch/polyfill'
import * as Types from '../types'

class MeiliSearchCommunicationError extends Error {
  type: string
  statusCode?: number
  errno?: string
  code?: string

  constructor(message: string, body: Response | Types.FetchError) {
    super(message)
    this.name = 'MeiliSearchCommunicationError'
    this.type = 'MeiliSearchCommunicationError'
    if (body instanceof Response) {
      this.message = body.statusText
      this.statusCode = body.status
    }
    if (body instanceof Error) {
      this.errno = body.errno
      this.code = body.code
    }

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MeiliSearchCommunicationError)
    }
  }
}

export default MeiliSearchCommunicationError
