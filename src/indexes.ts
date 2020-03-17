/*
 * Bundle: Meili / Indexes
 * Project: Meili - Javascript API
 * Author: Quentin de Quelen <quentin@meilisearch.com>
 * Copyright: 2019, Meili
 */

'use strict'

import axios, { AxiosInstance, CancelTokenSource } from 'axios'

import * as Types from './types'

class Indexes {
  instance: AxiosInstance
  indexUid: string
  cancelTokenSource: CancelTokenSource

  constructor(instance: AxiosInstance, indexUid: string) {
    this.instance = instance
    this.indexUid = indexUid
    this.cancelTokenSource = axios.CancelToken.source()
  }

  ///
  /// UPDATES
  ///

  /**
   * Get the informations about on update
   * @memberof Indexes
   * @method getUpdate
   */
  getUpdate(updateId: number): Promise<object> {
    const url = `/indexes/${this.indexUid}/updates/${updateId}`

    return this.instance.get(url)
  }

  /**
   * Get the list of all updates
   * @memberof Indexes
   * @method getUpdates
   */
  getUpdates(): Promise<object[]> {
    const url = `/indexes/${this.indexUid}/updates`

    return this.instance.get(url)
  }

  ///
  /// SEARCH
  ///

  /**
   * Search for documents into an index
   * @memberof Meili
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
        params.attributesToRetrieve = options.attributesToRetrieve.join()
      }
      if (options.attributesToSearchIn) {
        params.attributesToSearchIn = options.attributesToSearchIn.join()
      }
      if (options.attributesToCrop) {
        params.attributesToCrop = options.attributesToCrop.join()
      }
      if (options.cropLength) {
        params.cropLength = options.cropLength
      }
      if (options.attributesToHighlight) {
        let attributesToHighlight: string[]
        if (!Array.isArray(options.attributesToHighlight)) {
          attributesToHighlight = [options.attributesToHighlight]
        } else {
          attributesToHighlight = options.attributesToHighlight
        }
        params.attributesToHighlight = attributesToHighlight.join()
      }
      if (options.filters) {
        params.filters = options.filters
      }
      if (options.timeoutMs) {
        params.timeoutMs = options.timeoutMs
      }
      if (options.matches) {
        params.matches = options.matches
      }
    }

    return this.instance.get(url, {
      params,
      cancelToken: this.cancelTokenSource.token,
    })
  }

  ///
  /// INDEX
  ///
  /**
   * Get an index.
   * @memberof Indexes
   * @method getIndex
   */
  getIndex(): Promise<Types.Index> {
    const url = `/indexes/${this.indexUid}`

    return this.instance.get(url)
  }

  /**
   * Upate an index.
   * @memberof Indexes
   * @method updateIndex
   */
  updateIndex(data: Types.UpdateIndexRequest): Promise<Types.Index> {
    const url = `/indexes/${this.indexUid}`

    return this.instance.put(url, data)
  }

  /**
   * Delete an index.
   * @memberof Indexes
   * @method deleteIndex
   */

  deleteIndex(): Promise<void> {
    const url = `/indexes/${this.indexUid}`

    return this.instance.delete(url)
  }

  ///
  /// STATS
  ///

  /**
   * get stats of an index
   * @memberof Indexes
   * @method getStats
   */
  getStats(): Promise<object[]> {
    const url = `/indexes/${this.indexUid}/stats`

    return this.instance.get(url)
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

    return this.instance.get(url, {
      params: {
        ...options,
        ...(attr ? { attributesToRetrieve: attr } : {}),
      },
    })
  }

  /**
   * Get one document
   * @memberof Documents
   * @method getDocument
   */
  getDocument(documentId: string): Promise<object> {
    const url = `/indexes/${this.indexUid}/documents/${documentId}`

    return this.instance.get(url)
  }

  /**
   * Add or update multiples documents to an index
   * @memberof Documents
   * @method addDocuments
   */
  addDocuments(
    documents: object[],
    options?: Types.AddDocumentParams
  ): Promise<Types.AsyncUpdateId> {
    const url = `/indexes/${this.indexUid}/documents`

    return this.instance.post(url, documents, {
      params: options,
    })
  }

  /**
   * Delete one document
   * @memberof Documents
   * @method deleteDocument
   */
  deleteDocument(documentId: string): Promise<Types.AsyncUpdateId> {
    const url = `/indexes/${this.indexUid}/documents/${documentId}`

    return this.instance.delete(url)
  }

  /**
   * Delete multiples documents of an index
   * @memberof Documents
   * @method deleteDocuments
   */
  deleteDocuments(documentsIds: string[]): Promise<Types.AsyncUpdateId> {
    const url = `/indexes/${this.indexUid}/documents/delete-batch`

    return this.instance.post(url, documentsIds)
  }

  /**
   * Delete all documents of an index
   * @memberof Documents
   * @method deleteAllDocuments
   */
  deleteAllDocuments(): Promise<Types.AsyncUpdateId> {
    const url = `/indexes/${this.indexUid}/documents`

    return this.instance.delete(url)
  }

  ///
  /// SETTINGS
  ///

  /**
   * Retrieve all settings
   * @memberof Settings
   * @method getSettings
   */
  getSettings(): Promise<object> {
    const url = `/indexes/${this.indexUid}/settings`

    return this.instance.get(url)
  }

  /**
   * Update all settings
   * @memberof Settings
   * @method updateSettings
   */
  updateSettings(settings: Types.Settings): Promise<void> {
    const url = `/indexes/${this.indexUid}/settings`

    return this.instance.post(url, settings)
  }

  /**
   * Update all settings. Any parameters not provided will be left unchanged.
   * @memberof Settings
   * @method resetSettings
   */
  resetSettings(): Promise<void> {
    const url = `/indexes/${this.indexUid}/settings`

    return this.instance.delete(url)
  }

  ///
  /// SYNONYMS
  ///

  /**
   * Get the list of all synonyms
   * @memberof Settings
   * @method getSynonyms
   */
  getSynonyms(): Promise<object[]> {
    const url = `/indexes/${this.indexUid}/settings/synonyms`

    return this.instance.get(url)
  }

  /**
   * Update the list of synonyms. Overwrite the old list.
   * @memberof Settings
   * @method updateSynonyms
   */
  updateSynonyms(synonyms: object): Promise<object> {
    const url = `/indexes/${this.indexUid}/settings/synonyms`

    return this.instance.post(url, synonyms)
  }

  /**
   * Reset the synonym list to be empty again
   * @memberof Settings
   * @method resetSynonyms
   */
  resetSynonyms(): Promise<object> {
    const url = `/indexes/${this.indexUid}/settings/synonyms`

    return this.instance.delete(url)
  }

  ///
  /// STOP WORDS
  ///

  /**
   * Get the list of all stop-words
   * @memberof Settings
   * @method getStopWords
   */
  getStopWords(): Promise<object[]> {
    const url = `/indexes/${this.indexUid}/settings/stop-words`

    return this.instance.get(url)
  }

  /**
   * Update the list of stop-words. Overwrite the old list.
   * @memberof Settings
   * @method updateStopWords
   */
  updateStopWords(stopWords: string[]): Promise<object> {
    const url = `/indexes/${this.indexUid}/settings/stop-words`

    return this.instance.post(url, stopWords)
  }

  /**
   * Reset the stop-words list to be empty again
   * @memberof Settings
   * @method resetStopWords
   */
  resetStopWords(): Promise<object> {
    const url = `/indexes/${this.indexUid}/settings/stop-words`

    return this.instance.delete(url)
  }

  ///
  /// RANKING RULES
  ///

  /**
   * Get the list of all ranking-rules
   * @memberof Settings
   * @method getRankingRules
   */
  getRankingRules(): Promise<object[]> {
    const url = `/indexes/${this.indexUid}/settings/ranking-rules`

    return this.instance.get(url)
  }

  /**
   * Update the list of ranking-rules. Overwrite the old list.
   * @memberof Settings
   * @method updateRankingRules
   */
  updateRankingRules(rankingRules: string[]): Promise<object> {
    const url = `/indexes/${this.indexUid}/settings/ranking-rules`

    return this.instance.post(url, rankingRules)
  }

  /**
   * Reset the ranking rules list to its default value
   * @memberof Settings
   * @method resetRankingRules
   */
  resetRankingRules(): Promise<object> {
    const url = `/indexes/${this.indexUid}/settings/ranking-rules`

    return this.instance.delete(url)
  }

  ///
  /// DISTINCT ATTRIBUTE
  ///

  /**
   * Get the distinct-attribute
   * @memberof Settings
   * @method getDistinctAttribute
   */
  getDistinctAttribute(): Promise<object[]> {
    const url = `/indexes/${this.indexUid}/settings/distinct-attribute`

    return this.instance.get(url)
  }

  /**
   * Update the distinct-attribute.
   * @memberof Settings
   * @method updateDistinctAttribute
   */
  updateDistinctAttribute(distinctAttribute: string): Promise<object> {
    const url = `/indexes/${this.indexUid}/settings/distinct-attribute`

    return this.instance.post(url, distinctAttribute)
  }

  /**
   * Reset the distinct-attribute.
   * @memberof Settings
   * @method resetDistinctAttribute
   */
  resetDistinctAttribute(): Promise<object> {
    const url = `/indexes/${this.indexUid}/settings/distinct-attribute`

    return this.instance.delete(url)
  }

  ///
  /// SEARCHABLE ATTRIBUTE
  ///

  /**
   * Get the searchable-attributes
   * @memberof Settings
   * @method getSearchableAttributes
   */
  getSearchableAttributes(): Promise<object[]> {
    const url = `/indexes/${this.indexUid}/settings/searchable-attributes`

    return this.instance.get(url)
  }

  /**
   * Update the searchable-attributes.
   * @memberof Settings
   * @method updateSearchableAttributes
   */
  updateSearchableAttributes(searchableAttributes: string[]): Promise<object> {
    const url = `/indexes/${this.indexUid}/settings/searchable-attributes`

    return this.instance.post(url, searchableAttributes)
  }

  /**
   * Reset the searchable-attributes.
   * @memberof Settings
   * @method resetSearchableAttributes
   */
  resetSearchableAttributes(): Promise<object> {
    const url = `/indexes/${this.indexUid}/settings/searchable-attributes`

    return this.instance.delete(url)
  }

  ///
  /// DISPLAYED ATTRIBUTE
  ///

  /**
   * Get the displayed-attributes
   * @memberof Settings
   * @method getDisplayedAttributes
   */
  getDisplayedAttributes(): Promise<object[]> {
    const url = `/indexes/${this.indexUid}/settings/displayed-attributes`

    return this.instance.get(url)
  }

  /**
   * Update the displayed-attributes.
   * @memberof Settings
   * @method updateDisplayedAttributes
   */
  updateDisplayedAttributes(displayedAttributes: string[]): Promise<object> {
    const url = `/indexes/${this.indexUid}/settings/displayed-attributes`

    return this.instance.post(url, displayedAttributes)
  }

  /**
   * Reset the displayed-attributes.
   * @memberof Settings
   * @method resetDisplayedAttributes
   */
  resetDisplayedAttributes(): Promise<object> {
    const url = `/indexes/${this.indexUid}/settings/displayed-attributes`

    return this.instance.delete(url)
  }

  ///
  /// ACCEPT NEW FIELDS
  ///

  /**
   * Get the accept-new-fields value.
   * @memberof Settings
   * @method getAcceptNewFields
   */
  getAcceptNewFields(): Promise<object[]> {
    const url = `/indexes/${this.indexUid}/settings/accept-new-fields`

    return this.instance.get(url)
  }

  /**
   * Update the accept-new-fields value.
   * @memberof Settings
   * @method updateAcceptNewFields
   */
  updateAcceptNewFields(acceptNewFields: boolean): Promise<object> {
    const url = `/indexes/${this.indexUid}/settings/accept-new-fields`

    return this.instance.post(url, acceptNewFields)
  }
}

export { Indexes }
