import type {
  Config,
  HttpRequestsRequestInit,
  RequestOptions,
  MainRequestOptions,
  URLSearchParamsRecord,
  MeiliSearchErrorResponse,
} from "./types/index.js";
import pkg from "../package.json" with { type: "json" };
import {
  MeiliSearchError,
  MeiliSearchApiError,
  MeiliSearchRequestError,
  MeiliSearchRequestTimeOutError,
} from "./errors/index.js";
import { addProtocolIfNotPresent, addTrailingSlash } from "./utils.js";

/** Append a set of key value pairs to a {@link URLSearchParams} object. */
function appendRecordToURLSearchParams(
  searchParams: URLSearchParams,
  recordToAppend: URLSearchParamsRecord,
): void {
  for (const [key, val] of Object.entries(recordToAppend)) {
    if (val != null) {
      searchParams.set(
        key,
        Array.isArray(val)
          ? val.join()
          : val instanceof Date
            ? val.toISOString()
            : String(val),
      );
    }
  }
}

/**
 * Creates a new Headers object from a {@link HeadersInit} and adds various
 * properties to it, some from {@link Config}.
 *
 * @returns A new Headers object
 */
function getHeaders(config: Config, headersInit?: HeadersInit): Headers {
  const agentHeader = "X-Meilisearch-Client";
  const packageAgent = `Meilisearch JavaScript (v${pkg.version})`;
  const contentType = "Content-Type";
  const authorization = "Authorization";

  const headers = new Headers(headersInit);

  // do not override if user provided the header
  if (config.apiKey && !headers.has(authorization)) {
    headers.set(authorization, `Bearer ${config.apiKey}`);
  }

  if (!headers.has(contentType)) {
    headers.set(contentType, "application/json");
  }

  // Creates the custom user agent with information on the package used.
  if (config.clientAgents !== undefined) {
    const clients = config.clientAgents.concat(packageAgent);

    headers.set(agentHeader, clients.join(" ; "));
  } else {
    headers.set(agentHeader, packageAgent);
  }

  return headers;
}

/** Used to identify whether an error is a timeout error after fetch request. */
const TIMEOUT_ID = Symbol("<timeout>");

/**
 * Attach a timeout signal to a {@link RequestInit}, while preserving original
 * signal functionality, if there is one.
 *
 * @remarks
 * This could be a short few straight forward lines using {@link AbortSignal.any}
 * and {@link AbortSignal.timeout}, but these aren't yet widely supported enough,
 * nor polyfill -able, at the time of writing.
 * @returns A new function which starts the timeout, which then returns another
 *   function that clears the timeout
 */
function getTimeoutFn(
  requestInit: RequestInit,
  ms: number,
): () => (() => void) | void {
  const { signal } = requestInit;
  const ac = new AbortController();

  if (signal != null) {
    let acSignalFn: (() => void) | null = null;

    if (signal.aborted) {
      ac.abort(signal.reason);
    } else {
      const fn = () => ac.abort(signal.reason);

      signal.addEventListener("abort", fn, { once: true });

      acSignalFn = () => signal.removeEventListener("abort", fn);
      ac.signal.addEventListener("abort", acSignalFn, { once: true });
    }

    return () => {
      if (signal.aborted) {
        return;
      }

      const to = setTimeout(() => ac.abort(TIMEOUT_ID), ms);
      const fn = () => {
        clearTimeout(to);

        if (acSignalFn !== null) {
          ac.signal.removeEventListener("abort", acSignalFn);
        }
      };

      signal.addEventListener("abort", fn, { once: true });

      return () => {
        signal.removeEventListener("abort", fn);
        fn();
      };
    };
  }

  requestInit.signal = ac.signal;

  return () => {
    const to = setTimeout(() => ac.abort(TIMEOUT_ID), ms);
    return () => clearTimeout(to);
  };
}

/** Class used to perform HTTP requests. */
export class HttpRequests {
  #url: URL;
  #requestInit: HttpRequestsRequestInit;
  #customRequestFn?: Config["httpClient"];
  #requestTimeout?: Config["timeout"];

  constructor(config: Config) {
    const host = addTrailingSlash(addProtocolIfNotPresent(config.host));

    try {
      this.#url = new URL(host);
    } catch (error) {
      throw new MeiliSearchError("The provided host is not valid", {
        cause: error,
      });
    }

    this.#requestInit = {
      ...config.requestInit,
      headers: getHeaders(config, config.requestInit?.headers),
    };

    this.#customRequestFn = config.httpClient;
    this.#requestTimeout = config.timeout;
  }

  /**
   * Combines provided extra {@link RequestInit} headers, provided content type
   * and class instance RequestInit headers, prioritizing them in this order.
   *
   * @returns A new Headers object or the main headers of this class if no
   *   headers are provided
   */
  #getHeaders(extraHeaders?: HeadersInit, contentType?: string): Headers {
    if (extraHeaders === undefined && contentType === undefined) {
      return this.#requestInit.headers;
    }

    const headers = new Headers(extraHeaders);

    if (contentType !== undefined && !headers.has("Content-Type")) {
      headers.set("Content-Type", contentType);
    }

    for (const [key, val] of this.#requestInit.headers) {
      if (!headers.has(key)) {
        headers.set(key, val);
      }
    }

    return headers;
  }

  /**
   * Prepares common request parameters (URL and RequestInit).
   *
   * @returns Object containing the prepared URL and RequestInit
   */
  #prepareRequest({
    path,
    method,
    params,
    contentType,
    body,
    extraRequestInit,
  }: MainRequestOptions): { url: URL; init: RequestInit } {
    const url = new URL(path, this.#url);
    if (params !== undefined) {
      appendRecordToURLSearchParams(url.searchParams, params);
    }

    const init: RequestInit = {
      method,
      body:
        contentType === undefined || typeof body !== "string"
          ? JSON.stringify(body)
          : body,
      ...extraRequestInit,
      ...this.#requestInit,
      headers: this.#getHeaders(extraRequestInit?.headers, contentType),
    };

    return { url, init };
  }

  /**
   * Sends a request with {@link fetch} or a custom HTTP client, combining
   * parameters and class properties.
   *
   * @returns A promise containing the response
   */
  async #request<T = unknown>(options: MainRequestOptions): Promise<T> {
    const { url, init } = this.#prepareRequest(options);

    const startTimeout =
      this.#requestTimeout !== undefined
        ? getTimeoutFn(init, this.#requestTimeout)
        : null;

    const stopTimeout = startTimeout?.();

    let response: Response;
    let responseBody: string;
    try {
      if (this.#customRequestFn !== undefined) {
        // When using a custom HTTP client, the response should already be handled and ready to be returned
        return (await this.#customRequestFn(url, init)) as T;
      }

      response = await fetch(url, init);
      responseBody = await response.text();
    } catch (error) {
      throw new MeiliSearchRequestError(
        url.toString(),
        Object.is(error, TIMEOUT_ID)
          ? new MeiliSearchRequestTimeOutError(this.#requestTimeout!, init)
          : error,
      );
    } finally {
      stopTimeout?.();
    }

    const parsedResponse =
      responseBody === ""
        ? undefined
        : (JSON.parse(responseBody) as T | MeiliSearchErrorResponse);

    if (!response.ok) {
      throw new MeiliSearchApiError(
        response,
        parsedResponse as MeiliSearchErrorResponse | undefined,
      );
    }

    return parsedResponse as T;
  }

  /** Request with GET. */
  get<T = unknown>(options: RequestOptions): Promise<T> {
    return this.#request<T>(options);
  }

  /** Request with POST. */
  post<T = unknown>(options: RequestOptions): Promise<T> {
    return this.#request<T>({ ...options, method: "POST" });
  }

  /** Request with PUT. */
  put<T = unknown>(options: RequestOptions): Promise<T> {
    return this.#request<T>({ ...options, method: "PUT" });
  }

  /** Request with PATCH. */
  patch<T = unknown>(options: RequestOptions): Promise<T> {
    return this.#request<T>({ ...options, method: "PATCH" });
  }

  /** Request with DELETE. */
  delete<T = unknown>(options: RequestOptions): Promise<T> {
    return this.#request<T>({ ...options, method: "DELETE" });
  }

  /** Request with POST that returns a stream. */
  postStream(options: RequestOptions): Promise<ReadableStream<Uint8Array>> {
    return this.#requestStream({ ...options, method: "POST" });
  }

  /**
   * Sends a request that returns a ReadableStream for streaming responses.
   *
   * @returns A promise containing the response stream
   */
  async #requestStream(
    options: MainRequestOptions,
  ): Promise<ReadableStream<Uint8Array>> {
    const { url, init } = this.#prepareRequest(options);

    const startTimeout =
      this.#requestTimeout !== undefined
        ? getTimeoutFn(init, this.#requestTimeout)
        : null;

    const stopTimeout = startTimeout?.();

    let response: Response;
    try {
      if (this.#customRequestFn !== undefined) {
        const result = await this.#customRequestFn(url, init);
        if (!(result instanceof ReadableStream)) {
          throw new MeiliSearchError(
            "Custom HTTP client must return a ReadableStream for streaming requests",
          );
        }
        return result as ReadableStream<Uint8Array>;
      }

      response = await fetch(url, init);
    } catch (error) {
      throw new MeiliSearchRequestError(
        url.toString(),
        Object.is(error, TIMEOUT_ID)
          ? new MeiliSearchRequestTimeOutError(this.#requestTimeout!, init)
          : error,
      );
    } finally {
      stopTimeout?.();
    }

    if (!response.ok) {
      // For error responses, we still need to read the body to get error details
      const responseBody = await response.text();
      const parsedResponse =
        responseBody === ""
          ? undefined
          : (JSON.parse(responseBody) as MeiliSearchErrorResponse);

      throw new MeiliSearchApiError(response, parsedResponse);
    }

    if (!response.body) {
      throw new MeiliSearchError(
        "Response body is null - server did not return a readable stream",
      );
    }

    return response.body;
  }
}
