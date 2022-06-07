class MeiliSearchError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MeiliSearchError'

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MeiliSearchError)
    }
  }
}

export { MeiliSearchError }
