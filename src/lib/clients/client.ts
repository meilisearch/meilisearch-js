/*
 * Bundle: MeiliSearch
 * Project: MeiliSearch - Javascript API
 * Author: Quentin de Quelen <quentin@meilisearch.com>
 * Copyright: 2019, MeiliSearch
 */

'use strict'

import { Index } from '../indexes'
import {
  KeyPayload,
  Config,
  IndexOptions,
  IndexResponse,
  EnqueuedTask,
  Key,
  Health,
  Stats,
  Version,
  EnqueuedDump,
  ErrorStatusCode,
  Task,
  Result,
  TokenSearchRules,
  TokenOptions,
} from '../../types'
import { HttpRequests } from '../http-requests'
import { TaskClient } from '../task'

class Client {
  config: Config
  httpRequest: HttpRequests
  tasks: TaskClient

  /**
   * Creates new MeiliSearch instance
   * @param {Config} config Configuration object
   */
  constructor(config: Config) {
    this.config = config
    this.httpRequest = new HttpRequests(config)
    this.tasks = new TaskClient(config)
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
   * @returns {Promise<Index<T>>} Promise returning Index instance
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
   * @returns {Promise<IndexResponse>} Promise returning index information
   */
  async getRawIndex(indexUid: string): Promise<IndexResponse> {
    return new Index(this.config, indexUid).getRawInfo()
  }

  /**
   * Get all the indexes as Index instances.
   * @memberof MeiliSearch
   * @method getIndexes
   * @returns {Promise<Index[]>} Promise returning array of raw index information
   */
  async getIndexes(): Promise<Index[]> {
    const response = await this.getRawIndexes()
    const indexes: Index[] = response.map(
      (index) => new Index(this.config, index.uid, index.primaryKey)
    )
    return indexes
  }

  /**
   * Get all the indexes in their raw value (no Index instances).
   * @memberof MeiliSearch
   * @method getRawIndexes
   * @returns {Promise<IndexResponse[]>} Promise returning array of raw index information
   */
  async getRawIndexes(): Promise<IndexResponse[]> {
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
   * @returns {Promise<Index<T>>} Promise returning Index instance
   */
  async createIndex(
    uid: string,
    options: IndexOptions = {}
  ): Promise<EnqueuedTask> {
    return await Index.create(uid, options, this.config)
  }

  /**
   * Update an index
   * @memberof MeiliSearch
   * @method updateIndex
   * @template T
   * @param {string} uid The index UID
   * @param {IndexOptions} options Index options to update
   * @returns {Promise<Index<T>>} Promise returning Index instance after updating
   */
  async updateIndex(
    uid: string,
    options: IndexOptions = {}
  ): Promise<EnqueuedTask> {
    return await new Index(this.config, uid).update(options)
  }

  /**
   * Delete an index
   * @memberof MeiliSearch
   * @method deleteIndex
   * @param {string} uid The index UID
   * @returns {Promise<void>} Promise which resolves when index is deleted successfully
   */
  async deleteIndex(uid: string): Promise<EnqueuedTask> {
    return await new Index(this.config, uid).delete()
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
  /// TASKS
  ///

  /**
   * Get the list of all client tasks
   * @memberof MeiliSearch
   * @method getTasks
   * @returns {Promise<Result<Task[]>>} - Promise returning all tasks
   */
  async getTasks(): Promise<Result<Task[]>> {
    return await this.tasks.getClientTasks()
  }

  /**
   * Get one task on the client scope
   * @memberof MeiliSearch
   * @method getTask
   * @param {number} taskId - Task identifier
   * @returns {Promise<Task>} - Promise returning a task
   */
  async getTask(taskId: number): Promise<Task> {
    return await this.tasks.getClientTask(taskId)
  }

  /**
   * Wait for a batch of tasks to be processed.
   * @memberof MeiliSearch
   * @method waitForTasks
   * @param {number[]} taskIds - Tasks identifier
   * @param {WaitOptions} waitOptions - Options on timeout and interval
   *
   * @returns {Promise<Result<Task[]>>} - Promise returning an array of tasks
   */
  async waitForTasks(
    taskIds: number[],
    {
      timeOutMs = 5000,
      intervalMs = 50,
    }: { timeOutMs?: number; intervalMs?: number } = {}
  ): Promise<Result<Task[]>> {
    return await this.tasks.waitForClientTasks(taskIds, {
      timeOutMs,
      intervalMs,
    })
  }

  /**
   * Wait for a task to be processed.
   *
   * @memberof MeiliSearch
   * @method waitForTask
   * @param {number} taskId - Task identifier
   * @param {WaitOptions} waitOptions - Options on timeout and interval
   *
   * @returns {Promise<Task>} - Promise returning an array of tasks
   */
  async waitForTask(
    taskId: number,
    {
      timeOutMs = 5000,
      intervalMs = 50,
    }: { timeOutMs?: number; intervalMs?: number } = {}
  ): Promise<Task> {
    return await this.tasks.waitForClientTask(taskId, {
      timeOutMs,
      intervalMs,
    })
  }

  ///
  /// KEYS
  ///

  /**
   * Get all API keys
   * @memberof MeiliSearch
   * @method getKeys
   * @returns {Promise<Keys>} Promise returning an object with keys
   */
  async getKeys(): Promise<Result<Key[]>> {
    const url = `keys`
    return await this.httpRequest.get<Result<Key[]>>(url)
  }

  /**
   * Get one API key
   * @memberof MeiliSearch
   * @method getKey
   *
   * @param {string} key - Key
   * @returns {Promise<Keys>} Promise returning a key
   */
  async getKey(key: string): Promise<Key> {
    const url = `keys/${key}`
    return await this.httpRequest.get<Key>(url)
  }

  /**
   * Create one API key
   * @memberof MeiliSearch
   * @method createKey
   *
   * @param {KeyPayload} options - Key options
   * @returns {Promise<Key>} Promise returning an object with keys
   */
  async createKey(options: KeyPayload): Promise<Key> {
    const url = `keys`
    return await this.httpRequest.post(url, options)
  }

  /**
   * Update one API key
   * @memberof MeiliSearch
   * @method updateKey
   *
   * @param {string} key - Key
   * @param {KeyPayload} options - Key options
   * @returns {Promise<Key>} Promise returning an object with keys
   */
  async updateKey(key: string, options: KeyPayload): Promise<Key> {
    const url = `keys/${key}`
    return await this.httpRequest.patch(url, options)
  }

  /**
   * Delete one API key
   * @memberof MeiliSearch
   * @method deleteKey
   *
   * @param {string} key - Key
   * @returns {Promise<Void>}
   */
  async deleteKey(key: string): Promise<void> {
    const url = `keys/${key}`
    return await this.httpRequest.delete<any>(url)
  }

  ///
  /// HEALTH
  ///

  /**
   * Checks if the server is healthy, otherwise an error will be thrown.
   * @memberof MeiliSearch
   * @method health
   * @returns {Promise<Health>} Promise returning an object with health details
   */
  async health(): Promise<Health> {
    const url = `health`
    return await this.httpRequest.get<Health>(url)
  }

  /**
   * Checks if the server is healthy, return true or false.
   * @memberof MeiliSearch
   * @method isHealthy
   * @returns {Promise<boolean>} Promise returning a boolean
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
   * @returns {Promise<Stats>} Promise returning object of all the stats
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
   * @returns {Promise<Version>} Promise returning object with version details
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
   * @returns {Promise<EnqueuedDump>} Promise returning object of the enqueued update
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
   * @returns {Promise<EnqueuedDump>} Promise returning object of the enqueued update
   */
  async getDumpStatus(dumpUid: string): Promise<EnqueuedDump> {
    const url = `dumps/${dumpUid}/status`
    return await this.httpRequest.get<EnqueuedDump>(url)
  }

  /**
   * Generate a tenant token
   *
   * @memberof MeiliSearch
   * @method generateTenantToken
   * @param {SearchRules} searchRules Search rules that are applied to every search.
   * @param {TokenOptions} options Token options to customize some aspect of the token.
   * @returns {String} The token in JWT format.
   */
  generateTenantToken(
    _searchRules: TokenSearchRules,
    _options?: TokenOptions
  ): string {
    const error = new Error()
    throw new Error(
      `Meilisearch: failed to generate a tenant token. Generation of a token only works in a node environment \n ${error.stack}.`
    )
  }
}

export { Client }
