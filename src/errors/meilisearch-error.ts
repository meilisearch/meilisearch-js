class MeiliSearchError extends Error {
  constructor(message: string) {
    super(message)

    // Make errors comparison possible. ex: error instanceof MeiliSearchError.
    Object.setPrototypeOf(this, MeiliSearchError.prototype)

    this.name = 'MeiliSearchError'

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MeiliSearchError)
    }
  }
}

export { MeiliSearchError }
