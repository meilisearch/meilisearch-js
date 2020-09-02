import * as Types from '../types'

export type MSApiErrorConstructor = new (
  error: MSApiError,
  status: number
) => void

export interface MSApiError extends Error {
  name: string
  message: string
  stack?: string
  httpStatus: number
  errorCode?: string
  errorType?: string
  errorLink?: string
}

const MeiliSearchApiError: MSApiErrorConstructor = class extends Error
  implements Types.MeiliSearchApiErrorInterface {
  httpStatus: number
  response?: Types.MeiliSearchApiErrorResponse
  errorCode?: string
  errorType?: string
  errorLink?: string
  stack?: string
  type: string

  constructor(error: MSApiError, status: number) {
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
