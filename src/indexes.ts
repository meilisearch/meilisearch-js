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
        params.attributesToHighlight = options.attributesToHighlight.join()
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

  getIndex(): Promise<Types.Index> {
    const url = `/indexes/${this.indexUid}`

    return this.instance.get(url)
  }

  updateIndex(data: Types.UpdateIndexRequest): Promise<Types.Index> {
    const url = `/indexes/${this.indexUid}`

    return this.instance.put(url, data)
  }

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
   * Delete multiples documents to an index
   * @memberof Documents
   * @method deleteDocuments
   */
  deleteDocuments(documentsIds: string[]): Promise<Types.AsyncUpdateId> {
    const url = `/indexes/${this.indexUid}/documents/delete-batch`

    return this.instance.post(url, documentsIds)
  }

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
   * @method get
   */
  getSettings(): Promise<object> {
    const url = `/indexes/${this.indexUid}/settings`

    return this.instance.get(url)
  }

  /**
   * Update all settings
   * @memberof Settings
   * @method update
   */
  updateSettings(settings: Types.Settings): Promise<void> {
    const url = `/indexes/${this.indexUid}/settings`

    return this.instance.post(url, settings)
  }

  /**
   * Update all settings. Any parameters not provided will be left unchanged.
   * @memberof Settings
   * @method reset
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
   * @memberof Synonyms
   * @method list
   */
  getSynonyms(): Promise<object[]> {
    const url = `/indexes/${this.indexUid}/settings/synonyms`

    return this.instance.get(url)
  }

  /**
   * Update the list of synonyms. Overwrite the old list.
   * @memberof Synonyms
   * @method update
   */
  updateSynonyms(synonyms: object): Promise<object> {
    const url = `/indexes/${this.indexUid}/settings/synonyms`

    return this.instance.post(url, synonyms)
  }

  /**
   * Reset the synonym list to be empty again
   * @memberof Synonyms
   * @method reset
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
   * @memberof StopWords
   * @method list
   */
  getStopWords(): Promise<object[]> {
    const url = `/indexes/${this.indexUid}/settings/stop-words`

    return this.instance.get(url)
  }

  /**
   * Update the list of stop-words. Overwrite the old list.
   * @memberof StopWords
   * @method update
   */
  updateStopWords(stopWords: string[]): Promise<object> {
    const url = `/indexes/${this.indexUid}/settings/stop-words`

    return this.instance.post(url, stopWords)
  }

  /**
   * Reset the stop-words list to be empty again
   * @memberof StopWords
   * @method reset
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
   * @memberof RankingRules
   * @method get
   */
  getRankingRules(): Promise<object[]> {
    const url = `/indexes/${this.indexUid}/settings/ranking-rules`

    return this.instance.get(url)
  }

  /**
   * Update the list of ranking-rules. Overwrite the old list.
   * @memberof RankingRules
   * @method update
   */
  updateRankingRules(rankingRules: string[]): Promise<object> {
    const url = `/indexes/${this.indexUid}/settings/ranking-rules`

    return this.instance.post(url, rankingRules)
  }

  /**
   * Reset the ranking rules list to its default value
   * @memberof RankingRules
   * @method reset
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
   * @memberof DistinctAttribute
   * @method get
   */
  getDistinctAttribute(): Promise<object[]> {
    const url = `/indexes/${this.indexUid}/settings/distinct-attribute`

    return this.instance.get(url)
  }

  /**
   * Update the distinct-attribute.
   * @memberof DistinctAttribute
   * @method update
   */
  updateDistinctAttribute(distinctAttribute: string): Promise<object> {
    const url = `/indexes/${this.indexUid}/settings/distinct-attribute`

    return this.instance.post(url, distinctAttribute)
  }

  /**
   * Reset the distinct-attribute.
   * @memberof DistinctAttribute
   * @method reset
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
   * @memberof SearchableAttributes
   * @method get
   */
  getSearchableAttributes(): Promise<object[]> {
    const url = `/indexes/${this.indexUid}/settings/searchable-attributes`

    return this.instance.get(url)
  }

  /**
   * Update the searchable-attributes.
   * @memberof SearchableAttributes
   * @method update
   */
  updateSearchableAttributes(searchableAttributes: string[]): Promise<object> {
    const url = `/indexes/${this.indexUid}/settings/searchable-attributes`

    return this.instance.post(url, searchableAttributes)
  }

  /**
   * Reset the searchable-attributes.
   * @memberof SearchableAttributes
   * @method reset
   */
  resetSearchableAttributes(): Promise<object> {
    const url = `/indexes/${this.indexUid}/settings/searchable-attributes`

    return this.instance.delete(url)
  }
}

export { Indexes }
