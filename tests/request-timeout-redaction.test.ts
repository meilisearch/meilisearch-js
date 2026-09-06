import { afterAll, beforeEach, describe, expect, test, vi } from "vitest";
import { HttpRequests } from "../src/http-requests.js";
import {
  MeilisearchRequestError,
  MeilisearchRequestTimeOutError,
} from "../src/errors/index.js";

/** Mocks `fetch` with a request that hangs until aborted (like a real timeout). */
function mockHangingFetch() {
  vi.spyOn(globalThis, "fetch").mockImplementation(
    (_url, init) =>
      new Promise((_, reject) => {
        init?.signal?.addEventListener("abort", () => {
          // Mimics real fetch, which rejects with the abort reason
          // (a Symbol on timeout), not an Error.
          // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
          reject(init.signal?.reason);
        });
      }),
  );
}

/** Extracts the timeout `cause` payload from a request error. */
function timeoutCauseOf(error: unknown): {
  timeout: number;
  requestInit: RequestInit;
} {
  const requestError = error as MeilisearchRequestError;
  return (requestError.cause as MeilisearchRequestTimeOutError).cause;
}

describe("Request timeout errors", () => {
  beforeEach(() => {
    mockHangingFetch();
  });
  afterAll(() => {
    vi.restoreAllMocks();
  });

  test("timeout cause must NOT contain the raw api key", async () => {
    const SECRET = "MASTER_KEY_SUPER_SECRET_123";
    const http = new HttpRequests({
      host: "http://localhost:7700",
      apiKey: SECRET,
      timeout: 50,
    });
    const err = await http.get({ path: "health" }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(MeilisearchRequestError);

    const { requestInit } = timeoutCauseOf(err);
    const leaked: string[] = [];
    new Headers(requestInit.headers).forEach((v) => {
      if (v.includes(SECRET)) leaked.push(v);
    });
    if (
      typeof requestInit.body === "string" &&
      requestInit.body.includes(SECRET)
    ) {
      leaked.push(requestInit.body);
    }
    expect(leaked).toEqual([]);
  });

  test("timeout cause redacts Authorization but keeps debug info", async () => {
    const http = new HttpRequests({
      host: "http://localhost:7700",
      apiKey: "SOME_KEY",
      timeout: 50,
    });
    const err = await http
      .post({ path: "indexes", body: { uid: "movies" } })
      .catch((e: unknown) => e);
    const { timeout, requestInit } = timeoutCauseOf(err);

    expect(timeout).toBe(50);
    expect(requestInit.method).toBe("POST");
    const headers = new Headers(requestInit.headers);
    expect(headers.get("Authorization")).toBe("<redacted>");
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  test("timeout without apiKey still reports cause", async () => {
    const http = new HttpRequests({
      host: "http://localhost:7700",
      timeout: 50,
    });
    const err = await http.get({ path: "health" }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(MeilisearchRequestError);
    const { timeout, requestInit } = timeoutCauseOf(err);
    expect(timeout).toBe(50);
    expect(new Headers(requestInit.headers).has("Authorization")).toBe(false);
  });
});
