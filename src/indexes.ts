/*
 * Bundle: MeiliSearch / Indexes
 * Project: MeiliSearch - Javascript API
 * Author: Quentin de Quelen <quentin@meilisearch.com>
 * Copyright: 2019, MeiliSearch
 */

'use strict'

import { MeiliSearchError } from './errors'

import {
  Config,
  Task,
  SearchResponse,
  SearchParams,
  Filter,
  SearchRequestGET,
  IndexObject,
  IndexOptions,
  IndexStats,
  DocumentsQuery,
  DocumentQuery,
  Document,
  DocumentOptions,
  EnqueuedTask,
  Settings,
  Synonyms,
  StopWords,
  RankingRules,
  DistinctAttribute,
  FilterableAttributes,
  SortableAttributes,
  SearchableAttributes,
  DisplayedAttributes,
  TypoTolerance,
  WaitOptions,
  DocumentsResults,
  TasksQuery,
  TasksResults,
} from './types'
import { removeUndefinedFromObject } from './utils'
import { HttpRequests } from './http-requests'
import { TaskClient } from './task'

class Index<T = Record<string, any>> {
  uid: string
  primaryKey: string | undefined
  createdAt: Date | undefined
  updatedAt: Date | undefined
  httpRequest: HttpRequests
  tasks: TaskClient

  /**
   * @param {Config} config Request configuration options
   * @param {string} uid UID of the index
   * @param {string} [primaryKey] Primary Key of the index
   */
  constructor(config: Config, uid: string, primaryKey?: string) {
    this.uid = uid
    this.primaryKey = primaryKey
    this.httpRequest = new HttpRequests(config)
    this.tasks = new TaskClient(config)
  }

  ///
  /// SEARCH
  ///

  /**
   * Search for documents into an index
   * @memberof Index
   * @method search
   * @template T
   * @param {string | null} query? Query string
   * @param {SearchParams} options? Search options
   * @param {Partial<Request>} config? Additional request configuration options
   * @returns {Promise<SearchResponse<T>>} Promise containing the search response
   */
  async search<T = Record<string, any>>(
    query?: string | null,
    options?: SearchParams,
    config?: Partial<Request>
  ): Promise<SearchResponse<T>> {
    const url = `indexes/${this.uid}/search`

    return await this.httpRequest.post(
      url,
      removeUndefinedFromObject({ q: query, ...options }),
      undefined,
      config
    )
  }

  /**
   * Search for documents into an index using the GET method
   * @memberof Index
   * @method search
   * @template T
   * @param {string | null} query? Query string
   * @param {SearchParams} options? Search options
   * @param {Partial<Request>} config? Additional request configuration options
   * @returns {Promise<SearchResponse<T>>} Promise containing the search response
   */
  async searchGet<T = Record<string, any>>(
    query?: string | null,
    options?: SearchParams,
    config?: Partial<Request>
  ): Promise<SearchResponse<T>> {
    const url = `indexes/${this.uid}/search`

    const parseFilter = (filter?: Filter): string | undefined => {
      if (typeof filter === 'string') return filter
      else if (Array.isArray(filter))
        throw new MeiliSearchError(
          'The filter query parameter should be in string format when using searchGet'
        )
      else return undefined
    }

    const getParams: SearchRequestGET = {
      q: query,
      ...options,
      filter: parseFilter(options?.filter),
      sort: options?.sort?.join(','),
      facets: options?.facets?.join(','),
      attributesToRetrieve: options?.attributesToRetrieve?.join(','),
      attributesToCrop: options?.attributesToCrop?.join(','),
      attributesToHighlight: options?.attributesToHighlight?.join(','),
    }

    return await this.httpRequest.get<SearchResponse<T>>(
      url,
      removeUndefinedFromObject(getParams),
      config
    )
  }

  ///
  /// INDEX
  ///

  /**
   * Get index information.
   * @memberof Index
   * @method getRawInfo
   *
   * @returns {Promise<IndexObject>} Promise containing index information
   */
  async getRawInfo(): Promise<IndexObject> {
    const url = `indexes/${this.uid}`
    const res = await this.httpRequest.get<IndexObject>(url)
    this.primaryKey = res.primaryKey
    this.updatedAt = new Date(res.updatedAt)
    this.createdAt = new Date(res.createdAt)
    return res
  }

  /**
   * Fetch and update Index information.
   * @memberof Index
   * @method fetchInfo
   * @returns {Promise<this>} Promise to the current Index object with updated information
   */
  async fetchInfo(): Promise<this> {
    await this.getRawInfo()
    return this
  }

  /**
   * Get Primary Key.
   * @memberof Index
   * @method fetchPrimaryKey
   * @returns {Promise<string | undefined>} Promise containing the Primary Key of the index
   */
  async fetchPrimaryKey(): Promise<string | undefined> {
    this.primaryKey = (await this.getRawInfo()).primaryKey
    return this.primaryKey
  }

  /**
   * Create an index.
   * @memberof Index
   * @method create
   * @template T
   * @param {string} uid Unique identifier of the Index
   * @param {IndexOptions} options Index options
   * @param {Config} config Request configuration options
   * @returns {Promise<Index<T>>} Newly created Index object
   */
  static async create(
    uid: string,
    options: IndexOptions = {},
    config: Config
  ): Promise<EnqueuedTask> {
    const url = `indexes`
    const req = new HttpRequests(config)
    return req.post(url, { ...options, uid })
  }

  /**
   * Update an index.
   * @memberof Index
   * @method update
   * @param {IndexOptions} data Data to update
   * @returns {Promise<this>} Promise to the current Index object with updated information
   */
  async update(data: IndexOptions): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}`
    return await this.httpRequest.patch(url, data)
  }

  /**
   * Delete an index.
   * @memberof Index
   * @method delete
   * @returns {Promise<void>} Promise which resolves when index is deleted successfully
   */
  async delete(): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}`
    return await this.httpRequest.delete(url)
  }

  ///
  /// TASKS
  ///

  /**
   * Get the list of all the tasks of the index.
   *
   * @memberof Indexes
   * @method getTasks
   * @param {TasksQuery} [parameters={}] - Parameters to browse the tasks
   *
   * @returns {Promise<TasksResults>} - Promise containing all tasks
   */
  async getTasks(parameters: TasksQuery = {}): Promise<TasksResults> {
    return await this.tasks.getTasks({ ...parameters, indexUid: [this.uid] })
  }

  /**
   * Get one task of the index.
   *
   * @memberof Indexes
   * @method getTask
   * @param {number} taskUid - Task identifier
   *
   * @returns {Promise<Task>} - Promise containing a task
   */
  async getTask(taskUid: number): Promise<Task> {
    return await this.tasks.getTask(taskUid)
  }

  /**
   * Wait for multiple tasks to be processed.
   *
   * @memberof Indexes
   * @method waitForTasks
   * @param {number[]} taskUids - Tasks identifier
   * @param {WaitOptions} waitOptions - Options on timeout and interval
   *
   * @returns {Promise<Task[]>} - Promise containing an array of tasks
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
   * Wait for a task to be processed.
   *
   * @memberof Indexes
   * @method waitForTask
   * @param {number} taskUid - Task identifier
   * @param {WaitOptions} waitOptions - Options on timeout and interval
   *
   * @returns {Promise<Task>} - Promise containing an array of tasks
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
  /// STATS
  ///

  /**
   * get stats of an index
   * @memberof Index
   * @method getStats
   * @returns {Promise<IndexStats>} Promise containing object with stats of the index
   */
  async getStats(): Promise<IndexStats> {
    const url = `indexes/${this.uid}/stats`
    return await this.httpRequest.get<IndexStats>(url)
  }
  ///
  /// DOCUMENTS
  ///

  /**
   * get documents of an index
   * @memberof Index
   * @method getDocuments
   * @template T
   * @param {DocumentsQuery<T>} [parameters={}] Parameters to browse the documents
   * @returns {Promise<DocumentsResults<T>>>} Promise containing Document responses
   */
  async getDocuments<T = Record<string, any>>(
    parameters: DocumentsQuery<T> = {}
  ): Promise<DocumentsResults<T>> {
    const url = `indexes/${this.uid}/documents`

    const fields = (() => {
      if (Array.isArray(parameters?.fields)) {
        return parameters?.fields?.join(',')
      }
      return undefined
    })()

    return await this.httpRequest.get<Promise<DocumentsResults<T>>>(
      url,
      removeUndefinedFromObject({
        ...parameters,
        fields,
      })
    )
  }

  /**
   * Get one document
   * @memberof Index
   * @method getDocument
   * @template T
   * @param {string | number} documentId Document ID
   * @param {DocumentQuery<T>} [parameters={}] Parameters applied on a document
   * @returns {Promise<Document<T>>} Promise containing Document response
   */
  async getDocument<T = Record<string, any>>(
    documentId: string | number,
    parameters?: DocumentQuery<T>
  ): Promise<Document<T>> {
    const url = `indexes/${this.uid}/documents/${documentId}`

    const fields = (() => {
      if (Array.isArray(parameters?.fields)) {
        return parameters?.fields?.join(',')
      }
      return undefined
    })()

    return await this.httpRequest.get<Document<T>>(
      url,
      removeUndefinedFromObject({
        ...parameters,
        fields,
      })
    )
  }

  /**
   * Add or replace multiples documents to an index
   * @memberof Index
   * @method addDocuments
   * @template T
   * @param {Array<Document<T>>} documents Array of Document objects to add/replace
   * @param {DocumentOptions} options? Options on document addition
   *
   * @returns {Promise<EnqueuedTask>} Promise containing object of the enqueued task
   */
  async addDocuments(
    documents: Array<Document<T>>,
    options?: DocumentOptions
  ): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/documents`
    return await this.httpRequest.post(url, documents, options)
  }

  /**
   * Add or replace multiples documents to an index in batches
   * @memberof Index
   * @method addDocumentsInBatches
   * @template T
   * @param {Array<Document<T>>} documents Array of Document objects to add/replace
   * @param {number} batchSize Size of the batch
   * @param {DocumentOptions} options? Options on document addition
   * @returns {Promise<EnqueuedTasks>} Promise containing array of enqueued task objects for each batch
   */
  async addDocumentsInBatches(
    documents: Array<Document<T>>,
    batchSize = 1000,
    options?: DocumentOptions
  ): Promise<EnqueuedTask[]> {
    const updates = []
    for (let i = 0; i < documents.length; i += batchSize) {
      updates.push(
        await this.addDocuments(documents.slice(i, i + batchSize), options)
      )
    }
    return updates
  }

  /**
   * Add or update multiples documents to an index
   * @memberof Index
   * @method updateDocuments
   * @param {Array<Document<Partial<T>>>} documents Array of Document objects to add/update
   * @param {DocumentOptions} options? Options on document update
   * @returns {Promise<EnqueuedTask>} Promise containing object of the enqueued task
   */
  async updateDocuments(
    documents: Array<Document<Partial<T>>>,
    options?: DocumentOptions
  ): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/documents`
    return await this.httpRequest.put(url, documents, options)
  }

  /**
   * Add or update multiples documents to an index in batches
   * @memberof Index
   * @method updateDocuments
   * @template T
   * @param {Array<Document<T>>} documents Array of Document objects to add/update
   * @param {number} batchSize Size of the batch
   * @param {DocumentOptions} options? Options on document update
   * @returns {Promise<EnqueuedTasks>} Promise containing array of enqueued task objects for each batch
   */
  async updateDocumentsInBatches(
    documents: Array<Document<Partial<T>>>,
    batchSize = 1000,
    options?: DocumentOptions
  ): Promise<EnqueuedTask[]> {
    const updates = []
    for (let i = 0; i < documents.length; i += batchSize) {
      updates.push(
        await this.updateDocuments(documents.slice(i, i + batchSize), options)
      )
    }
    return updates
  }

  /**
   * Delete one document
   * @memberof Index
   * @method deleteDocument
   * @param {string | number} documentId Id of Document to delete
   * @returns {Promise<EnqueuedTask>} Promise containing object of the enqueued task
   */
  async deleteDocument(documentId: string | number): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/documents/${documentId}`
    return await this.httpRequest.delete<EnqueuedTask>(url)
  }

  /**
   * Delete multiples documents of an index
   * @memberof Index
   * @method deleteDocuments
   * @param {string[] | number[]} documentsIds Array of Document Ids to delete
   * @returns {Promise<EnqueuedTask>} Promise containing object of the enqueued task
   */
  async deleteDocuments(
    documentsIds: string[] | number[]
  ): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/documents/delete-batch`

    return await this.httpRequest.post(url, documentsIds)
  }

  /**
   * Delete all documents of an index
   * @memberof Index
   * @method deleteAllDocuments
   * @returns {Promise<EnqueuedTask>} Promise containing object of the enqueued task
   */
  async deleteAllDocuments(): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/documents`
    return await this.httpRequest.delete<EnqueuedTask>(url)
  }

  ///
  /// SETTINGS
  ///

  /**
   * Retrieve all settings
   * @memberof Index
   * @method getSettings
   * @returns {Promise<Settings>} Promise containing Settings object
   */
  async getSettings(): Promise<Settings> {
    const url = `indexes/${this.uid}/settings`
    return await this.httpRequest.get<Settings>(url)
  }

  /**
   * Update all settings
   * Any parameters not provided will be left unchanged.
   * @memberof Index
   * @method updateSettings
   * @param {Settings} settings Object containing parameters with their updated values
   * @returns {Promise<EnqueuedTask>} Promise containing object of the enqueued task
   */
  async updateSettings(settings: Settings): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/settings`
    return await this.httpRequest.patch(url, settings)
  }

  /**
   * Reset settings.
   * @memberof Index
   * @method resetSettings
   * @returns {Promise<EnqueuedTask>} Promise containing object of the enqueued task
   */
  async resetSettings(): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/settings`
    return await this.httpRequest.delete<EnqueuedTask>(url)
  }

  ///
  /// SYNONYMS
  ///

  /**
   * Get the list of all synonyms
   * @memberof Index
   * @method getSynonyms
   * @returns {Promise<object>} Promise containing object of synonym mappings
   */
  async getSynonyms(): Promise<object> {
    const url = `indexes/${this.uid}/settings/synonyms`
    return await this.httpRequest.get<object>(url)
  }

  /**
   * Update the list of synonyms. Overwrite the old list.
   * @memberof Index
   * @method updateSynonyms
   * @param {Synonyms} synonyms Mapping of synonyms with their associated words
   * @returns {Promise<EnqueuedTask>} Promise containing object of the enqueued task
   */
  async updateSynonyms(synonyms: Synonyms): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/settings/synonyms`
    return await this.httpRequest.put(url, synonyms)
  }

  /**
   * Reset the synonym list to be empty again
   * @memberof Index
   * @method resetSynonyms
   * @returns {Promise<EnqueuedTask>} Promise containing object of the enqueued task
   */
  async resetSynonyms(): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/settings/synonyms`
    return await this.httpRequest.delete<EnqueuedTask>(url)
  }

  ///
  /// STOP WORDS
  ///

  /**
   * Get the list of all stop-words
   * @memberof Index
   * @method getStopWords
   * @returns {Promise<string[]>} Promise containing array of stop-words
   */
  async getStopWords(): Promise<string[]> {
    const url = `indexes/${this.uid}/settings/stop-words`
    return await this.httpRequest.get<string[]>(url)
  }

  /**
   * Update the list of stop-words. Overwrite the old list.
   * @memberof Index
   * @method updateStopWords
   * @param {StopWords} stopWords Array of strings that contains the stop-words.
   * @returns {Promise<EnqueuedTask>} Promise containing object of the enqueued task
   */
  async updateStopWords(stopWords: StopWords): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/settings/stop-words`
    return await this.httpRequest.put(url, stopWords)
  }

  /**
   * Reset the stop-words list to be empty again
   * @memberof Index
   * @method resetStopWords
   * @returns {Promise<EnqueuedTask>} Promise containing object of the enqueued task
   */
  async resetStopWords(): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/settings/stop-words`
    return await this.httpRequest.delete<EnqueuedTask>(url)
  }

  ///
  /// RANKING RULES
  ///

  /**
   * Get the list of all ranking-rules
   * @memberof Index
   * @method getRankingRules
   * @returns {Promise<string[]>} Promise containing array of ranking-rules
   */
  async getRankingRules(): Promise<string[]> {
    const url = `indexes/${this.uid}/settings/ranking-rules`
    return await this.httpRequest.get<string[]>(url)
  }

  /**
   * Update the list of ranking-rules. Overwrite the old list.
   * @memberof Index
   * @method updateRankingRules
   * @param {RankingRules} rankingRules Array that contain ranking rules sorted by order of importance.
   * @returns {Promise<EnqueuedTask>} Promise containing object of the enqueued task
   */
  async updateRankingRules(rankingRules: RankingRules): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/settings/ranking-rules`
    return await this.httpRequest.put(url, rankingRules)
  }

  /**
   * Reset the ranking rules list to its default value
   * @memberof Index
   * @method resetRankingRules
   * @returns {Promise<EnqueuedTask>} Promise containing object of the enqueued task
   */
  async resetRankingRules(): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/settings/ranking-rules`
    return await this.httpRequest.delete<EnqueuedTask>(url)
  }

  ///
  /// DISTINCT ATTRIBUTE
  ///

  /**
   * Get the distinct-attribute
   * @memberof Index
   * @method getDistinctAttribute
   * @returns {Promise<string | null>} Promise containing the distinct-attribute of the index
   */
  async getDistinctAttribute(): Promise<string | null> {
    const url = `indexes/${this.uid}/settings/distinct-attribute`
    return await this.httpRequest.get<string | null>(url)
  }

  /**
   * Update the distinct-attribute.
   * @memberof Index
   * @method updateDistinctAttribute
   * @param {DistinctAttribute} distinctAttribute Field name of the distinct-attribute
   * @returns {Promise<EnqueuedTask>} Promise containing object of the enqueued task
   */
  async updateDistinctAttribute(
    distinctAttribute: DistinctAttribute
  ): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/settings/distinct-attribute`
    return await this.httpRequest.put(url, distinctAttribute)
  }

  /**
   * Reset the distinct-attribute.
   * @memberof Index
   * @method resetDistinctAttribute
   * @returns {Promise<EnqueuedTask>} Promise containing object of the enqueued task
   */
  async resetDistinctAttribute(): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/settings/distinct-attribute`
    return await this.httpRequest.delete<EnqueuedTask>(url)
  }

  ///
  /// FILTERABLE ATTRIBUTES
  ///

  /**
   * Get the filterable-attributes
   * @memberof Index
   * @method getFilterableAttributes
   * @returns {Promise<string[]>} Promise containing an array of filterable-attributes
   */
  async getFilterableAttributes(): Promise<string[]> {
    const url = `indexes/${this.uid}/settings/filterable-attributes`
    return await this.httpRequest.get<string[]>(url)
  }

  /**
   * Update the filterable-attributes.
   * @memberof Index
   * @method updateFilterableAttributes
   * @param {FilterableAttributes} filterableAttributes Array of strings containing the attributes that can be used as filters at query time
   * @returns {Promise<EnqueuedTask>} Promise containing object of the enqueued task
   */
  async updateFilterableAttributes(
    filterableAttributes: FilterableAttributes
  ): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/settings/filterable-attributes`
    return await this.httpRequest.put(url, filterableAttributes)
  }

  /**
   * Reset the filterable-attributes.
   * @memberof Index
   * @method resetFilterableAttributes
   * @returns {Promise<EnqueuedTask>} Promise containing object of the enqueued task
   */
  async resetFilterableAttributes(): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/settings/filterable-attributes`
    return await this.httpRequest.delete<EnqueuedTask>(url)
  }

  ///
  /// SORTABLE ATTRIBUTES
  ///

  /**
   * Get the sortable-attributes
   * @memberof Index
   * @method getSortableAttributes
   * @returns {Promise<string[]>} Promise containing array of sortable-attributes
   */
  async getSortableAttributes(): Promise<string[]> {
    const url = `indexes/${this.uid}/settings/sortable-attributes`
    return await this.httpRequest.get<string[]>(url)
  }

  /**
   * Update the sortable-attributes.
   * @memberof Index
   * @method updateSortableAttributes
   * @param {SortableAttributes} sortableAttributes Array of strings containing the attributes that can be used to sort search results at query time
   * @returns {Promise<EnqueuedTask>} Promise containing object of the enqueued task
   */
  async updateSortableAttributes(
    sortableAttributes: SortableAttributes
  ): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/settings/sortable-attributes`
    return await this.httpRequest.put(url, sortableAttributes)
  }

  /**
   * Reset the sortable-attributes.
   * @memberof Index
   * @method resetSortableAttributes
   * @returns {Promise<EnqueuedTask>} Promise containing object of the enqueued task
   */
  async resetSortableAttributes(): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/settings/sortable-attributes`
    return await this.httpRequest.delete<EnqueuedTask>(url)
  }

  ///
  /// SEARCHABLE ATTRIBUTE
  ///

  /**
   * Get the searchable-attributes
   * @memberof Index
   * @method getSearchableAttributes
   * @returns {Promise<string[]>} Promise containing array of searchable-attributes
   */
  async getSearchableAttributes(): Promise<string[]> {
    const url = `indexes/${this.uid}/settings/searchable-attributes`
    return await this.httpRequest.get<string[]>(url)
  }

  /**
   * Update the searchable-attributes.
   * @memberof Index
   * @method updateSearchableAttributes
   * @param {SearchableAttributes} searchableAttributes Array of strings that contains searchable attributes sorted by order of importance(most to least important)
   * @returns {Promise<EnqueuedTask>} Promise containing object of the enqueued task
   */
  async updateSearchableAttributes(
    searchableAttributes: SearchableAttributes
  ): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/settings/searchable-attributes`
    return await this.httpRequest.put(url, searchableAttributes)
  }

  /**
   * Reset the searchable-attributes.
   * @memberof Index
   * @method resetSearchableAttributes
   * @returns {Promise<EnqueuedTask>} Promise containing object of the enqueued task
   */
  async resetSearchableAttributes(): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/settings/searchable-attributes`
    return await this.httpRequest.delete<EnqueuedTask>(url)
  }

  ///
  /// DISPLAYED ATTRIBUTE
  ///

  /**
   * Get the displayed-attributes
   * @memberof Index
   * @method getDisplayedAttributes
   * @returns {Promise<string[]>} Promise containing array of displayed-attributes
   */
  async getDisplayedAttributes(): Promise<string[]> {
    const url = `indexes/${this.uid}/settings/displayed-attributes`
    return await this.httpRequest.get<string[]>(url)
  }

  /**
   * Update the displayed-attributes.
   * @memberof Index
   * @method updateDisplayedAttributes
   * @param {DisplayedAttributes} displayedAttributes Array of strings that contains attributes of an index to display
   * @returns {Promise<EnqueuedTask>} Promise containing object of the enqueued task
   */
  async updateDisplayedAttributes(
    displayedAttributes: DisplayedAttributes
  ): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/settings/displayed-attributes`
    return await this.httpRequest.put(url, displayedAttributes)
  }

  /**
   * Reset the displayed-attributes.
   * @memberof Index
   * @method resetDisplayedAttributes
   * @returns {Promise<EnqueuedTask>} Promise containing object of the enqueued task
   */
  async resetDisplayedAttributes(): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/settings/displayed-attributes`
    return await this.httpRequest.delete<EnqueuedTask>(url)
  }

  ///
  /// TYPO TOLERANCE
  ///

  /**
   * Get the typo tolerance settings.
   * @memberof Index
   * @method getTypoTolerance
   * @returns {Promise<string[]>} Promise containing the typo tolerance settings.
   */
  async getTypoTolerance(): Promise<string[]> {
    const url = `indexes/${this.uid}/settings/typo-tolerance`
    return await this.httpRequest.get<string[]>(url)
  }

  /**
   * Update the typo tolerance settings.
   * @memberof Index
   * @method updateTypoTolerance
   * @param {TypoTolerance} typoTolerance Object containing the custom typo tolerance settings.
   * @returns {Promise<EnqueuedTask>} Promise containing object of the enqueued update
   */
  async updateTypoTolerance(
    typoTolerance: TypoTolerance
  ): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/settings/typo-tolerance`
    return await this.httpRequest.patch(url, typoTolerance)
  }

  /**
   * Reset the typo tolerance settings.
   * @memberof Index
   * @method resetTypoTolerance
   * @returns {Promise<EnqueuedTask>} Promise containing object of the enqueued update
   */
  async resetTypoTolerance(): Promise<EnqueuedTask> {
    const url = `indexes/${this.uid}/settings/typo-tolerance`
    return await this.httpRequest.delete<EnqueuedTask>(url)
  }
}

export { Index }
