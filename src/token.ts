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
 * @param {String} uid API key used to sign the token.
 * @param {String} encodedHeader Header of the token in base64.
 * @param {String} encodedPayload Payload of the token in base64.
 * @returns {String} The signature of the token in base64.
 */
function sign(uid: string, encodedHeader: string, encodedPayload: string) {
  return crypto
    .createHmac('sha256', uid)
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
  uid: string
  expiresAt?: Date
}) {
  const { searchRules, uid, expiresAt } = payloadParams
  // console.log({ uid })

  // const error = new Error()

  // console.log(error)
  if (expiresAt) {
    if (!(expiresAt instanceof Date) || expiresAt.getTime() < Date.now()) {
      throw new MeiliSearchError(
        `Meilisearch: When the expiresAt field in the token generation has a value, it must be a date set in the future and not in the past. \n`
      )
    }
  }

  if (searchRules) {
    if (!(typeof searchRules === 'object' || Array.isArray(searchRules))) {
      throw new MeiliSearchError(
        `Meilisearch: The search rules added in the token generation must be of type array or object. \n.`
      )
    }
  }

  if (!uid || typeof uid !== 'string') {
    throw new MeiliSearchError(
      `Meilisearch: The API key used for the token generation must exist and be of type string. \n.`
    )
  }

  if (!validateUuid4(uid)) {
    throw new MeiliSearchError(
      `Meilisearch: The uid of your key is not a valid uuid4. To find out the uid of your key use getKey() \n.`
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
  uid: string
  expiresAt?: Date
}): string {
  const { searchRules, uid, expiresAt } = payloadParams
  validatePayload(payloadParams)
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
   * @param {SearchRules} searchRules Search rules that are applied to every search.
   * @param {TokenOptions} options Token options to customize some aspect of the token.
   * @returns {String} The token in JWT format.
   */
  generateTenantToken(
    searchRules: TokenSearchRules,
    options?: TokenOptions
  ): string {
    // const apiKey = options?.apiKey || this.config.apiKey || ''
    const uid = options?.uid || ''
    const expiresAt = options?.expiresAt
    // console.log({ expiresAt })

    const encodedHeader = createHeader()
    const encodedPayload = createPayload({ searchRules, uid, expiresAt })
    const signature = sign(uid, encodedHeader, encodedPayload)

    return `${encodedHeader}.${encodedPayload}.${signature}`
  }
}
export { Token }
