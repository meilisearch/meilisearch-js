/*
 * Bundle: Meili / Settings
 * Project: Meili - Javascript API
 * Author: Quentin de Quelen <quentin@meilisearch.com>
 * Copyright: 2019, Meili
 */

'use strict'

import { AxiosInstance } from 'axios'

class Settings {
  instance: AxiosInstance
  indexId: string

  constructor(instance: AxiosInstance, indexId: string) {
    this.indexId = indexId
    this.instance = instance
  }

  /**
   * Retrieve all settings
   * @memberof Settings
   * @method get
   */
  get(): Promise<object> {
    const url = '/settings'

    return this.instance.get(url)
  }

  /**
   * Update all settings
   * @memberof Settings
   * @method set
   */
  set(settings: object): Promise<void> {
    const url = '/settings'

    return this.instance.post(url, settings)
  }
}

export { Settings }
