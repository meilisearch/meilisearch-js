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

type createPath = (x: string | number) => string

export class MeiliSearch implements Types.MeiliSearchInterface {
  config: Types.Config
  httpRequest: HttpRequests
  static apiRoutes: {
    [key: string]: string
  } = {
    listIndexes: 'indexes',
    getkeys: 'keys',
    isHealthy: 'health',
    stats: 'stats',
    version: 'version',
    createDump: 'dumps',
  }
  static routeConstructors: {
    [key: string]: createPath
  } = {
    getDumpStatus: (dumpUid: string | number) => {
      return `dumps/${dumpUid}/status`
    },
  }

  constructor(config: Types.Config) {
    config.host = HttpRequests.addTrailingSlash(config.host)
    this.config = config
    this.httpRequest = new HttpRequests(config)
  }

  static getApiRoutes(): { [key: string]: string } {
    return MeiliSearch.apiRoutes
  }
  static getRouteConstructors(): { [key: string]: createPath } {
    return MeiliSearch.routeConstructors
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
    const url = MeiliSearch.apiRoutes.listIndexes
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
    const url = MeiliSearch.apiRoutes.getKeys
    return await this.httpRequest.get<Types.Keys>(url)
  }

  ///
  /// HEALTH
  ///

  /**
   * Checks if the server is healthy, otherwise an error will be thrown.
   *
   * @memberof MeiliSearch
   * @method isHealthy
   */
  async isHealthy(): Promise<true> {
    return await this.httpRequest
      .get(MeiliSearch.apiRoutes.isHealthy)
      .then(() => true)
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
    const url = MeiliSearch.apiRoutes.stats
    return await this.httpRequest.get<Types.Stats>(url)
  }

  /**
   * Get the version of MeiliSearch
   * @memberof MeiliSearch
   * @method version
   */
  async version(): Promise<Types.Version> {
    const url = MeiliSearch.apiRoutes.version
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
    const url = MeiliSearch.apiRoutes.createDump
    return await this.httpRequest.post<undefined, Types.EnqueuedDump>(url)
  }

  /**
   * Get the status of a dump creation process
   * @memberof MeiliSearch
   * @method getDumpStatus
   */
  async getDumpStatus(dumpUid: string): Promise<Types.EnqueuedDump> {
    const url = MeiliSearch.routeConstructors.getDumpStatus(dumpUid)
    return await this.httpRequest.get<Types.EnqueuedDump>(url)
  }
}
