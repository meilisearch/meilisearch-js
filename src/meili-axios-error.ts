import { AxiosError } from 'axios'

interface MeiliAxiosErrorInterface extends Error {
  name: string
  message: string
  stack?: string
}
interface MeiliAxiosErrorResponse {
  status?: number
  statusText?: String
  path?: String
  method?: String
  body? : object
}
interface MeiliAxiosErrorRequest {
  path?: String
  method?: String
}

type MeiliAxiosErrorConstructor = new (
  error: AxiosError,
  cachedStack?: string
) => void

const MeiliAxiosError: MeiliAxiosErrorConstructor = class MeiliAxiosError
  extends Error
  implements MeiliAxiosErrorInterface {
    response?: MeiliAxiosErrorResponse
    request?: MeiliAxiosErrorRequest

  constructor(error: AxiosError, cachedStack?: string) {
    super(error.message)

    this.name = 'MeiliSearch Error'
    this.message = `${this.name}: ${this.message}`

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
        this.message = `${this.name}: ${error.response.data.message}`
      }
    } else {
      // If MeiliSearch did not answered
      if (error.config) {
        this.request = {
          path: error.config.url,
          method: error.config.method
        }
      }
      // Fetch the native error message but add our application name in front of it.
      // This means slicing the "Error" string at the start of the message.
      this.message = `${this.name}: ${this.message}`
    }
    // Add custom message at the start, only takes first stack call of the axios error and then add the cached stack
    // while also removing the first line of the axios stack and the cached stack because it starts with "Error:"
    // Since we added our own MeiliSearch Error: we do not need the redundancy.
    const firstLineNumber = 1
    const numberOfErrorLinesToKeep = 2
    if (cachedStack && error.stack) {
      this.stack = `${this.message}
${error.stack
  .split('\n')
  .slice(firstLineNumber, numberOfErrorLinesToKeep)
  .join('\n')}
${cachedStack.split('\n').slice(firstLineNumber).join('\n')}`
    }
  }
}
export default MeiliAxiosError
