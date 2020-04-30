/*
 * Bundle: Meilisearch / Indexes
 * Project: Meilisearch - Javascript API
 * Author: Quentin de Quelen <quentin@meilisearch.com>
 * Copyright: 2019, Meilisearch
 */

'use strict'

import MeiliSearchTimeOutError from './custom-errors/meilisearch-timeout-error'
import MeiliAxiosWrapper from './meili-axios-wrapper'
import * as Types from './types'
import { sleep } from './utils'

class Index extends MeiliAxiosWrapper implements Types.IndexInterface {
  uid: string
  constructor(config: Types.Config, uid: string) {
    super(config)
    this.uid = uid
  }

  ///
  /// UPDATES
  ///

  /**
   * Get the informations about an update status
   * @memberof Index
   * @method getUpdateStatus
   */
  async getUpdateStatus(updateId: number): Promise<Types.Update> {
    const url = `/indexes/${this.uid}/updates/${updateId}`

    return await this.get(url)
  }

  async waitForPendingUpdate(
    updateId: number,
    {
      timeOutMs = 5000,
      intervalMs = 50,
    }: { timeOutMs?: number; intervalMs?: number } = {}
  ): Promise<Types.Update> {
    const startingTime = Date.now()
    while (Date.now() - startingTime < timeOutMs) {
      const response = await this.getUpdateStatus(updateId)
      if (response.status !== 'enqueued') return response
      await sleep(intervalMs)
    }
    throw new MeiliSearchTimeOutError(
      `timeout of ${timeOutMs}ms has exceeded on process ${updateId} when waiting for pending update to resolve.`
    )
  }

  /**
   * Get the list of all updates
   * @memberof Index
   * @method getAllUpdateStatus
   */
  async getAllUpdateStatus(): Promise<Types.Update[]> {
    const url = `/indexes/${this.uid}/updates`

    return await this.get(url)
  }

  ///
  /// SEARCH
  ///

  /**
   * Search for documents into an index
   * @memberof Index
   * @method search
   */
  async search(
    query: string,
    options?: Types.SearchParams
  ): Promise<Types.SearchResponse> {
    const url = `/indexes/${this.uid}/search`

    const params: Types.SearchRequest = {
      q: query,
    }
    if (options !== undefined) {
      if (options.offset !== undefined) {
        params.offset = options.offset
      }
      if (options.limit !== undefined) {
        params.limit = options.limit
      }
      if (options.attributesToRetrieve !== undefined) {
        if (Array.isArray(options.attributesToRetrieve)) {
          params.attributesToRetrieve = options.attributesToRetrieve.join(',')
        } else {
          params.attributesToRetrieve = options.attributesToRetrieve
        }
      }

      if (options.attributesToCrop !== undefined) {
        if (Array.isArray(options.attributesToCrop)) {
          params.attributesToCrop = options.attributesToCrop.join(',')
        } else {
          params.attributesToCrop = options.attributesToCrop
        }
      }
      if (options.cropLength !== undefined) {
        params.cropLength = options.cropLength
      }
      if (options.attributesToHighlight !== undefined) {
        if (Array.isArray(options.attributesToHighlight)) {
          params.attributesToHighlight = options.attributesToHighlight.join(',')
        } else {
          params.attributesToHighlight = options.attributesToHighlight
        }
      }
      if (options.filters !== undefined) {
        params.filters = options.filters
      }

      if (options.matches !== undefined) {
        params.matches = options.matches
      }
    }

    return await this.get(url, {
      params,
      cancelToken: this.cancelTokenSource.token,
    })
  }

  ///
  /// INDEX
  ///
  /**
   * Show index information.
   * @memberof Index
   * @method show
   */
  async show(): Promise<Types.IndexResponse> {
    const url = `/indexes/${this.uid}`

    return await this.get(url)
  }

  /**
   * Update an index.
   * @memberof Index
   * @method updateIndex
   */
  async updateIndex(
    data: Types.UpdateIndexRequest
  ): Promise<Types.IndexResponse> {
    const url = `/indexes/${this.uid}`

    return await this.put(url, data)
  }

  /**
   * Delete an index.
   * @memberof Index
   * @method deleteIndex
   */

  async deleteIndex(): Promise<string> {
    const url = `/indexes/${this.uid}`

    return await this.delete(url)
  }

  ///
  /// STATS
  ///

  /**
   * get stats of an index
   * @memberof Index
   * @method getStats
   */
  async getStats(): Promise<Types.IndexStats> {
    const url = `/indexes/${this.uid}/stats`

    return await this.get(url)
  }
  ///
  /// DOCUMENTS
  ///

  /**
   * get documents of an index
   * @memberof Index
   * @method getDocuments
   */
  async getDocuments(
    options?: Types.GetDocumentsParams
  ): Promise<Types.Document[]> {
    const url = `/indexes/${this.uid}/documents`
    let attr
    if (options !== undefined && Array.isArray(options.attributesToRetrieve)) {
      attr = options.attributesToRetrieve.join(',')
    }

    return await this.get(url, {
      params: {
        ...options,
        ...(attr !== undefined ? { attributesToRetrieve: attr } : {}),
      },
    })
  }

  /**
   * Get one document
   * @memberof Index
   * @method getDocument
   */
  async getDocument(documentId: string | number): Promise<Types.Document> {
    const url = `/indexes/${this.uid}/documents/${documentId}`

    return await this.get(url)
  }

  /**
   * Add or replace multiples documents to an index
   * @memberof Index
   * @method addDocuments
   */
  async addDocuments(
    documents: Types.Document[],
    options?: Types.AddDocumentParams
  ): Promise<Types.EnqueuedUpdate> {
    const url = `/indexes/${this.uid}/documents`

    return await this.post(url, documents, {
      params: options,
    })
  }

  /**
   * Add or update multiples documents to an index
   * @memberof Index
   * @method updateDocuments
   */
  async updateDocuments(
    documents: Types.Document[],
    options?: Types.AddDocumentParams
  ): Promise<Types.EnqueuedUpdate> {
    const url = `/indexes/${this.uid}/documents`

    return await this.put(url, documents, {
      params: options,
    })
  }

  /**
   * Delete one document
   * @memberof Index
   * @method deleteDocument
   */
  async deleteDocument(
    documentId: string | number
  ): Promise<Types.EnqueuedUpdate> {
    const url = `/indexes/${this.uid}/documents/${documentId}`

    return await this.delete(url)
  }

  /**
   * Delete multiples documents of an index
   * @memberof Index
   * @method deleteDocuments
   */
  async deleteDocuments(
    documentsIds: string[] | number[]
  ): Promise<Types.EnqueuedUpdate> {
    const url = `/indexes/${this.uid}/documents/delete-batch`

    return await this.post(url, documentsIds)
  }

  /**
   * Delete all documents of an index
   * @memberof Index
   * @method deleteAllDocuments
   */
  async deleteAllDocuments(): Promise<Types.EnqueuedUpdate> {
    const url = `/indexes/${this.uid}/documents`

    return await this.delete(url)
  }

  ///
  /// SETTINGS
  ///

  /**
   * Retrieve all settings
   * @memberof Index
   * @method getSettings
   */
  async getSettings(): Promise<Types.Settings> {
    const url = `/indexes/${this.uid}/settings`

    return await this.get(url)
  }

  /**
   * Update all settings
   * Any parameters not provided will be left unchanged.
   * @memberof Index
   * @method updateSettings
   */
  async updateSettings(
    settings: Types.Settings
  ): Promise<Types.EnqueuedUpdate> {
    const url = `/indexes/${this.uid}/settings`

    return await this.post(url, settings)
  }

  /**
   * Reset settings.
   * @memberof Index
   * @method resetSettings
   */
  async resetSettings(): Promise<Types.EnqueuedUpdate> {
    const url = `/indexes/${this.uid}/settings`

    return await this.delete(url)
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
    const url = `/indexes/${this.uid}/settings/synonyms`

    return await this.get(url)
  }

  /**
   * Update the list of synonyms. Overwrite the old list.
   * @memberof Index
   * @method updateSynonyms
   */
  async updateSynonyms(synonyms: object): Promise<Types.EnqueuedUpdate> {
    const url = `/indexes/${this.uid}/settings/synonyms`

    return await this.post(url, synonyms)
  }

  /**
   * Reset the synonym list to be empty again
   * @memberof Index
   * @method resetSynonyms
   */
  async resetSynonyms(): Promise<Types.EnqueuedUpdate> {
    const url = `/indexes/${this.uid}/settings/synonyms`

    return await this.delete(url)
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
    const url = `/indexes/${this.uid}/settings/stop-words`

    return await this.get(url)
  }

  /**
   * Update the list of stop-words. Overwrite the old list.
   * @memberof Index
   * @method updateStopWords
   */
  async updateStopWords(stopWords: string[]): Promise<Types.EnqueuedUpdate> {
    const url = `/indexes/${this.uid}/settings/stop-words`

    return await this.post(url, stopWords)
  }

  /**
   * Reset the stop-words list to be empty again
   * @memberof Index
   * @method resetStopWords
   */
  async resetStopWords(): Promise<Types.EnqueuedUpdate> {
    const url = `/indexes/${this.uid}/settings/stop-words`

    return await this.delete(url)
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
    const url = `/indexes/${this.uid}/settings/ranking-rules`

    return await this.get(url)
  }

  /**
   * Update the list of ranking-rules. Overwrite the old list.
   * @memberof Index
   * @method updateRankingRules
   */
  async updateRankingRules(
    rankingRules: string[]
  ): Promise<Types.EnqueuedUpdate> {
    const url = `/indexes/${this.uid}/settings/ranking-rules`

    return await this.post(url, rankingRules)
  }

  /**
   * Reset the ranking rules list to its default value
   * @memberof Index
   * @method resetRankingRules
   */
  async resetRankingRules(): Promise<Types.EnqueuedUpdate> {
    const url = `/indexes/${this.uid}/settings/ranking-rules`

    return await this.delete(url)
  }

  ///
  /// DISTINCT ATTRIBUTE
  ///

  /**
   * Get the distinct-attribute
   * @memberof Index
   * @method getDistinctAttribute
   */
  async getDistinctAttribute(): Promise<string | void> {
    const url = `/indexes/${this.uid}/settings/distinct-attribute`

    return await this.get(url)
  }

  /**
   * Update the distinct-attribute.
   * @memberof Index
   * @method updateDistinctAttribute
   */
  async updateDistinctAttribute(
    distinctAttribute: string
  ): Promise<Types.EnqueuedUpdate> {
    const url = `/indexes/${this.uid}/settings/distinct-attribute`

    return await this.post(url, distinctAttribute)
  }

  /**
   * Reset the distinct-attribute.
   * @memberof Index
   * @method resetDistinctAttribute
   */
  async resetDistinctAttribute(): Promise<Types.EnqueuedUpdate> {
    const url = `/indexes/${this.uid}/settings/distinct-attribute`

    return await this.delete(url)
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
    const url = `/indexes/${this.uid}/settings/searchable-attributes`

    return await this.get(url)
  }

  /**
   * Update the searchable-attributes.
   * @memberof Index
   * @method updateSearchableAttributes
   */
  async updateSearchableAttributes(
    searchableAttributes: string[]
  ): Promise<Types.EnqueuedUpdate> {
    const url = `/indexes/${this.uid}/settings/searchable-attributes`

    return await this.post(url, searchableAttributes)
  }

  /**
   * Reset the searchable-attributes.
   * @memberof Index
   * @method resetSearchableAttributes
   */
  async resetSearchableAttributes(): Promise<Types.EnqueuedUpdate> {
    const url = `/indexes/${this.uid}/settings/searchable-attributes`

    return await this.delete(url)
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
    const url = `/indexes/${this.uid}/settings/displayed-attributes`

    return await this.get(url)
  }

  /**
   * Update the displayed-attributes.
   * @memberof Index
   * @method updateDisplayedAttributes
   */
  async updateDisplayedAttributes(
    displayedAttributes: string[]
  ): Promise<Types.EnqueuedUpdate> {
    const url = `/indexes/${this.uid}/settings/displayed-attributes`

    return await this.post(url, displayedAttributes)
  }

  /**
   * Reset the displayed-attributes.
   * @memberof Index
   * @method resetDisplayedAttributes
   */
  async resetDisplayedAttributes(): Promise<Types.EnqueuedUpdate> {
    const url = `/indexes/${this.uid}/settings/displayed-attributes`

    return await this.delete(url)
  }

  ///
  /// ACCEPT NEW FIELDS
  ///

  /**
   * Get the accept-new-fields value.
   * @memberof Index
   * @method getAcceptNewFields
   */
  async getAcceptNewFields(): Promise<boolean> {
    const url = `/indexes/${this.uid}/settings/accept-new-fields`

    return await this.get(url)
  }

  /**
   * Update the accept-new-fields value.
   * @memberof Index
   * @method updateAcceptNewFields
   */
  async updateAcceptNewFields(
    acceptNewFields: boolean
  ): Promise<Types.EnqueuedUpdate> {
    const url = `/indexes/${this.uid}/settings/accept-new-fields`

    return await this.post(url, acceptNewFields)
  }
}

export { Index }
