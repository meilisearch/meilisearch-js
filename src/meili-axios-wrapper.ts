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
import MeiliAxiosError from './meili-axios-error'
import * as Types from './types'

class MeiliAxiosWrapper {
  instance: AxiosInstance
  cancelTokenSource: CancelTokenSource

  constructor(config: Types.Config) {
    if (config.apiKey) {
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

  get<T = any, R = AxiosResponse<T>>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<R> {
    const { stack: cachedStack }: { stack?: string } = new Error()

    return this.instance
      .get(url, config)
      .then((response: any) => response)
      .catch((e) => {
        const meiliError = new MeiliAxiosError(e, cachedStack)
        throw meiliError
      })
  }

  post<T = any, R = AxiosResponse<T>>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<R> {
    const { stack: cachedStack }: { stack?: string } = new Error()

    return this.instance
      .post(url, data, config)
      .then((response: any) => response)
      .catch((e) => {
        throw new MeiliAxiosError(e, cachedStack)
      })
  }

  put<T = any, R = AxiosResponse<T>>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<R> {
    const { stack: cachedStack }: { stack?: string } = new Error()

    return this.instance
      .put(url, data, config)
      .then((response: any) => response)
      .catch((e) => {
        const meiliError = new MeiliAxiosError(e, cachedStack)
        throw meiliError
      })
  }
  patch<T = any, R = AxiosResponse<T>>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<R> {
    const { stack: cachedStack }: { stack?: string } = new Error()

    return this.instance
      .patch(url, data, config)
      .then((response: any) => response)
      .catch((e) => {
        const meiliError = new MeiliAxiosError(e, cachedStack)
        throw meiliError
      })
  }
  delete<T = any, R = AxiosResponse<T>>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<R> {
    const { stack: cachedStack }: { stack?: string } = new Error()

    return this.instance
      .delete(url, config)
      .then((response: any) => response)
      .catch((e) => {
        const meiliError = new MeiliAxiosError(e, cachedStack)
        throw meiliError
      })
  }
}

export default MeiliAxiosWrapper
