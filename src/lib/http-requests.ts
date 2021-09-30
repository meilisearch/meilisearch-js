import 'cross-fetch/polyfill'

import {
  Config,
  IndexRequest,
  EnqueuedUpdate,
  IndexResponse,
  IndexOptions,
} from '../types'

import { httpResponseErrorHandler, httpErrorHandler } from '../errors'

class HttpRequests {
  headers: {}
  url: URL

  constructor(config: Config) {
    this.headers = {
      ...(config.headers || {}),
      'Content-Type': 'application/json',
      ...(config.apiKey ? { 'X-Meili-API-Key': config.apiKey } : {}),
    }
    this.url = new URL(config.host)
  }

  static addTrailingSlash(url: string): string {
    if (!url.endsWith('/')) {
      url += '/'
    }
    return url
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
    config?: Partial<Request>
  }) {
    const constructURL = new URL(url, this.url)
    if (params) {
      const queryParams = new URLSearchParams()
      Object.keys(params)
        .filter((x: string) => params[x] !== null)
        .map((x: string) => queryParams.set(x, params[x]))
      constructURL.search = queryParams.toString()
    }

    try {
      const response: Response = await fetch(constructURL.toString(), {
        ...config,
        method,
        body: JSON.stringify(body),
        headers: this.headers,
      }).then((res) => httpResponseErrorHandler(res))
      const parsedBody: string = await response.text()

      try {
        const parsedJson = JSON.parse(parsedBody)
        return parsedJson
      } catch (_) {
        return
      }
    } catch (e) {
      const stack = e.stack
      httpErrorHandler(e, stack, constructURL.toString())
    }
  }

  async get(
    url: string,
    params?: { [key: string]: any },
    config?: Partial<Request>
  ): Promise<void>

  async get<T = any>(
    url: string,
    params?: { [key: string]: any },
    config?: Partial<Request>
  ): Promise<T>

  async get(
    url: string,
    params?: { [key: string]: any },
    config?: Partial<Request>
  ): Promise<any> {
    return await this.request({
      method: 'GET',
      url,
      params,
      config,
    })
  }

  async post(
    url: string,
    data: IndexRequest,
    params?: { [key: string]: any },
    config?: Partial<Request>
  ): Promise<IndexResponse>

  async post<T = any, R = EnqueuedUpdate>(
    url: string,
    data?: T,
    params?: { [key: string]: any },
    config?: Partial<Request>
  ): Promise<R>

  async post(
    url: string,
    data?: any,
    params?: { [key: string]: any },
    config?: Partial<Request>
  ): Promise<any> {
    return await this.request({
      method: 'POST',
      url,
      body: data,
      params,
      config,
    })
  }

  async put(
    url: string,
    data: IndexOptions | IndexRequest,
    params?: { [key: string]: any },
    config?: Partial<Request>
  ): Promise<IndexResponse>

  async put<T = any, R = EnqueuedUpdate>(
    url: string,
    data?: T,
    params?: { [key: string]: any },
    config?: Partial<Request>
  ): Promise<R>

  async put(
    url: string,
    data?: any,
    params?: { [key: string]: any },
    config?: Partial<Request>
  ): Promise<any> {
    return await this.request({
      method: 'PUT',
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
    config?: Partial<Request>
  ): Promise<void>
  async delete<T>(
    url: string,
    data?: any,
    params?: { [key: string]: any },
    config?: Partial<Request>
  ): Promise<T>
  async delete(
    url: string,
    data?: any,
    params?: { [key: string]: any },
    config?: Partial<Request>
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
