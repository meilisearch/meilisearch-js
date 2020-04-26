import { AxiosError } from 'axios'
import * as Types from '../types'

const MeiliSearchApiError: Types.MeiliSearchApiErrorConstructor = class
  extends Error
  implements Types.MeiliSearchApiErrorInterface {
  response?: Types.MeiliSearchApiErrorResponse
  request?: Types.MeiliSearchApiErrorRequest
  type: string

  constructor(error: AxiosError, cachedStack?: string) {
    super(error.message)
    this.type = this.constructor.name
    this.name = 'MeiliSearchApiError'

    // Fetch the native error message but add our application name in front of it.
    // This means slicing the "Error" string at the start of the message.
    if (error.response !== undefined) {
      this.response = {
        status: error.response.status,
        statusText: error.response.statusText,
        path: error.response.config.url,
        method: error.response.config.method,
        body: error.response.data,
      }
      // If a custom message was sent back by our API
      // We change the error message to be more explicit
      if (error.response.data?.message !== undefined) {
        this.message = error.response.data.message
      }
    } else {
      // If MeiliSearch did not answered
      this.request = {
        url: error.request._currentUrl,
        path: error.config.url,
        method: error.config.method,
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
