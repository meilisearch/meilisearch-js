import { expect, test, describe, beforeEach, vi } from "vitest";
import { MeiliSearch } from "./utils/meilisearch-test-utils.js";

const mockedFetch = vi.fn();
globalThis.fetch = mockedFetch;

describe("Test on updates", () => {
  beforeEach(() => {
    mockedFetch.mockReset();
  });

  test(`Throw MeilisearchRequestError when thrown error is not MeiliSearchApiError`, async () => {
    mockedFetch.mockRejectedValue(new Error("fake error message"));

    const client = new MeiliSearch({ host: "http://localhost:9345" });
    try {
      await client.health();
    } catch (error: any) {
      expect(error.name).toEqual("MeiliSearchRequestError");
    }
  });
});
