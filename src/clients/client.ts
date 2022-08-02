/*
 * Bundle: MeiliSearch
 * Project: MeiliSearch - Javascript API
 * Author: Quentin de Quelen <quentin@meilisearch.com>
 * Copyright: 2019, MeiliSearch
 */

'use strict'

import { Index } from '../indexes'
import {
  KeyCreation,
  Config,
  IndexOptions,
  IndexObject,
  EnqueuedTask,
  Key,
  Health,
  Stats,
  Version,
  ErrorStatusCode,
  Task,
  TokenSearchRules,
  TokenOptions,
  TasksQuery,
  WaitOptions,
  KeyUpdate,
  IndexesQuery,
  IndexesResults,
  KeysQuery,
  KeysResults,
  TasksResults,
} from '../types'
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
   * @returns {Promise<IndexObject>} Promise returning index information
   */
  async getRawIndex(indexUid: string): Promise<IndexObject> {
    return new Index(this.config, indexUid).getRawInfo()
  }

  /**
   * Get all the indexes as Index instances.
   * @memberof MeiliSearch
   * @method getIndexes
   * @param {IndexesQuery} [parameters={}] - Parameters to browse the indexes
   *
   * @returns {Promise<IndexesResults<Index[]>>} Promise returning array of raw index information
   */
  async getIndexes(
    parameters: IndexesQuery = {}
  ): Promise<IndexesResults<Index[]>> {
    const rawIndexes = await this.getRawIndexes(parameters)
    const indexes: Index[] = rawIndexes.results.map(
      (index) => new Index(this.config, index.uid, index.primaryKey)
    )
    return { ...rawIndexes, results: indexes }
  }

  /**
   * Get all the indexes in their raw value (no Index instances).
   * @memberof MeiliSearch
   * @method getRawIndexes
   * @param {IndexesQuery} [parameters={}] - Parameters to browse the indexes
   *
   * @returns {Promise<IndexesResults<IndexObject[]>>} Promise returning array of raw index information
   */
  async getRawIndexes(
    parameters: IndexesQuery = {}
  ): Promise<IndexesResults<IndexObject[]>> {
    const url = `indexes`
    return await this.httpRequest.get<IndexesResults<IndexObject[]>>(
      url,
      parameters
    )
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
   * @param {TasksQuery} [parameters={}] - Parameters to browse the tasks
   *
   * @returns {Promise<TasksResults>} - Promise returning all tasks
   */
  async getTasks(parameters: TasksQuery = {}): Promise<TasksResults> {
    return await this.tasks.getTasks(parameters)
  }

  /**
   * Get one task on the client scope
   * @memberof MeiliSearch
   * @method getTask
   * @param {number} taskUid - Task identifier
   * @returns {Promise<Task>} - Promise returning a task
   */
  async getTask(taskUid: number): Promise<Task> {
    return await this.tasks.getTask(taskUid)
  }

  /**
   * Wait for multiple tasks to be finished.
   *
   * @memberof MeiliSearch
   * @method waitForTasks
   * @param {number[]} taskUids - Tasks identifier
   * @param {WaitOptions} waitOptions - Options on timeout and interval
   *
   * @returns {Promise<Task[]>} - Promise returning an array of tasks
   */
  async waitForTasks(
    taskUids: number[],
    { timeOutMs = 5000, intervalMs = 50 }: WaitOptions = {}
  ): Promise<Task[]> {
    return await this.tasks.waitForTasks(taskUids, {
      timeOutMs,
      intervalMs,
    })
  }

  /**
   * Wait for a task to be finished.
   *
   * @memberof MeiliSearch
   * @method waitForTask
   *
   * @param {number} taskUid - Task identifier
   * @param {WaitOptions} waitOptions - Options on timeout and interval
   *
   * @returns {Promise<Task>} - Promise returning an array of tasks
   */
  async waitForTask(
    taskUid: number,
    { timeOutMs = 5000, intervalMs = 50 }: WaitOptions = {}
  ): Promise<Task> {
    return await this.tasks.waitForTask(taskUid, {
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
   * @param {KeysQuery} [parameters={}] - Parameters to browse the indexes
   *
   * @returns {Promise<KeysResults>} Promise returning an object with keys
   */
  async getKeys(parameters: KeysQuery = {}): Promise<KeysResults> {
    const url = `keys`
    return await this.httpRequest.get<KeysResults>(url, parameters)
  }

  /**
   * Get one API key
   * @memberof MeiliSearch
   * @method getKey
   *
   * @param {string} keyOrUid - Key or uid of the API key
   * @returns {Promise<Key>} Promise returning a key
   */
  async getKey(keyOrUid: string): Promise<Key> {
    const url = `keys/${keyOrUid}`
    return await this.httpRequest.get<Key>(url)
  }

  /**
   * Create one API key
   * @memberof MeiliSearch
   * @method createKey
   *
   * @param {KeyCreation} options - Key options
   * @returns {Promise<Key>} Promise returning a key
   */
  async createKey(options: KeyCreation): Promise<Key> {
    const url = `keys`
    return await this.httpRequest.post(url, options)
  }

  /**
   * Update one API key
   * @memberof MeiliSearch
   * @method updateKey
   *
   * @param {string} keyOrUid - Key
   * @param {KeyUpdate} options - Key options
   * @returns {Promise<Key>} Promise returning a key
   */
  async updateKey(keyOrUid: string, options: KeyUpdate): Promise<Key> {
    const url = `keys/${keyOrUid}`
    return await this.httpRequest.patch(url, options)
  }

  /**
   * Delete one API key
   * @memberof MeiliSearch
   * @method deleteKey
   *
   * @param {string} keyOrUid - Key
   * @returns {Promise<Void>}
   */
  async deleteKey(keyOrUid: string): Promise<void> {
    const url = `keys/${keyOrUid}`
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
   * Creates a dump
   * @memberof MeiliSearch
   * @method createDump
   * @returns {Promise<EnqueuedTask>} Promise returning object of the enqueued task
   */
  async createDump(): Promise<EnqueuedTask> {
    const url = `dumps`
    return await this.httpRequest.post<undefined, EnqueuedTask>(url)
  }

  ///
  /// TOKENS
  ///

  /**
   * Generate a tenant token
   *
   * @memberof MeiliSearch
   * @method generateTenantToken
   * @param {apiKeyUid} apiKeyUid The uid of the api key used as issuer of the token.
   * @param {SearchRules} searchRules Search rules that are applied to every search.
   * @param {TokenOptions} options Token options to customize some aspect of the token.
   *
   * @returns {String} The token in JWT format.
   */
  generateTenantToken(
    _apiKeyUid: string,
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
