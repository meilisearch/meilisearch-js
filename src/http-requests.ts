import type {
  Config,
  HttpRequestsRequestInit,
  RequestOptions,
  MainRequestOptions,
  URLSearchParamsRecord,
  MeiliSearchErrorResponse,
} from "./types/index.js";
import { PACKAGE_VERSION } from "./package-version.js";
import {
  MeiliSearchError,
  MeiliSearchApiError,
  MeiliSearchRequestError,
  MeiliSearchRequestTimeOutError,
} from "./errors/index.js";
import { addProtocolIfNotPresent } from "./utils.js";

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

const AGENT_HEADER_KEY = "X-Meilisearch-Client";
const CONTENT_TYPE_KEY = "Content-Type";
const AUTHORIZATION_KEY = "Authorization";
const PACKAGE_AGENT = `Meilisearch JavaScript (v${PACKAGE_VERSION})`;

/**
 * Creates a new Headers object from a {@link HeadersInit} and adds various
 * properties to it, as long as they're not already provided by the user.
 */
function getHeaders(config: Config, headersInit?: HeadersInit): Headers {
  const headers = new Headers(headersInit);

  if (config.apiKey && !headers.has(AUTHORIZATION_KEY)) {
    headers.set(AUTHORIZATION_KEY, `Bearer ${config.apiKey}`);
  }

  if (!headers.has(CONTENT_TYPE_KEY)) {
    headers.set(CONTENT_TYPE_KEY, "application/json");
  }

  // Creates the custom user agent with information on the package used.
  if (config.clientAgents !== undefined) {
    const agents = config.clientAgents.concat(PACKAGE_AGENT);
    headers.set(AGENT_HEADER_KEY, agents.join(" ; "));
  } else {
    headers.set(AGENT_HEADER_KEY, PACKAGE_AGENT);
  }

  return headers;
}

// TODO: Convert to Symbol("timeout id") when Node.js 18 is dropped
/** Used to identify whether an error is a timeout error after fetch request. */
const TIMEOUT_ID = {};

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
  init: RequestInit,
  ms: number,
): () => (() => void) | void {
  const { signal } = init;
  const ac = new AbortController();

  init.signal = ac.signal;

  if (signal != null) {
    let acSignalFn: (() => void) | null = null;

    if (signal.aborted) {
      ac.abort(signal.reason);
    } else {
      const fn = () => {
        ac.abort(signal.reason);
      };

      signal.addEventListener("abort", fn, { once: true });

      acSignalFn = () => signal.removeEventListener("abort", fn);
      ac.signal.addEventListener("abort", acSignalFn, { once: true });
    }

    return () => {
      if (signal.aborted) {
        return;
      }

      const to = setTimeout(() => {
        ac.abort(TIMEOUT_ID);
      }, ms);
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

  return () => {
    const to = setTimeout(() => {
      ac.abort(TIMEOUT_ID);
    }, ms);
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
    const host = addProtocolIfNotPresent(config.host);

    try {
      this.#url = new URL(host.endsWith("/") ? host : host + "/");
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

    if (contentType !== undefined && !headers.has(CONTENT_TYPE_KEY)) {
      headers.set(CONTENT_TYPE_KEY, contentType);
    }

    for (const [key, val] of this.#requestInit.headers) {
      if (!headers.has(key)) {
        headers.set(key, val);
      }
    }

    return headers;
  }

  /**
   * Sends a request with {@link fetch} or a custom HTTP client, combining
   * parameters and class properties.
   *
   * @returns A promise containing the response
   */
  async #request<T = unknown>({
    path,
    method,
    params,
    contentType,
    body,
    extraRequestInit,
  }: MainRequestOptions): Promise<T> {
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
}
