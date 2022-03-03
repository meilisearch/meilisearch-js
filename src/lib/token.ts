import { Config, TokenSearchRules, TokenOptions } from '../types'
import { encode64 } from './utils'
import crypto from 'crypto'

/**
 * Create the header of the token.
 *
 * @param {String} apiKey API key used to sign the token.
 * @param {String} encodedHeader Header of the token in base64.
 * @param {String} encodedPayload Payload of the token in base64.
 * @returns {String} The signature of the token in base64.
 */
function sign(apiKey: string, encodedHeader: string, encodedPayload: string) {
  return crypto
    .createHmac('sha256', apiKey)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

/**
 * Create the header of the token.
 *
 * @returns {String} The header encoded in base64.
 */
function createHeader() {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  }

  return encode64(header).replace(/=/g, '')
}

/**
 * Create the payload of the token.
 *
 * @param {SearchRules} searchRules Search rules that are applied ton every search.
 * @param {String} apiKey Api key used as issuer of the token.
 * @param {Date | undefined} apiKey Date value.
 * @returns {String} The payload encoded in base64.
 */
function createPayload(
  searchRules: TokenSearchRules,
  apiKey: string,
  expiresAt?: Date
): string {
  const payload = {
    searchRules,
    apiKeyPrefix: apiKey.substring(0, 8),
    exp: expiresAt?.getTime(),
  }

  return encode64(payload).replace(/=/g, '')
}

class Token {
  config: Config

  constructor(config: Config) {
    this.config = config
  }

  /**
   * Generate a tenant token
   *
   * @memberof MeiliSearch
   * @method generateTenantToken
   * @param {SearchRules} searchRules Search rules that are applied ton every search.
   * @param {TokenOptions} options Search rules that are applied to every search.
   * @returns {String} The token in JWT format.
   */
  generateTenantToken(
    searchRules: TokenSearchRules,
    options?: TokenOptions
  ): string {
    const apiKey = options?.apiKey || this.config.apiKey || ''
    const expiresAt = options?.expiresAt

    const encodedHeader = createHeader()
    const encodedPayload = createPayload(searchRules, apiKey, expiresAt)
    const signature = sign(apiKey, encodedHeader, encodedPayload)

    return `${encodedHeader}.${encodedPayload}.${signature}`
  }
}
export { Token }
