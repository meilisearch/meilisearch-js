import {
  afterAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
  type MockInstance,
} from "vitest";
import { HttpRequests } from "../src/http-requests.js";
import { Meilisearch } from "../src/index.js";
import type { Config } from "../src/types/index.js";
import {
  MeilisearchError,
  MeilisearchRequestError,
  MeilisearchApiError,
} from "../src/errors/index.js";

describe("HttpRequests", () => {
  let fetchSpy: MockInstance<typeof fetch>;

  beforeEach(() => {
    fetchSpy = vi.spyOn(globalThis, "fetch");
    fetchSpy.mockClear();
  });

  afterAll(() => {
    fetchSpy.mockRestore();
  });

  test("should throw error if custom http client returns non-stream for stream request", async () => {
    const customHttpClient = vi
      .fn()
      .mockResolvedValue({ data: "not a stream" });
    const config: Config = {
      host: "http://localhost:7700",
      httpClient: customHttpClient,
    };
    const httpRequests = new HttpRequests(config);

    await expect(
      httpRequests.postStream({ path: "chat", body: {} }),
    ).rejects.toThrow(MeilisearchRequestError);
  });

  test("should return stream from custom http client", async () => {
    const mockStream = new ReadableStream();
    const customHttpClient = vi.fn().mockResolvedValue(mockStream);
    const config: Config = {
      host: "http://localhost:7700",
      httpClient: customHttpClient,
    };
    const httpRequests = new HttpRequests(config);

    const result = await httpRequests.postStream({ path: "chat", body: {} });
    expect(result).toBe(mockStream);
  });

  test("should handle stream error response with body", async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ message: "Stream error" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const config: Config = { host: "http://localhost:7700" };
    const httpRequests = new HttpRequests(config);

    await expect(
      httpRequests.postStream({ path: "chat", body: {} }),
    ).rejects.toThrow(MeilisearchApiError);
  });

  test("should handle stream error response with empty body", async () => {
    fetchSpy.mockResolvedValue(
      new Response("", {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const config: Config = { host: "http://localhost:7700" };
    const httpRequests = new HttpRequests(config);

    await expect(
      httpRequests.postStream({ path: "chat", body: {} }),
    ).rejects.toThrow(MeilisearchApiError);
  });

  test("should handle null response body for stream", async () => {
    fetchSpy.mockResolvedValue(
      new Response(null, {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const config: Config = { host: "http://localhost:7700" };
    const httpRequests = new HttpRequests(config);

    await expect(
      httpRequests.postStream({ path: "chat", body: {} }),
    ).rejects.toThrow(MeilisearchError);
    await expect(
      httpRequests.postStream({ path: "chat", body: {} }),
    ).rejects.toThrow(
      "Response body is null - server did not return a readable stream",
    );
  });
  describe("Index.getDocument fields parameter", () => {
    const documentBody = { id: 1, title: "Alice In Wonderland" };

    function getRequestedUrl(): string {
      const [input] = fetchSpy.mock.lastCall as [URL];
      return input.href;
    }

    test("sends a single string field instead of dropping it", async () => {
      fetchSpy.mockResolvedValue(
        new Response(JSON.stringify(documentBody), { status: 200 }),
      );

      const client = new Meilisearch({ host: "http://localhost:7700" });
      const document = await client
        .index("movies")
        .getDocument(1, { fields: "title" });

      expect(document).toEqual(documentBody);
      expect(getRequestedUrl()).toContain("fields=title");
    });

    test("keeps joining an array of fields", async () => {
      fetchSpy.mockResolvedValue(
        new Response(JSON.stringify(documentBody), { status: 200 }),
      );

      const client = new Meilisearch({ host: "http://localhost:7700" });
      await client.index("movies").getDocument(1, { fields: ["id", "title"] });

      expect(getRequestedUrl()).toContain("fields=id%2Ctitle");
    });

    test("omits the fields parameter when not requested", async () => {
      fetchSpy.mockResolvedValue(
        new Response(JSON.stringify(documentBody), { status: 200 }),
      );

      const client = new Meilisearch({ host: "http://localhost:7700" });
      await client.index("movies").getDocument(1);

      expect(getRequestedUrl()).not.toContain("fields=");
    });
  });
});
