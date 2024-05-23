import { TokenSearchRules, TokenOptions } from "./types";
import { MeiliSearchError } from "./errors";
import { validateUuid4 } from "./utils";

function encode64(data: unknown): string {
  return btoa(JSON.stringify(data))
}

/**
 * Create the header of the token.
 *
 * @param apiKey - API key used to sign the token.
 * @param encodedHeader - Header of the token in base64.
 * @param encodedPayload - Payload of the token in base64.
 * @returns The signature of the token in base64.
 */
async function sign(
  apiKey: string,
  encodedHeader: string,
  encodedPayload: string
): Promise<string> {
  // missing crypto global for Node.js 18
  const localCrypto = crypto ?? (await import('node:crypto')).webcrypto

  const textEncoder = new TextEncoder()

  const cryptoKey = await localCrypto.subtle.importKey(
    'raw',
    textEncoder.encode(apiKey),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await localCrypto.subtle.sign(
    'HMAC',
    cryptoKey,
    textEncoder.encode(`${encodedHeader}.${encodedPayload}`)
  )

  const digest = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')

  return digest
}

/**
 * Create the header of the token.
 *
 * @returns The header encoded in base64.
 */
function createHeader() {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  return encode64(header).replace(/=/g, "");
}

/**
 * Validate the parameter used for the payload of the token.
 *
 * @param searchRules - Search rules that are applied to every search.
 * @param apiKey - Api key used as issuer of the token.
 * @param uid - The uid of the api key used as issuer of the token.
 * @param expiresAt - Date at which the token expires.
 */
function validateTokenParameters({
  searchRules,
  apiKeyUid,
  expiresAt,
}: {
  searchRules: TokenSearchRules;
  apiKeyUid: string;
  expiresAt?: Date;
}) {
  if (expiresAt) {
    if (!(expiresAt instanceof Date)) {
      throw new MeiliSearchError(
        `Meilisearch: The expiredAt field must be an instance of Date.`,
      );
    } else if (expiresAt.getTime() < Date.now()) {
      throw new MeiliSearchError(
        `Meilisearch: The expiresAt field must be a date in the future.`,
      );
    }
  }

  if (searchRules) {
    if (!(typeof searchRules === "object" || Array.isArray(searchRules))) {
      throw new MeiliSearchError(
        `Meilisearch: The search rules added in the token generation must be of type array or object.`,
      );
    }
  }

  if (!apiKeyUid || typeof apiKeyUid !== "string") {
    throw new MeiliSearchError(
      `Meilisearch: The uid of the api key used for the token generation must exist, be of type string and comply to the uuid4 format.`,
    );
  }

  if (!validateUuid4(apiKeyUid)) {
    throw new MeiliSearchError(
      `Meilisearch: The uid of your key is not a valid uuid4. To find out the uid of your key use getKey().`,
    );
  }
}

/**
 * Create the payload of the token.
 *
 * @param searchRules - Search rules that are applied to every search.
 * @param uid - The uid of the api key used as issuer of the token.
 * @param expiresAt - Date at which the token expires.
 * @returns The payload encoded in base64.
 */
function createPayload({
  searchRules,
  apiKeyUid,
  expiresAt,
}: {
  searchRules: TokenSearchRules;
  apiKeyUid: string;
  expiresAt?: Date;
}): string {
  const payload = {
    searchRules,
    apiKeyUid,
    exp: expiresAt ? Math.floor(expiresAt.getTime() / 1000) : undefined,
  };

  return encode64(payload).replace(/=/g, "");
}

/**
 * Generate a tenant token
 *
 * @param apiKeyUid - The uid of the api key used as issuer of the token.
 * @param searchRules - Search rules that are applied to every search.
 * @param options - Token options to customize some aspect of the token.
 * @returns The token in JWT format.
 */
export async function generateTenantToken(
  apiKeyUid: string,
  searchRules: TokenSearchRules,
  { apiKey, expiresAt }: TokenOptions,
): Promise<string> {
  validateTokenParameters({ apiKeyUid, expiresAt, searchRules });

  const encodedHeader = createHeader();
  const encodedPayload = createPayload({
    searchRules,
    apiKeyUid,
    expiresAt,
  });
  const signature = await sign(apiKey, encodedHeader, encodedPayload);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}
