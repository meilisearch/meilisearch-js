import 'cross-fetch/polyfill'
import { FetchError,MSApiError } from '../types'
import { MSApiError } from '../../dist/types/types/types';
import { MeiliSearchApiError } from '.';


class MeiliSearchCommunicationError extends Error {
  type: string
  statusCode?: number
  errno?: string
  code?: string
  stack?: string

  constructor(
    message: string,
    body: Response | FetchError,
    url?: string,
    stack?: string
  ) {
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
    if (stack) {
      if (this.statusCode === 404) {
        const err: MSApiError = {
          name: '',
          message: '',
          stack: this.stack,
          httpStatus: this.statusCode,
          errorCode: this.statusCode.toString(),
          errorType: 'NOT FOUND',
          errorLink: url,
        }
        throw new MeiliSearchApiError(err, this.statusCode)
      }
      this.stack = stack
      this.stack = this.stack?.replace(/(TypeError|FetchError)/, this.name)
      this.stack = this.stack?.replace(
        'Failed to fetch',
        `request to ${url} failed, reason: connect ECONNREFUSED`
      )
    } else {
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, MeiliSearchCommunicationError)
      }
    }
  }
}

export { MeiliSearchCommunicationError }
