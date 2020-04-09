/*
 * Bundle: Meilisearch / Indexes
 * Project: Meilisearch - Javascript API
 * Author: Quentin de Quelen <quentin@meilisearch.com>
 * Copyright: 2019, Meilisearch
 */

'use strict'

import MeiliAxiosWrapper from './meili-axios-wrapper'
import * as Types from './types'

class Indexes extends MeiliAxiosWrapper {
  indexUid: string
  constructor(config: Types.Config, indexUid: string) {
    super(config)
    this.indexUid = indexUid
  }

  ///
  /// UPDATES
  ///

  /**
   * Get the informations about an update status
   * @memberof Indexes
   * @method getUpdateStatus
   */
  getUpdateStatus(updateId: number): Promise<object> {
    const url = `/indexes/${this.indexUid}/updates/${updateId}`

    return this.get(url)
  }

  /**
   * Get the list of all updates
   * @memberof Indexes
   * @method getAllUpdateStatus
   */
  getAllUpdateStatus(): Promise<object[]> {
    const url = `/indexes/${this.indexUid}/updates`

    return this.get(url)
  }

  ///
  /// SEARCH
  ///

  /**
   * Search for documents into an index
   * @memberof Indexes
   * @method search
   */
  search(
    query: string,
    options?: Types.SearchParams
  ): Promise<Types.SearchResponse> {
    const url = `/indexes/${this.indexUid}/search`

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
          params.attributesToRetrieve = options.attributesToRetrieve.join()
        } else {
          params.attributesToRetrieve = options.attributesToRetrieve
        }
      }

      if (options.attributesToCrop) {
        if (Array.isArray(options.attributesToCrop)) {
          params.attributesToCrop = options.attributesToCrop.join()
        } else {
          params.attributesToCrop = options.attributesToCrop
        }
      }
      if (options.cropLength) {
        params.cropLength = options.cropLength
      }
      if (options.attributesToHighlight) {
        if (Array.isArray(options.attributesToHighlight)) {
          params.attributesToHighlight = options.attributesToHighlight.join()
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
   * @memberof Indexes
   * @method getIndex
   */
  show(): Promise<Types.Index> {
    const url = `/indexes/${this.indexUid}`

    return this.get(url)
  }

  /**
   * Update an index.
   * @memberof Indexes
   * @method updateIndex
   */
  updateIndex(data: Types.UpdateIndexRequest): Promise<Types.Index> {
    const url = `/indexes/${this.indexUid}`

    return this.put(url, data)
  }

  /**
   * Delete an index.
   * @memberof Indexes
   * @method deleteIndex
   */

  deleteIndex(): Promise<string> {
    const url = `/indexes/${this.indexUid}`

    return this.delete(url)
  }

  ///
  /// STATS
  ///

  /**
   * get stats of an index
   * @memberof Indexes
   * @method getStats
   */
  getStats(): Promise<Types.IndexStats> {
    const url = `/indexes/${this.indexUid}/stats`

    return this.get(url)
  }
  ///
  /// DOCUMENTS
  ///

  /**
   * get documents of an index
   * @memberof Indexes
   * @method getDocuments
   */
  getDocuments(options?: Types.GetDocumentsParams): Promise<object[]> {
    const url = `/indexes/${this.indexUid}/documents`
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
   * @memberof Indexes
   * @method getDocument
   */
  getDocument(documentId: string): Promise<object> {
    const url = `/indexes/${this.indexUid}/documents/${documentId}`

    return this.get(url)
  }

  /**
   * Add or replace multiples documents to an index
   * @memberof Indexes
   * @method addDocuments
   */
  addDocuments(
    documents: object[],
    options?: Types.AddDocumentParams
  ): Promise<Types.AsyncUpdateId> {
    const url = `/indexes/${this.indexUid}/documents`

    return this.post(url, documents, {
      params: options,
    })
  }

  /**
   * Add or update multiples documents to an index
   * @memberof Indexes
   * @method updateDocuments
   */
  updateDocuments(
    documents: object[],
    options?: Types.AddDocumentParams
  ): Promise<Types.AsyncUpdateId> {
    const url = `/indexes/${this.indexUid}/documents`

    return this.put(url, documents, {
      params: options,
    })
  }

  /**
   * Delete one document
   * @memberof Indexes
   * @method deleteDocument
   */
  deleteDocument(documentId: string | number): Promise<Types.AsyncUpdateId> {
    const url = `/indexes/${this.indexUid}/documents/${documentId}`

    return this.delete(url)
  }

  /**
   * Delete multiples documents of an index
   * @memberof Indexes
   * @method deleteDocuments
   */
  deleteDocuments(
    documentsIds: string[] | number[]
  ): Promise<Types.AsyncUpdateId> {
    const url = `/indexes/${this.indexUid}/documents/delete-batch`

    return this.post(url, documentsIds)
  }

  /**
   * Delete all documents of an index
   * @memberof Indexes
   * @method deleteAllDocuments
   */
  deleteAllDocuments(): Promise<Types.AsyncUpdateId> {
    const url = `/indexes/${this.indexUid}/documents`

    return this.delete(url)
  }

  ///
  /// SETTINGS
  ///

  /**
   * Retrieve all settings
   * @memberof Indexes
   * @method getSettings
   */
  getSettings(): Promise<object> {
    const url = `/indexes/${this.indexUid}/settings`

    return this.get(url)
  }

  /**
   * Update all settings
   * Any parameters not provided will be left unchanged.
   * @memberof Indexes
   * @method updateSettings
   */
  updateSettings(settings: Types.Settings): Promise<void> {
    const url = `/indexes/${this.indexUid}/settings`

    return this.post(url, settings)
  }

  /**
   * Reset settings.
   * @memberof Indexes
   * @method resetSettings
   */
  resetSettings(): Promise<void> {
    const url = `/indexes/${this.indexUid}/settings`

    return this.delete(url)
  }

  ///
  /// SYNONYMS
  ///

  /**
   * Get the list of all synonyms
   * @memberof Indexes
   * @method getSynonyms
   */
  getSynonyms(): Promise<object[]> {
    const url = `/indexes/${this.indexUid}/settings/synonyms`

    return this.get(url)
  }

  /**
   * Update the list of synonyms. Overwrite the old list.
   * @memberof Indexes
   * @method updateSynonyms
   */
  updateSynonyms(synonyms: object): Promise<object> {
    const url = `/indexes/${this.indexUid}/settings/synonyms`

    return this.post(url, synonyms)
  }

  /**
   * Reset the synonym list to be empty again
   * @memberof Indexes
   * @method resetSynonyms
   */
  resetSynonyms(): Promise<object> {
    const url = `/indexes/${this.indexUid}/settings/synonyms`

    return this.delete(url)
  }

  ///
  /// STOP WORDS
  ///

  /**
   * Get the list of all stop-words
   * @memberof Indexes
   * @method getStopWords
   */
  getStopWords(): Promise<object[]> {
    const url = `/indexes/${this.indexUid}/settings/stop-words`

    return this.get(url)
  }

  /**
   * Update the list of stop-words. Overwrite the old list.
   * @memberof Indexes
   * @method updateStopWords
   */
  updateStopWords(stopWords: string[]): Promise<object> {
    const url = `/indexes/${this.indexUid}/settings/stop-words`

    return this.post(url, stopWords)
  }

  /**
   * Reset the stop-words list to be empty again
   * @memberof Indexes
   * @method resetStopWords
   */
  resetStopWords(): Promise<object> {
    const url = `/indexes/${this.indexUid}/settings/stop-words`

    return this.delete(url)
  }

  ///
  /// RANKING RULES
  ///

  /**
   * Get the list of all ranking-rules
   * @memberof Indexes
   * @method getRankingRules
   */
  getRankingRules(): Promise<object[]> {
    const url = `/indexes/${this.indexUid}/settings/ranking-rules`

    return this.get(url)
  }

  /**
   * Update the list of ranking-rules. Overwrite the old list.
   * @memberof Indexes
   * @method updateRankingRules
   */
  updateRankingRules(rankingRules: string[]): Promise<object> {
    const url = `/indexes/${this.indexUid}/settings/ranking-rules`

    return this.post(url, rankingRules)
  }

  /**
   * Reset the ranking rules list to its default value
   * @memberof Indexes
   * @method resetRankingRules
   */
  resetRankingRules(): Promise<object> {
    const url = `/indexes/${this.indexUid}/settings/ranking-rules`

    return this.delete(url)
  }

  ///
  /// DISTINCT ATTRIBUTE
  ///

  /**
   * Get the distinct-attribute
   * @memberof Indexes
   * @method getDistinctAttribute
   */
  getDistinctAttribute(): Promise<object[]> {
    const url = `/indexes/${this.indexUid}/settings/distinct-attribute`

    return this.get(url)
  }

  /**
   * Update the distinct-attribute.
   * @memberof Indexes
   * @method updateDistinctAttribute
   */
  updateDistinctAttribute(distinctAttribute: string): Promise<object> {
    const url = `/indexes/${this.indexUid}/settings/distinct-attribute`

    return this.post(url, distinctAttribute)
  }

  /**
   * Reset the distinct-attribute.
   * @memberof Indexes
   * @method resetDistinctAttribute
   */
  resetDistinctAttribute(): Promise<object> {
    const url = `/indexes/${this.indexUid}/settings/distinct-attribute`

    return this.delete(url)
  }

  ///
  /// SEARCHABLE ATTRIBUTE
  ///

  /**
   * Get the searchable-attributes
   * @memberof Indexes
   * @method getSearchableAttributes
   */
  getSearchableAttributes(): Promise<object[]> {
    const url = `/indexes/${this.indexUid}/settings/searchable-attributes`

    return this.get(url)
  }

  /**
   * Update the searchable-attributes.
   * @memberof Indexes
   * @method updateSearchableAttributes
   */
  updateSearchableAttributes(searchableAttributes: string[]): Promise<object> {
    const url = `/indexes/${this.indexUid}/settings/searchable-attributes`

    return this.post(url, searchableAttributes)
  }

  /**
   * Reset the searchable-attributes.
   * @memberof Indexes
   * @method resetSearchableAttributes
   */
  resetSearchableAttributes(): Promise<object> {
    const url = `/indexes/${this.indexUid}/settings/searchable-attributes`

    return this.delete(url)
  }

  ///
  /// DISPLAYED ATTRIBUTE
  ///

  /**
   * Get the displayed-attributes
   * @memberof Indexes
   * @method getDisplayedAttributes
   */
  getDisplayedAttributes(): Promise<object[]> {
    const url = `/indexes/${this.indexUid}/settings/displayed-attributes`

    return this.get(url)
  }

  /**
   * Update the displayed-attributes.
   * @memberof Indexes
   * @method updateDisplayedAttributes
   */
  updateDisplayedAttributes(displayedAttributes: string[]): Promise<object> {
    const url = `/indexes/${this.indexUid}/settings/displayed-attributes`

    return this.post(url, displayedAttributes)
  }

  /**
   * Reset the displayed-attributes.
   * @memberof Indexes
   * @method resetDisplayedAttributes
   */
  resetDisplayedAttributes(): Promise<object> {
    const url = `/indexes/${this.indexUid}/settings/displayed-attributes`

    return this.delete(url)
  }

  ///
  /// ACCEPT NEW FIELDS
  ///

  /**
   * Get the accept-new-fields value.
   * @memberof Indexes
   * @method getAcceptNewFields
   */
  getAcceptNewFields(): Promise<object[]> {
    const url = `/indexes/${this.indexUid}/settings/accept-new-fields`

    return this.get(url)
  }

  /**
   * Update the accept-new-fields value.
   * @memberof Indexes
   * @method updateAcceptNewFields
   */
  updateAcceptNewFields(acceptNewFields: boolean): Promise<object> {
    const url = `/indexes/${this.indexUid}/settings/accept-new-fields`

    return this.post(url, acceptNewFields)
  }
}

export { Indexes }
