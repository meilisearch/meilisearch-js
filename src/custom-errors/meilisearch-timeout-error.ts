class MeiliSearchTimeOutError extends Error {
  type: string
  constructor(message: string) {
    super(message)
    this.name = 'MeiliSearchTimeOutError'
    this.type = this.constructor.name
    Error.captureStackTrace(this, MeiliSearchTimeOutError)
  }
}

export default MeiliSearchTimeOutError
