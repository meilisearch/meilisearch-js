class MeiliSearchTimeOutError extends Error {
  type: string
  constructor(message: string) {
    super(message)
    this.name = 'MeiliSearchTimeOutError'
    this.type = this.constructor.name

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MeiliSearchTimeOutError)
    }
  }
}

export { MeiliSearchTimeOutError }
