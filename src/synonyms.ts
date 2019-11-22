/*
 * Bundle: Meili
 * Project: Meili - Javascript API
 * Author: Quentin de Quelen <quentin@meilisearch.com>
 * Copyright: 2019, Meili
 */

'use strict'

import { AxiosInstance } from 'axios'

class Synonyms {
  instance: AxiosInstance
  indexUid: string

  constructor(instance: AxiosInstance, indexUid: string) {
    this.instance = instance
    this.indexUid = indexUid
  }

  /**
   * Get the list of all synonyms
   * @memberof Synonyms
   * @method list
   */
  list(): Promise<object[]> {
    const url = '/synonym'

    return this.instance.get(url)
  }

  /**
   * Add a new relation between an input and equivalents synonyms
   * @memberof Synonyms
   * @method create
   */
  create(input: string, synonyms: string[]): Promise<object> {
    const url = '/synonym'

    return this.instance.post(url, {
      input,
      synonyms,
    })
  }
}

export { Synonyms }
