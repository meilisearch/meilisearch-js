import { AxiosError } from 'axios'

interface MeiliAxiosErrorInterface extends Error {
  name: string
  message: string
  stack?: string
}
interface MeiliAxiosErrorResponse {
  status?: number
  statusText?: string
  path?: string
  method?: string
  body?: object
}
interface MeiliAxiosErrorRequest {
  url?: string
  path?: string
  method?: string
}

type MeiliAxiosErrorConstructor = new (
  error: AxiosError,
  cachedStack?: string
) => void

const MeiliAxiosError: MeiliAxiosErrorConstructor = class extends Error
  implements MeiliAxiosErrorInterface {
  response?: MeiliAxiosErrorResponse
  request?: MeiliAxiosErrorRequest

  constructor(error: AxiosError, cachedStack?: string) {
    super(error.message)

    this.name = 'MeiliSearch Error'

    // Fetch the native error message but add our application name in front of it.
    // This means slicing the "Error" string at the start of the message.
    this.message = `${this.message}`
    if (error.response) {
      // If MeiliSearch answered
      this.response = {
        status: error.response.status,
        statusText: error.response.statusText,
        path: error.response.config.url,
        method: error.response.config.method,
        body: error.response.data,
      }
      // If a custom message was sent back by our API
      // We change the error message to be more explicit
      if (error.response.data && error.response.data.message) {
        this.message = `${error.response.data.message}`
      }
    } else {
      // If MeiliSearch did not answered
      if (error.config && error.request) {
        this.request = {
          url: error.request._currentUrl,
          path: error.config.url,
          method: error.config.method,
        }
      }
    }
    // use cached Stack on error object to keep the call stack
    if (cachedStack && error.stack) {
      this.stack = cachedStack
    }
  }
}
export default MeiliAxiosError
