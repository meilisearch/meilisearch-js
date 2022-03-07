import { Config, TokenSearchRules, TokenOptions } from '../types'
import crypto from 'crypto'

function encode64(data: any) {
  return Buffer.from(JSON.stringify(data)).toString('base64')
}

function sign(apiKey: string, encodedHeader: string, encodedPayload: string) {
  return crypto
    .createHmac('sha256', apiKey)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

function createHeader() {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  }

  return encode64(header).replace(/=/g, '')
}

function createPayload(
  searchRules: TokenSearchRules,
  apiKey: string,
  expiresAt: Date | null
) {
  const payload = {
    exp: expiresAt?.getTime() || null,
    searchRules,
    apiKeyPrefix: apiKey.substring(0, 8),
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

    const encodedHeader = createHeader()
    const encodedPayload = createPayload(searchRules, apiKey, expiresAt)
    const signature = sign(apiKey, encodedHeader, encodedPayload)

    return `${encodedHeader}.${encodedPayload}.${signature}`
  }
}
export { Token }
