import { Config, TokenSearchRules, TokenOptions } from '../types'

function base64Encoder(str: any) {
  return Buffer.from(JSON.stringify(str)).toString('base64')
}

class Token {
  config: Config

  constructor(config: Config) {
    console.log('NODE')
    this.config = config
  }

  /**
   * Generate a tenant token
   * @memberof MeiliSearch
   * @method generateTenantToken
   * @param {string} dumpUid Dump UID
   * @returns {String} Token
   */
  async generateTenantToken(
    searchRules: TokenSearchRules,
    options: TokenOptions
  ): Promise<string> {
    const apiKey = options.apiKey || this.config.apiKey || ''
    const expiresAt = options?.expiresAt || null

    const header = {
      typ: 'JWT',
      alg: 'HS256',
    }

    const payload = {
      apiKeyPrefix: apiKey.substring(0, 8),
      exp: expiresAt?.getDate(),
      searchRules,
    }

    const encodedHeader = base64Encoder(header)
    const encodedPayload = base64Encoder(payload)

    const signature = await import('crypto').then((crypto) => {
      const securedKey = crypto
        .createHmac('sha256', apiKey)
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest('hex')
      return securedKey
    })
    return `${encodedHeader}.${encodedPayload}.${signature}`
  }
}
export { Token }
