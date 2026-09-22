import {
  afterAll,
  assert,
  beforeEach,
  describe,
  expect,
  test,
  vi,
  type MockInstance,
} from "vitest";
import { HttpRequests } from "../src/http-requests.js";
import { Meilisearch } from "../src/meilisearch.js";
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

  test("should throw MeilisearchApiError for error response with HTML body", async () => {
    fetchSpy.mockResolvedValue(
      new Response("<html><body>502 Bad Gateway</body></html>", {
        status: 502,
        statusText: "Bad Gateway",
        headers: { "Content-Type": "text/html" },
      }),
    );

    const config: Config = { host: "http://localhost:7700" };
    const httpRequests = new HttpRequests(config);

    const error = await httpRequests
      .get({ path: "indexes" })
      .catch((error: unknown) => error);
    expect(error).toBeInstanceOf(MeilisearchApiError);
    expect((error as MeilisearchApiError).message).toBe("502: Bad Gateway");
    expect((error as MeilisearchApiError).cause).toBeUndefined();
  });

  test("should throw MeilisearchApiError for error response with plain text body", async () => {
    fetchSpy.mockResolvedValue(
      new Response("Service Unavailable", {
        status: 503,
        statusText: "Service Unavailable",
        headers: { "Content-Type": "text/plain" },
      }),
    );

    const config: Config = { host: "http://localhost:7700" };
    const httpRequests = new HttpRequests(config);

    await expect(httpRequests.get({ path: "indexes" })).rejects.toThrow(
      MeilisearchApiError,
    );
  });

  test("should throw SyntaxError for 200 response with HTML body", async () => {
    fetchSpy.mockResolvedValue(
      new Response("<html>ok</html>", {
        status: 200,
        headers: { "Content-Type": "text/html" },
      }),
    );

    const config: Config = { host: "http://localhost:7700" };
    const httpRequests = new HttpRequests(config);

    await expect(httpRequests.get({ path: "indexes" })).rejects.toThrow(
      SyntaxError,
    );
  });

  test("should throw MeilisearchApiError for stream error response with HTML body", async () => {
    fetchSpy.mockResolvedValue(
      new Response("<html><body>502 Bad Gateway</body></html>", {
        status: 502,
        statusText: "Bad Gateway",
        headers: { "Content-Type": "text/html" },
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

  test("should let per-request extraRequestInit override client requestInit", async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ status: "available" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const config: Config = {
      host: "http://localhost:7700",
      requestInit: { credentials: "omit" },
    };
    const httpRequests = new HttpRequests(config);

    await httpRequests.get({
      path: "health",
      extraRequestInit: { credentials: "include" },
    });

    assert.isDefined(fetchSpy.mock.lastCall);
    const [, init] = fetchSpy.mock.lastCall as [URL, RequestInit];
    expect(init.credentials).toBe("include");
  });

  test("should apply client requestInit as default without per-request override", async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ status: "available" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const config: Config = {
      host: "http://localhost:7700",
      requestInit: { credentials: "omit" },
    };
    const httpRequests = new HttpRequests(config);

    await httpRequests.get({ path: "health" });

    assert.isDefined(fetchSpy.mock.lastCall);
    const [, init] = fetchSpy.mock.lastCall as [URL, RequestInit];
    expect(init.credentials).toBe("omit");
  });

  test("Index#searchGet translates a `hybrid` object into `hybridEmbedder`/`hybridSemanticRatio` query params", async () => {
    fetchSpy.mockResolvedValue(
      new Response(JSON.stringify({ hits: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const client = new Meilisearch({ host: "http://localhost:7700" });

    await client.index("movies").searchGet("prince", {
      hybrid: { embedder: "default", semanticRatio: 0.5 },
    });

    assert.isDefined(fetchSpy.mock.lastCall);
    const [url] = fetchSpy.mock.lastCall as [URL, RequestInit];

    expect(url.searchParams.get("hybridEmbedder")).toBe("default");
    expect(url.searchParams.get("hybridSemanticRatio")).toBe("0.5");
    expect(url.searchParams.has("hybrid")).toBe(false);
    expect(url.search).not.toContain("object+Object");
  });
});
