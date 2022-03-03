import { Client } from './client'
import { Config, TokenSearchRules, TokenOptions } from '../../types'
import { Token } from '../token'

class MeiliSearch extends Client {
  tokens: Token

  constructor(config: Config) {
    super(config)
    this.tokens = new Token(config)
  }

  /**
   * Generate a tenant token
   * @memberof MeiliSearch
   * @method generateTenantToken
   * @param {string} dumpUid Dump UID
   * @returns {String} Token
   */
  generateTenantToken(
    searchRules: TokenSearchRules,
    options?: TokenOptions
  ): string {
    if (typeof window === 'undefined') {
      return this.tokens.generateTenantToken(searchRules, options)
    }
    return super.generateTenantToken(searchRules, options)
  }
}
export { MeiliSearch }
