import { Config, TokenSearchRules, TokenOptions } from '../types'
import crypto from 'crypto'

function encode64(data: any) {
  return Buffer.from(JSON.stringify(data)).toString('base64')
}

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
 * Validate the parameter used for the payload of the token.
 *
 * @param {SearchRules} searchRules Search rules that are applied to every search.
 * @param {String} apiKey Api key used as issuer of the token.
 * @param {Date | undefined} expiresAt Date at which the token expires.
 */
function validatePayload(payloadParams: {
  searchRules: TokenSearchRules
  apiKey: string
  expiresAt?: Date
}) {
  const { searchRules, apiKey, expiresAt } = payloadParams
  const error = new Error()

  if (expiresAt) {
    if (!(expiresAt instanceof Date) || expiresAt.getTime() < Date.now()) {
      throw new Error(
        `Meilisearch: When the expiresAt field in the token generation has a value, it must be a date set in the future and not in the past. \n ${error.stack}.`
      )
    }
  }

  if (searchRules) {
    if (!(typeof searchRules === 'object' || Array.isArray(searchRules))) {
      throw new Error(
        `Meilisearch: The search rules added in the token generation must be of type array or object. \n ${error.stack}.`
      )
    }
  }

  if (!apiKey || typeof apiKey !== 'string') {
    throw new Error(
      `Meilisearch: The API key used for the token generation must exist and be of type string. \n ${error.stack}.`
    )
  }
}

/**
 * Create the payload of the token.
 *
 * @param {SearchRules} searchRules Search rules that are applied to every search.
 * @param {String} apiKey Api key used as issuer of the token.
 * @param {Date | undefined} expiresAt Date at which the token expires.
 * @returns {String} The payload encoded in base64.
 */
function createPayload(payloadParams: {
  searchRules: TokenSearchRules
  apiKey: string
  expiresAt?: Date
}): string {
  const { searchRules, apiKey, expiresAt } = payloadParams
  validatePayload(payloadParams)
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
   * @param {SearchRules} searchRules Search rules that are applied to every search.
   * @param {TokenOptions} options Token options to customize some aspect of the token.
   * @returns {String} The token in JWT format.
   */
  generateTenantToken(
    searchRules: TokenSearchRules,
    options?: TokenOptions
  ): string {
    const apiKey = options?.apiKey || this.config.apiKey || ''
    const expiresAt = options?.expiresAt

    const encodedHeader = createHeader()
    const encodedPayload = createPayload({ searchRules, apiKey, expiresAt })
    const signature = sign(apiKey, encodedHeader, encodedPayload)

    return `${encodedHeader}.${encodedPayload}.${signature}`
  }
}
export { Token }
