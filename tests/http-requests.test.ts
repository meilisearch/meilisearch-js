import { env } from "node:process";
import {
  afterAll,
  beforeEach,
  describe,
  expect,
  test,
  vi,
  type MockInstance,
} from "vitest";
import { HttpRequests } from "#src/http-requests";
import type { Config } from "#src/index";
import {
  MeiliSearchError,
  MeiliSearchRequestError,
  MeiliSearchApiError,
} from "#src/index";

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
      host: `http://localhost:${env.PORT}`,
      httpClient: customHttpClient,
    };
    const httpRequests = new HttpRequests(config);

    await expect(
      httpRequests.postStream({ path: "chat", body: {} }),
    ).rejects.toThrow(MeiliSearchRequestError);
  });

  test("should return stream from custom http client", async () => {
    const mockStream = new ReadableStream();
    const customHttpClient = vi.fn().mockResolvedValue(mockStream);
    const config: Config = {
      host: `http://localhost:${env.PORT}`,
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

    const config: Config = { host: `http://localhost:${env.PORT}` };
    const httpRequests = new HttpRequests(config);

    await expect(
      httpRequests.postStream({ path: "chat", body: {} }),
    ).rejects.toThrow(MeiliSearchApiError);
  });

  test("should handle stream error response with empty body", async () => {
    fetchSpy.mockResolvedValue(
      new Response("", {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const config: Config = { host: `http://localhost:${env.PORT}` };
    const httpRequests = new HttpRequests(config);

    await expect(
      httpRequests.postStream({ path: "chat", body: {} }),
    ).rejects.toThrow(MeiliSearchApiError);
  });

  test("should handle null response body for stream", async () => {
    fetchSpy.mockResolvedValue(
      new Response(null, {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const config: Config = { host: `http://localhost:${env.PORT}` };
    const httpRequests = new HttpRequests(config);

    await expect(
      httpRequests.postStream({ path: "chat", body: {} }),
    ).rejects.toThrow(MeiliSearchError);
    await expect(
      httpRequests.postStream({ path: "chat", body: {} }),
    ).rejects.toThrow(
      "Response body is null - server did not return a readable stream",
    );
  });
});
