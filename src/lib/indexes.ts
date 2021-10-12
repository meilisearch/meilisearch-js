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
} from '../types'
import { sleep, removeUndefinedFromObject } from './utils'
import { HttpRequests } from './http-requests'

class Index<T = Record<string, any>> {
  uid: string
  primaryKey: string | undefined
  httpRequest: HttpRequests

  constructor(config: Config, uid: string, primaryKey?: string) {
    this.uid = uid
    this.primaryKey = primaryKey
    this.httpRequest = new HttpRequests(config)
  }

  ///
  /// UTILS
  ///

  async waitForPendingUpdate(
    updateId: number,
    {
      timeOutMs = 5000,
      intervalMs = 50,
    }: { timeOutMs?: number; intervalMs?: number } = {}
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
   */
  async fetchInfo(): Promise<this> {
    await this.getRawInfo()
    return this
  }

  /**
   * Get Primary Key.
   * @memberof Index
   * @method fetchPrimaryKey
   */
  async fetchPrimaryKey(): Promise<string | undefined> {
    this.primaryKey = (await this.getRawInfo()).primaryKey
    return this.primaryKey
  }

  /**
   * Create an index.
   * @memberof Index
   * @method create
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
   */
  async delete(): Promise<void> {
    const url = `indexes/${this.uid}`
    return await this.httpRequest.delete(url)
  }

  /**
   * Deletes an index if it already exists.
   * @memberof Index
   * @method deleteIfExists
   */
  async deleteIfExists(): Promise<boolean> {
    try {
      await this.delete()
      return true
    } catch (e) {
      if (e.errorCode === 'index_not_found') {
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
   */
  async getAllUpdateStatus(): Promise<Update[]> {
    const url = `indexes/${this.uid}/updates`
    return await this.httpRequest.get<Update[]>(url)
  }

  /**
   * Get the informations about an update status
   * @memberof Index
   * @method getUpdateStatus
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
   */
  async getDocument(documentId: string | number): Promise<Document<T>> {
    const url = `indexes/${this.uid}/documents/${documentId}`
    return await this.httpRequest.get<Document<T>>(url)
  }

  /**
   * Add or replace multiples documents to an index
   * @memberof Index
   * @method addDocuments
   */
  async addDocuments(
    documents: Array<Document<T>>,
    options?: AddDocumentParams
  ): Promise<EnqueuedUpdate> {
    const url = `indexes/${this.uid}/documents`
    return await this.httpRequest.post(url, documents, options)
  }

  /**
   * Add or update multiples documents to an index
   * @memberof Index
   * @method updateDocuments
   */
  async updateDocuments(
    documents: Array<Document<T>>,
    options?: AddDocumentParams
  ): Promise<EnqueuedUpdate> {
    const url = `indexes/${this.uid}/documents`
    return await this.httpRequest.put(url, documents, options)
  }

  /**
   * Delete one document
   * @memberof Index
   * @method deleteDocument
   */
  async deleteDocument(documentId: string | number): Promise<EnqueuedUpdate> {
    const url = `indexes/${this.uid}/documents/${documentId}`
    return await this.httpRequest.delete<EnqueuedUpdate>(url)
  }

  /**
   * Delete multiples documents of an index
   * @memberof Index
   * @method deleteDocuments
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
   */
  async updateSettings(settings: Settings): Promise<EnqueuedUpdate> {
    const url = `indexes/${this.uid}/settings`
    return await this.httpRequest.post(url, settings)
  }

  /**
   * Reset settings.
   * @memberof Index
   * @method resetSettings
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
   */
  async getSynonyms(): Promise<object> {
    const url = `indexes/${this.uid}/settings/synonyms`
    return await this.httpRequest.get<object>(url)
  }

  /**
   * Update the list of synonyms. Overwrite the old list.
   * @memberof Index
   * @method updateSynonyms
   */
  async updateSynonyms(synonyms: Synonyms): Promise<EnqueuedUpdate> {
    const url = `indexes/${this.uid}/settings/synonyms`
    return await this.httpRequest.post(url, synonyms)
  }

  /**
   * Reset the synonym list to be empty again
   * @memberof Index
   * @method resetSynonyms
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
   */
  async getStopWords(): Promise<string[]> {
    const url = `indexes/${this.uid}/settings/stop-words`
    return await this.httpRequest.get<string[]>(url)
  }

  /**
   * Update the list of stop-words. Overwrite the old list.
   * @memberof Index
   * @method updateStopWords
   */
  async updateStopWords(stopWords: StopWords): Promise<EnqueuedUpdate> {
    const url = `indexes/${this.uid}/settings/stop-words`
    return await this.httpRequest.post(url, stopWords)
  }

  /**
   * Reset the stop-words list to be empty again
   * @memberof Index
   * @method resetStopWords
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
   */
  async getRankingRules(): Promise<string[]> {
    const url = `indexes/${this.uid}/settings/ranking-rules`
    return await this.httpRequest.get<string[]>(url)
  }

  /**
   * Update the list of ranking-rules. Overwrite the old list.
   * @memberof Index
   * @method updateRankingRules
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
   */
  async getDistinctAttribute(): Promise<string | null> {
    const url = `indexes/${this.uid}/settings/distinct-attribute`
    return await this.httpRequest.get<string | null>(url)
  }

  /**
   * Update the distinct-attribute.
   * @memberof Index
   * @method updateDistinctAttribute
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
   */
  async getFilterableAttributes(): Promise<string[]> {
    const url = `indexes/${this.uid}/settings/filterable-attributes`
    return await this.httpRequest.get<string[]>(url)
  }

  /**
   * Update the filterable-attributes.
   * @memberof Index
   * @method updateFilterableAttributes
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
   */
  async getSortableAttributes(): Promise<string[]> {
    const url = `indexes/${this.uid}/settings/sortable-attributes`
    return await this.httpRequest.get<string[]>(url)
  }

  /**
   * Update the sortable-attributes.
   * @memberof Index
   * @method updateSortableAttributes
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
   */
  async getSearchableAttributes(): Promise<string[]> {
    const url = `indexes/${this.uid}/settings/searchable-attributes`
    return await this.httpRequest.get<string[]>(url)
  }

  /**
   * Update the searchable-attributes.
   * @memberof Index
   * @method updateSearchableAttributes
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
   */
  async getDisplayedAttributes(): Promise<string[]> {
    const url = `indexes/${this.uid}/settings/displayed-attributes`
    return await this.httpRequest.get<string[]>(url)
  }

  /**
   * Update the displayed-attributes.
   * @memberof Index
   * @method updateDisplayedAttributes
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
   */
  async resetDisplayedAttributes(): Promise<EnqueuedUpdate> {
    const url = `indexes/${this.uid}/settings/displayed-attributes`
    return await this.httpRequest.delete<EnqueuedUpdate>(url)
  }
}

export { Index }
