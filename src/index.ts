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

const DEFAULT_HOST_BASE = 'getmeili.com'

interface Config {
  applicationId: string
  host?: string
  apiKey?: string
}

export interface Schema {
  [field: string]: string[]
}

class Meili {
  baseURL: string
  apiKey?: string
  instance: AxiosInstance

  constructor(config: Config) {
    this.baseURL = `https://${config.applicationId}.${config.host ||
      DEFAULT_HOST_BASE}`

    this.apiKey = config.apiKey

    this.instance = instance.create({
      baseURL: this.baseURL,
      timeout: 1000,
      headers: {
        'X-Meili-API-Key': config.apiKey,
      },
    })
    this.instance.interceptors.response.use((response) => response.data)
  }

  /**
   * Return an index instance
   * @memberof Meili
   * @method Index
   */
  Index(indexId: string): Indexes {
    return new Indexes(this.instance, indexId)
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
  listIndexes(): Promise<string[]> {
    const url = '/indexes'

    return this.instance.get(url)
  }

  /**
   * Create a new index with a schema
   * @memberof Meili
   * @method createIndex
   */
  createIndex(indexId: string, schema: Schema): Promise<void> {
    const url = `/indexes/${indexId}`

    return this.instance.post(url, schema)
  }
}

export default Meili
