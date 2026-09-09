import { test, describe, beforeEach, vi } from "vitest";
import { Meilisearch, assert } from "./utils/meilisearch-test-utils.js";
import {
  MeilisearchRequestError,
  MeilisearchRequestTimeOutError,
} from "../src/index.js";

const mockedFetch = vi.fn();
globalThis.fetch = mockedFetch;

describe("Test on updates", () => {
  beforeEach(() => {
    mockedFetch.mockReset();
  });

  test(`Throw MeilisearchRequestError when thrown error is not MeilisearchApiError`, async () => {
    mockedFetch.mockRejectedValue(new Error("fake error message"));

    const client = new Meilisearch({ host: "http://localhost:9345" });
    await assert.rejects(client.health(), MeilisearchRequestError);
  });

  test(`Throw MeilisearchRequestTimeOutError when request exceeds the timeout`, async () => {
    // A `fetch` that never resolves on its own and only settles once its abort
    // signal fires, mirroring how the real `fetch` reacts to an aborted signal.
    // This removes the event-loop timing race of testing against a real server,
    // so the timeout path is exercised deterministically.
    mockedFetch.mockImplementation(
      (_input: unknown, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          const { signal } = init ?? {};
          if (signal == null) {
            return;
          }

          signal.addEventListener(
            "abort",
            // The real `fetch` rejects with the signal's abort reason, which is
            // the internal timeout marker the SDK checks for; forward it as-is.
            // oxlint-disable-next-line prefer-promise-reject-errors
            () => reject(signal.reason),
            { once: true },
          );
        }),
    );

    const timeout = 1;
    const client = new Meilisearch({
      host: "http://localhost:9345",
      timeout,
    });

    const error = await assert.rejects(
      client.health(),
      MeilisearchRequestError,
    );

    assert.instanceOf(error.cause, MeilisearchRequestTimeOutError);
    assert.strictEqual(error.cause.cause.timeout, timeout);
  });
});

describe("MeilisearchRequestTimeOutError", () => {
  test("timeout cause must NOT contain the raw api key", () => {
    const SECRET = "MASTER_KEY_SUPER_SECRET_123";
    const error = new MeilisearchRequestTimeOutError(50, {
      method: "GET",
      headers: { Authorization: `Bearer ${SECRET}` },
      body: JSON.stringify({ note: "not a secret" }),
    });

    const { requestInit } = error.cause;
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
    assert.deepEqual(leaked, []);
  });

  test("timeout cause redacts Authorization but keeps debug info", () => {
    const error = new MeilisearchRequestTimeOutError(50, {
      method: "POST",
      headers: {
        Authorization: "Bearer SOME_KEY",
        "Content-Type": "application/json",
      },
    });

    const { timeout, requestInit } = error.cause;
    assert.strictEqual(timeout, 50);
    assert.strictEqual(requestInit.method, "POST");
    const headers = new Headers(requestInit.headers);
    assert.strictEqual(headers.get("Authorization"), "<redacted>");
    assert.strictEqual(headers.get("Content-Type"), "application/json");
  });

  test("timeout without apiKey still reports cause", () => {
    const error = new MeilisearchRequestTimeOutError(50, {
      method: "GET",
    });

    const { timeout, requestInit } = error.cause;
    assert.strictEqual(timeout, 50);
    assert.isFalse(new Headers(requestInit.headers).has("Authorization"));
  });
});
