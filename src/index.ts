/*
 * Bundle: Meili
 * Project: Meili - Javascript API
 * Author: Quentin de Quelen <quentin@meilisearch.com>
 * Copyright: 2019, Meili
 */

'use strict'

import instance, { AxiosInstance } from 'axios'

import { Indexes } from './indexes'
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

        headers: {
          'X-Meili-API-Key': config.apiKey,
        },
      })
    } else {
      this.instance = instance.create({
        baseURL: this.baseURL,
      })
    }

    this.instance.interceptors.response.use((response) => response.data)
  }

  /**
   * Return an Index instance
   * @memberof Meili
   * @method Index
   */
  Index(indexUid: string): Indexes {
    return new Indexes(this.instance, indexUid)
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
   * Create a new index with am optional schema
   * @memberof Meili
   * @method createIndex
   */
  createIndex(
    data: Types.CreateIndexRequest
  ): Promise<Types.CreateIndexResponse> {
    const url = `/indexes`

    return this.instance.post(url, data)
  }

  ///
  /// HEALTH
  ///

  /**
   * Check if the server is healhty
   * @memberof Admin
   * @method isHealthy
   */
  isHealthy(): Promise<boolean> {
    const url = '/health'

    return this.instance.get(url).then((res) => true)
  }

  /**
   * Change the healthyness to healthy
   * @memberof Admin
   * @method setHealthy
   */
  setHealthy(): Promise<void> {
    const url = '/health'

    return this.instance.put(url, {
      health: true,
    })
  }

  /**
   * Change the healthyness to unhealthy
   * @memberof Admin
   * @method setUnhealthy
   */
  setUnhealthy(): Promise<void> {
    const url = '/health'

    return this.instance.put(url, {
      health: false,
    })
  }

  /**
   * Change the healthyness to unhealthy
   * @memberof Admin
   * @method setUnhealthy
   */
  changeHealthTo(health: boolean): Promise<void> {
    const url = '/health'

    return this.instance.put(url, {
      health,
    })
  }

  ///
  /// STATS
  ///

  /**
   * Get the stats of all the database
   * @memberof Admin
   * @method databaseStats
   */
  databaseStats(): Promise<object> {
    const url = '/stats'

    return this.instance.get(url)
  }

  /**
   * Get the version of the server
   * @memberof Admin
   * @method version
   */
  version(): Promise<object> {
    const url = '/version'

    return this.instance.get(url)
  }

  /**
   * Get the server consuption, RAM / CPU / Network
   * @memberof Admin
   * @method systemInformation
   */
  systemInformation(): Promise<object> {
    const url = '/sys-info'

    return this.instance.get(url)
  }

  /**
   * Get the server consuption, RAM / CPU / Network. All information as human readable
   * @memberof Admin
   * @method systemInformationPretty
   */
  systemInformationPretty(): Promise<object> {
    const url = '/sys-info/pretty'

    return this.instance.get(url)
  }
}

export default Meili
