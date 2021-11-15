/*
 * Bundle: MeiliSearch / Indexes
 * Project: MeiliSearch - Javascript API
 * Author: Quentin de Quelen <quentin@meilisearch.com>
 * Copyright: 2019, MeiliSearch
 */

'use strict'

import { MeiliSearchTimeOutError, MeiliSearchError } from '../errors'

import {
  Config,
  Update,
  SearchResponse,
  SearchParams,
  Filter,
  SearchRequestGET,
  IndexResponse,
  IndexOptions,
  IndexStats,
  GetDocumentsParams,
  GetDocumentsResponse,
  Document,
  AddDocumentParams,
  EnqueuedUpdate,
  Settings,
  Synonyms,
  StopWords,
  RankingRules,
  DistinctAttribute,
  FilterableAttributes,
  SortableAttributes,
  SearchableAttributes,
  DisplayedAttributes,
  WaitForPendingUpdateOptions,
  ErrorStatusCode,
} from '../types'
import { sleep, removeUndefinedFromObject } from './utils'
import { HttpRequests } from './http-requests'

class Index<T = Record<string, any>> {
  uid: string
  primaryKey: string | undefined
  httpRequest: HttpRequests

  /**
   * @param {Config} config Request configuration options
   * @param {string} uid UID of the index
   * @param {string} primaryKey? Primary Key of the index
   */
  constructor(config: Config, uid: string, primaryKey?: string) {
    this.uid = uid
    this.primaryKey = primaryKey
    this.httpRequest = new HttpRequests(config)
  }

  ///
  /// UTILS
  ///

  /**
   * Waits for a pending update till it has been processed
   * @param {number} updateId Update identifier
   * @param {WaitForPendingUpdateOptions} options Additional configuration options
   * @returns {Promise<Update>} Promise containing Update object after it has been processed
   */
  async waitForPendingUpdate(
    updateId: number,
    { timeOutMs = 5000, intervalMs = 50 }: WaitForPendingUpdateOptions = {}
  ): Promise<Update> {
    const startingTime = Date.now()
    while (Date.now() - startingTime < timeOutMs) {
      const response = await this.getUpdateStatus(updateId)
      if (!['enqueued', 'processing'].includes(response.status)) return response
      await sleep(intervalMs)
    }
    throw new MeiliSearchTimeOutError(
      `timeout of ${timeOutMs}ms has exceeded on process ${updateId} when waiting for pending update to resolve.`
    )
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
      removeUndefinedFromObject({ ...options, q: query }),
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
      sort: options?.sort ? options.sort.join(',') : undefined,
      facetsDistribution: options?.facetsDistribution
        ? options.facetsDistribution.join(',')
        : undefined,
      attributesToRetrieve: options?.attributesToRetrieve
        ? options.attributesToRetrieve.join(',')
        : undefined,
      attributesToCrop: options?.attributesToCrop
        ? options.attributesToCrop.join(',')
        : undefined,
      attributesToHighlight: options?.attributesToHighlight
        ? options.attributesToHighlight.join(',')
        : undefined,
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
   * @returns {Promise<IndexResponse>} Promise containing index information
   */
  async getRawInfo(): Promise<IndexResponse> {
    const url = `indexes/${this.uid}`
    const res = await this.httpRequest.get<IndexResponse>(url)
    this.primaryKey = res.primaryKey
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
  static async create<T = Record<string, any>>(
    uid: string,
    options: IndexOptions = {},
    config: Config
  ): Promise<Index<T>> {
    const url = `indexes`
    const req = new HttpRequests(config)
    const index = await req.post(url, { ...options, uid })
    return new Index(config, uid, index.primaryKey)
  }

  /**
   * Update an index.
   * @memberof Index
   * @method update
   * @param {IndexOptions} data Data to update
   * @returns {Promise<this>} Promise to the current Index object with updated information
   */
  async update(data: IndexOptions): Promise<this> {
    const url = `indexes/${this.uid}`
    const index = await this.httpRequest.put(url, data)
    this.primaryKey = index.primaryKey
    return this
  }

  /**
   * Delete an index.
   * @memberof Index
   * @method delete
   * @returns {Promise<void>} Promise which resolves when index is deleted successfully
   */
  async delete(): Promise<void> {
    const url = `indexes/${this.uid}`
    return await this.httpRequest.delete(url)
  }

  /**
   * Deletes an index if it already exists.
   * @memberof Index
   * @method deleteIfExists
   * @returns {Promise<boolean>} Promise which resolves to true when index exists and is deleted successfully, otherwise false if it does not exist
   */
  async deleteIfExists(): Promise<boolean> {
    try {
      await this.delete()
      return true
    } catch (e: any) {
      if (e.code === ErrorStatusCode.INDEX_NOT_FOUND) {
        return false
      }
      throw e
    }
  }

  ///
  /// UPDATES
  ///

  /**
   * Get the list of all updates
   * @memberof Index
   * @method getAllUpdateStatus
   * @returns {Promise<Update[]>} Promise containing array of Update objects
   */
  async getAllUpdateStatus(): Promise<Update[]> {
    const url = `indexes/${this.uid}/updates`
    return await this.httpRequest.get<Update[]>(url)
  }

  /**
   * Get the informations about an update status
   * @memberof Index
   * @method getUpdateStatus
   * @param {number} updateId Update identifier
   * @returns {Promise<Update>} Promise containing the requested Update object
   */
  async getUpdateStatus(updateId: number): Promise<Update> {
    const url = `indexes/${this.uid}/updates/${updateId}`
    return await this.httpRequest.get<Update>(url)
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
   * @param {GetDocumentsParams<T>} options? Options to browse the documents
   * @returns {Promise<GetDocumentsResponse<T>>} Promise containing Document responses
   */
  async getDocuments<T = Record<string, any>>(
    options?: GetDocumentsParams<T>
  ): Promise<GetDocumentsResponse<T>> {
    const url = `indexes/${this.uid}/documents`
    let attr
    if (options !== undefined && Array.isArray(options.attributesToRetrieve)) {
      attr = options.attributesToRetrieve.join(',')
    }

    return await this.httpRequest.get<GetDocumentsResponse<T>>(url, {
      ...options,
      ...(attr !== undefined ? { attributesToRetrieve: attr } : {}),
    })
  }

  /**
   * Get one document
   * @memberof Index
   * @method getDocument
   * @template T
   * @param {string | number} documentId Document ID
   * @returns {Promise<Document<T>>} Promise containing Document response
   */
  async getDocument(documentId: string | number): Promise<Document<T>> {
    const url = `indexes/${this.uid}/documents/${documentId}`
    return await this.httpRequest.get<Document<T>>(url)
  }

  /**
   * Add or replace multiples documents to an index
   * @memberof Index
   * @method addDocuments
   * @template T
   * @param {Array<Document<T>>} documents Array of Document objects to add/replace
   * @param {AddDocumentParams} options? Query parameters
   * @returns {Promise<EnqueuedUpdate>} Promise containing object of the enqueued update
   */
  async addDocuments(
    documents: Array<Document<T>>,
    options?: AddDocumentParams
  ): Promise<EnqueuedUpdate> {
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
   * @param {AddDocumentParams} options? Query parameters
   * @returns {Promise<EnqueuedUpdate[]>} Promise containing array of enqueued update objects for each batch
   */
  async addDocumentsInBatches(
    documents: Array<Document<T>>,
    batchSize = 1000,
    options?: AddDocumentParams
  ): Promise<EnqueuedUpdate[]> {
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
   * @param {Array<Document<T>>} documents Array of Document objects to add/update
   * @param {AddDocumentParams} options? Query parameters
   * @returns {Promise<EnqueuedUpdate>} Promise containing object of the enqueued update
   */
  async updateDocuments(
    documents: Array<Document<T>>,
    options?: AddDocumentParams
  ): Promise<EnqueuedUpdate> {
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
   * @param {AddDocumentParams} options? Query parameters
   * @returns {Promise<EnqueuedUpdate[]>} Promise containing array of enqueued update objects for each batch
   */
  async updateDocumentsInBatches(
    documents: Array<Document<T>>,
    batchSize = 1000,
    options?: AddDocumentParams
  ): Promise<EnqueuedUpdate[]> {
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
   * @returns {Promise<EnqueuedUpdate>} Promise containing object of the enqueued update
   */
  async deleteDocument(documentId: string | number): Promise<EnqueuedUpdate> {
    const url = `indexes/${this.uid}/documents/${documentId}`
    return await this.httpRequest.delete<EnqueuedUpdate>(url)
  }

  /**
   * Delete multiples documents of an index
   * @memberof Index
   * @method deleteDocuments
   * @param {string[] | number[]} documentsIds Array of Document Ids to delete
   * @returns {Promise<EnqueuedUpdate>} Promise containing object of the enqueued update
   */
  async deleteDocuments(
    documentsIds: string[] | number[]
  ): Promise<EnqueuedUpdate> {
    const url = `indexes/${this.uid}/documents/delete-batch`

    return await this.httpRequest.post(url, documentsIds)
  }

  /**
   * Delete all documents of an index
   * @memberof Index
   * @method deleteAllDocuments
   * @returns {Promise<EnqueuedUpdate>} Promise containing object of the enqueued update
   */
  async deleteAllDocuments(): Promise<EnqueuedUpdate> {
    const url = `indexes/${this.uid}/documents`
    return await this.httpRequest.delete<EnqueuedUpdate>(url)
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
   * @returns {Promise<EnqueuedUpdate>} Promise containing object of the enqueued update
   */
  async updateSettings(settings: Settings): Promise<EnqueuedUpdate> {
    const url = `indexes/${this.uid}/settings`
    return await this.httpRequest.post(url, settings)
  }

  /**
   * Reset settings.
   * @memberof Index
   * @method resetSettings
   * @returns {Promise<EnqueuedUpdate>} Promise containing object of the enqueued update
   */
  async resetSettings(): Promise<EnqueuedUpdate> {
    const url = `indexes/${this.uid}/settings`
    return await this.httpRequest.delete<EnqueuedUpdate>(url)
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
   * @returns {Promise<EnqueuedUpdate>} Promise containing object of the enqueued update
   */
  async updateSynonyms(synonyms: Synonyms): Promise<EnqueuedUpdate> {
    const url = `indexes/${this.uid}/settings/synonyms`
    return await this.httpRequest.post(url, synonyms)
  }

  /**
   * Reset the synonym list to be empty again
   * @memberof Index
   * @method resetSynonyms
   * @returns {Promise<EnqueuedUpdate>} Promise containing object of the enqueued update
   */
  async resetSynonyms(): Promise<EnqueuedUpdate> {
    const url = `indexes/${this.uid}/settings/synonyms`
    return await this.httpRequest.delete<EnqueuedUpdate>(url)
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
   * @returns {Promise<EnqueuedUpdate>} Promise containing object of the enqueued update
   */
  async updateStopWords(stopWords: StopWords): Promise<EnqueuedUpdate> {
    const url = `indexes/${this.uid}/settings/stop-words`
    return await this.httpRequest.post(url, stopWords)
  }

  /**
   * Reset the stop-words list to be empty again
   * @memberof Index
   * @method resetStopWords
   * @returns {Promise<EnqueuedUpdate>} Promise containing object of the enqueued update
   */
  async resetStopWords(): Promise<EnqueuedUpdate> {
    const url = `indexes/${this.uid}/settings/stop-words`
    return await this.httpRequest.delete<EnqueuedUpdate>(url)
  }

  ///
  /// RANKING RULES
  ///

  /**
   * Get the list of all ranking-rules
   * @memberof Index
   * @method getRankingRules
   * @returns {Promise<string[]} Promise containing array of ranking-rules
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
   * @returns {Promise<EnqueuedUpdate>} Promise containing object of the enqueued update
   */
  async updateRankingRules(
    rankingRules: RankingRules
  ): Promise<EnqueuedUpdate> {
    const url = `indexes/${this.uid}/settings/ranking-rules`
    return await this.httpRequest.post(url, rankingRules)
  }

  /**
   * Reset the ranking rules list to its default value
   * @memberof Index
   * @method resetRankingRules
   * @returns {Promise<EnqueuedUpdate>} Promise containing object of the enqueued update
   */
  async resetRankingRules(): Promise<EnqueuedUpdate> {
    const url = `indexes/${this.uid}/settings/ranking-rules`
    return await this.httpRequest.delete<EnqueuedUpdate>(url)
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
   * @returns {Promise<EnqueuedUpdate>} Promise containing object of the enqueued update
   */
  async updateDistinctAttribute(
    distinctAttribute: DistinctAttribute
  ): Promise<EnqueuedUpdate> {
    const url = `indexes/${this.uid}/settings/distinct-attribute`
    return await this.httpRequest.post(url, distinctAttribute)
  }

  /**
   * Reset the distinct-attribute.
   * @memberof Index
   * @method resetDistinctAttribute
   * @returns {Promise<EnqueuedUpdate>} Promise containing object of the enqueued update
   */
  async resetDistinctAttribute(): Promise<EnqueuedUpdate> {
    const url = `indexes/${this.uid}/settings/distinct-attribute`
    return await this.httpRequest.delete<EnqueuedUpdate>(url)
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
   * @returns {Promise<EnqueuedUpdate>} Promise containing object of the enqueued update
   */
  async updateFilterableAttributes(
    filterableAttributes: FilterableAttributes
  ): Promise<EnqueuedUpdate> {
    const url = `indexes/${this.uid}/settings/filterable-attributes`
    return await this.httpRequest.post(url, filterableAttributes)
  }

  /**
   * Reset the filterable-attributes.
   * @memberof Index
   * @method resetFilterableAttributes
   * @returns {Promise<EnqueuedUpdate>} Promise containing object of the enqueued update
   */
  async resetFilterableAttributes(): Promise<EnqueuedUpdate> {
    const url = `indexes/${this.uid}/settings/filterable-attributes`
    return await this.httpRequest.delete<EnqueuedUpdate>(url)
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
   * @returns {Promise<EnqueuedUpdate>} Promise containing object of the enqueued update
   */
  async updateSortableAttributes(
    sortableAttributes: SortableAttributes
  ): Promise<EnqueuedUpdate> {
    const url = `indexes/${this.uid}/settings/sortable-attributes`
    return await this.httpRequest.post(url, sortableAttributes)
  }

  /**
   * Reset the sortable-attributes.
   * @memberof Index
   * @method resetSortableAttributes
   * @returns {Promise<EnqueuedUpdate>} Promise containing object of the enqueued update
   */
  async resetSortableAttributes(): Promise<EnqueuedUpdate> {
    const url = `indexes/${this.uid}/settings/sortable-attributes`
    return await this.httpRequest.delete<EnqueuedUpdate>(url)
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
   * @returns {Promise<EnqueuedUpdate>} Promise containing object of the enqueued update
   */
  async updateSearchableAttributes(
    searchableAttributes: SearchableAttributes
  ): Promise<EnqueuedUpdate> {
    const url = `indexes/${this.uid}/settings/searchable-attributes`
    return await this.httpRequest.post(url, searchableAttributes)
  }

  /**
   * Reset the searchable-attributes.
   * @memberof Index
   * @method resetSearchableAttributes
   * @returns {Promise<EnqueuedUpdate>} Promise containing object of the enqueued update
   */
  async resetSearchableAttributes(): Promise<EnqueuedUpdate> {
    const url = `indexes/${this.uid}/settings/searchable-attributes`
    return await this.httpRequest.delete<EnqueuedUpdate>(url)
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
   * @returns {Promise<EnqueuedUpdate>} Promise containing object of the enqueued update
   */
  async updateDisplayedAttributes(
    displayedAttributes: DisplayedAttributes
  ): Promise<EnqueuedUpdate> {
    const url = `indexes/${this.uid}/settings/displayed-attributes`
    return await this.httpRequest.post(url, displayedAttributes)
  }

  /**
   * Reset the displayed-attributes.
   * @memberof Index
   * @method resetDisplayedAttributes
   * @returns {Promise<EnqueuedUpdate>} Promise containing object of the enqueued update
   */
  async resetDisplayedAttributes(): Promise<EnqueuedUpdate> {
    const url = `indexes/${this.uid}/settings/displayed-attributes`
    return await this.httpRequest.delete<EnqueuedUpdate>(url)
  }
}

export { Index }
