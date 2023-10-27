import { Client } from './client'
import { Config, TokenSearchRules, TokenOptions } from '../types'
import { Token } from '../token'
import { PACKAGE_VERSION } from '../package-version'

class MeiliSearch extends Client {
  tokens: Token

  constructor(config: Config) {
    super({
      ...config,
      clientAgents: [
        ...(config.clientAgents ?? []),
        `Meilisearch Node (v${PACKAGE_VERSION})`,
      ],
    })
    this.tokens = new Token(config)
  }

  /**
   * Generate a tenant token
   *
   * @param apiKeyUid - The uid of the api key used as issuer of the token.
   * @param searchRules - Search rules that are applied to every search.
   * @param options - Token options to customize some aspect of the token.
   * @returns The token in JWT format.
   */
  generateTenantToken(
    apiKeyUid: string,
    searchRules: TokenSearchRules,
    options?: TokenOptions
  ): string {
    if (typeof window === 'undefined') {
      return this.tokens.generateTenantToken(apiKeyUid, searchRules, options)
    }
    return super.generateTenantToken(apiKeyUid, searchRules, options)
  }
}
export { MeiliSearch }
