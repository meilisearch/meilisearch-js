/*
 * Bundle: Meilisearch
 * Project: Meilisearch - Javascript API
 * Author: Quentin de Quelen <quentin@meilisearch.com>
 * Copyright: 2019, Meilisearch
 */

'use strict'

import { Index } from './index'
import MeiliAxiosWrapper from './meili-axios-wrapper'
import * as Types from './types'

class Meilisearch extends MeiliAxiosWrapper
  implements Types.MeiliSearchInterface {
  config: Types.Config
  constructor(config: Types.Config) {
    super(config)
    this.config = config
  }

  /**
   * Return an Index instance
   * @memberof Meilisearch
   * @method Index
   */
  getIndex(indexUid: string): Index {
    return new Index(this.config, indexUid)
  }

  /**
   * List all indexes in the database
   * @memberof Meilisearch
   * @method listIndexes
   */
  async listIndexes(): Promise<Types.IndexResponse[]> {
    const url = '/indexes'

    return await this.get(url)
  }

  /**
   * Create a new index
   * @memberof Meilisearch
   * @method createIndex
   */
  async createIndex(data: Types.IndexRequest): Promise<Index> {
    const url = '/indexes'

    const index = await this.post(url, data)

    return new Index(this.config, index.uid)
  }
  ///
  /// KEYS
  ///

  /**
   * Get private and public key
   * @memberof Meilisearch
   * @method getKey
   */
  async getKeys(): Promise<Types.Keys> {
    const url = '/keys'

    return await this.get(url)
  }

  ///
  /// HEALTH
  ///

  /**
   * Check if the server is healhty
   * @memberof Meilisearch
   * @method isHealthy
   */
  async isHealthy(): Promise<boolean> {
    const url = '/health'

    return await this.get(url).then((_) => true)
  }

  /**
   * Change the healthyness to healthy
   * @memberof Meilisearch
   * @method setHealthy
   */
  async setHealthy(): Promise<void> {
    const url = '/health'

    return await this.put(url, {
      health: true,
    })
  }

  /**
   * Change the healthyness to unhealthy
   * @memberof Meilisearch
   * @method setUnhealthy
   */
  async setUnhealthy(): Promise<void> {
    const url = '/health'

    return await this.put(url, {
      health: false,
    })
  }

  /**
   * Change the healthyness to unhealthy
   * @memberof Meilisearch
   * @method setUnhealthy
   */
  async changeHealthTo(health: boolean): Promise<void> {
    const url = '/health'

    return await this.put(url, {
      health,
    })
  }

  ///
  /// STATS
  ///

  /**
   * Get the stats of all the database
   * @memberof Meilisearch
   * @method stats
   */
  async stats(): Promise<Types.Stats> {
    const url = '/stats'

    return await this.get(url)
  }

  /**
   * Get the version of MeiliSearch
   * @memberof Meilisearch
   * @method version
   */
  async version(): Promise<Types.Version> {
    const url = '/version'

    return await this.get(url)
  }

  /**
   * Get the server consuption, RAM / CPU / Network
   * @memberof Meilisearch
   * @method sysInfo
   */
  async sysInfo(): Promise<Types.SysInfo> {
    const url = '/sys-info'

    return await this.get(url)
  }

  /**
   * Get the server consuption, RAM / CPU / Network. All information as human readable
   * @memberof Meilisearch
   * @method prettySysInfo
   */
  async prettySysInfo(): Promise<Types.SysInfoPretty> {
    const url = '/sys-info/pretty'

    return await this.get(url)
  }
}

export default Meilisearch
