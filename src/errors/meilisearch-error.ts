class MeiliSearchError extends Error {
  type: string
  constructor(message: string) {
    super(message)
    this.name = 'MeiliSearchError'
    this.type = 'MeiliSearchError'

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MeiliSearchError)
    }
  }
}

export { MeiliSearchError }
