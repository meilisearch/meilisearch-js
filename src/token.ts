import { Config, TokenSearchRules, TokenOptions } from './types'
import crypto from 'crypto'
import { MeiliSearchError } from './errors'
import { validateUuid4 } from './utils'

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
 * @param {String} uid The uid of the api key used as issuer of the token.
 * @param {Date | undefined} expiresAt Date at which the token expires.
 */
function validateTokenParameters(tokenParams: {
  searchRules: TokenSearchRules
  uid: string
  apiKey: string
  expiresAt?: Date
}) {
  const { searchRules, uid, apiKey, expiresAt } = tokenParams

  if (expiresAt) {
    if (!(expiresAt instanceof Date)) {
      throw new MeiliSearchError(
        `Meilisearch: The expiredAt field must be an instance of Date.`
      )
    } else if (expiresAt.getTime() < Date.now()) {
      throw new MeiliSearchError(
        `Meilisearch: The expiresAt field must be a date in the future.`
      )
    }
  }

  if (searchRules) {
    if (!(typeof searchRules === 'object' || Array.isArray(searchRules))) {
      throw new MeiliSearchError(
        `Meilisearch: The search rules added in the token generation must be of type array or object.`
      )
    }
  }

  if (!apiKey || typeof apiKey !== 'string') {
    throw new MeiliSearchError(
      `Meilisearch: The API key used for the token generation must exist and be of type string.`
    )
  }

  if (!uid || typeof uid !== 'string') {
    throw new MeiliSearchError(
      `Meilisearch: The uid of the api key used for the token generation must exist, be of type string and comply to the uuid4 format.`
    )
  }

  if (!validateUuid4(uid)) {
    throw new MeiliSearchError(
      `Meilisearch: The uid of your key is not a valid uuid4. To find out the uid of your key use getKey().`
    )
  }
}

/**
 * Create the payload of the token.
 *
 * @param {SearchRules} searchRules Search rules that are applied to every search.
 * @param {String} uid The uid of the api key used as issuer of the token.
 * @param {Date | undefined} expiresAt Date at which the token expires.
 * @returns {String} The payload encoded in base64.
 */
function createPayload(payloadParams: {
  searchRules: TokenSearchRules
  uid: string
  expiresAt?: Date
}): string {
  const { searchRules, uid, expiresAt } = payloadParams

  const payload = {
    searchRules,
    apiKeyUid: uid,
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
   * @param {apiKeyUid} apiKeyUid The uid of the api key used as issuer of the token.
   * @param {SearchRules} searchRules Search rules that are applied to every search.
   * @param {TokenOptions} options Token options to customize some aspect of the token.
   *
   * @returns {String} The token in JWT format.
   */
  generateTenantToken(
    apiKeyUid: string,
    searchRules: TokenSearchRules,
    options?: TokenOptions
  ): string {
    const apiKey = options?.apiKey || this.config.apiKey || ''
    const uid = apiKeyUid || ''
    const expiresAt = options?.expiresAt

    validateTokenParameters({ apiKey, uid, expiresAt, searchRules })

    const encodedHeader = createHeader()
    const encodedPayload = createPayload({ searchRules, uid, expiresAt })
    const signature = sign(apiKey, encodedHeader, encodedPayload)

    return `${encodedHeader}.${encodedPayload}.${signature}`
  }
}
export { Token }
