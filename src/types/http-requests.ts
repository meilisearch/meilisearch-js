import type { WaitOptions } from "./task-and-batch.js";

/**
 * Shape of allowed record object that can be appended to a
 * {@link URLSearchParams}.
 */
export type URLSearchParamsRecord = Record<
  string,
  string | string[] | number | number[] | boolean | null | undefined
>;

/**
 * {@link RequestInit} without {@link RequestInit.body} and
 * {@link RequestInit.method} properties.
 */
export type ExtraRequestInit = Omit<RequestInit, "body" | "method">;

/** Same as {@link ExtraRequestInit} but without {@link ExtraRequestInit.signal}. */
export type BaseRequestInit = Omit<ExtraRequestInit, "signal">;

/**
 * Same as {@link BaseRequestInit} but with its headers property forced as a
 * {@link Headers} object.
 */
export type HttpRequestsRequestInit = Omit<BaseRequestInit, "headers"> & {
  headers: Headers;
};

/** Main configuration object for the meilisearch client. */
export type Config = {
  /**
   * The base URL for reaching a meilisearch instance.
   *
   * @remarks
   * Protocol and trailing slash can be omitted.
   */
  host: string;
  /**
   * API key for interacting with a meilisearch instance.
   *
   * @see {@link https://www.meilisearch.com/docs/learn/security/basic_security}
   */
  apiKey?: string;
  /**
   * Custom strings that will be concatenated to the "X-Meilisearch-Client"
   * header on each request.
   */
  clientAgents?: string[];
  /** Base request options that may override the default ones. */
  requestInit?: BaseRequestInit;
  /**
   * Custom function that can be provided in place of {@link fetch}.
   *
   * @remarks
   * API response errors will have to be handled manually with this as well.
   * @deprecated This will be removed in a future version. See
   *   {@link https://github.com/meilisearch/meilisearch-js/issues/1824 | issue}.
   */
  httpClient?: (...args: Parameters<typeof fetch>) => Promise<unknown>;
  /** Timeout in milliseconds for each HTTP request. */
  timeout?: number;
  /** Options for waiting on tasks. */
  defaultWaitOptions?: WaitOptions;
};

/** Main options of a request. */
export type MainRequestOptions = {
  /** The path or subpath of the URL to make a request to. */
  path: string;
  /** The REST method of the request. */
  method?: string;
  /** The search parameters of the URL. */
  params?: URLSearchParamsRecord;
  /**
   * {@link https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Type | Content-Type}
   * passed to request {@link Headers}.
   */
  contentType?: string;
  /**
   * The body of the request.
   *
   * @remarks
   * This only really supports string for now (any other type gets stringified)
   * but it could support more in the future.
   * {@link https://developer.mozilla.org/en-US/docs/Web/API/RequestInit#body}
   */
  body?: string | boolean | number | object | null;
  /**
   * An extra, more limited {@link RequestInit}, that may override some of the
   * options.
   */
  extraRequestInit?: ExtraRequestInit;
};

/**
 * {@link MainRequestOptions} without {@link MainRequestOptions.method}, for
 * method functions.
 */
export type RequestOptions = Omit<MainRequestOptions, "method">;
