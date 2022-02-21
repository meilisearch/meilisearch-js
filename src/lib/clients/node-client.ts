import { SearchClient } from '..'
import { Config } from '../../types'

class MeiliSearch extends SearchClient {
  constructor(config: Config) {
    super(config)
  }

  /**
   * Generate a tenant token
   * @memberof MeiliSearch
   * @method generateTenantToken
   * @param {string} dumpUid Dump UID
   * @returns {String} Token
   */
  async generateTenantToken(): Promise<string> {
    if (typeof window === 'undefined') {
      // This line
      return import('crypto').then((crypto) => {
        const securedKey = crypto
          .createHmac('sha256', 'masterKey')
          .update('1221')
          .digest('hex')
        console.log(Buffer.from(JSON.stringify('ploug')))
        return securedKey
      })
    }
    return 'done'
  }
}
export { MeiliSearch }
