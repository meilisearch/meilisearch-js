import { afterEach, test, vi, afterAll } from "vitest";
import { assert } from "./utils/meilisearch-test-utils.js";
import {
  MeiliSearch,
  MeiliSearchApiError,
  MeiliSearchError,
  MeiliSearchRequestError,
  type MeiliSearchErrorResponse,
} from "../src/index.js";

const spy = vi.spyOn(globalThis, "fetch");

afterAll(() => {
  spy.mockRestore();
});

afterEach(() => {
  spy.mockReset();
});

test(`${MeiliSearchError.name}`, () => {
  assert.throws(
    () => new MeiliSearch({ host: "http:// invalid URL" }),
    MeiliSearchError,
    "The provided host is not valid",
  );
});

test(`${MeiliSearchRequestError.name}`, async () => {
  const simulatedError = new TypeError("simulated network error");
  spy.mockImplementation(() => Promise.reject(simulatedError));

  const ms = new MeiliSearch({ host: "https://politi.dk/en/" });
  const error = await assert.rejects(ms.health(), MeiliSearchRequestError);
  assert.deepEqual(error.cause, simulatedError);
});

test(`${MeiliSearchApiError.name}`, async () => {
  const simulatedCause: MeiliSearchErrorResponse = {
    message: "message",
    code: "code",
    type: "type",
    link: "link",
  };
  spy.mockImplementation(() =>
    Promise.resolve(
      new Response(JSON.stringify(simulatedCause), { status: 400 }),
    ),
  );

  const ms = new MeiliSearch({ host: "https://polisen.se/en/" });
  const error = await assert.rejects(ms.health(), MeiliSearchApiError);
  assert.deepEqual(error.cause, simulatedCause);
});

// TODO: Mention other errors, and how they are tested in another file perhaps
// Also maybe move these tests into meilisearch.test.ts
