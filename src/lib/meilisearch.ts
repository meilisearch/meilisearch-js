/*
 * Bundle: MeiliSearch
 * Project: MeiliSearch - Javascript API
 * Author: Quentin de Quelen <quentin@meilisearch.com>
 * Copyright: 2019, MeiliSearch
 */

'use strict'

import { Index } from './indexes'
import {
  Config,
  IndexOptions,
  IndexResponse,
  Keys,
  Health,
  Stats,
  Version,
  EnqueuedDump,
  ErrorStatusCode,
} from '../types'
import { HttpRequests } from './http-requests'
import { addProtocolIfNotPresent } from './utils'

class MeiliSearch {
  config: Config
  httpRequest: HttpRequests

  /**
   * Creates new MeiliSearch instance
   * @param {Config} config Configuration object
   */
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
   * @template T
   * @param {string} indexUid The index UID
   * @returns {Index<T>} Instance of Index
   */
  index<T = any>(indexUid: string): Index<T> {
    return new Index<T>(this.config, indexUid)
  }

  /**
   * Gather information about an index by calling MeiliSearch and
   * return an Index instance with the gathered information
   * @memberof MeiliSearch
   * @method getIndex
   * @template T
   * @param {string} indexUid The index UID
   * @returns {Promise<Index<T>>} Promise containing Index instance
   */
  async getIndex<T = any>(indexUid: string): Promise<Index<T>> {
    return new Index<T>(this.config, indexUid).fetchInfo()
  }

  /**
   * Gather information about an index by calling MeiliSearch and
   * return the raw JSON response
   * @memberof MeiliSearch
   * @method getRawIndex
   * @param {string} indexUid The index UID
   * @returns {Promise<IndexResponse>} Promise containing index information
   */
  async getRawIndex(indexUid: string): Promise<IndexResponse> {
    return new Index(this.config, indexUid).getRawInfo()
  }

  /**
   * Get an index or create it if it does not exist
   * @memberof MeiliSearch
   * @method getOrCreateIndex
   * @template T
   * @param {string} uid The index UID
   * @param {IndexOptions} options Index options
   * @returns {Promise<Index<T>>} Promise containing Index instance
   */
  async getOrCreateIndex<T = any>(
    uid: string,
    options: IndexOptions = {}
  ): Promise<Index<T>> {
    try {
      const index = await this.getIndex(uid)
      return index
    } catch (e: any) {
      if (e.code === ErrorStatusCode.INDEX_NOT_FOUND) {
        return this.createIndex(uid, options)
      }
      throw e
    }
  }

  /**
   * Get all indexes in the database
   * @memberof MeiliSearch
   * @method getIndexes
   * @returns {Promise<IndexResponse[]>} Promise containing array of raw index information
   */
  async getIndexes(): Promise<IndexResponse[]> {
    const url = `indexes`
    return await this.httpRequest.get<IndexResponse[]>(url)
  }

  /**
   * Create a new index
   * @memberof MeiliSearch
   * @method createIndex
   * @template T
   * @param {string} uid The index UID
   * @param {IndexOptions} options Index options
   * @returns {Promise<Index<T>>} Promise containing Index instance
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
   * @template T
   * @param {string} uid The index UID
   * @param {IndexOptions} options Index options to update
   * @returns {Promise<Index<T>>} Promise containing Index instance after updating
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
   * @param {string} uid The index UID
   * @returns {Promise<void>} Promise which resolves when index is deleted successfully
   */
  async deleteIndex(uid: string): Promise<void> {
    return new Index(this.config, uid).delete()
  }

  /**
   * Deletes an index if it already exists.
   * @memberof MeiliSearch
   * @method deleteIndexIfExists
   * @param {string} uid The index UID
   * @returns {Promise<boolean>} Promise which resolves to true when index exists and is deleted successfully, otherwise false if it does not exist
   */
  async deleteIndexIfExists(uid: string): Promise<boolean> {
    try {
      await this.deleteIndex(uid)
      return true
    } catch (e: any) {
      if (e.code === ErrorStatusCode.INDEX_NOT_FOUND) {
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
   * @returns {Promise<Keys>} Promise containing an object with keys
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
   * @memberof MeiliSearch
   * @method health
   * @returns {Promise<Health>} Promise containing an object with health details
   */
  async health(): Promise<Health> {
    const url = `health`
    return await this.httpRequest.get<Health>(url)
  }

  /**
   * Checks if the server is healthy, return true or false.
   * @memberof MeiliSearch
   * @method isHealthy
   * @returns {Promise<boolean>} Promise containing a boolean
   */
  async isHealthy(): Promise<boolean> {
    try {
      const url = `health`
      await this.httpRequest.get(url)
      return true
    } catch (e: any) {
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
   * @returns {Promise<Stats>} Promise containing object of all the stats
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
   * @returns {Promise<Version>} Promise containing object with version details
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
   * @returns {Promise<EnqueuedDump>} Promise containing object of the enqueued update
   */
  async createDump(): Promise<EnqueuedDump> {
    const url = `dumps`
    return await this.httpRequest.post<undefined, EnqueuedDump>(url)
  }

  /**
   * Get the status of a dump creation process
   * @memberof MeiliSearch
   * @method getDumpStatus
   * @param {string} dumpUid Dump UID
   * @returns {Promise<EnqueuedDump>} Promise containing object of the enqueued update
   */
  async getDumpStatus(dumpUid: string): Promise<EnqueuedDump> {
    const url = `dumps/${dumpUid}/status`
    return await this.httpRequest.get<EnqueuedDump>(url)
  }
}

export { MeiliSearch }
