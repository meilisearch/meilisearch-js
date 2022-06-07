class MeiliSearchTimeOutError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MeiliSearchTimeOutError'

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MeiliSearchTimeOutError)
    }
  }
}

export { MeiliSearchTimeOutError }
