import {
  MSApiError,
  MeiliSearchApiErrorResponse,
  MSApiErrorConstructor,
} from '../types'

const MeiliSearchApiError: MSApiErrorConstructor = class
  extends Error
  implements MSApiError {
  httpStatus: number
  response?: MeiliSearchApiErrorResponse
  code?: string
  link?: string
  stack?: string
  type?: string

  constructor(error: MSApiError, status: number) {
    super(error.message)
    this.name = 'MeiliSearchApiError'

    this.code = error.code
    this.type = error.type
    this.link = error.link
    this.message = error.message
    this.httpStatus = status

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MeiliSearchApiError)
    }
  }
}
export { MeiliSearchApiError }
