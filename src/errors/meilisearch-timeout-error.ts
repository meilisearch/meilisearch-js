class MeiliSearchTimeOutError extends Error {
  constructor(message: string) {
    super(message)

    // Make errors comparison possible. ex: error instanceof MeiliSearchTimeOutError.
    Object.setPrototypeOf(this, MeiliSearchTimeOutError.prototype)

    this.name = 'MeiliSearchTimeOutError'

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MeiliSearchTimeOutError)
    }
  }
}

export { MeiliSearchTimeOutError }
