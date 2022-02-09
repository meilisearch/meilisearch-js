import { MeiliSearchErrorInterface } from '../types'

const MeiliSearchApiError = class extends Error {
  httpStatus: number
  code?: string
  link?: string
  stack?: string
  type?: string

  constructor(error: MeiliSearchErrorInterface, status: number) {
    super(error.message)
    this.name = 'MeiliSearchApiError'

    this.code = error.code
    this.type = error.type
    this.link = error.link
    this.message = error.message
    this.httpStatus = status
    // Make errors comparison possible. ex: error instanceof MeiliSearchApiError.
    Object.setPrototypeOf(this, MeiliSearchApiError.prototype)

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MeiliSearchApiError)
    }
  }
}
export { MeiliSearchApiError }
