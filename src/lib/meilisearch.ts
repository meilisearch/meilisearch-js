/*
 * Bundle: MeiliSearch
 * Project: MeiliSearch - Javascript API
 * Author: Quentin de Quelen <quentin@meilisearch.com>
 * Copyright: 2019, MeiliSearch
 */

'use strict'

import { Index } from './indexes'
import { MeiliSearchApiError, MeiliSearchCommunicationError } from '../errors'
import {
  Config,
  IndexOptions,
  IndexResponse,
  Keys,
  Health,
  Stats,
  Version,
  EnqueuedDump,
} from '../types'
import { HttpRequests } from './http-requests'
import { addProtocolIfNotPresent } from './utils'

class MeiliSearch {
  config: Config
  httpRequest: HttpRequests

  constructor(config: Config) {
    config.host = addProtocolIfNotPresent(config.host)
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
   * Gather information about an index by calling MeiliSearch and
   * return the raw JSON response
   * @memberof MeiliSearch
   * @method getRawIndex
   */
  async getRawIndex(indexUid: string): Promise<IndexResponse> {
    return new Index(this.config, indexUid).getRawInfo()
  }

  /**
   * Get an index or create it if it does not exist
   * @memberof MeiliSearch
   * @method getOrCreateIndex
   */
  async getOrCreateIndex<T = any>(
    uid: string,
    options: IndexOptions = {}
  ): Promise<Index<T>> {
    try {
      const index = await this.getIndex(uid)
      return index
    } catch (e) {
      if (e.errorCode === 'index_not_found') {
        return this.createIndex(uid, options)
      }
      if (e.type !== 'MeiliSearchCommunicationError') {
        throw new MeiliSearchApiError(e, e.status)
      }
      if (e.type === 'MeiliSearchCommunicationError') {
        throw new MeiliSearchCommunicationError(e.message, e, e.stack)
      }
      throw e
    }
  }

  /**
   * Get all indexes in the database
   * @memberof MeiliSearch
   * @method getIndexes
   */
  async getIndexes(): Promise<IndexResponse[]> {
    const url = `indexes`
    return await this.httpRequest.get<IndexResponse[]>(url)
  }

  /**
   * Create a new index
   * @memberof MeiliSearch
   * @method createIndex
   */
  async createIndex<T = any>(
    uid: string,
    options: IndexOptions = {}
  ): Promise<Index<T>> {
    return await Index.create<T>(uid, options, this.config)
  }

  /**
   * Update an index
   * @memberof MeiliSearch
   * @method updateIndex
   */
  async updateIndex<T = any>(
    uid: string,
    options: IndexOptions = {}
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

  /**
   * Deletes an index if it already exists.
   * @memberof MeiliSearch
   * @method deleteIndexIfExists
   */
  async deleteIndexIfExists(uid: string): Promise<boolean> {
    try {
      await this.deleteIndex(uid)
      return true
    } catch (e) {
      if (e.errorCode === 'index_not_found') {
        return false
      }
      throw e
    }
  }

  ///
  /// KEYS
  ///

  /**
   * Get private and public key
   * @memberof MeiliSearch
   * @method getKey
   */
  async getKeys(): Promise<Keys> {
    const url = `keys`
    return await this.httpRequest.get<Keys>(url)
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
  async health(): Promise<Health> {
    const url = `health`
    return await this.httpRequest.get<Health>(url)
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
   * @method getStats
   */
  async getStats(): Promise<Stats> {
    const url = `stats`
    return await this.httpRequest.get<Stats>(url)
  }

  ///
  /// VERSION
  ///

  /**
   * Get the version of MeiliSearch
   * @memberof MeiliSearch
   * @method getVersion
   */
  async getVersion(): Promise<Version> {
    const url = `version`
    return await this.httpRequest.get<Version>(url)
  }

  ///
  /// DUMPS
  ///

  /**
   * Triggers a dump creation process
   * @memberof MeiliSearch
   * @method createDump
   */
  async createDump(): Promise<EnqueuedDump> {
    const url = `dumps`
    return await this.httpRequest.post<undefined, EnqueuedDump>(url)
  }

  /**
   * Get the status of a dump creation process
   * @memberof MeiliSearch
   * @method getDumpStatus
   */
  async getDumpStatus(dumpUid: string): Promise<EnqueuedDump> {
    const url = `dumps/${dumpUid}/status`
    return await this.httpRequest.get<EnqueuedDump>(url)
  }
}

export { MeiliSearch }
