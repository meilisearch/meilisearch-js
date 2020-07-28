/*
 * Bundle: MeiliSearch
 * Project: MeiliSearch - Javascript API
 * Author: Quentin de Quelen <quentin@meilisearch.com>
 * Copyright: 2019, MeiliSearch
 */

'use strict'

import { Index } from './index'
import MeiliAxiosWrapper from './meili-axios-wrapper'
import * as Types from './types'

class MeiliSearch extends MeiliAxiosWrapper
  implements Types.MeiliSearchInterface {
  config: Types.Config
  constructor(config: Types.Config) {
    super(config)
    this.config = config
  }

  /**
   * Return an Index instance
   * @memberof MeiliSearch
   * @method getIndex
   */
  getIndex<T = any>(indexUid: string): Index<T> {
    return new Index<T>(this.config, indexUid)
  }

  /**
   * Get an index or create it if it does not exist
   * @memberof MeiliSearch
   * @method getOrCreateIndex
   */
  async getOrCreateIndex<T = any>(
    uid: string,
    options: Types.IndexOptions = {}
  ): Promise<Index<T>> {
    try {
      const index = await this.createIndex(uid, options)
      return index
    } catch (e) {
      if (e.errorCode === 'index_already_exists') {
        return this.getIndex(uid)
      }
      throw e
    }
  }

  /**
   * List all indexes in the database
   * @memberof MeiliSearch
   * @method listIndexes
   */
  async listIndexes(): Promise<Types.IndexResponse[]> {
    const url = '/indexes'

    return await this.get(url)
  }

  /**
   * Create a new index
   * @memberof MeiliSearch
   * @method createIndex
   */
  async createIndex<T = any>(
    uid: string,
    options: Types.IndexOptions = {}
  ): Promise<Index<T>> {
    const url = '/indexes'

    const index = await this.post(url, { ...options, uid })

    return new Index(this.config, index.uid)
  }
  ///
  /// KEYS
  ///

  /**
   * Get private and public key
   * @memberof MeiliSearch
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
   * @memberof MeiliSearch
   * @method isHealthy
   */
  async isHealthy(): Promise<boolean> {
    const url = '/health'

    return await this.get(url).then(() => true)
  }

  /**
   * Change the healthyness to healthy
   * @memberof MeiliSearch
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
   * @memberof MeiliSearch
   * @method setUnhealthy
   */
  async setUnhealthy(): Promise<void> {
    const url = '/health'

    return await this.put(url, {
      health: false,
    })
  }

  /**
   * Set the healthyness to health value
   * @memberof MeiliSearch
   * @method changeHealthTo
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
   * @memberof MeiliSearch
   * @method stats
   */
  async stats(): Promise<Types.Stats> {
    const url = '/stats'

    return await this.get(url)
  }

  /**
   * Get the version of MeiliSearch
   * @memberof MeiliSearch
   * @method version
   */
  async version(): Promise<Types.Version> {
    const url = '/version'

    return await this.get(url)
  }
}

export default MeiliSearch
