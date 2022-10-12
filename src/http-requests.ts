import 'cross-fetch/polyfill'

import { Config, EnqueuedTaskObject } from './types'
import { PACKAGE_VERSION } from './package-version'
import AbortController from 'abort-controller'

import {
  MeiliSearchError,
  httpResponseErrorHandler,
  httpErrorHandler,
} from './errors'

import { addTrailingSlash, addProtocolIfNotPresent } from './utils'

function constructHostURL(host: string): string {
  try {
    host = addProtocolIfNotPresent(host)
    host = addTrailingSlash(host)
    return host
  } catch (e) {
    throw new MeiliSearchError('The provided host is not valid.')
  }
}

function createHeaders(config: Config): Record<string, any> {
  const agentHeader = 'X-Meilisearch-Client'
  const packageAgent = `Meilisearch JavaScript (v${PACKAGE_VERSION})`
  const contentType = 'Content-Type'
  config.headers = config.headers || {}

  const headers: Record<string, any> = Object.assign({}, config.headers) // Create a hard copy and not a reference to config.headers

  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`
  }

  if (!config.headers[contentType]) {
    headers['Content-Type'] = 'application/json'
  }

  // Creates the custom user agent with information on the package used.
  if (config.clientAgents && Array.isArray(config.clientAgents)) {
    const clients = config.clientAgents.concat(packageAgent)

    headers[agentHeader] = clients.join(' ; ')
  } else if (config.clientAgents && !Array.isArray(config.clientAgents)) {
    // If the header is defined but not an array
    throw new MeiliSearchError(
      `Meilisearch: The header "${agentHeader}" should be an array of string(s).\n`
    )
  } else {
    headers[agentHeader] = packageAgent
  }

  return headers
}

function combineAbortSignal(
  abortController: AbortController,
  signal: AbortSignal
): void {
  const onAbort = () => {
    abortController.abort()
    signal.removeEventListener('abort', onAbort)
  }
  signal.addEventListener('abort', onAbort, { once: true })
}

class HttpRequests {
  headers: Record<string, any>
  url: URL
  timeout?: number

  constructor(config: Config) {
    this.headers = createHeaders(config)
    this.timeout = config.timeout

    try {
      const host = constructHostURL(config.host)
      this.url = new URL(host)
    } catch (e) {
      throw new MeiliSearchError('The provided host is not valid.')
    }
  }

  async request({
    method,
    url,
    params,
    body,
    config,
  }: {
    method: string
    url: string
    params?: { [key: string]: any }
    body?: any
    config?: Record<string, any>
  }) {
    const constructURL = new URL(url, this.url)
    if (params) {
      const queryParams = new URLSearchParams()
      Object.keys(params)
        .filter((x: string) => params[x] !== null)
        .map((x: string) => queryParams.set(x, params[x]))
      constructURL.search = queryParams.toString()
    }

    let timeout: any
    try {
      let signal: AbortSignal | null = config?.signal
      // Check if the user has set a timeout, and either no signal or the provided signal is not already aborted
      if (this.timeout && this.timeout > 0 && (!signal || !signal.aborted)) {
        const controller = new AbortController()
        timeout = setTimeout(() => controller?.abort(), this.timeout || 300_000)
        if (signal) {
          combineAbortSignal(controller, signal)
        }
        signal = controller.signal
      }
      const response: any = await fetch(constructURL.toString(), {
        ...config,
        method,
        body: JSON.stringify(body),
        headers: this.headers,
        signal: signal,
      }).then((res) => httpResponseErrorHandler(res))
      const parsedBody = await response.json().catch(() => undefined)

      return parsedBody
    } catch (e: any) {
      const stack = e.stack
      httpErrorHandler(e, stack, constructURL.toString())
    } finally {
      if (timeout) {
        clearTimeout(timeout)
      }
    }
  }

  async get(
    url: string,
    params?: { [key: string]: any },
    config?: Record<string, any>
  ): Promise<void>

  async get<T = any>(
    url: string,
    params?: { [key: string]: any },
    config?: Record<string, any>
  ): Promise<T>

  async get(
    url: string,
    params?: { [key: string]: any },
    config?: Record<string, any>
  ): Promise<any> {
    return await this.request({
      method: 'GET',
      url,
      params,
      config,
    })
  }

  async post<T = any, R = EnqueuedTaskObject>(
    url: string,
    data?: T,
    params?: { [key: string]: any },
    config?: Record<string, any>
  ): Promise<R>

  async post(
    url: string,
    data?: any,
    params?: { [key: string]: any },
    config?: Record<string, any>
  ): Promise<any> {
    return await this.request({
      method: 'POST',
      url,
      body: data,
      params,
      config,
    })
  }

  async put<T = any, R = EnqueuedTaskObject>(
    url: string,
    data?: T,
    params?: { [key: string]: any },
    config?: Record<string, any>
  ): Promise<R>

  async put(
    url: string,
    data?: any,
    params?: { [key: string]: any },
    config?: Record<string, any>
  ): Promise<any> {
    return await this.request({
      method: 'PUT',
      url,
      body: data,
      params,
      config,
    })
  }

  async patch(
    url: string,
    data?: any,
    params?: { [key: string]: any },
    config?: Record<string, any>
  ): Promise<any> {
    return await this.request({
      method: 'PATCH',
      url,
      body: data,
      params,
      config,
    })
  }

  async delete(
    url: string,
    data?: any,
    params?: { [key: string]: any },
    config?: Record<string, any>
  ): Promise<EnqueuedTaskObject>
  async delete<T>(
    url: string,
    data?: any,
    params?: { [key: string]: any },
    config?: Record<string, any>
  ): Promise<T>
  async delete(
    url: string,
    data?: any,
    params?: { [key: string]: any },
    config?: Record<string, any>
  ): Promise<any> {
    return await this.request({
      method: 'DELETE',
      url,
      body: data,
      params,
      config,
    })
  }
}

export { HttpRequests }
