/*
 * Bundle: Meilisearch / Indexes
 * Project: Meilisearch - Javascript API
 * Author: Quentin de Quelen <quentin@meilisearch.com>
 * Copyright: 2019, Meilisearch
 */

'use strict'

import { MeiliSearchTimeOutError } from './errors/meilisearch-timeout-error'
import MeiliAxiosWrapper from './meili-axios-wrapper'
import * as Types from './types'
import { sleep } from './utils'

class Index extends MeiliAxiosWrapper implements Types.Index {
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
  getUpdateStatus(updateId: number): Promise<Types.Update> {
    const url = `/indexes/${this.uid}/updates/${updateId}`

    return this.get(url)
  }

  async waitForPendingUpdate(
    updateId: number,
    {
      timeOutMs = 5000,
      intervalMs = 50,
    }: { timeOutMs?: number; intervalMs?: number } = {}
  ) {
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
  getAllUpdateStatus(): Promise<Types.Update[]> {
    const url = `/indexes/${this.uid}/updates`

    return this.get(url)
  }

  ///
  /// SEARCH
  ///

  /**
   * Search for documents into an index
   * @memberof Index
   * @method search
   */
  search(
    query: string,
    options?: Types.SearchParams
  ): Promise<Types.SearchResponse> {
    const url = `/indexes/${this.uid}/search`

    const params: Types.SearchRequest = {
      q: query,
    }
    if (options) {
      if (options.offset) {
        params.offset = options.offset
      }
      if (options.limit) {
        params.limit = options.limit
      }
      if (options.attributesToRetrieve) {
        if (Array.isArray(options.attributesToRetrieve)) {
          params.attributesToRetrieve = options.attributesToRetrieve.join(',')
        } else {
          params.attributesToRetrieve = options.attributesToRetrieve
        }
      }

      if (options.attributesToCrop) {
        if (Array.isArray(options.attributesToCrop)) {
          params.attributesToCrop = options.attributesToCrop.join(',')
        } else {
          params.attributesToCrop = options.attributesToCrop
        }
      }
      if (options.cropLength) {
        params.cropLength = options.cropLength
      }
      if (options.attributesToHighlight) {
        if (Array.isArray(options.attributesToHighlight)) {
          params.attributesToHighlight = options.attributesToHighlight.join(',')
        } else {
          params.attributesToHighlight = options.attributesToHighlight
        }
      }
      if (options.filters) {
        params.filters = options.filters
      }

      if (options.matches) {
        params.matches = options.matches
      }
    }

    return this.get(url, {
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
  show(): Promise<Types.IndexResponse> {
    const url = `/indexes/${this.uid}`

    return this.get(url)
  }

  /**
   * Update an index.
   * @memberof Index
   * @method updateIndex
   */
  updateIndex(data: Types.UpdateIndexRequest): Promise<Types.IndexResponse> {
    const url = `/indexes/${this.uid}`

    return this.put(url, data)
  }

  /**
   * Delete an index.
   * @memberof Index
   * @method deleteIndex
   */

  deleteIndex(): Promise<string> {
    const url = `/indexes/${this.uid}`

    return this.delete(url)
  }

  ///
  /// STATS
  ///

  /**
   * get stats of an index
   * @memberof Index
   * @method getStats
   */
  getStats(): Promise<Types.IndexStats> {
    const url = `/indexes/${this.uid}/stats`

    return this.get(url)
  }
  ///
  /// DOCUMENTS
  ///

  /**
   * get documents of an index
   * @memberof Index
   * @method getDocuments
   */
  getDocuments(options?: Types.GetDocumentsParams): Promise<Types.Document[]> {
    const url = `/indexes/${this.uid}/documents`
    let attr
    if (options && Array.isArray(options.attributesToRetrieve)) {
      attr = options.attributesToRetrieve.join(',')
    }

    return this.get(url, {
      params: {
        ...options,
        ...(attr ? { attributesToRetrieve: attr } : {}),
      },
    })
  }

  /**
   * Get one document
   * @memberof Index
   * @method getDocument
   */
  getDocument(documentId: string | number): Promise<Types.Document> {
    const url = `/indexes/${this.uid}/documents/${documentId}`

    return this.get(url)
  }

  /**
   * Add or replace multiples documents to an index
   * @memberof Index
   * @method addDocuments
   */
  addDocuments(
    documents: Types.Document[],
    options?: Types.AddDocumentParams
  ): Promise<Types.EnqueuedUpdate> {
    const url = `/indexes/${this.uid}/documents`

    return this.post(url, documents, {
      params: options,
    })
  }

  /**
   * Add or update multiples documents to an index
   * @memberof Index
   * @method updateDocuments
   */
  updateDocuments(
    documents: Types.Document[],
    options?: Types.AddDocumentParams
  ): Promise<Types.EnqueuedUpdate> {
    const url = `/indexes/${this.uid}/documents`

    return this.put(url, documents, {
      params: options,
    })
  }

  /**
   * Delete one document
   * @memberof Index
   * @method deleteDocument
   */
  deleteDocument(documentId: string | number): Promise<Types.EnqueuedUpdate> {
    const url = `/indexes/${this.uid}/documents/${documentId}`

    return this.delete(url)
  }

  /**
   * Delete multiples documents of an index
   * @memberof Index
   * @method deleteDocuments
   */
  deleteDocuments(
    documentsIds: string[] | number[]
  ): Promise<Types.EnqueuedUpdate> {
    const url = `/indexes/${this.uid}/documents/delete-batch`

    return this.post(url, documentsIds)
  }

  /**
   * Delete all documents of an index
   * @memberof Index
   * @method deleteAllDocuments
   */
  deleteAllDocuments(): Promise<Types.EnqueuedUpdate> {
    const url = `/indexes/${this.uid}/documents`

    return this.delete(url)
  }

  ///
  /// SETTINGS
  ///

  /**
   * Retrieve all settings
   * @memberof Index
   * @method getSettings
   */
  getSettings(): Promise<Types.Settings> {
    const url = `/indexes/${this.uid}/settings`

    return this.get(url)
  }

  /**
   * Update all settings
   * Any parameters not provided will be left unchanged.
   * @memberof Index
   * @method updateSettings
   */
  updateSettings(settings: Types.Settings): Promise<Types.EnqueuedUpdate> {
    const url = `/indexes/${this.uid}/settings`

    return this.post(url, settings)
  }

  /**
   * Reset settings.
   * @memberof Index
   * @method resetSettings
   */
  resetSettings(): Promise<Types.EnqueuedUpdate> {
    const url = `/indexes/${this.uid}/settings`

    return this.delete(url)
  }

  ///
  /// SYNONYMS
  ///

  /**
   * Get the list of all synonyms
   * @memberof Index
   * @method getSynonyms
   */
  getSynonyms(): Promise<object> {
    const url = `/indexes/${this.uid}/settings/synonyms`

    return this.get(url)
  }

  /**
   * Update the list of synonyms. Overwrite the old list.
   * @memberof Index
   * @method updateSynonyms
   */
  updateSynonyms(synonyms: object): Promise<Types.EnqueuedUpdate> {
    const url = `/indexes/${this.uid}/settings/synonyms`

    return this.post(url, synonyms)
  }

  /**
   * Reset the synonym list to be empty again
   * @memberof Index
   * @method resetSynonyms
   */
  resetSynonyms(): Promise<Types.EnqueuedUpdate> {
    const url = `/indexes/${this.uid}/settings/synonyms`

    return this.delete(url)
  }

  ///
  /// STOP WORDS
  ///

  /**
   * Get the list of all stop-words
   * @memberof Index
   * @method getStopWords
   */
  getStopWords(): Promise<string[]> {
    const url = `/indexes/${this.uid}/settings/stop-words`

    return this.get(url)
  }

  /**
   * Update the list of stop-words. Overwrite the old list.
   * @memberof Index
   * @method updateStopWords
   */
  updateStopWords(stopWords: string[]): Promise<Types.EnqueuedUpdate> {
    const url = `/indexes/${this.uid}/settings/stop-words`

    return this.post(url, stopWords)
  }

  /**
   * Reset the stop-words list to be empty again
   * @memberof Index
   * @method resetStopWords
   */
  resetStopWords(): Promise<Types.EnqueuedUpdate> {
    const url = `/indexes/${this.uid}/settings/stop-words`

    return this.delete(url)
  }

  ///
  /// RANKING RULES
  ///

  /**
   * Get the list of all ranking-rules
   * @memberof Index
   * @method getRankingRules
   */
  getRankingRules(): Promise<string[]> {
    const url = `/indexes/${this.uid}/settings/ranking-rules`

    return this.get(url)
  }

  /**
   * Update the list of ranking-rules. Overwrite the old list.
   * @memberof Index
   * @method updateRankingRules
   */
  updateRankingRules(rankingRules: string[]): Promise<Types.EnqueuedUpdate> {
    const url = `/indexes/${this.uid}/settings/ranking-rules`

    return this.post(url, rankingRules)
  }

  /**
   * Reset the ranking rules list to its default value
   * @memberof Index
   * @method resetRankingRules
   */
  resetRankingRules(): Promise<Types.EnqueuedUpdate> {
    const url = `/indexes/${this.uid}/settings/ranking-rules`

    return this.delete(url)
  }

  ///
  /// DISTINCT ATTRIBUTE
  ///

  /**
   * Get the distinct-attribute
   * @memberof Index
   * @method getDistinctAttribute
   */
  getDistinctAttribute(): Promise<string | void> {
    const url = `/indexes/${this.uid}/settings/distinct-attribute`

    return this.get(url)
  }

  /**
   * Update the distinct-attribute.
   * @memberof Index
   * @method updateDistinctAttribute
   */
  updateDistinctAttribute(
    distinctAttribute: string
  ): Promise<Types.EnqueuedUpdate> {
    const url = `/indexes/${this.uid}/settings/distinct-attribute`

    return this.post(url, distinctAttribute)
  }

  /**
   * Reset the distinct-attribute.
   * @memberof Index
   * @method resetDistinctAttribute
   */
  resetDistinctAttribute(): Promise<Types.EnqueuedUpdate> {
    const url = `/indexes/${this.uid}/settings/distinct-attribute`

    return this.delete(url)
  }

  ///
  /// SEARCHABLE ATTRIBUTE
  ///

  /**
   * Get the searchable-attributes
   * @memberof Index
   * @method getSearchableAttributes
   */
  getSearchableAttributes(): Promise<string[]> {
    const url = `/indexes/${this.uid}/settings/searchable-attributes`

    return this.get(url)
  }

  /**
   * Update the searchable-attributes.
   * @memberof Index
   * @method updateSearchableAttributes
   */
  updateSearchableAttributes(
    searchableAttributes: string[]
  ): Promise<Types.EnqueuedUpdate> {
    const url = `/indexes/${this.uid}/settings/searchable-attributes`

    return this.post(url, searchableAttributes)
  }

  /**
   * Reset the searchable-attributes.
   * @memberof Index
   * @method resetSearchableAttributes
   */
  resetSearchableAttributes(): Promise<Types.EnqueuedUpdate> {
    const url = `/indexes/${this.uid}/settings/searchable-attributes`

    return this.delete(url)
  }

  ///
  /// DISPLAYED ATTRIBUTE
  ///

  /**
   * Get the displayed-attributes
   * @memberof Index
   * @method getDisplayedAttributes
   */
  getDisplayedAttributes(): Promise<string[]> {
    const url = `/indexes/${this.uid}/settings/displayed-attributes`

    return this.get(url)
  }

  /**
   * Update the displayed-attributes.
   * @memberof Index
   * @method updateDisplayedAttributes
   */
  updateDisplayedAttributes(
    displayedAttributes: string[]
  ): Promise<Types.EnqueuedUpdate> {
    const url = `/indexes/${this.uid}/settings/displayed-attributes`

    return this.post(url, displayedAttributes)
  }

  /**
   * Reset the displayed-attributes.
   * @memberof Index
   * @method resetDisplayedAttributes
   */
  resetDisplayedAttributes(): Promise<Types.EnqueuedUpdate> {
    const url = `/indexes/${this.uid}/settings/displayed-attributes`

    return this.delete(url)
  }

  ///
  /// ACCEPT NEW FIELDS
  ///

  /**
   * Get the accept-new-fields value.
   * @memberof Index
   * @method getAcceptNewFields
   */
  getAcceptNewFields(): Promise<boolean> {
    const url = `/indexes/${this.uid}/settings/accept-new-fields`

    return this.get(url)
  }

  /**
   * Update the accept-new-fields value.
   * @memberof Index
   * @method updateAcceptNewFields
   */
  updateAcceptNewFields(
    acceptNewFields: boolean
  ): Promise<Types.EnqueuedUpdate> {
    const url = `/indexes/${this.uid}/settings/accept-new-fields`

    return this.post(url, acceptNewFields)
  }
}

export { Index }
