import { AxiosError } from 'axios'
import * as Types from '../types'

const MeiliSearchApiError: Types.MeiliSearchApiErrorConstructor = class
  extends Error
  implements Types.MeiliSearchApiErrorInterface {
  response?: Types.MeiliSearchApiErrorResponse
  request?: Types.MeiliSearchApiErrorRequest
  errorCode?: string
  errorType?: string
  errorLink?: string
  stack?: string
  type: string

  constructor(error: AxiosError, cachedStack?: string) {
    super(error.message)

    this.type = 'MeiliSearchApiError'
    this.name = 'MeiliSearchApiError'

    // Fetch the native error message but add our application name in front of it.
    // This means slicing the "Error" string at the start of the message.
    if (error.response !== undefined) {
      this.response = {
        status: error.response.status,
        statusText: error.response.statusText,
        path: error.response.config.url,
        method: error.response.config.method,
      }

      // If a custom message was sent back by our API
      // We change the error message to be more explicit
      if (error.response.data?.message !== undefined) {
        this.errorCode = error.response.data.errorCode
        this.errorType = error.response.data.errorType
        this.errorLink = error.response.data.errorLink
        this.message = error.response.data.message
      }
    }

    // use cached Stack on error object to keep the call stack
    if (cachedStack !== undefined && error.stack !== undefined) {
      this.stack = `${this.name}: ${this.message}\n${cachedStack
        .split('\n')
        .slice(1)
        .join('\n')}`
    }
  }
}
export default MeiliSearchApiError
