import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { Index } from "../src/indexes.js";
import { MeilisearchError } from "../src/errors/index.js";

describe("add/updateDocumentsInBatches batchSize validation", () => {
  beforeEach(() => {
    vi.spyOn(globalThis, "fetch").mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ taskUid: 1 }), {
          status: 202,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("addDocumentsInBatches throws on batchSize 0 without firing requests", () => {
    const index = new Index({ host: "http://localhost:7700" }, "movies");
    expect(() =>
      index.addDocumentsInBatches([{ id: 1 }, { id: 2 }], 0),
    ).toThrow(MeilisearchError);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  test("updateDocumentsInBatches throws on negative batchSize without firing requests", () => {
    const index = new Index({ host: "http://localhost:7700" }, "movies");
    expect(() => index.updateDocumentsInBatches([{ id: 1 }], -5)).toThrow(
      MeilisearchError,
    );
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  test("addDocumentsInBatches throws on NaN batchSize without firing requests", () => {
    const index = new Index({ host: "http://localhost:7700" }, "movies");
    expect(() => index.addDocumentsInBatches([{ id: 1 }], Number.NaN)).toThrow(
      MeilisearchError,
    );
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  test("addDocumentsInBatches still splits valid batches", async () => {
    const index = new Index({ host: "http://localhost:7700" }, "movies");
    const batches = index.addDocumentsInBatches(
      [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }],
      2,
    );
    expect(batches).toHaveLength(3);
    await Promise.all(batches);
    expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledTimes(3);
  });

  test("updateDocumentsInBatches still splits valid batches", async () => {
    const index = new Index({ host: "http://localhost:7700" }, "movies");
    const batches = index.updateDocumentsInBatches(
      [{ id: 1 }, { id: 2 }, { id: 3 }],
      2,
    );
    expect(batches).toHaveLength(2);
    await Promise.all(batches);
    expect(vi.mocked(globalThis.fetch)).toHaveBeenCalledTimes(2);
  });
});
