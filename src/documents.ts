/*
 * Bundle: Meili / Documents
 * Project: Meili - Javascript API
 * Author: Quentin de Quelen <quentin@meilisearch.com>
 * Copyright: 2019, Meili
 */

'use strict'

import { AxiosInstance } from 'axios'

class Documents {
  instance: AxiosInstance
  indexId: string

  constructor(instance: AxiosInstance, indexId: string) {
    this.instance = instance
    this.indexId = indexId
  }

  /**
   * Add or update multiples documents to an index
   * @memberof Documents
   * @method addDocuments
   */
  addDocuments(documents: object[]): Promise<object> {
    const url = `/indexes/${this.indexId}/documents`

    return this.instance.post(url, documents)
  }

  /**
   * Get one document
   * @memberof Documents
   * @method getDocument
   */
  getDocument(documentId: string): Promise<object> {
    const url = `/indexes/${this.indexId}/documents/' + documentI`

    return this.instance.get(url)
  }

  /**
   * Delete one document
   * @memberof Documents
   * @method deleteDocument
   */
  deleteDocument(documentId: string): Promise<object> {
    const url = `/indexes/${this.indexId}/documents/' + documentI`

    return this.instance.delete(url)
  }

  /**
   * Delete multiples documents to an index
   * @memberof Documents
   * @method deleteDocuments
   */
  deleteDocuments(documents: object[]): Promise<object> {
    const url = `/indexes/${this.indexId}/documents/delete`

    return this.instance.post(url, documents)
  }

  /**
   * Add, update or delete multiples document in one time
   * @memberof Documents
   * @method batchWrite
   */
  batchWrite(
    documentsToInsert: object[],
    documentsToDelete: object[]
  ): Promise<object> {
    const url = `/indexes/${this.indexId}/documents/batch`

    return this.instance.post(url, {
      insert: documentsToInsert,
      delete: documentsToDelete,
    })
  }
}

export { Documents }
