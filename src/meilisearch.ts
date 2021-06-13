/*
 * Bundle: MeiliSearch
 * Project: MeiliSearch - Javascript API
 * Author: Quentin de Quelen <quentin@meilisearch.com>
 * Copyright: 2019, MeiliSearch
 */

'use strict'

import { Index } from './index'
import MeiliSearchApiError from './errors/meilisearch-api-error'
import * as Types from './types'
import HttpRequests from './http-requests'

export class MeiliSearch implements Types.MeiliSearchInterface {
  config: Types.Config
  httpRequest: HttpRequests

  constructor(config: Types.Config) {
    config.host = HttpRequests.addTrailingSlash(config.host)
    this.config = config
    this.httpRequest = new HttpRequests(config)
  }

  /**
   * Return an Index instance
   * @memberof MeiliSearch
   * @method index
   */
  index<T = any>(indexUid: string): Index<T> {
    return new Index<T>(this.config, indexUid)
  }

  /**
   * Gather information about an index by calling MeiliSearch and
   * return an Index instance with the gathered information
   * @memberof MeiliSearch
   * @method getIndex
   */
  async getIndex<T = any>(indexUid: string): Promise<Index<T>> {
    return new Index<T>(this.config, indexUid).fetchInfo()
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
      const index = await this.getIndex(uid)
      return index
    } catch (e) {
      if (e.errorCode === 'index_not_found') {
        return this.createIndex(uid, options)
      }
      throw new MeiliSearchApiError(e, e.status)
    }
  }

  /**
   * List all indexes in the database
   * @memberof MeiliSearch
   * @method listIndexes
   */
  async listIndexes(): Promise<Types.IndexResponse[]> {
    const url = `indexes`
    return await this.httpRequest.get<Types.IndexResponse[]>(url)
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
    return await Index.create<T>(this.config, uid, options)
  }

  /**
   * Update an index
   * @memberof MeiliSearch
   * @method updateIndex
   */
  async updateIndex<T = any>(
    uid: string,
    options: Types.IndexOptions = {}
  ): Promise<Index<T>> {
    return new Index<T>(this.config, uid).update(options)
  }

  /**
   * Delete an index
   * @memberof MeiliSearch
   * @method deleteIndex
   */
  async deleteIndex(uid: string): Promise<void> {
    return new Index(this.config, uid).delete()
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
    const url = `keys`
    return await this.httpRequest.get<Types.Keys>(url)
  }

  ///
  /// HEALTH
  ///

  /**
   * Checks if the server is healthy, otherwise an error will be thrown.
   *
   * @memberof MeiliSearch
   * @method health
   */
  async health(): Promise<Types.Health> {
    const url = `health`
    return await this.httpRequest.get<Types.Health>(url)
  }

  /**
   * Checks if the server is healthy, return true or false.
   *
   * @memberof MeiliSearch
   * @method isHealthy
   */
  async isHealthy(): Promise<boolean> {
    try {
      const url = `health`
      await this.httpRequest.get(url)
      return true
    } catch (e) {
      return false
    }
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
    const url = `stats`
    return await this.httpRequest.get<Types.Stats>(url)
  }

  ///
  /// VERSION
  ///

  /**
   * Get the version of MeiliSearch
   * @memberof MeiliSearch
   * @method version
   */
  async version(): Promise<Types.Version> {
    const url = `version`
    return await this.httpRequest.get<Types.Version>(url)
  }

  ///
  /// DUMPS
  ///

  /**
   * Triggers a dump creation process
   * @memberof MeiliSearch
   * @method createDump
   */
  async createDump(): Promise<Types.EnqueuedDump> {
    const url = `dumps`
    return await this.httpRequest.post<undefined, Types.EnqueuedDump>(url)
  }

  /**
   * Get the status of a dump creation process
   * @memberof MeiliSearch
   * @method getDumpStatus
   */
  async getDumpStatus(dumpUid: string): Promise<Types.EnqueuedDump> {
    const url = `dumps/${dumpUid}/status`
    return await this.httpRequest.get<Types.EnqueuedDump>(url)
  }
}
