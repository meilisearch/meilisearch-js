/*
 * Bundle: Meilisearch
 * Project: Meilisearch - Javascript API
 * Author: Quentin de Quelen <quentin@meilisearch.com>
 * Copyright: 2019, Meilisearch
 */

'use strict'

import instance, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  CancelTokenSource,
} from 'axios'
import MeiliSearchApiError from './custom-errors/meilisearch-error'
import * as Types from './types'

class MeiliAxiosWrapper implements Types.MeiliAxiosWrapperInterface {
  instance: AxiosInstance
  cancelTokenSource: CancelTokenSource

  constructor(config: Types.Config) {
    if (config.apiKey !== undefined) {
      this.instance = instance.create({
        baseURL: config.host,
        headers: {
          'X-Meili-API-Key': config.apiKey,
        },
      })
    } else {
      this.instance = instance.create({
        baseURL: config.host,
      })
    }
    this.cancelTokenSource = instance.CancelToken.source()
    this.instance.interceptors.response.use((response) => response.data)
    this.instance.interceptors.request.use((request) => {
      if (request.data !== undefined) {
        return {
          ...request,
          data: JSON.stringify(request.data),
        }
      }

      return request
    })
  }

  async get<T = any, R = AxiosResponse<T>>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<R> {
    const { stack: cachedStack }: { stack?: string } = new Error()
    try {
      return await this.instance.get(url, config)
    } catch (e) {
      throw new MeiliSearchApiError(e, cachedStack)
    }
  }

  //  Overloads functions
  async post(
    url: string,
    data: Types.IndexRequest,
    config?: AxiosRequestConfig
  ): Promise<Types.IndexResponse>

  async post<T = any, R = AxiosResponse<Types.EnqueuedUpdate>>(
    url: string,
    data?: T,
    config?: AxiosRequestConfig
  ): Promise<R>

  async post(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<any> {
    const { stack: cachedStack }: { stack?: string } = new Error()
    try {
      return await this.instance.post(url, data, config)
    } catch (e) {
      throw new MeiliSearchApiError(e, cachedStack)
    }
  }

  async put<T = any, R = AxiosResponse<T>>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<R> {
    const { stack: cachedStack }: { stack?: string } = new Error()
    try {
      return await this.instance.put(url, data, config)
    } catch (e) {
      throw new MeiliSearchApiError(e, cachedStack)
    }
  }

  async patch<T = any, R = AxiosResponse<T>>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<R> {
    const { stack: cachedStack }: { stack?: string } = new Error()
    try {
      return await this.instance.patch(url, data, config)
    } catch (e) {
      throw new MeiliSearchApiError(e, cachedStack)
    }
  }

  async delete<T = any, R = AxiosResponse<T>>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<R> {
    const { stack: cachedStack }: { stack?: string } = new Error()
    try {
      return await this.instance.delete(url, config)
    } catch (e) {
      throw new MeiliSearchApiError(e, cachedStack)
    }
  }
}

export default MeiliAxiosWrapper
