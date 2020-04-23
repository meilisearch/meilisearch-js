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

class Meilisearch extends MeiliAxiosWrapper {
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
  listIndexes(): Promise<Types.IndexResponse[]> {
    const url = '/indexes'

    return this.get(url)
  }

  /**
   * Create a new index
   * @memberof Meilisearch
   * @method createIndex
   */
  async createIndex(data: Types.IndexRequest): Promise<Index> {
    const url = `/indexes`

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
  getKeys(): Promise<Types.Keys> {
    const url = '/keys'

    return this.get(url)
  }

  ///
  /// HEALTH
  ///

  /**
   * Check if the server is healhty
   * @memberof Meilisearch
   * @method isHealthy
   */
  isHealthy(): Promise<boolean> {
    const url = '/health'

    return this.get(url).then((_) => true)
  }

  /**
   * Change the healthyness to healthy
   * @memberof Meilisearch
   * @method setHealthy
   */
  setHealthy(): Promise<void> {
    const url = '/health'

    return this.put(url, {
      health: true,
    })
  }

  /**
   * Change the healthyness to unhealthy
   * @memberof Meilisearch
   * @method setUnhealthy
   */
  setUnhealthy(): Promise<void> {
    const url = '/health'

    return this.put(url, {
      health: false,
    })
  }

  /**
   * Change the healthyness to unhealthy
   * @memberof Meilisearch
   * @method setUnhealthy
   */
  changeHealthTo(health: boolean): Promise<void> {
    const url = '/health'

    return this.put(url, {
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
  stats(): Promise<Types.Stats> {
    const url = '/stats'

    return this.get(url)
  }

  /**
   * Get the version of MeiliSearch
   * @memberof Meilisearch
   * @method version
   */
  version(): Promise<Types.Version> {
    const url = '/version'

    return this.get(url)
  }

  /**
   * Get the server consuption, RAM / CPU / Network
   * @memberof Meilisearch
   * @method sysInfo
   */
  sysInfo(): Promise<Types.SysInfo> {
    const url = '/sys-info'

    return this.get(url)
  }

  /**
   * Get the server consuption, RAM / CPU / Network. All information as human readable
   * @memberof Meilisearch
   * @method prettySysInfo
   */
  prettySysInfo(): Promise<Types.SysInfoPretty> {
    const url = '/sys-info/pretty'

    return this.get(url)
  }
}

export default Meilisearch
