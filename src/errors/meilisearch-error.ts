class MeiliSearchError extends Error {
  type: string
  constructor(message: string) {
    super(message)
    this.name = 'MeiliSearchError'
    this.type = 'MeiliSearchError'
    Error.captureStackTrace(this, MeiliSearchError)
  }
}

export default MeiliSearchError
