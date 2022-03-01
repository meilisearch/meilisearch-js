import { Config, TokenSearchRules, TokenOptions } from '../types'
import crypto from 'crypto'

function encode64(str: any) {
  return Buffer.from(JSON.stringify(str)).toString('base64')
  // return str
}

class Token {
  config: Config

  constructor(config: Config) {
    this.config = config
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
    const apiKey = options?.apiKey || this.config.apiKey || ''
    const expiresAt = options?.expiresAt || null

    const header = {
      alg: 'HS256',
      typ: 'JWT',
    }

    const payload = {
      exp: expiresAt?.getTime() || null,
      searchRules,
      apiKeyPrefix: apiKey.substring(0, 8),
    }

    const encodedHeader = encode64(header).replace(/=/g, '')
    const encodedPayload = encode64(payload).replace(/=/g, '')

    const signature = crypto
      .createHmac('sha256', apiKey)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '')
    return `${encodedHeader}.${encodedPayload}.${signature}`
  }
}
export { Token }
