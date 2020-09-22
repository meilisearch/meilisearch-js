import * as Types from '../types'

const MeiliSearchApiError: Types.MSApiErrorConstructor = class
  extends Error
  implements Types.MSApiError {
  httpStatus: number
  response?: Types.MeiliSearchApiErrorResponse
  errorCode?: string
  errorType?: string
  errorLink?: string
  stack?: string
  type: string

  constructor(error: Types.MSApiError, status: number) {
    super(error.message)
    this.type = 'MeiliSearchApiError'
    this.name = 'MeiliSearchApiError'

    this.errorCode = error.errorCode
    this.errorType = error.errorType
    this.errorLink = error.errorLink
    this.message = error.message
    this.httpStatus = status
    Error.captureStackTrace(this, MeiliSearchApiError)
  }
}
export default MeiliSearchApiError
