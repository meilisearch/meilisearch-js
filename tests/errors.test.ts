import { test, describe, beforeEach, vi } from "vitest";
import { Meilisearch, assert } from "./utils/meilisearch-test-utils.js";
import { MeilisearchRequestError } from "../src/index.js";

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
});
