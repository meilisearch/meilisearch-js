import { Config } from "./types";
import { PACKAGE_VERSION } from "./package-version";

import {
  MeiliSearchError,
  MeiliSearchApiError,
  MeiliSearchRequestError,
} from "./errors";

import { addProtocolIfNotPresent, addTrailingSlash } from "./utils";

type URLSearchParamsRecord = Record<
  string,
  | string
  | string[]
  | Array<string | string[]>
  | number
  | number[]
  | boolean
  | Date
  | null
  | undefined
>;

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

function getHeaders(config: Config, headersInit?: HeadersInit): Headers {
  const agentHeader = "X-Meilisearch-Client";
  const packageAgent = `Meilisearch JavaScript (v${PACKAGE_VERSION})`;
  const contentType = "Content-Type";
  const authorization = "Authorization";

  const headers = new Headers(headersInit);

  // do not override if user provided the header
  if (config.apiKey && !headers.has(authorization)) {
    headers.set(authorization, `Bearer ${config.apiKey}`);
  }

  if (!headers.has(contentType)) {
    headers.set("Content-Type", "application/json");
  }

  // Creates the custom user agent with information on the package used.
  if (config.clientAgents && Array.isArray(config.clientAgents)) {
    const clients = config.clientAgents.concat(packageAgent);

    headers.set(agentHeader, clients.join(" ; "));
  } else if (config.clientAgents && !Array.isArray(config.clientAgents)) {
    // If the header is defined but not an array
    throw new MeiliSearchError(
      `Meilisearch: The header "${agentHeader}" should be an array of string(s).\n`,
    );
  } else {
    headers.set(agentHeader, packageAgent);
  }

  return headers;
}

type RequestOptions = {
  relativeURL: string;
  method?: string;
  params?: URLSearchParamsRecord;
  headers?: HeadersInit;
  body?: unknown;
};

export type MethodOptions = Omit<RequestOptions, "method">;

export class HttpRequests {
  #url: URL;
  #requestInit: Omit<NonNullable<Config["requestInit"]>, "headers"> & {
    headers: Headers;
  };
  #requestFn: NonNullable<Config["httpClient"]>;
  #isCustomRequestFnProvided: boolean;
  #requestTimeout?: number;

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

    this.#requestFn = config.httpClient ?? fetch;
    this.#isCustomRequestFnProvided = config.httpClient !== undefined;
    this.#requestTimeout = config.timeout;
  }

  async #fetchWithTimeout(
    ...fetchParams: Parameters<typeof fetch>
  ): Promise<Response> {
    return new Promise((resolve, reject) => {
      const fetchPromise = this.#requestFn(...fetchParams);

      const promises: Array<Promise<any>> = [fetchPromise];

      // TimeoutPromise will not run if undefined or zero
      let timeoutId: ReturnType<typeof setTimeout>;
      if (this.#requestTimeout) {
        const timeoutPromise = new Promise((_, reject) => {
          timeoutId = setTimeout(() => {
            reject(new Error("Error: Request Timed Out"));
          }, this.#requestTimeout);
        });

        promises.push(timeoutPromise);
      }

      Promise.race(promises)
        .then(resolve)
        .catch(reject)
        .finally(() => {
          clearTimeout(timeoutId);
        });
    });
  }

  async #request({
    relativeURL,
    method,
    params,
    headers,
    body,
  }: RequestOptions): Promise<unknown> {
    const url = new URL(relativeURL, this.#url);
    if (params !== undefined) {
      appendRecordToURLSearchParams(url.searchParams, params);
    }

    let isCustomContentTypeProvided: boolean;

    if (headers !== undefined) {
      headers = new Headers(headers);

      isCustomContentTypeProvided = headers.has("Content-Type");

      for (const [key, val] of this.#requestInit.headers.entries()) {
        if (!headers.has(key)) {
          headers.set(key, val);
        }
      }
    } else {
      isCustomContentTypeProvided = false;
    }

    const responsePromise = this.#fetchWithTimeout(url, {
      method,
      body:
        // in case a custom content-type is provided do not stringify body
        typeof body !== "string" || !isCustomContentTypeProvided
          ? // this will throw an error for any value that is not serializable
            JSON.stringify(body)
          : body,
      ...this.#requestInit,
      headers: headers ?? this.#requestInit.headers,
    });

    const response = await responsePromise.catch((error: unknown) => {
      throw new MeiliSearchRequestError(url.toString(), error);
    });

    // When using a custom HTTP client, the response is returned to allow the user to parse/handle it as they see fit
    if (this.#isCustomRequestFnProvided) {
      return response;
    }

    const responseBody = await response.text();
    const parsedResponse =
      responseBody === "" ? undefined : JSON.parse(responseBody);

    if (!response.ok) {
      throw new MeiliSearchApiError(response, parsedResponse);
    }

    return parsedResponse;
  }

  get(options: MethodOptions) {
    return this.#request(options);
  }

  post(options: MethodOptions) {
    return this.#request({ ...options, method: "POST" });
  }

  put(options: MethodOptions) {
    return this.#request({ ...options, method: "PUT" });
  }

  patch(options: MethodOptions) {
    return this.#request({ ...options, method: "PATCH" });
  }

  delete(options: MethodOptions) {
    return this.#request({ ...options, method: "DELETE" });
  }
}
