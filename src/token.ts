import type { TokenSearchRules, TokenOptions } from "./types";

const UUID_V4_REGEXP = /^[0-9a-f]{8}\b(?:-[0-9a-f]{4}\b){3}-[0-9a-f]{12}$/i;
function isValidUUIDv4(uuid: string): boolean {
  return UUID_V4_REGEXP.test(uuid);
}

function encodeToBase64(data: unknown): string {
  // TODO: instead of btoa use Uint8Array.prototype.toBase64() when it becomes available in supported runtime versions
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array/toBase64
  return btoa(typeof data === "string" ? data : JSON.stringify(data));
}

// missing crypto global for Node.js 18 https://nodejs.org/api/globals.html#crypto_1
// TODO: Improve error handling?
const compatCrypto =
  typeof crypto === "undefined"
    ? (await import("node:crypto")).webcrypto
    : crypto;

const textEncoder = new TextEncoder();

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
  encodedPayload: string,
): Promise<string> {
  const cryptoKey = await compatCrypto.subtle.importKey(
    "raw",
    textEncoder.encode(apiKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await compatCrypto.subtle.sign(
    "HMAC",
    cryptoKey,
    textEncoder.encode(`${encodedHeader}.${encodedPayload}`),
  );

  // TODO: Same problem as in `encodeToBase64` above
  const digest = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return digest;
}

/**
 * Create the header of the token.
 *
 * @returns The header encoded in base64.
 */
function createHeader(): string {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  return encodeToBase64(header).replace(/=/g, "");
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

  return encodeToBase64(payload).replace(/=/g, "");
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
  if (expiresAt !== undefined && expiresAt.getTime() < Date.now()) {
    throw new Error("the `expiresAt` field must be a date in the future");
  }

  if (!isValidUUIDv4(apiKeyUid)) {
    throw new Error(
      "the uid of your key is not a valid UUIDv4; to find out the uid of your key use `getKey()`",
    );
  }

  const encodedHeader = createHeader();
  const encodedPayload = createPayload({
    searchRules,
    apiKeyUid,
    expiresAt,
  });
  const signature = await sign(apiKey, encodedHeader, encodedPayload);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}
