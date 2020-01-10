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
   * @method getOneUpdateInfo
   */
  getOneUpdateInfo(updateId: number): Promise<object> {
    const url = `/indexes/${this.indexUid}/updates/${updateId}`

    return this.instance.get(url)
  }

  /**
   * Get the list of all updates
   * @memberof Indexes
   * @method getAllUpdatesInfos
   */
  getAllUpdatesInfos(): Promise<object[]> {
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
  search(options: Types.SearchParams): Promise<Types.SearchResponse> {
    const url = `/indexes/${this.indexUid}/search`

    const params: Types.SearchRequest = {
      q: options.q,
    }

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
  /// SCHEMA
  ///

  getSchema(raw?: boolean): Promise<Types.Schema | Types.SchemaRaw> {
    const url = `/indexes/${this.indexUid}/schema`
    if (raw) {
      return this.instance.get(url, {
        params: {
          raw: true,
        },
      })
    } else {
      return this.instance.get(url)
    }
  }

  updateSchema(
    schema: Types.Schema | Types.SchemaRaw
  ): Promise<Types.AsyncUpdateId> {
    const url = `/indexes/${this.indexUid}/schema`
    if (schema.identifier) {
      return this.instance.put(url, schema, {
        params: {
          raw: true,
        },
      })
    } else {
      return this.instance.put(url, schema)
    }
  }

  ///
  /// DOCUMENTS
  ///

  /**
   * Browse for documents into an index
   * @memberof Indexes
   * @method browse
   */
  getDocuments(params?: Types.GetDocumentsParams): Promise<object[]> {
    const url = `/indexes/${this.indexUid}/documents`
    let attr
    if (params && Array.isArray(params.attributesToRetrieve)) {
      attr = params.attributesToRetrieve.join(',')
    }

    return this.instance.get(url, {
      params: {
        ...params,
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
  addDocuments(documents: object[]): Promise<Types.AsyncUpdateId> {
    const url = `/indexes/${this.indexUid}/documents`

    return this.instance.post(url, documents)
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
    const url = `/indexes/${this.indexUid}/documents/delete`

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
    const url = '/settings'

    return this.instance.get(url)
  }

  /**
   * Update all settings
   * @memberof Settings
   * @method set
   */
  updateSettings(settings: object): Promise<void> {
    const url = '/settings'

    return this.instance.post(url, settings)
  }

  ///
  /// SYNONYMS
  ///

  /**
   * Get the list of all synonyms
   * @memberof Synonyms
   * @method list
   */
  listSynonyms(): Promise<object[]> {
    const url = '/synonym'

    return this.instance.get(url)
  }

  /**
   * Add a new relation between an input and equivalents synonyms
   * @memberof Synonyms
   * @method create
   */
  createSynonym(input: string, synonyms: string[]): Promise<object> {
    const url = '/synonym'

    return this.instance.post(url, {
      input,
      synonyms,
    })
  }
}

export { Indexes }
