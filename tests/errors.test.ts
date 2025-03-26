import { expect, test, describe, beforeEach, vi } from "vitest";
import { assert, MeiliSearch } from "./utils/meilisearch-test-utils.js";
import {
  MeiliSearchError,
  MeiliSearchApiError,
  MeiliSearchRequestError,
  MeiliSearchTimeOutError,
} from "../src/errors/index.js";

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

  test("MeiliSearchApiError can be compared with the instanceof operator", () => {
    expect(
      new MeiliSearchApiError(new Response(), {
        message: "Some error",
        code: "some_error",
        type: "random_error",
        link: "a link",
      }) instanceof MeiliSearchApiError,
    ).toEqual(true);
  });

  test("MeilisearchRequestError can be compared with the instanceof operator", async () => {
    mockedFetch.mockRejectedValue(new Error("fake error message"));

    const client = new MeiliSearch({ host: "http://localhost:9345" });
    try {
      await client.health();
    } catch (error) {
      expect(error instanceof MeiliSearchRequestError).toEqual(true);
    }
  });

  test("MeiliSearchError can be compared with the instanceof operator", () => {
    expect(new MeiliSearchError("message") instanceof MeiliSearchError).toEqual(
      true,
    );
  });

  test("MeiliSearchTimeOutError can be compared with the instanceof operator", () => {
    expect(
      new MeiliSearchTimeOutError("message") instanceof MeiliSearchTimeOutError,
    ).toEqual(true);
  });
});
