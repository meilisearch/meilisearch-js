/*
 * Bundle: Meili / Indexes
 * Project: Meili - Javascript API
 * Author: Quentin de Quelen <quentin@meilisearch.com>
 * Copyright: 2019, Meili
 */

'use strict'

import axios, { AxiosInstance, CancelTokenSource } from 'axios'

import { Documents } from './documents'
import { Settings } from './settings'
import { Synonyms } from './synonyms'

class Indexes {
  instance: AxiosInstance
  indexUid: string
  cancelTokenSource: CancelTokenSource

  constructor(instance: AxiosInstance, indexUid: string) {
    this.instance = instance
    this.indexUid = indexUid
    this.cancelTokenSource = axios.CancelToken.source()
  }

  /**
   * Return an Document instance
   * @memberof Indexes
   * @method Documents
   */
  Documents(): Documents {
    return new Documents(this.instance, this.indexUid)
  }

  /**
   * Return a Settings instance
   * @memberof Indexes
   * @method Settings
   */
  Settings(): Settings {
    return new Settings(this.instance, this.indexUid)
  }

  /**
   * Return a Synonyms instance
   * @memberof Indexes
   * @method Synonyms
   */
  Synonyms(): Synonyms {
    return new Synonyms(this.instance, this.indexUid)
  }

  /**
   * Search for documents into an index
   * @memberof Indexes
   * @method search
   */
  updateInfo(updateId: number): Promise<object> {
    const url = `/indexes/${this.indexUid}/updates/${updateId}`

    return this.instance.get(url)
  }

  /**
   * Search for documents into an index
   * @memberof Indexes
   * @method search
   */
  getSchema(): Promise<object> {
    const url = `/indexes/${this.indexUid}`

    return this.instance.get(url)
  }

  /**
   * Search for documents into an index
   * @memberof Meili
   * @method search
   */
  search(queryParams: object): Promise<object> {
    if (!queryParams.hasOwnProperty('q')) {
      throw new Error('Meili, search: param should contain a "q" attribute')
    }

    const url = `/indexes/${this.indexUid}/search`

    return this.instance.get(url, {
      params: queryParams,
      cancelToken: this.cancelTokenSource.token,
    })
  }

  /**
   * Browse for documents into an index
   * @memberof Indexes
   * @method browse
   */
  browse(queryParams: object): Promise<object[]> {
    const url = `/indexes/${this.indexUid}/documents`

    return this.instance.get(url, {
      params: queryParams,
    })
  }
}

export { Indexes }
