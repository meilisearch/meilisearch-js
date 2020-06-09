class MeiliSearchCommunicationError extends Error {
  type: string
  constructor(message: string) {
    super(message)
    this.name = 'MeiliSearchCommunicationError'
    this.type = 'MeiliSearchCommunicationError'
    Error.captureStackTrace(this, MeiliSearchCommunicationError)
  }
}

export default MeiliSearchCommunicationError
