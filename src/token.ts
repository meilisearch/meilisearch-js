import type { TenantTokenGeneratorOptions } from "./types";

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
const cryptoPonyfill =
  typeof crypto === "undefined"
    ? import("node:crypto").then((v) => v.webcrypto)
    : Promise.resolve(crypto);

const textEncoder = new TextEncoder();

/** Create the signature of the token. */
async function sign(
  apiKey: string,
  encodedPayload: string,
  encodedHeader: string,
): Promise<string> {
  const crypto = await cryptoPonyfill;

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(apiKey),
    // TODO: Does alg depend on this too?
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signature = await crypto.subtle.sign(
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

/** Create the header of the token. */
function getHeader({
  algorithm: alg = "HS256",
}: TenantTokenGeneratorOptions): string {
  const header = { alg, typ: "JWT" };
  return encodeToBase64(header).replace(/=/g, "");
}

/** Create the payload of the token. */
function getPayload({
  searchRules = [],
  apiKeyUid,
  expiresAt,
}: TenantTokenGeneratorOptions): string {
  if (!isValidUUIDv4(apiKeyUid)) {
    throw new Error("the uid of your key is not a valid UUIDv4");
  }

  const payload = {
    searchRules,
    apiKeyUid,
    exp: expiresAt
      ? Math.floor(
          (typeof expiresAt === "number" ? expiresAt : expiresAt.getTime()) /
            1000,
        )
      : undefined,
  };

  return encodeToBase64(payload).replace(/=/g, "");
}

/**
 * Try to detect if the script is running in a server-side runtime.
 *
 * @remarks
 * This is not a silver bullet method for determining the environment.
 * {@link https://developer.mozilla.org/en-US/docs/Web/API/Navigator/userAgent | User agent }
 * can be spoofed, `process` can be patched. Never the less theoretically it
 * should prevent misuse for the overwhelming majority of cases.
 */
function tryDetectEnvironment(): void {
  // https://min-common-api.proposal.wintercg.org/#navigator-useragent-requirements
  if (
    typeof navigator !== "undefined" &&
    Object.hasOwn(navigator, "userAgent")
  ) {
    const { userAgent } = navigator;

    if (
      userAgent.startsWith("Node") ||
      userAgent.startsWith("Deno") ||
      userAgent.startsWith("Bun") ||
      userAgent.startsWith("Cloudflare-Workers")
    ) {
      return;
    }
  }

  // Node.js prior to v21.1.0 doesn't have the above global
  // https://nodejs.org/api/globals.html#navigatoruseragent
  if (
    Object.hasOwn(globalThis, "process") &&
    Object.hasOwn(globalThis.process, "versions") &&
    Object.hasOwn(globalThis.process.versions, "node")
  ) {
    return;
  }

  throw new Error("TODO");
}

/**
 * Generate a tenant token.
 *
 * @remarks
 * TODO: Describe how this should be used safely.
 * @param options - Options object for tenant token generation
 * @returns The token in JWT (JSON Web Token) format
 * @see {@link https://www.meilisearch.com/docs/learn/security/generate_tenant_token_sdk | Using tenant tokens with an official SDK}
 * @see {@link https://www.meilisearch.com/docs/learn/security/tenant_token_reference | Tenant token payload reference}
 */
export async function generateTenantToken(
  options: TenantTokenGeneratorOptions,
): Promise<string> {
  const { apiKey, force = false } = options;

  if (!force) {
    tryDetectEnvironment();
  }

  const encodedPayload = getPayload(options);
  const encodedHeader = getHeader(options);
  const signature = await sign(apiKey, encodedPayload, encodedHeader);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}
