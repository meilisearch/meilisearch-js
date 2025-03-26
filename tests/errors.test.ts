import { test, describe, beforeEach, vi } from "vitest";
import { MeiliSearch, assert } from "./utils/meilisearch-test-utils.js";
import { MeiliSearchRequestError } from "../src/index.js";

const mockedFetch = vi.fn();
globalThis.fetch = mockedFetch;

describe("Test on updates", () => {
  beforeEach(() => {
    mockedFetch.mockReset();
  });

  test(`Throw MeilisearchRequestError when thrown error is not MeiliSearchApiError`, async () => {
    mockedFetch.mockRejectedValue(new Error("fake error message"));

    const client = new MeiliSearch({ host: "http://localhost:9345" });
    await assert.rejects(client.health(), MeiliSearchRequestError);
  });
});
