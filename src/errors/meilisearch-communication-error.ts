import 'cross-fetch/polyfill'
import { FetchError } from '../types'

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
      this.stack = stack
      this.stack = this.stack?.replace(/(TypeError|FetchError)/, this.name)
      this.stack = this.stack?.replace(
        'Failed to fetch',
        `request to ${url} failed, reason: connect ECONNREFUSED`
      )
      this.stack = this.stack?.replace('Not Found', `Not Found: ${url}`)
    } else {
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, MeiliSearchCommunicationError)
      }
    }
  }
}

export { MeiliSearchCommunicationError }
