import { describe, expect, test } from "vitest";
import { createHmac } from "node:crypto";
import { generateTenantToken } from "../src/token.js";

const UID = "599749c9-2d06-4d28-9c9c-8f3e0f1f2a3b";
const KEY = "test-api-key-sup3r-secret";

function decodePayload(token: string): unknown {
  const [, payload] = token.split(".");
  const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  return JSON.parse(Buffer.from(b64, "base64").toString("utf8"));
}

describe("tenant token unicode search rules (RED)", () => {
  test("does not crash on non-latin1 search rules", async () => {
    const token = await generateTenantToken({
      apiKey: KEY,
      apiKeyUid: UID,
      searchRules: { movies: { filter: "genre = کتاب" } },
    });
    expect(typeof token).toBe("string");
  });

  test("unicode payload round-trips through the token", async () => {
    const token = await generateTenantToken({
      apiKey: KEY,
      apiKeyUid: UID,
      searchRules: { movies: { filter: "genre = کتاب" } },
    });
    expect(decodePayload(token)).toMatchObject({
      apiKeyUid: UID,
      searchRules: { movies: { filter: "genre = کتاب" } },
    });
  });

  test("signature verifies against the standard JWT HMAC input", async () => {
    const token = await generateTenantToken({
      apiKey: KEY,
      apiKeyUid: UID,
      searchRules: { movies: { filter: "genre = کتاب" } },
    });
    const [header, payload, signature] = token.split(".");
    const expected = createHmac("sha256", KEY)
      .update(`${header}.${payload}`)
      .digest("base64url");
    expect(signature).toBe(expected);
  });
});
