/*
 * Bundle: Meili
 * Project: Meili - Javascript API
 * Author: Quentin de Quelen <quentin@meilisearch.com>
 * Copyright: 2019, Meili
 */

'use strict'

import instance, { AxiosInstance } from 'axios'

import { Admin } from './admin'
import { Indexes } from './indexes'
import { Keys } from './keys'
import * as Types from './types'

interface Config {
  host: string
  apiKey?: string
}

class Meili {
  baseURL: string
  apiKey?: string
  instance: AxiosInstance

  constructor(config: Config) {
    this.baseURL = config.host
    this.apiKey = config.apiKey

    if (config.apiKey) {
      this.instance = instance.create({
        baseURL: this.baseURL,
        timeout: 1000,
        headers: {
          'X-Meili-API-Key': config.apiKey,
        },
      })
    } else {
      this.instance = instance.create({
        baseURL: this.baseURL,
        timeout: 1000,
      })
    }

    this.instance.interceptors.response.use((response) => response.data)
  }

  /**
   * Return an index instance
   * @memberof Meili
   * @method Index
   */
  Index(indexUid: string): Indexes {
    return new Indexes(this.instance, indexUid)
  }

  /**
   * Return an keys instance
   * @memberof Meili
   * @method Keys
   */
  Keys(): Keys {
    return new Keys(this.instance)
  }

  /**
   * Return an admin instance
   * @memberof Meili
   * @method Admin
   */
  Admin(): Admin {
    return new Admin(this.instance)
  }

  /**
   * List all indexes in the database
   * @memberof Meili
   * @method listIndexes
   */
  listIndexes(): Promise<object[]> {
    const url = '/indexes'

    return this.instance.get(url)
  }

  /**
   * Create a new index with a schema
   * @memberof Meili
   * @method createIndex
   */
  createIndex(
    data: Types.CreateIndexRequest
  ): Promise<Types.CreateIndexResponse> {
    const url = `/indexes`

    return this.instance.post(url, data)
  }
}

export default Meili
