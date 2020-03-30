import { AxiosError } from 'axios'

interface MeiliAxiosErrorInterface extends Error {
  name: string
  message: string
  stack?: string
}

type MeiliAxiosErrorConstructor = new (
  error: AxiosError,
  cachedStack?: string
) => void

const MeiliAxiosError: MeiliAxiosErrorConstructor = class MeiliAxiosError
  extends Error
  implements MeiliAxiosErrorInterface {
  constructor(error: AxiosError, cachedStack?: string) {
    super(error.message)
    this.name = 'MeiliSearch Error'
    // Fetch the native error message but add our application name in front of it.
    // This means slicing the "Error" string at the start of the message.
    this.message = `${this.name}: ${this.message}`
    // If a custom message was sent back by our API
    if (error.response && error.response.data && error.response.data.message) {
      this.message = `${this.message}: ${error.response.data.message}`
    } else {
      this.message = `${this.message}`
    }
    // Add custom message at the start, only takes first stack call of the axios error and then add the cached stack
    // while also removing the first line of the axios stack and the cached stack because it starts with "Error:"
    // Since we added our own MeiliSearch Error: we do not need the redundancy.
    const firstLineNumber = 1
    const numberOfErrorLinesToKeep = 2
    if (cachedStack && error.stack) {
      this.stack = `${this.message}
${error.stack
  .split('\n')
  .slice(firstLineNumber, numberOfErrorLinesToKeep)
  .join('\n')}
${cachedStack.split('\n').slice(firstLineNumber).join('\n')}`
    }
  }
}
export default MeiliAxiosError
